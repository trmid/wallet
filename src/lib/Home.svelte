<script lang="ts">
  import AppLink from './AppLink.svelte'
  import Balance from './Balance.svelte'
  import { bookmarks, bookmarkInfo, appSrc, bundlerClient, transferAction } from './stores'

  const goToTransferApp = (action: typeof $transferAction) => {
    $transferAction = action
    $appSrc = 'wallet://transfer'
  }
</script>

<div class="wrapper">
  <!-- Balance and Mini Apps -->
  {#if $bundlerClient}
    <div class="view-header-wrapper">
      <div class="view-header-container">
        <h2>Balance</h2>
        <div class="balance-info">
          <span class="balance">
            <Balance bundlerClient={$bundlerClient} />
          </span>
          <button title="Send" on:click={() => goToTransferApp('send')}>
            <i class="icofont-upload-alt"></i>
          </button>
          <button title="Receive" on:click={() => goToTransferApp('receive')}>
            <i class="icofont-download"></i>
          </button>
        </div>
      </div>
    </div>
  {/if}
  <div class="app-view">
    <div class="app-container">
      {#each ['wallet://transfer'] as bookmark}
        <AppLink {bookmark} />
      {/each}
    </div>
  </div>

  <!-- Dapps -->
  <div class="view-header-wrapper">
    <div class="view-header-container">
      <h2>Dapps</h2>
    </div>
  </div>
  <div class="app-view">
    <div class="app-container">
      {#each $bookmarks as bookmark}
        <AppLink {bookmark} />
      {/each}
    </div>
  </div>
</div>

<style>
  .wrapper {
    position: absolute;
    inset: 0;
    overflow-y: auto;
  }

  .view-header-wrapper {
    padding: 0 1rem;
    width: 1280px;
    max-width: 100%;
    margin: 0 auto;
  }

  .view-header-container {
    padding: 1rem;
    color: var(--bg);
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid currentColor;
  }

  .view-header-container > h2 {
    font-size: large;
    font-weight: bold;
    margin: 0;
  }

  .balance-info {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.25rem;
  }

  .balance-info > button {
    font-size: large;
    width: 2.5rem;
    padding: 0.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .balance {
    font-weight: bold;
    margin-right: 0.5rem;
  }

  .app-view {
    flex-grow: 1;
    overflow-y: auto;
  }

  .app-container {
    padding: 1rem;
    width: 1280px;
    max-width: 100%;
    max-height: fit-content;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-auto-rows: minmax(100px, auto);
    gap: 1rem;
  }

  @media (max-width: 1024px) {
    .app-container {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  @media (max-width: 900px) {
    .app-container {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 720px) {
    .app-container {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 400px) {
    .app-container {
      grid-template-columns: repeat(1, 1fr);
    }
  }
</style>
