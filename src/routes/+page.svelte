<script lang="ts">
  import DappView from '$lib/DappView.svelte'
  import SearchBar from '$lib/SearchBar.svelte'
  import { appSrc, bookmarkInfo, bundlerClient } from '$lib/stores'
  import { onMount } from 'svelte'

  onMount(() => {
    // Update bookmark info:
    bookmarkInfo.set(JSON.parse(localStorage.getItem('bookmarkInfo') ?? '{}'))

    // Set appSrc to home:
    appSrc.set('home')
  })
</script>

<svelte:head>
  <title>Wallet</title>
  <meta
    name="description"
    content="Completely client-side web wallet with account abstraction and a dapp browser."
  />
</svelte:head>

<SearchBar />

<div id="app-bar">
  {#if !!$bundlerClient}
    <DappView bundlerClient={$bundlerClient}></DappView>
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
