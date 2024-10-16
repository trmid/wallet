<script>
  import Loading from './Loading.svelte'
  import ShortAddress from './ShortAddress.svelte'
  import { appSrc, bgColor, bundlerClient, primaryColor, walletAddress } from './stores'
</script>

<nav>
  <div>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <span on:click={() => ($appSrc = 'home')}>
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
      <div class="connected">
        <i class="icofont-wallet"></i>
        {#if !!$walletAddress}
          <ShortAddress address={$walletAddress} enableCopy={true}></ShortAddress>
        {:else}
          <Loading height="0.5rem" />
        {/if}
      </div>
    {/if}
  </div>
</nav>

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
    font-family: 'Major Mono Display', monospace;
  }

  div.connected {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    gap: 0.5rem;
    font-family: monospace;
  }
</style>
