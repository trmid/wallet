<script lang="ts">
  import type { BundlerClient } from 'viem/account-abstraction'
  import { formatPrimaryToken, primaryTokenAddress } from '../config'
  import { walletAddress } from './stores'
  import { createEventDispatcher, onDestroy, onMount } from 'svelte'
  import { type Address, type PublicClient } from 'viem'
  import Loading from './Loading.svelte'
  import { getBalance } from './balance'

  export let bundlerClient: BundlerClient
  export let tokenAddress: Address = primaryTokenAddress
  export let accountAddress: Address = $walletAddress
  export let queryIntervalSeconds: number = 0 // 0 means no re-query
  export let queryIntervalFalloffSeconds: number = 0 // The number of seconds added on each re-query
  export let maxQueries = 20 // max number of queries before it stops the interval
  export let balance: bigint = -1n

  const dispatch = createEventDispatcher()

  let lastBalance: bigint = -1n
  let errorCount = 0
  let queryNum = 0
  let destroyed = false
  let queryTimeout: number | null = null

  export const queryBalance = async () => {
    if (destroyed) return
    balance = await getBalance(bundlerClient.client as PublicClient, tokenAddress, accountAddress)
    if (lastBalance > -1n && balance > lastBalance) {
      dispatch('balanceIncrease', {
        accountAddress,
        tokenAddress,
        amount: balance - lastBalance,
        balance
      })
    }
    lastBalance = balance
    if (queryIntervalSeconds > 0) {
      if (queryNum < maxQueries) {
        queryTimeout = setTimeout(
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
      if (queryTimeout !== null) clearTimeout(queryTimeout)
    }
  }

  onMount(async () => {
    await queryBalance().catch(handleQueryError)
  })

  onDestroy(() => {
    destroyed = true
    if (queryTimeout !== null) clearTimeout(queryTimeout)
  })
</script>

<span>
  {#if balance < 0n}
    <Loading height="1em" />
  {:else}
    {formatPrimaryToken(balance)}
  {/if}
</span>
