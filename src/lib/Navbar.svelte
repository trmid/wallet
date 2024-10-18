<script lang="ts">
  import Loading from './Loading.svelte'
  import Popup from './Popup.svelte'
  import Address from './Address.svelte'
  import { appSrc, bgColor, bundlerClient, primaryColor, walletAddress } from './stores'

  let showAccountInfo = false
  let qrCodeContainer: HTMLDivElement | undefined

  $: if (qrCodeContainer) {
    new QRCode(qrCodeContainer, $walletAddress)
  }
</script>

<nav>
  <div>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <span on:click={() => ($appSrc = 'Home')}>
      <svg
        width="56mm"
        height="56mm"
        version="1.1"
        viewBox="0 0 56 56"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform="translate(-75.628 -91.966)">
          <rect
            x="83.092"
            y="103.21"
            width="41.072"
            height="33.516"
            ry="8.7545"
            fill={$primaryColor}
            stroke={$bgColor}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="12"
            style="paint-order:stroke fill markers"
          />
          <rect
            x="103.14"
            y="119.98"
            width="25.228"
            height="7.227"
            ry="3.4844"
            fill={$bgColor}
            style="paint-order:stroke fill markers"
          />
        </g>
      </svg>
      <span id="logo">Wallet</span>
    </span>
    {#if $bundlerClient}
      <button class="connected" on:click={() => (showAccountInfo = true)}>
        <i class="icofont-wallet"></i>
        {#if !!$walletAddress}
          <Address address={$walletAddress} enableCopy={false}></Address>
        {:else}
          <Loading height="0.5rem" />
        {/if}
      </button>
    {/if}
  </div>
</nav>

{#if showAccountInfo}
  <Popup
    showCloseButton={true}
    on:requestClose={() => {
      console.log('close')
      showAccountInfo = false
    }}
    --popup-position="fixed"
    --popup-top="50%"
    --popup-left="50%"
    --popup-width="fit-content"
    --popup-max-width="90vw"
    --popup-height="fit-content"
    --popup-max-height="90vh"
    --popup-padding="2rem"
    --popup-transform="translate(-50%, -50%)"
  >
    <div class="wallet-info">
      <h3>Your Wallet</h3>
      <aside>You can receive tokens to this address on the Base network.</aside>
      <br />
      <button>
        <Address address={$walletAddress} enableCopy={true} showFull={true}></Address>
      </button>
      <div class="qr-container" bind:this={qrCodeContainer}></div>
    </div>
  </Popup>
{/if}

<style>
  nav {
    padding: 0.5rem 1rem;
    background-color: inherit;
    border-bottom: solid 2px currentColor;
    z-index: 50;
    font-family: monospace;
  }

  nav > div {
    margin: 0 auto;
    width: 100%;
    max-width: 1280px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  nav > div > span {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 24px;
    font-family: monospace;
    cursor: pointer;
  }

  nav > div svg {
    width: 32px;
    height: 32px;
  }

  #logo {
    position: relative;
    top: 1px;
    font-size: 28px;
    font-family: 'Supermercado One', sans-serif;
    margin-left: 3px;
  }

  button.connected {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    font-family: monospace;
  }

  .wallet-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .qr-container {
    width: 300px;
    height: 300px;
    max-width: 90vw;
    max-height: 90vh;
    background-color: white;
    border-radius: 1rem;
    margin-top: 1rem;
    margin-bottom: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  :global(.qr-container > img) {
    width: 256px;
    height: 256px;
  }
</style>
