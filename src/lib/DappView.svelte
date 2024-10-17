<script lang="ts">
  import { type PublicClient, type Address, parseAbi, formatUnits } from 'viem'
  import IFrameApp from './IFrameApp.svelte'
  import { activePopupCount, appSrc, walletAddress, chainId, maxGasCost } from './stores'
  import type { TX } from './types'
  import type { BundlerClient, UserOperationCall } from 'viem/account-abstraction'
  import {
    PUBLIC_GAS_ERC20_PAYMASTER,
    PUBLIC_GAS_ERC20_MAX_TX_COST,
    PUBLIC_GAS_ERC20_TOKEN,
    PUBLIC_GAS_ERC20_DECIMALS
  } from '$env/static/public'
  import Popup from './Popup.svelte'
  import { NETWORKS } from './networks'
  import { shortAddress } from './address'
  import Home from './Home.svelte'

  export let bundlerClient: BundlerClient

  const defaultGasCost = BigInt(PUBLIC_GAS_ERC20_MAX_TX_COST)
  const decimals = parseInt(PUBLIC_GAS_ERC20_DECIMALS)
  const gasOptions: { amount: bigint; text: string }[] = [
    {
      amount: defaultGasCost,
      text: `$${parseFloat(formatUnits(defaultGasCost, decimals)).toFixed(2)}`
    },
    {
      amount: defaultGasCost * 10n,
      text: `$${parseFloat(formatUnits(defaultGasCost * 10n, decimals)).toFixed(2)}`
    },
    {
      amount: defaultGasCost * 100n,
      text: `$${parseFloat(formatUnits(defaultGasCost * 100n, decimals)).toFixed(2)}`
    }
  ]

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

    const userOpHash = await bundlerClient.sendUserOperation({
      paymasterContext: {
        token: PUBLIC_GAS_ERC20_TOKEN as Address
      },
      calls: [
        {
          to: PUBLIC_GAS_ERC20_TOKEN as Address,
          abi: parseAbi(['function approve(address,uint256) view']),
          functionName: 'approve',
          args: [PUBLIC_GAS_ERC20_PAYMASTER as Address, BigInt($maxGasCost)]
        } as any,
        ...(txs as UserOperationCall[])
      ]
    })
    const receipt = await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash })
    console.log(receipt)
    txHash = receipt.receipt.transactionHash
    return receipt.receipt.transactionHash
  }
</script>

<div id="container">
  {#if $appSrc === 'Home'}
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
      on:requestClose={() => {
        txsToReview = []
        denyTxReview && denyTxReview('Execution cancelled by user...')
      }}
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
      <h3>Review Transactions</h3>
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
          <span>TX #{i}</span>
          <a
            on:click|stopPropagation={() => (txsReviewed[i] = true)}
            target="_blank"
            href="https://calldata.swiss-knife.xyz/decoder?calldata={tx.data}&address={tx.to}"
          >
            {shortAddress(tx.to)}:{tx.data?.slice(0, 10)}
          </a>
        </div>
      {/each}
      <div class="gas-cost">
        <strong>Max gas cost:</strong>
        {#each gasOptions as gasOption}
          <button
            class="gas-option"
            class:selected={$maxGasCost == gasOption.amount}
            on:click={() => ($maxGasCost = gasOption.amount)}>{gasOption.text}</button
          >
        {/each}
      </div>
      <button
        class="tx-btn"
        disabled={txsReviewed.includes(false)}
        on:click={() => {
          approveTxReview && approveTxReview(null)
          txsToReview = []
        }}
      >
        <i class="icofont-duotone icofont-play-circle"></i> Send
      </button>
      <button
        class="tx-btn"
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
          class="tx-link"
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
    background-color: var(--primary);
  }

  #click-capture {
    position: absolute;
    inset: 0;
    background-color: #0004;
    z-index: 2;
  }

  .tx-to-review,
  .gas-cost {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    background-color: var(--bg-2);
    color: var(--primary);
    border-radius: 0.25rem;
    font-family: monospace;
    font-size: medium;
  }

  .tx-to-review > a,
  .tx-link {
    color: currentColor;
  }

  .tx-to-review.checked {
    opacity: 0.5;
  }

  .tx-to-review > .icon-box {
    display: block;
    font-size: 22px;
    width: 24px;
    height: 24px;
    text-align: center;
    box-sizing: border-box;
    border: 1px solid currentColor;
    border-radius: 3px;
  }

  .tx-btn {
    font-size: medium;
  }

  .gas-option.selected {
    color: var(--bg);
    background-color: var(--primary);
  }
</style>
