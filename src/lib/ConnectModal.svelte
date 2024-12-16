<script lang="ts">
  import { bundlerClient } from './stores'
  import { createPublicClient, http, type PublicClient } from 'viem'
  import {
    toWebAuthnAccount,
    toCoinbaseSmartAccount,
    createBundlerClient,
    entryPoint06Address,
    type EntryPointVersion
  } from 'viem/account-abstraction'
  import { createPimlicoClient, type PimlicoClient } from 'permissionless/clients/pimlico'
  import {
    getCredentialCreationOptions,
    parseCredentialPublicKey,
    serializePublicKey
  } from 'webauthn-p256'
  import { PUBLIC_BUNDLER_RPC_URL, PUBLIC_RPC_URL } from '$env/static/public'
  import { english } from 'viem/accounts'
  import { onMount } from 'svelte'
  import Popup from './Popup.svelte'
  import { chainInfo, primaryTokenAddress } from '../config'
  import { LocalStorageCache } from './cache'

  let fileInput: HTMLInputElement
  let credentialFiles: FileList
  let triedToConnect = false
  let gasPriceCache = new LocalStorageCache<{
    maxFeePerGas: bigint
    maxPriorityFeePerGas: bigint
  }>(
    'getUserOperationGasPrice.fast',
    (str) => {
      const parsed = JSON.parse(str)
      return {
        maxFeePerGas: BigInt(parsed.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(parsed.maxPriorityFeePerGas)
      }
    },
    (value) =>
      JSON.stringify({
        maxFeePerGas: value.maxFeePerGas.toString(),
        maxPriorityFeePerGas: value.maxPriorityFeePerGas.toString()
      }),
    60_000 // 1 min TTL
  )
  let primaryTokenQuoteCache = new LocalStorageCache<
    Awaited<ReturnType<PimlicoClient['getTokenQuotes']>>
  >(
    'getTokenQuotes:primaryToken',
    (str) => {
      const parsed = JSON.parse(str)
      return [
        {
          ...parsed,
          postOpGas: BigInt(parsed.postOpGas),
          exchangeRate: BigInt(parsed.exchangeRate),
          exchangeRateNativeToUsd: BigInt(parsed.exchangeRateNativeToUsd)
        }
      ]
    },
    (value) =>
      JSON.stringify({
        ...value[0],
        postOpGas: value[0].postOpGas.toString(),
        exchangeRate: value[0].exchangeRate.toString(),
        exchangeRateNativeToUsd: value[0].exchangeRateNativeToUsd.toString()
      }),
    600_000 // 10 min TTL
  )

  $: credentialFiles && handleCredentialFileUpload(credentialFiles).catch(console.error)

  const handleCredentialFileUpload = async (files: FileList) => {
    if (files.length > 0) {
      try {
        const file = files[0]
        const credentialInfo = JSON.parse(await file.text())
        if (typeof credentialInfo.id !== 'string') {
          throw new Error('Missing `id` string field')
        }
        if (typeof credentialInfo.publicKey !== 'string') {
          throw new Error('Missing `publicKey` string field')
        }
        if (localStorage.getItem('walletCredential')) {
          if (
            !window.confirm(
              'You already have a wallet credential loaded. This action will overwrite the credential, are you sure you want to continue?'
            )
          ) {
            throw new Error('Credential file upload aborted...')
          }
        }
        localStorage.setItem(
          'walletCredential',
          JSON.stringify({ id: credentialInfo.id, publicKey: credentialInfo.publicKey })
        )
        await connectWallet()
      } catch (err) {
        console.error(err)
      }
    }
  }

  const createWallet = async () => {
    const randWord = () => english[Math.floor(Math.random() * english.length)]
    const name = `Wallet - ${randWord()} ${randWord()} ${randWord()}`
    const credentialCreationOptions = getCredentialCreationOptions({ name }) as any
    const rawCredential = (await navigator.credentials.create(
      credentialCreationOptions
    )) as PublicKeyCredential
    const publicKey = await parseCredentialPublicKey(
      new Uint8Array((rawCredential.response as any).getPublicKey())
    )
    const credentialInfo = {
      id: rawCredential.id,
      publicKey: serializePublicKey(publicKey, { compressed: true })
    }
    localStorage.setItem('walletCredential', JSON.stringify(credentialInfo))
    await connectWallet()
    if (
      window.confirm(
        'Would you like to backup your public credential data? This can be used to restore your wallet if you erase your browser data.'
      )
    ) {
      const fileBlob = new Blob([JSON.stringify(credentialInfo)], { type: 'application/json' })
      const aTag = document.createElement('a')
      aTag.href = URL.createObjectURL(fileBlob)
      aTag.download = `Credential Backup - ${name}.json`
      aTag.click()
    }
  }

  const restoreWallet = async () => {
    fileInput.click()
  }

  const connectWallet = async () => {
    const publicClient = createPublicClient({
      chain: chainInfo,
      transport: http(PUBLIC_RPC_URL)
    }) as PublicClient
    let credentialInfo = JSON.parse(localStorage.getItem('walletCredential') || 'null')
    if (!credentialInfo) {
      throw new Error('No credential info available...')
    }
    const webAuthnAccount = toWebAuthnAccount({
      credential: credentialInfo
    })
    const smartAccount = await toCoinbaseSmartAccount({
      client: publicClient,
      owners: [webAuthnAccount]
    })
    const pimlicoClient = createPimlicoClient({
      chain: chainInfo,
      transport: http(PUBLIC_BUNDLER_RPC_URL),
      entryPoint: {
        address: entryPoint06Address,
        version: '0.6' as EntryPointVersion
      }
    })
    const pimlicoProxy = new Proxy(pimlicoClient, {
      get(target: typeof pimlicoClient, prop, receiver) {
        if (prop === 'getTokenQuotes') {
          const getTokenQuotes = target[prop]
          return function (this: any, ...args) {
            if (
              (args[0].chain?.id ?? chainInfo.id) == chainInfo.id &&
              args[0].tokens.length == 1 &&
              args[0].tokens[0] === primaryTokenAddress
            ) {
              return primaryTokenQuoteCache.value(() =>
                getTokenQuotes.apply(this === receiver ? target : this, args)
              )
            } else {
              return getTokenQuotes.apply(this === receiver ? target : this, args)
            }
          } as typeof pimlicoClient.getTokenQuotes
        }
        return Reflect.get(target, prop, receiver)
      }
    })
    bundlerClient.set(
      createBundlerClient({
        chain: chainInfo,
        client: publicClient,
        account: smartAccount,
        paymaster: pimlicoProxy,
        transport: http(PUBLIC_BUNDLER_RPC_URL),
        userOperation: {
          estimateFeesPerGas: async () => {
            return await gasPriceCache.value(
              async () => (await pimlicoClient.getUserOperationGasPrice()).fast
            )
          }
        }
      })
    )
  }

  onMount(() => {
    connectWallet()
      .catch(console.error)
      .finally(() => (triedToConnect = true))
  })
</script>

{#if triedToConnect}
  <Popup
    --popup-position="fixed"
    --popup-top="50%"
    --popup-left="50%"
    --popup-width="500px"
    --popup-max-width="90vw"
    --popup-height="fit-content"
    --popup-max-height="300px"
    --popup-padding="1rem"
    --popup-transform="translate(-50%, -50%)"
    --bg="var(--bg-2)"
    showCloseButton={false}
  >
    <h3>Welcome to Wallet!</h3>
    <p>Sign in or create a new wallet to get started.</p>
    <button class="connect-btn" on:click={restoreWallet}>
      <i class="icofont-duotone icofont-user"></i> Restore Wallet
    </button>
    <button class="connect-btn" on:click={createWallet}>
      <i class="icofont-ui-add"></i> Create Wallet
    </button>
    <input type="file" style:display="none" bind:this={fileInput} bind:files={credentialFiles} />
  </Popup>
{/if}

<style>
  .connect-btn {
    padding: 0.6rem 0.75rem;
    font-weight: 700;
    border-radius: 0.75rem;
  }

  .connect-btn > i {
    margin-right: 0.25rem;
  }
</style>
