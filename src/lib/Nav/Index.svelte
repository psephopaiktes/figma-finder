<script lang="ts">
  import i18n from "@/lib/i18n.svelte";
  import { store } from "@/lib/store.svelte";
  import UserSelector from "./UserSelector.svelte";

  let { title = null, current = null, children = null } = $props();
  let drawer: HTMLDialogElement;

  function openDrawer() {
    drawer.showModal();
  }

  function closeDrawer() {
    drawer.close();
  }

  function backdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    console.log(target);
    if (target === drawer) {
      closeDrawer();
    }
  }
</script>

<nav class="l-nav">
  <header class="l-navHeader">
    <button onclick={openDrawer}>
      <svg-icon src="/img/icon/menu.svg">
        {i18n.t({ en: "Menu", ja: "メニュー", "zh-cn": "菜单" })}
      </svg-icon>
    </button>

    <div class="child">
      {#if children}
        {@render children?.()}
      {:else if title}
        <h1>{i18n.t(title)}</h1>
      {:else}
        <h1>Figma Finder</h1>
      {/if}
    </div>

    <UserSelector />
  </header>

  <dialog bind:this={drawer} onclick={backdropClick} class="l-navDrawer">
    <button onclick={closeDrawer}>
      <svg-icon src="/img/icon/close.svg">
        {i18n.t({ en: "Close", ja: "閉じる", "zh-cn": "关闭" })}
      </svg-icon>
    </button>

    <h1>
      <img src="/img/logo-symbol.svg" alt="Figma Finder" />
    </h1>

    <hr />

    <ul>
      <li>
        <!-- Loopさせるとか、そもそももっとシンプル?TODO -->
        <a
          href="/sidepanel.html"
          class:current={current === "home"}
          inert={current === "home"}
          onclick={(e) => {
            e.preventDefault();
            closeDrawer();
            location.href = browser.runtime.getURL("/sidepanel.html");
          }}
        >
          <svg-icon src="/img/icon/home.svg"></svg-icon>
          home
        </a>
      </li>

      <li>
        <a
          href="/options.html?sidepanel"
          class:current={current === "options"}
          inert={current === "options"}
          onclick={(e) => {
            e.preventDefault();
            closeDrawer();
            location.href = browser.runtime.getURL("/options.html?sidepanel");
          }}
        >
          <svg-icon src="/img/icon/options.svg"></svg-icon>
          Options
        </a>
      </li>

      <li>
        <a
          href="/help.html"
          class:current={current === "help"}
          inert={current === "help"}
          onclick={(e) => {
            e.preventDefault();
            closeDrawer();
            location.href = browser.runtime.getURL("/help.html");
          }}
        >
          <svg-icon src="/img/icon/help.svg"></svg-icon>
          Help
        </a>
      </li>
    </ul>

    <footer>
      <a href="https://hira.page" target="_blank"> © Akira HIRATA </a>
    </footer>
  </dialog>
</nav>

<style>
  header {
    display: flex;
    justify-content: stretch;
    align-items: center;
    gap: 8px;
    padding-inline: 8px;
    background: color-mix(in srgb, var(--color-base) 60%, transparent);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid
      color-mix(in srgb, var(--color-main) 10%, transparent);

    button {
      width: 40px;
      aspect-ratio: 1;
      font-size: 20px;
      border-radius: 8px;
      line-height: 100%;
      &:hover {
        background: color-mix(in srgb, var(--color-main) 5%, transparent);
      }
    }
    .child {
      flex: 1;
      h1 {
        font-size: 1.5em;
        font-weight: 600;
      }
    }
  }

  dialog {
    color: var(--color-main);
    background: var(--color-base);
    box-shadow:
      0 0 32px rgb(0 0 0 / 0.1),
      0 0 64px rgb(0 0 0 / 0.1);
    &::backdrop {
      background-color: rgb(0 0 0 / 0.1);
      backdrop-filter: blur(2px);
    }

    h1 {
      margin: 0;
      color: var(--color-theme);
      text-align: center;
      padding: 48px 0 40px;
    }
    hr {
      margin-top: 8px;
      border: 0;
      border-top: 1px solid var(--color-main);
      opacity: 0.1;
    }
    ul {
      margin-top: 8px;
      li {
        height: 48px;
        padding: 2px 8px;
      }
      a {
        display: block;
        position: relative;
        padding: 0 8px 0 48px;
        line-height: 44px;
        border-radius: 6px;
        text-decoration: none;
        font-size: 16px;
        opacity: 0.8;
        &:hover {
          background: color-mix(in srgb, var(--color-theme) 10%, transparent);
        }
        &.current {
          background: color-mix(in srgb, var(--color-theme) 20%, transparent);
          color: var(--color-theme);
        }
      }
      svg-icon {
        width: 20px;
        position: absolute;
        top: 12px;
        left: 10px;
      }
    }

    footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 24px;
      text-align: center;
      a {
        opacity: 0.6;
        font-size: 0.8em;
        color: var(--color-theme);
        &:hover {
          opacity: 0.8;
        }
      }
    }
  }
</style>
