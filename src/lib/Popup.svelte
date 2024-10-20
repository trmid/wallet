<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from 'svelte'
  import { activePopupCount } from './stores'

  export let showCloseButton = true
  export let style: string = ''

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

<svelte:window
  on:pointerdown={() => requestClose()}
  on:keydown|stopPropagation={(e) => {
    e.key === 'Escape' ? requestClose() : null
  }}
/>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div id="popup" on:click|stopPropagation on:pointerdown|stopPropagation {style}>
  <div>
    <slot />
  </div>
  {#if showCloseButton}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div id="close" title="Close" on:click={requestClose}>
      <i class="icofont-ui-close"></i>
    </div>
  {/if}
</div>

<style>
  #popup {
    z-index: 100;
    position: var(--popup-position, fixed);
    background-color: var(--popup-bg, var(--bg));
    color: var(--popup-color, var(--primary));
    width: var(--popup-width, 400px);
    height: var(--popup-height, 300px);
    max-width: var(--popup-max-width, 100vw);
    max-height: var(--popup-max-height, 100vh);
    top: var(--popup-top, 0);
    left: var(--popup-left, 0);
    transform: var(--popup-transform, '');
    padding: var(--popup-padding, 1rem);
    box-shadow: 3px 3px 5px #0008;
    border: 0.5rem solid currentColor;
    border-radius: var(--popup-border-radius, 1rem);
    overflow: auto;
  }

  #close {
    z-index: 2;
    font-family: monospace;
    font-size: medium;
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 32px;
    height: 32px;
    top: 0.5rem;
    right: 0.5rem;
    cursor: pointer;
    user-select: none;
  }

  #close:hover {
    color: var(--secondary);
  }
</style>
