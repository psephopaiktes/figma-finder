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
    {#each Object.keys(store.options.users) as user}
      <button
        onclick={() => {
          store.options.currentUser = user;
          storage.setItem("sync:options", store.options);
          location.reload();
        }}
        inert={store.options.currentUser == user}
      >
        <img src={store.options.users[user].img_url} alt="Profile Icon" />
        <p>
          {store.options.users[user].handle}
          <small>{store.options.users[user].email}</small>
        </p>
        {#if store.options.currentUser == user}
          <svg-icon src="/img/icon/check.svg"></svg-icon>
        {/if}
      </button>
    {/each}

    <button
      onclick={async () => {
        await oauth.logIn({ add: true });
        location.reload();
      }}
    >
      <svg-icon src="/img/icon/add.svg"></svg-icon>
      <p>
        {i18n.t({
          en: "Add account",
          ja: "アカウントの追加",
          "zh-CN": "添加账户",
        })}
      </p>
    </button>

    <hr />

    <button
      onclick={() => {
        oauth.logOut();
        location.reload();
      }}
      class="simple"
    >
      <svg-icon src="/img/icon/logout.svg"></svg-icon>
      <p>
        {i18n.t({
          en: "Log out",
          ja: "ログアウト",
          "zh-CN": "登出",
        })}
      </p>
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
    flex-direction: column;
    gap: var(--sp-xs);
    width: 240px;
    left: auto;
    top: 44px;
    right: 8px;
    padding: 8px;
    border-radius: 12px;
    color: var(--color-base);
    background-color: var(--color-main);
    border: 1px solid color-mix(in srgb, var(--color-base) 20%, transparent);
    box-shadow: 2px 12px 64px -24px rgb(0 0 0 / 0.4);
    &[open] {
      display: flex;
    }
    &::backdrop {
      background-color: transparent;
    }

    hr {
      border: 0;
      border-top: 1px solid
        color-mix(in srgb, var(--color-base) 20%, transparent);
    }
    button {
      width: 100%;
      display: flex;
      gap: 0.5em;
      align-items: center;
      justify-content: start;
      padding: 0 8px;
      border-radius: 4px;
      height: 40px;
      p,
      small {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      p {
        text-align: left;
        line-height: 1;
        flex: 1;
        small {
          display: block;
          margin-block-start: 2px;
          font-size: 0.8em;
          opacity: 0.5;
        }
      }
      &:hover {
        background: var(--color-theme);
      }
      img {
        width: 24px;
        aspect-ratio: 1;
        border-radius: 50%;
      }
      svg-icon {
        font-size: 24px;
      }
    }
  }
</style>
