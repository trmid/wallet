<script lang="ts">
  import { chainInfo } from '../config'
  import Address from './Address.svelte'
  import { walletAddress } from './stores'

  let qrCodeContainer: HTMLDivElement | undefined

  $: if (qrCodeContainer) {
    new QRCode(qrCodeContainer, $walletAddress)
  }
</script>

<div class="wallet-info">
  <h3>Your Wallet</h3>
  <div class="address-button-row">
    <button>
      <Address address={$walletAddress} enableCopy={true}>
        <i class="icofont-ui-copy" slot="before"></i>
      </Address>
    </button>
    <button
      on:click={async () => {
        try {
          await navigator.share({
            text: `My wallet address on the ${chainInfo.name} network: ${$walletAddress}`
          })
        } catch (err) {
          console.error(err)
        }
      }}
    >
      <i class="icofont-share"></i>
    </button>
  </div>
  <div class="qr-container" bind:this={qrCodeContainer}></div>
  <br />
  <aside class="chain-warning">
    <i class="icofont-warning-alt"></i>
    <span
      >You can receive tokens to this address on the {chainInfo.name}
      network.</span
    >
  </aside>
</div>

<style>
  .wallet-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .address-button-row {
    display: flex;
    justify-content: center;
    align-items: stretch;
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  .address-button-row > button {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .qr-container {
    width: 300px;
    max-width: 100%;
    max-height: 80vh;
    background-color: white;
    border-radius: 1rem;
    margin-top: 1rem;
    margin-bottom: 1rem;
    padding: 2rem;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .chain-warning {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 0.5rem;
    max-width: 300px;
    padding: 0.5rem;
  }

  .chain-warning > i {
    font-size: 24px;
  }

  :global(.qr-container > img) {
    width: 256px;
    max-width: 100%;
  }
</style>
