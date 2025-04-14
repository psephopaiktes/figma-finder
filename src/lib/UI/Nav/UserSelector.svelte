<script lang="ts">
import i18n from "@/lib/i18n.svelte";
import oauth from "@/lib/oauth.svelte";
import { store } from "@/lib/store.svelte";
import { openSidePanel } from "@/lib/utils.svelte";

let users = $derived(store.options.users);

async function addAccount() {
  if (window.location.pathname.includes("popup")) {
    const result = confirm(
      i18n.t({
        en: "You need to add an account from the side panel. Do you want to open the side panel?",
        ja: "アカウントの追加はサイドパネル上から行う必要があります。サイドパネルを開きますか？",
        "zh-cn": "您需要从侧边栏添加帐户。要打开侧边栏吗？",
        es: "Necesita agregar una cuenta desde el panel lateral. ¿Quieres abrir el panel lateral?",
      }),
    );
    if (!result) return;
    openSidePanel();
    window.close();
    return;
  }
  await oauth.logIn({ add: true });
  location.reload();
}
</script>

{#if !store.options.currentUser}
  <a href="http://figma.com" target="_blank" class="figmaLink">
    <img src="/img/figma.svg" alt="Figma" />
  </a>
{:else}
  <button popovertarget="userSelector" class="selectorButton" tabindex="-1">
    <img src={users[store.options.currentUser].img_url} alt="User Selector" />
  </button>

  <dialog popover id="userSelector" class="c-popover">
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

    <button onclick={addAccount}>
      <svg-icon src="/img/icon/add.svg"></svg-icon>
      <p>
        {i18n.t({
          en: "Add account",
          ja: "アカウントの追加",
          "zh-cn": "添加账户",
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
          "zh-cn": "登出",
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
    left: auto;
    width: 240px;
    top: 44px;
    right: 8px;
    button {
      width: 100%;
      height: 40px;
      display: flex;
      gap: 0.5em;
      align-items: center;
      justify-content: start;
      p,
      small {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      p {
        line-height: 1;
        flex: 1;
        small {
          display: block;
          margin-block-start: 2px;
          font-size: 0.8em;
          opacity: 0.5;
        }
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
