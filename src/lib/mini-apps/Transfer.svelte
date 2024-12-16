<script lang="ts">
  import QrScanner from '$lib/QrScanner.svelte'
  import { bundlerClient, transferAction } from '$lib/stores'
  import { estimateGasCost, sendTxs } from '$lib/tx'
  import WalletInfo from '$lib/WalletInfo.svelte'
  import { isAddress, zeroAddress, encodeFunctionData, formatUnits, type Address } from 'viem'
  import {
    chainInfo,
    formatPrimaryToken,
    paymasterAddress,
    primaryTokenAddress,
    primaryTokenDecimals
  } from '../../config'
  import { parseAbi } from 'viem/utils'
  import { parseUnits } from 'viem/utils'
  import { shortAddress } from '$lib/address'
  import Popup from '$lib/Popup.svelte'
  import Balance from '$lib/Balance.svelte'
  import { notify } from '$lib/notification'
  import Loading from '$lib/Loading.svelte'
  import { onMount } from 'svelte'
  import GasEstimate from '$lib/GasEstimate.svelte'
  import { LocalStorageCache } from '$lib/cache'

  let scanningAddress = false
  let to: string = ''
  let amount: number
  let balance: bigint
  let estimatedGasCost: bigint = 0n
  let balanceComponent: Balance
  let transferTxHash: `0x${string}` | undefined
  let lastTransferDetails:
    | {
        to: Address
        amount: bigint
        errorMsg?: string
      }
    | undefined

  $: amount && balance >= 0n && capAmount()

  const capAmount = () => {
    const balanceNum = parseFloat(formatUnits(balance, primaryTokenDecimals))
    if (amount > balanceNum) amount = balanceNum
  }

  const onQrData = (e: CustomEvent<string>) => {
    const data = e.detail
    if (isAddress(data)) {
      to = data
      scanningAddress = false
    }
  }

  const onBalanceIncrease = (e: CustomEvent<{ amount: bigint; balance: bigint }>) => {
    const { amount } = e.detail
    notify(
      `You just received a transfer!`,
      `${formatPrimaryToken(amount)} has been sent to your wallet.`
    )
  }

  const send = async () => {
    if (!isAddress(to) || to === zeroAddress) {
      return alert('Please enter a valid address.')
    }
    if (!$bundlerClient) {
      return alert('Client not connected...')
    }
    try {
      const amountBigint = BigInt(parseUnits('' + amount, primaryTokenDecimals))
      lastTransferDetails = {
        to,
        amount: amountBigint
      }

      const receipt = await sendTxs(
        $bundlerClient,
        [
          {
            to: primaryTokenAddress,
            data: encodeFunctionData({
              abi: parseAbi(['function transfer(address,uint256) view']),
              functionName: 'transfer',
              args: [to, amountBigint]
            })
          }
        ],
        estimatedGasCost * 2n
      )
      transferTxHash = receipt.receipt.transactionHash
      balanceComponent.queryBalance().catch(console.error)
      to = ''
      amount = 0
    } catch (err) {
      console.error(err)
      if (lastTransferDetails) {
        lastTransferDetails.errorMsg =
          'There was an error during the transfer. The transfer may not have been completed.'
      }
    }
  }
  onMount(async () => {
    try {
      if ($bundlerClient) {
        const estimatedTransferCostCache = new LocalStorageCache<bigint>(
          'estimatedTransferCost',
          (str) => BigInt(str),
          (value) => value.toString(),
          60_000
        )
        estimatedGasCost = await estimatedTransferCostCache.value(
          async () =>
            await estimateGasCost($bundlerClient, [
              {
                to: primaryTokenAddress,
                data: encodeFunctionData({
                  abi: parseAbi(['function transfer(address,uint256) view']),
                  functionName: 'transfer',
                  args: [paymasterAddress, 1n]
                })
              }
            ])
        )
      }
    } catch (err) {
      console.error(err)
    }
  })
</script>

