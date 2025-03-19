<script lang="ts">
  import i18n from "@/lib/i18n.svelte";
  import oauth from "@/lib/oauth.svelte";
  import { store } from "@/lib/store.svelte";

  let selector: HTMLDialogElement;

  function openSelector() {
    selector.showModal();
  }

  function closeSelector() {
    selector.close();
  }

  function backdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    console.log(target);
    if (target === selector) {
      closeSelector();
    }
  }
</script>

{#if !store.options.currentUser}
  <a href="http://figma.com" target="_blank" class="figmaLink">
    <img src="/img/figma.svg" alt="Figma" />
  </a>
{:else}
  <button onclick={openSelector} class="selectorButton">
    <img
      src={store.options.users[store.options.currentUser].img_url}
      alt="User Selector"
    />
  </button>

  <dialog bind:this={selector} onclick={backdropClick}>
    <button
      onclick={() => {
        oauth.logOut();
        location.reload();
      }}
    >
      Logout
    </button>
  </dialog>
{/if}

<style>
  .figmaLink img {
    margin-inline: 8px;
    width: 16px;
    aspect-ratio: 2 / 3;
  }

  .selectorButton {
    height: 40px;
    border-radius: 50%;
    img {
      margin: 6px;
      width: 28px;
      aspect-ratio: 1;
      border-radius: 50%;
      background-color: color-mix(in srgb, var(--color-main) 10%, transparent);
    }
    &:hover {
      background-color: color-mix(in srgb, var(--color-main) 10%, transparent);
    }
  }

  dialog {
    position: fixed;
    width: 240px;
    left: auto;
    top: 48px;
    right: 8px;
    padding: 16px;

    border-radius: 12px;
    color: var(--color-base);
    background-color: var(--color-main);
    box-shadow: 2px 8px 64px -16px rgb(0 0 0 / 0.1);
    &::backdrop {
      background-color: transparent;
    }
  }
</style>
