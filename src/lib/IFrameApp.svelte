<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { IFrameCommunicator } from './iframeCommunicator'
  import type {
    GatewayTransactionDetails,
    MethodToResponse,
    RPCPayload
  } from './iframeCommunicatorTypes'
  import { Methods, TransactionStatus } from './iframeCommunicatorTypes'
  import { type Address, type PublicClient } from 'viem'
  import type { TX } from './types'
  import { PUBLIC_CHAIN_ID } from '$env/static/public'
  import { NETWORKS } from './networks'

  export let src: string
  export let publicClient: PublicClient
  export let safeAddress: Address
  export let sendTxs: (txs: TX[]) => Promise<`0x${string}` | null>

  const chain = NETWORKS[parseInt(PUBLIC_CHAIN_ID)]

  let iframe: HTMLIFrameElement | undefined
  let communicator: IFrameCommunicator | undefined

  console.log(safeAddress)

  onMount(() => {
    if (!iframe) throw new Error('Missing iframe...')
    communicator = new IFrameCommunicator(iframe)
    communicator.on(Methods.getSafeInfo, async () => ({
      safeAddress,
      chainId: parseInt(PUBLIC_CHAIN_ID),
      owners: [],
      threshold: 1,
      isReadOnly: false
    }))

    communicator.on(Methods.getEnvironmentInfo, async () => ({
      origin: document.location.origin
    }))

    communicator.on(Methods.getChainInfo, async () => ({
      chainName: chain.name,
      shortName: chain.name,
      chainId: chain.id,
      nativeCurrency: {
        ...chain.nativeCurrency,
        logoUri: ''
      },
      blockExplorerUriTemplate: {
        api: chain.blockExplorers?.default.apiUrl ?? '',
        txHash: chain.blockExplorers?.default.url ?? '#' + '/tx',
        address: chain.blockExplorers?.default.url ?? '#' + '/address'
      }
    }))

    communicator.on(Methods.rpcCall, async (msg) => {
      const params = msg.data.params as RPCPayload
      try {
        const response = (await publicClient.request({
          method: params.call as any,
          params: params.params as any
        })) as MethodToResponse['rpcCall']
        return response
      } catch (err) {
        return err
      }
    })

    communicator.on(Methods.sendTransactions, async (msg) => {
      console.log(msg)
      const transactions = ((msg.data.params as any).txs as any[]).map(({ to, ...rest }) => ({
        to,
        ...rest
      }))
      const txHash = await sendTxs(transactions)
      if (txHash) {
        communicator?.send(
          { safeTxHash: txHash } satisfies MethodToResponse[Methods.sendTransactions],
          msg.data.id
        )
      } else {
        communicator?.send('Error: TXs not Completed', msg.data.id, true)
      }
    })

    communicator.on(Methods.getTxBySafeTxHash, async (msg) => {
      const { safeTxHash } = msg.data.params as any
      return {
        txId: safeTxHash,
        txStatus: TransactionStatus.SUCCESS,
        txInfo: {} as any,
        txHash: safeTxHash
      } satisfies GatewayTransactionDetails
    })

    communicator.on(Methods.signMessage, async () => {
      console.log('sign not supported')
      alert('Signing messages with this wallet is not currently supported.')
    })

    communicator.on(Methods.signTypedMessage, async () => {
      console.log('sign not supported')
      alert('Signing messages with this wallet is not currently supported.')
    })

    communicator.on('getCurrentTheme' as Methods, (msg) => {
      communicator?.send(
        {
          darkMode: true
        },
        msg.data.id
      )
    })
  })

  onDestroy(() => {
    communicator?.clear()
  })
</script>

<iframe bind:this={iframe} title="IFrame App {src}" {src} frameborder="0">
  Your browser does not support IFrames...
</iframe>

<style>
  iframe {
    width: 100%;
    height: 100%;
  }
</style>
