<script lang="ts">
  import Navbar from '$lib/Navbar.svelte'
  import SearchBar from '$lib/SearchBar.svelte'
  import { onMount } from 'svelte'
  import '../app.css'

  let collapse = false

  onMount(() => {
    try {
      'serviceWorker' in navigator && navigator.serviceWorker.register('/sw.js')
    } catch (err) {
      console.error(err)
    }
  })
</script>

<header class:collapse>
  <div class="content">
    <Navbar />
    <SearchBar />
  </div>
  <button
    class="collapse-btn"
    title={collapse ? 'Show Navbar' : 'Hide Navbar'}
    on:click={() => (collapse = !collapse)}
  >
    <i class:icofont-caret-up={!collapse} class:icofont-caret-down={collapse}></i>
  </button>
</header>

<main><slot /></main>

<style>
  header {
    position: relative;
    width: 100%;
  }

  header.collapse .content {
    display: none;
  }

  .collapse-btn {
    position: absolute;
    left: 50%;
    top: -30px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    transform: translateX(-50%);
    padding-top: 28px;
    text-align: center;
    z-index: 100;
    background-color: var(--primary);
    color: var(--bg);
    cursor: pointer;
    font-size: large;
  }

  main {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    flex-grow: 1;
    background-color: var(--bg2);
  }
</style>
