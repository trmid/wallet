<script lang="ts">
  import { onMount } from 'svelte'
  import { appSrc, bookmarkInfo, bookmarks } from './stores'
  import Popup from './Popup.svelte'
  import { fetchManifest, updateBookmarkInfo } from './web'
  import { primaryTokenSymbol } from '../config'

  const defaultApps = [
    new URL('https://classic.cabana.fi/').toString(),
    new URL('https://smold.app/').toString()
  ]

  let hotSrc = 'wallet://home'
  let mounted = false
  let showingBookmarks = false
  let srcInput: HTMLInputElement

  $: $appSrc && updateHotSrc($appSrc)

  const updateHotSrc = (newSrc: string) => {
    hotSrc = newSrc
  }

  const go = async () => {
    if (!hotSrc.match(/^[a-z]+\:\/\//)) {
      hotSrc = `https://${hotSrc}`
    }
    hotSrc = new URL(hotSrc).toString()
    appSrc.set(hotSrc)
    closeAllModals()
  }

  const goHome = () => {
    $appSrc = 'wallet://home'
    closeAllModals()
  }

  const showBookmarks = () => {
    closeAllModals()
    showingBookmarks = true
  }

  const closeAllModals = () => {
    showingBookmarks = false
  }

  const saveBookmarks = () => {
    localStorage.setItem('bookmarks', JSON.stringify($bookmarks))
  }

  const toggleBookmark = () => {
    if ($appSrc && $appSrc !== 'wallet://home') {
      const formattedUrl = new URL($appSrc).toString()
      if ($bookmarks.includes(formattedUrl)) {
        $bookmarks = $bookmarks.filter((x) => x !== formattedUrl)
      } else {
        $bookmarks = [...$bookmarks, formattedUrl]
      }
      saveBookmarks()
    }
  }

  const deleteBookmark = (bookmark: string) => {
    $bookmarks = $bookmarks.filter((x) => x !== bookmark)
    saveBookmarks()
  }

  onMount(async () => {
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
          $bookmarks = bookmarksArray.map((x) => new URL(x).toString())
        }
      } catch (err) {
        localStorage.removeItem('bookmarks')
      }
    }
    if ($bookmarks.length == 0) {
      $bookmarks = [...defaultApps]
    }
    saveBookmarks()

    try {
      $bookmarkInfo = JSON.parse(localStorage.getItem('bookmarkInfo') ?? '{}')
    } catch (err) {
      localStorage.removeItem('bookmarkInfo')
      $bookmarkInfo = {}
    }
    $bookmarkInfo['wallet://transfer'] = {
      name: 'Transfer',
      description: `Send or receive ${primaryTokenSymbol} to your wallet.`,
      icon: '/icon-square.svg',
      backgroundColor:
        document.documentElement.computedStyleMap().get('--bg')?.toString() ?? 'white',
      color: document.documentElement.computedStyleMap().get('--primary')?.toString() ?? 'black'
    }

    // Queue manifest updates for bookmarks not stored in info
    for (const bookmark of $bookmarks) {
      if (!$bookmarkInfo[bookmark]) {
        fetchManifest(bookmark)
          .then((manifest) => {
            if (manifest) {
              updateBookmarkInfo(bookmark, manifest)
            }
          })
          .catch(console.error)
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
      {#if $appSrc !== 'wallet://home'}
        <button title="Home" on:click={goHome}>
          <i class="icofont-ui-home"></i>
        </button>
      {/if}
      <input
        id="src-input"
        type="text"
        autocomplete="off"
        bind:this={srcInput}
        bind:value={hotSrc}
        on:keypress={(e) => (e.key === 'Enter' ? go() : null)}
        placeholder="App URL"
        on:focus={(e) => {
          showBookmarks()
          srcInput.select()
        }}
      />
      {#if hotSrc === $appSrc && !$appSrc.startsWith('wallet://')}
        <button
          on:click={toggleBookmark}
          class="bookmark-btn"
          class:bookmarked={$bookmarks.includes(hotSrc)}
        >
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
          --popup-max-height="80vh"
          --popup-padding="0.5rem"
          --popup-border-radius="0.5rem"
          style="border: 0.25rem solid currentColor;"
          showCloseButton={false}
        >
          <div id="bookmarks">
            {#each $bookmarks as bookmark, i}
              <div class="bookmark">
                {#if $bookmarks.length > 1}
                  <button
                    title="Swap Order"
                    class="swap-btn"
                    class:hide={i == 0}
                    on:click={() => {
                      $bookmarks[i] = $bookmarks[i - 1]
                      $bookmarks[i - 1] = bookmark
                      saveBookmarks()
                    }}
                  >
                    <i class="icofont-arrow-down"></i>
                    <i class="icofont-arrow-up"></i>
                  </button>
                {/if}
                <button
                  class="go-to-btn"
                  on:click={() => {
                    hotSrc = bookmark
                    go()
                  }}
                  title={bookmark}
                >
                  {$bookmarkInfo[bookmark]?.name || bookmark}
                </button>
                <button
                  title="Delete Bookmark"
                  class="delete-btn"
                  on:click={() => deleteBookmark(bookmark)}
                >
                  <i class="icofont-duotone icofont-purge"></i>
                </button>
              </div>
            {/each}
          </div>
        </Popup>
      {/if}
    </div>
    <button on:click={go}><i class="icofont-arrow-right"></i></button>
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
    flex-wrap: nowrap;
    gap: 0.25rem;
    padding: 0.5rem 1rem;
    font-family: monospace;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 0.25rem;
    flex-grow: 1;
    min-width: 0;
  }

  #src-input {
    min-width: 50px;
    flex-grow: 1;
    flex-shrink: 1;
  }

  .bookmark-btn.bookmarked {
    opacity: 0.5;
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
    position: relative;
    display: flex;
    flex-direction: row;
    gap: 0.25rem;
  }

  .bookmark > button.swap-btn {
    transform: translateY(-55%);
    padding: 2px;
  }

  .bookmark > button.swap-btn.hide {
    visibility: hidden;
  }

  button.swap-btn > i {
    display: inline-block;
  }

  button.swap-btn > i:first-child {
    position: relative;
    top: 2px;
    left: 5px;
  }

  button.swap-btn > i:last-child {
    position: relative;
    bottom: 2px;
    right: 5px;
  }

  .bookmark > button.go-to-btn {
    flex-grow: 1;
  }

  .bookmark > button.go-to-btn {
    width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .bookmark > button.delete-btn {
    color: crimson;
  }
</style>
