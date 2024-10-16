<script lang="ts">
  import type { Address } from 'viem'
  import { shortAddress } from './address'

  export let address: Address
  export let enableCopy = false

  let copied = false

  const copy = () => {
    if (enableCopy && navigator && navigator.clipboard) {
      navigator.clipboard.writeText(address)
      copied = true
      setTimeout(() => (copied = false), 1000)
    }
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<span id="address" title={address} on:click={copy}>
  {#if copied}
    copied!
  {:else}
    {shortAddress(address)}
  {/if}
</span>

<style>
  #address {
    font-family: monospace;
    cursor: pointer;
  }
</style>