<div class="wrapper">
  <div class="container">
    <div class="panel">
      <h1>Transfer <i class="icofont-exchange"></i></h1>
      <hr />
      <h2>Send or receive USDC to your wallet.</h2>
    </div>
    {#if $bundlerClient}
      <div class="panel">
        <div class="balance-container">
          <span class="balance-label">Balance</span>
          <span class="balance">
            <Balance
              bundlerClient={$bundlerClient}
              queryIntervalSeconds={15}
              queryIntervalFalloffSeconds={5}
              on:balanceIncrease={onBalanceIncrease}
              bind:balance
              bind:this={balanceComponent}
            />
          </span>
        </div>
      </div>
    {/if}
    <div class="action-wrapper">
      <div class="action-selector">
        <button
          class="send-action-btn"
          class:active={$transferAction === 'send'}
          on:click={() => {
            $transferAction = 'send'
          }}>Send</button
        >
        <button
          class="receive-action-btn"
          class:active={$transferAction === 'receive'}
          on:click={() => {
            $transferAction = 'receive'
          }}>Receive</button
        >
      </div>
      <div class="action-container">
        {#if $transferAction === 'send'}
          <div class="input-container">
            <label for="amount">Amount</label>
            <div class="amount-wrapper">
              <input
                name="amount"
                type="number"
                min={0}
                max={formatUnits(balance || 0n, primaryTokenDecimals)}
                step={0.01}
                placeholder="0.00"
                bind:value={amount}
              />
            </div>
          </div>
          <div class="input-container">
            <label for="to">To</label>
            <div class="to-wrapper">
              <input
                name="to"
                type="text"
                placeholder={shortAddress(zeroAddress)}
                bind:value={to}
              />
              <button on:click={() => (scanningAddress = true)}>
                <i class="icofont-camera"></i>
              </button>
            </div>
          </div>
          {#if scanningAddress}
            <Popup
              on:requestClose={() => (scanningAddress = false)}
              --popup-position="fixed"
              --popup-top="50%"
              --popup-left="50%"
              --popup-width="fit-content"
              --popup-max-width="90vw"
              --popup-height="fit-content"
              --popup-max-height="90vh"
              --popup-padding="0"
              --popup-transform="translate(-50%, -50%)"
            >
              <QrScanner on:qrData={onQrData} />
            </Popup>
          {/if}
          {#if estimatedGasCost > 0n}
            <GasEstimate label="Estimated Transfer Cost" {estimatedGasCost} />
          {/if}
          <div class="input-container">
            <button class="send-btn" on:click={send}>Send</button>
          </div>
          <aside class="chain-warning">
            <i class="icofont-warning-alt"></i>
            <span>
              Please ensure the recipient can receive tokens on the {chainInfo.name} network.
            </span>
          </aside>
        {:else if $transferAction === 'receive'}
          <WalletInfo />
        {/if}
      </div>
    </div>
  </div>
  {#if lastTransferDetails}
    <Popup
      on:requestClose={() => {
        transferTxHash = undefined
        lastTransferDetails = undefined
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
    >
      {#if transferTxHash}
        <h3>
          Sent {formatPrimaryToken(lastTransferDetails.amount)} to {shortAddress(
            lastTransferDetails.to
          )}!
        </h3>
        <h4>Receipt:</h4>
        <p>
          <a
            class="tx-link"
            target="_blank"
            href="{chainInfo.blockExplorers?.default?.url ?? '#'}/tx/{transferTxHash}"
            >{shortAddress(transferTxHash)}</a
          >
        </p>
      {:else if lastTransferDetails.errorMsg}
        <h3>Error</h3>
        <p>{lastTransferDetails.errorMsg}</p>
      {:else}
        <h3>
          Sending {formatPrimaryToken(lastTransferDetails.amount)} to {shortAddress(
            lastTransferDetails.to
          )}
        </h3>
        <Loading />
      {/if}
    </Popup>
  {/if}
</div>

<style>
  h1 {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0;
    margin-bottom: 0.5rem;
  }

  h2 {
    font-size: medium;
    margin: 0;
    margin-top: 1rem;
    opacity: 0.8;
  }

  .wrapper {
    position: absolute;
    inset: 0;
    overflow: auto;
    background-color: var(--bg);
    color: var(--primary);
  }

  .container {
    max-width: 520px;
    margin: 0 auto;
    padding: 1rem;
  }

  .balance-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .balance-label {
    display: flex;
    font-size: large;
    font-weight: bold;
  }

  .balance {
    font-size: 32px;
    font-weight: bold;
  }

  .panel,
  .action-wrapper {
    margin-bottom: 0.5rem;
    border-radius: 0.5rem;
    background-color: var(--primary);
    color: var(--bg);
    overflow: hidden;
  }

  .action-selector {
    display: flex;
    align-items: center;
    width: 100%;
  }

  .action-selector > button {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--primary);
    color: var(--bg);
    filter: brightness(0.8);
    border-radius: 0;
    font-size: large;
    font-weight: bold;
    flex-grow: 1;
  }

  .action-selector > button.active {
    filter: none;
  }

  .action-selector > button:not(.active):hover {
    filter: brightness(0.9);
  }

  .send-action-btn:not(.active) {
    border-radius: 0 0 0.5rem 0;
  }

  .receive-action-btn:not(.active) {
    border-radius: 0 0 0 0.5rem;
  }

  .action-container {
    padding: 1rem 1rem 2rem 1rem;
  }

  .panel {
    padding: 1rem;
  }

  .input-container {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .to-wrapper > input,
  .input-container > button {
    padding: 1rem;
  }

  .input-container input:active,
  .input-container input:focus {
    border: none;
    outline: none;
  }

  .input-container > label {
    position: relative;
    top: 0.5rem;
    font-weight: bold;
    padding: 0.5rem;
    padding-bottom: 1rem;
    background-color: var(--bg);
    color: var(--primary);
    border-radius: 0.5rem 0.5rem 0 0;
  }

  input[name='amount'] {
    padding-left: 2.5rem;
    font-size: 32px;
    width: 100%;
    display: block;
  }

  .send-btn {
    font-weight: bold;
    margin-top: 0.5rem;
  }

  .amount-wrapper {
    position: relative;
    z-index: 1;
  }

  .to-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    z-index: 1;
  }

  .to-wrapper > input {
    flex-grow: 1;
    border-radius: 0.5rem 0 0 0.5rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .to-wrapper > button {
    font-size: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 0 0.5rem 0.5rem 0;
  }

  .amount-wrapper::after {
    content: '$';
    z-index: 2;
    position: absolute;
    left: 1rem;
    top: 0.5rem;
    font-size: 32px;
    color: var(--primary);
    opacity: 0.5;
  }

  .tx-link {
    color: currentColor;
  }

  .chain-warning {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem;
    margin-top: 1rem;
  }

  .chain-warning > i {
    font-size: 24px;
  }
</style>
