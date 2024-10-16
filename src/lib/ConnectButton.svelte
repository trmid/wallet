<script lang="ts">
  import { bundlerClient, walletAddress, chainId } from './stores'
  import Loading from './Loading.svelte'
  import { NETWORKS } from './networks'
  import ShortAddress from './ShortAddress.svelte'
  import { createPublicClient, http, type PublicClient } from 'viem'
  import {
    toWebAuthnAccount,
    toCoinbaseSmartAccount,
    createBundlerClient,
    entryPoint06Address,
    type EntryPointVersion
  } from 'viem/account-abstraction'
  import { createPimlicoClient } from 'permissionless/clients/pimlico'
  import {
    getCredentialCreationOptions,
    parseCredentialPublicKey,
    serializePublicKey
  } from 'webauthn-p256'
  import { PUBLIC_BUNDLER_RPC_URL, PUBLIC_RPC_URL } from '$env/static/public'
  import { english } from 'viem/accounts'

  const connectWallet = async () => {
    const publicClient = createPublicClient({
      chain: NETWORKS[$chainId],
      transport: http(PUBLIC_RPC_URL)
    }) as PublicClient
    const credentialCreationOptions = getCredentialCreationOptions({
      name: `Wallet - ${english[Math.floor(Math.random() * english.length)]} ${english[Math.floor(Math.random() * english.length)]}`
    }) as any
    let rawCredential: PublicKeyCredential | undefined
    let credentialInfo = JSON.parse(localStorage.getItem('walletCredential') || 'null')
    if (!credentialInfo) {
      rawCredential = (await navigator.credentials.create(
        credentialCreationOptions
      )) as PublicKeyCredential
      const publicKey = await parseCredentialPublicKey(
        new Uint8Array((rawCredential.response as any).getPublicKey())
      )
      credentialInfo = {
        id: rawCredential.id,
        publicKey: serializePublicKey(publicKey, { compressed: true })
      }
      localStorage.setItem('walletCredential', JSON.stringify(credentialInfo))
    }
    if (!credentialInfo) {
      throw new Error('Failed to create credential...')
    }
    const webAuthnAccount = toWebAuthnAccount({
      credential: credentialInfo
    })
    const smartAccount = await toCoinbaseSmartAccount({
      client: publicClient,
      owners: [webAuthnAccount]
    })
    const pimlicoClient = createPimlicoClient({
      chain: NETWORKS[$chainId],
      transport: http(PUBLIC_BUNDLER_RPC_URL),
      entryPoint: {
        address: entryPoint06Address,
        version: '0.6' as EntryPointVersion
      }
    })
    bundlerClient.set(
      createBundlerClient({
        chain: NETWORKS[$chainId],
        client: publicClient,
        account: smartAccount,
        paymaster: pimlicoClient,
        transport: http(PUBLIC_BUNDLER_RPC_URL),
        userOperation: {
          estimateFeesPerGas: async () => {
            return (await pimlicoClient.getUserOperationGasPrice()).fast
          }
        }
      })
    )
  }
</script>

{#if $bundlerClient}
  <div class="connected">
    <i class="icofont-wallet"></i>
    {#if !!$walletAddress}
      <ShortAddress address={$walletAddress} enableCopy={true}></ShortAddress>
    {:else}
      <Loading height="0.5rem" />
    {/if}
  </div>
{:else}
  <button id="connect" on:click={connectWallet}
    ><i class="icofont-duotone icofont-user"></i> Sign In</button
  >
{/if}

<style>
  div.connected {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    gap: 0.5rem;
    font-family: monospace;
  }

  button#connect {
    padding: 0.6rem 0.75rem;
    font-weight: 700;
    border-radius: 0.75rem;
  }
</style>
