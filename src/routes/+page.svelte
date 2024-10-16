<script lang="ts">
  import ConnectModal from '$lib/ConnectModal.svelte'
  import DappView from '$lib/DappView.svelte'
  import { bundlerClient } from '$lib/stores'
</script>

<svelte:head>
  <title>Wallet</title>
  <meta
    name="description"
    content="Completely client-side web wallet with account abstraction and a dapp browser."
  />
</svelte:head>

<div id="app-bar">
  {#if !!$bundlerClient}
    <DappView bundlerClient={$bundlerClient}></DappView>
  {:else}
    <ConnectModal></ConnectModal>
  {/if}
</div>

<style>
  #app-bar {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    flex-grow: 1;
  }

  @media screen and (max-width: 540px) {
    #app-bar {
      flex-direction: column;
    }
  }
</style>
