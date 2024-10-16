<script lang="ts">
  import { type PublicClient, type Address, parseAbi } from 'viem'
  import IFrameApp from './IFrameApp.svelte'
  import { activePopupCount, appSrc, walletAddress, chainId } from './stores'
  import type { TX } from './types'
  import type { BundlerClient, UserOperationCall } from 'viem/account-abstraction'
  import {
    PUBLIC_GAS_ERC20_PAYMASTER,
    PUBLIC_GAS_ERC20_MAX_TX_COST,
    PUBLIC_GAS_ERC20_TOKEN
  } from '$env/static/public'
  import Popup from './Popup.svelte'
  import { NETWORKS } from './networks'
  import { shortAddress } from './address'
  import Home from './Home.svelte'

  export let bundlerClient: BundlerClient

  let publicClient: PublicClient
  $: publicClient = bundlerClient.client as PublicClient

  let txsToReview: TX[] = []
  let txsReviewed: boolean[] = []
  let approveTxReview: ((x: any) => void) | undefined
  let denyTxReview: ((reason: string) => void) | undefined
  let txHash: `0x${string}` | undefined

  const executeTxs = async (txs: TX[]) => {
    if (!bundlerClient.account) {
      throw new Error('Missing account in bundler...')
    }
    if (txs.length == 0) {
      throw new Error('No txs to execute...')
    }

    txsToReview = txs
    txsReviewed = txs.map(() => false)
    await new Promise((resolve, reject) => {
      approveTxReview = resolve
      denyTxReview = reject
    })

    const pendingHash = await bundlerClient.sendUserOperation({
      paymasterContext: {
        token: PUBLIC_GAS_ERC20_TOKEN as Address
      },
      calls: [
        {
          to: PUBLIC_GAS_ERC20_TOKEN as Address,
          abi: parseAbi(['function approve(address,uint256) view']),
          functionName: 'approve',
          args: [PUBLIC_GAS_ERC20_PAYMASTER as Address, BigInt(PUBLIC_GAS_ERC20_MAX_TX_COST)]
        } as any,
        ...(txs as UserOperationCall[])
      ]
    })
    const receipt = await bundlerClient.waitForUserOperationReceipt({ hash: pendingHash })
    console.log(receipt)
    txHash = receipt.receipt.transactionHash
    return receipt.receipt.transactionHash
  }
</script>

<svelte:window on:click={() => (txHash = undefined)} />

<div id="container">
  {#if $appSrc === 'home'}
    <Home></Home>
  {:else if $appSrc && $walletAddress}
    {#key $appSrc}
      {#key $walletAddress}
        <IFrameApp
          src={$appSrc}
          safeAddress={$walletAddress}
          {publicClient}
          sendTxs={async (txs) => {
            console.log(txs)
            try {
              return await executeTxs(txs)
            } catch (err) {
              console.error(err)
              return null
            }
          }}
        />
      {/key}
    {/key}
  {/if}
  {#if $activePopupCount > 0}
    <div id="click-capture"></div>
  {/if}
  {#if txsToReview.length > 0}
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
      showCloseButton={false}
    >
      <h3>Review Transactions:</h3>
      {#each txsToReview as tx, i}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
          class="tx-to-review"
          class:checked={txsReviewed[i]}
          tabindex="0"
          on:click={() => (txsReviewed[i] = !txsReviewed[i])}
          on:keypress={(e) => e.key === 'enter' && (txsReviewed[i] = !txsReviewed[i])}
        >
          <div class="icon-box">
            <i class:icofont-check={txsReviewed[i]}></i>
          </div>
          <a
            on:click|stopPropagation
            target="_blank"
            href="https://calldata.swiss-knife.xyz/decoder?calldata={tx.data}&address={tx.to}"
            >TX#{i} | {shortAddress(tx.to)}:{tx.data?.slice(0, 10)}</a
          >
        </div>
      {/each}
      <button
        disabled={txsReviewed.includes(false)}
        on:click={() => {
          approveTxReview && approveTxReview(null)
          txsToReview = []
        }}
      >
        <i class="icofont-duotone icofont-play-circle"></i> Send
      </button>
      <button
        on:click={() => {
          denyTxReview && denyTxReview('Execution cancelled by user...')
          txsToReview = []
        }}
      >
        <i class="icofont-close-squared-alt"></i>
        Cancel
      </button>
    </Popup>
  {/if}
  {#if txHash}
    <Popup
      on:requestClose={() => (txHash = undefined)}
      --popup-position="fixed"
      --popup-top="50%"
      --popup-left="50%"
      --popup-width="500px"
      --popup-max-width="90vw"
      --popup-height="fit-content"
      --popup-max-height="300px"
      --popup-padding="1rem"
      --popup-transform="translate(-50%, -50%)"
    >
      <h3>Transaction Verified</h3>
      <h4>Receipt:</h4>
      <p>
        <a
          target="_blank"
          href="{NETWORKS[$chainId].blockExplorers?.default?.url ?? '#'}/tx/{txHash}"
          >{shortAddress(txHash)}</a
        >
      </p>
    </Popup>
  {/if}
</div>

<style>
  #container {
    position: relative;
    flex-grow: 1;
  }

  #click-capture {
    position: absolute;
    inset: 0;
    background-color: #0004;
    z-index: 2;
  }

  .tx-to-review {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    background-color: var(--bg-2);
    color: var(--primary-color);
    border-radius: 3px;
    font-family: monospace;
  }

  .tx-to-review > a {
    text-decoration: none;
  }

  .tx-to-review.checked {
    opacity: 0.5;
  }

  .tx-to-review > .icon-box {
    width: 1.1rem;
    height: 1.05rem;
    box-sizing: border-box;
    border: 1px solid currentColor;
    border-radius: 3px;
  }
</style>
