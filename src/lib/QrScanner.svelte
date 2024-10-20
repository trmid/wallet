<script lang="ts">
  import QrScanner from 'qr-scanner'
  import { createEventDispatcher, onDestroy, onMount } from 'svelte'

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

<!-- svelte-ignore a11y-media-has-caption -->
<video id="camera-video" bind:this={videoElement} />

<style>
  #camera-video {
    width: 100%;
    display: block;
  }
</style>
