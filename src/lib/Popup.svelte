<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from 'svelte'
  import { activePopupCount } from './stores'

  export let showCloseButton = true

  const dispatch = createEventDispatcher()
  const requestClose = () => {
    dispatch('requestClose')
  }

  onMount(() => {
    $activePopupCount++
  })

  onDestroy(() => {
    $activePopupCount--
  })
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  id="popup"
  on:click={requestClose}
  on:keypress={(e) => (e.key === 'Escape' ? requestClose() : null)}
>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div id="container" on:click|stopPropagation>
    <div>
      <slot />
    </div>
    {#if showCloseButton}
      <div id="close" on:click={requestClose}>x</div>
    {/if}
  </div>
</div>

<style>
  #popup {
    z-index: 100;
    position: var(--popup-position, fixed);
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--popup-width, 400px);
    height: var(--popup-height, 300px);
    max-width: var(--popup-max-width, 100vw);
    max-height: var(--popup-max-height, 100vh);
    top: var(--popup-top, 0);
    left: var(--popup-left, 0);
    transform: var(--popup-transform, '');

    --popup-margin: 0px;
  }

  #container {
    position: relative;
    background-color: var(--bg);
    box-shadow: 3px 3px 5px #0008;
    border-radius: 5px;
    overflow: auto;
    margin: auto;
    padding: var(--popup-padding, 1rem);
    width: calc(100% - var(--popup-margin) - var(--popup-margin));
    height: calc(100% - var(--popup-margin) - var(--popup-margin));
  }

  #close {
    z-index: 2;
    font-family: monospace;
    font-size: 24px;
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 32px;
    height: 32px;
    top: 0;
    right: 0;
    cursor: pointer;
    user-select: none;
  }

  #close:hover {
    color: var(--secondary);
  }
</style>
