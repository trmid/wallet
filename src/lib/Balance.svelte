<script lang="ts">
  import type { BundlerClient } from 'viem/account-abstraction'
  import { formatPrimaryToken, primaryTokenAddress } from '../config'
  import { walletAddress } from './stores'
  import { createEventDispatcher, onDestroy, onMount } from 'svelte'
  import { parseAbi, type Address, type PublicClient } from 'viem'
  import Loading from './Loading.svelte'

  export let bundlerClient: BundlerClient
  export let tokenAddress: Address = primaryTokenAddress
  export let accountAddress: Address = $walletAddress
  export let queryIntervalSeconds: number = 0 // 0 means no re-query
  export let queryIntervalFalloffSeconds: number = 0 // The number of seconds added on each re-query
  export let maxQueries = 20 // max number of queries before it stops the interval
  export let balance: bigint = -1n

  const dispatch = createEventDispatcher()

  let lastQueryAt: number = 0
  let lastBalance: bigint = -1n
  let errorCount = 0
  let queryNum = 0
  let destroyed = false

  export const queryBalance = async () => {
    if (destroyed) return
    balance = await (bundlerClient.client as PublicClient).readContract({
      address: tokenAddress,
      abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
      functionName: 'balanceOf',
      args: [accountAddress]
    })
    if (lastBalance > -1n && balance > lastBalance) {
      dispatch('balanceIncrease', {
        accountAddress,
        tokenAddress,
        amount: balance - lastBalance,
        balance
      })
    }
    lastQueryAt = Math.floor(Date.now() / 1000)
    lastBalance = balance
    if (queryIntervalSeconds > 0) {
      if (queryNum < maxQueries) {
        setTimeout(
          () => {
            queryBalance().catch(handleQueryError)
          },
          (queryIntervalSeconds + queryIntervalFalloffSeconds * queryNum++) * 1000
        )
      } else {
        console.warn('Reached max balance queries... stopping query interval.')
      }
    }
  }

  const handleQueryError = (err: Error) => {
    console.error(err)
    errorCount++
    if (errorCount > 2) {
      console.warn('Too many failed balance queries... stopping query interval.')
      destroyed = true
    }
  }

  onMount(async () => {
    await queryBalance().catch(handleQueryError)
  })

  onDestroy(() => {
    destroyed = false
  })
</script>

<span>
  {#if balance < 0n}
    <Loading height="1em" />
  {:else}
    {formatPrimaryToken(balance)}
  {/if}
</span>
