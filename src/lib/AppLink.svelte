<script lang="ts">
  import { appSrc, bookmarkInfo } from './stores'

  export let bookmark: string
</script>

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

<style>
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
</style>
