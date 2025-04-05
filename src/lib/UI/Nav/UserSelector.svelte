<script lang="ts">
import i18n from "@/lib/i18n.svelte";
import oauth from "@/lib/oauth.svelte";
import { store } from "@/lib/store.svelte";

let users = $derived(store.options.users);
let selector: HTMLDialogElement;

function openSelector() {
  selector.showModal();
}

function closeSelector() {
  selector.close();
}

function backdropClick(event: MouseEvent): void {
  const target = event.target as HTMLElement;
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
    <img src={users[store.options.currentUser].img_url} alt="User Selector" />
  </button>

  <dialog bind:this={selector} onclick={backdropClick}>
    {#each Object.keys(users) as id}
      <button
        onclick={() => {
          store.options.currentUser = id;
          storage.setItem("sync:options", store.options);
          storage.removeItem("local:projects");
          location.reload();
        }}
        inert={store.options.currentUser == id}
      >
        <img src={users[id].img_url} alt="Profile Icon" />
        <p>
          {users[id].handle}
          <small>{users[id].email}</small>
        </p>
        {#if store.options.currentUser == id}
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
          es: "Agregar cuenta",
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
          es: "Cerrar sesión",
        })}
      </p>
    </button>
  </dialog>
{/if}

<style>
  .figmaLink {
    margin-inline: 8px;
    img {
      width: 16px;
      aspect-ratio: 2 / 3;
    }
  }

  .selectorButton {
    height: 40px;
    border-radius: 50%;
    img {
      margin: 6px;
      width: 28px;
      aspect-ratio: 1;
      border-radius: 50%;
      background-color: rgb(from var(--color-main) r g b / 10%);
    }
    &:hover {
      background-color: rgb(from var(--color-main) r g b / 10%);
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
    border: 1px solid rgb(from var(--color-base) r g b / 20%);
    box-shadow: 2px 12px 64px -24px rgb(0 0 0 / 0.4);
    &[open] {
      display: flex;
    }
    &::backdrop {
      background-color: transparent;
    }

    hr {
      border: 0;
      border-top: 1px solid rgb(from var(--color-base) r g b / 20%);
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
