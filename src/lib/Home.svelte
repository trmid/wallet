<script lang="ts">
  import { bookmarks, bookmarkInfo, appSrc } from './stores'
</script>

<div class="wrapper">
  <div class="container">
    {#each ['wallet://transfer', ...$bookmarks] as bookmark}
      <a
        on:click|preventDefault={() => ($appSrc = bookmark)}
        href={bookmark}
        class="bookmark"
        style:background-color={$bookmarkInfo[bookmark]?.backgroundColor}
        style:color={$bookmarkInfo[bookmark]?.color}
      >
        <div class="header">
          {#if $bookmarkInfo[bookmark]?.icon}
            <img class="icon" src={$bookmarkInfo[bookmark].icon} alt="" />
          {/if}
          {#if $bookmarkInfo[bookmark]?.name}
            <strong>{$bookmarkInfo[bookmark].name}</strong>
          {/if}
        </div>
        <p>
          {$bookmarkInfo[bookmark]?.description ?? bookmark}
        </p>
      </a>
    {/each}
  </div>
</div>

<style>
  .wrapper {
    position: absolute;
    inset: 0;
    overflow-y: auto;
  }

  .container {
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

  .bookmark {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    text-decoration: none;
    color: inherit;
    background-color: var(--bg-2);
    padding: 1.5rem 1rem;
    border-radius: 0.5rem 1.5rem 1.5rem 1.5rem;
    box-shadow: 3px 3px 7px #0008;
    overflow: hidden;
    width: 100%;
    height: 150px;
  }

  .bookmark > .header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .bookmark img {
    width: 24px;
    height: 24px;
  }

  .bookmark > p {
    font-size: small;
  }

  @media (max-width: 1024px) {
    .container {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  @media (max-width: 900px) {
    .container {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 720px) {
    .container {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 400px) {
    .container {
      grid-template-columns: repeat(1, 1fr);
    }
  }
</style>
