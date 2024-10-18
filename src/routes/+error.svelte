<script lang="ts">
  import { page } from '$app/stores'
  import { onMount } from 'svelte'

  onMount(() => {
    location.assign('/')
  })
</script>

<div class="margins">
  <h1>{$page.status}: {$page.error?.message}</h1>
</div>

<style>
  .margins {
    max-width: 1024px;
    margin: 0 auto;
    padding: 1rem;
  }
</style>
