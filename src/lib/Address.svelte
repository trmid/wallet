<script lang="ts">
  import type { Address } from 'viem'
  import { shortAddress } from './address'

  export let address: Address
  export let enableCopy = false
  export let showFull = false

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
<span class="address" title={address} class:copied on:click={copy}>
  {#if showFull}
    {address}
  {:else}
    {shortAddress(address)}
  {/if}
  {#if copied}
    <div class="copy-text">copied!</div>
  {/if}
</span>

<style>
  .address {
    position: relative;
    display: inline-block;
    font-family: monospace;
    cursor: pointer;
  }

  .address.copied {
    color: #0000;
  }

  .copy-text {
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--primary);
  }
</style>
