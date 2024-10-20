<script lang="ts">
  import QrScanner from 'qr-scanner'
  import { createEventDispatcher, onDestroy, onMount } from 'svelte'

  export let width: string = '300px'
  export let height: string = '300px'

  const dispatch = createEventDispatcher()

  let qrScanner: QrScanner | undefined
  let videoElement: HTMLVideoElement
  let isQrEnabled = false

  const handleQrScan = (result: QrScanner.ScanResult) => {
    dispatch('qrData', result.data)
  }

  onMount(async () => {
    isQrEnabled = await QrScanner.hasCamera()
    console.log(isQrEnabled)
    if (isQrEnabled) {
      qrScanner = new QrScanner(videoElement, handleQrScan, {
        highlightScanRegion: true,
        highlightCodeOutline: true
      })
      qrScanner.start()
    }
  })

  onDestroy(() => {
    if (qrScanner) {
      qrScanner.stop()
      qrScanner.destroy()
    }
  })
</script>

<div class="camera-container" style:width style:height>
  <!-- svelte-ignore a11y-media-has-caption -->
  <video class="camera-video" bind:this={videoElement} style:width style:height />
</div>

<style>
  .camera-container {
    position: relative;
    overflow: hidden;
    max-height: 90vmin;
    max-width: 90vmin;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .camera-video {
    display: block;
    overflow: hidden;
    object-fit: cover;
  }
</style>
