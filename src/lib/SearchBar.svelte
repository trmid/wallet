<script lang="ts">
  import { onMount } from 'svelte'
  import { appSrc, bookmarks } from './stores'
  import Popup from './Popup.svelte'

  let hotSrc = 'https://smold.app/'
  let mounted = false
  let showingBookmarks = false

  $: $appSrc && updateHotSrc($appSrc)

  const updateHotSrc = (newSrc: string) => {
    hotSrc = newSrc
  }

  const go = async () => {
    appSrc.set(hotSrc)
  }

  const showBookmarks = () => {
    closeAllModals()
    showingBookmarks = true
  }

  const closeAllModals = () => {
    showingBookmarks = false
  }

  const addBookmark = () => {
    if ($appSrc) {
      $bookmarks = [...$bookmarks, $appSrc]
      localStorage.setItem('bookmarks', JSON.stringify($bookmarks))
    }
  }

  const deleteBookmark = (bookmark: string) => {
    $bookmarks = $bookmarks.filter((x) => x !== bookmark)
    localStorage.setItem('bookmarks', JSON.stringify($bookmarks))
  }

  onMount(() => {
    const searchParams = new URLSearchParams(location.search)
    hotSrc =
      decodeURIComponent(searchParams.get('app') ?? '') ||
      localStorage.getItem('lastVisited') ||
      hotSrc
    $appSrc = hotSrc

    const bookmarksStr = localStorage.getItem('bookmarks')
    if (bookmarksStr) {
      try {
        const bookmarksArray = JSON.parse(bookmarksStr)
        if (Array.isArray(bookmarksArray)) {
          $bookmarks = bookmarksArray
        }
      } catch (err) {
        localStorage.removeItem('bookmarks')
      }
    }

    mounted = true
  })
</script>

<svelte:window
  on:click={() => {
    closeAllModals()
  }}
  on:keydown={(e) => {
    if (e.key === 'Escape') {
      closeAllModals()
    }
  }}
/>

<nav>
  <div>
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="input-wrapper" on:click|stopPropagation on:keydown|stopPropagation>
      <input
        id="src-input"
        type="text"
        autocomplete="off"
        bind:value={hotSrc}
        on:keypress={(e) => (e.key === 'Enter' ? go() : null)}
        placeholder="App URL"
        on:focus={showBookmarks}
      />
      {#if hotSrc === $appSrc}
        <button on:click={addBookmark} disabled={$bookmarks.includes(hotSrc)}>
          <i class="icofont-duotone icofont-bookmark"></i>
        </button>
      {/if}
      {#if showingBookmarks && $bookmarks.length > 0}
        <Popup
          --popup-position="absolute"
          --popup-top="110%"
          --popup-left="0"
          --popup-width="100%"
          --popup-height="fit-content"
          --popup-max-height="300px"
          --popup-padding="0.5rem"
          showCloseButton={false}
        >
          <div id="bookmarks">
            {#each $bookmarks as bookmark}
              <div class="bookmark">
                <button
                  on:click={() => {
                    hotSrc = bookmark
                    go()
                  }}
                  title={bookmark}
                >
                  {bookmark}
                </button>
                <button on:click={() => deleteBookmark(bookmark)}>
                  <i class="icofont-duotone icofont-purge"></i>
                </button>
              </div>
            {/each}
          </div>
        </Popup>
      {/if}
    </div>
    <button on:click={go}>Go <i class="icofont-caret-right"></i></button>
  </div>
</nav>

<style>
  nav {
    background-color: var(--primary);
  }

  nav > div {
    margin: 0 auto;
    max-width: 1280px;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    font-family: monospace;
  }

  .input-wrapper {
    position: relative;
    height: 32px;
    display: flex;
    flex-direction: row;
    gap: 0.25rem;
  }

  #src-input {
    width: 300px;
    max-width: 75vw;
  }

  #bookmarks {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 2px;
  }

  .bookmark > button {
    text-align: left;
  }

  .bookmark {
    display: flex;
    flex-direction: row;
    gap: 0.25rem;
  }

  .bookmark > button:first-child {
    flex-grow: 1;
  }

  .bookmark > button:first-child {
    width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bookmark > button:last-child {
    color: crimson;
  }
</style>
