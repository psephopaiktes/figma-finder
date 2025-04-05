<script lang="ts">
import i18n from "@/lib/i18n.svelte";
import UserSelector from "./UserSelector.svelte";

const pageList = [
  {
    label: { en: "Home", ja: "ホーム", "zh-cn": "主页", es: "Inicio" },
    href: "/sidepanel.html",
    id: "home",
  },
  {
    label: {
      en: "Options",
      ja: "オプション",
      "zh-cn": "选项",
      es: "Opciones",
    },
    href: "/options.html?nav",
    id: "options",
  },
  {
    label: { en: "Help", ja: "ヘルプ", "zh-cn": "帮助", es: "Ayuda" },
    href: "/help.html?nav",
    id: "help",
  },
];

const extPageList = [
  {
    label: { en: "GitHub" },
    href: "https://github.com/psephopaiktes/figma-finder",
    id: "github",
  },
  {
    label: {
      en: "Support the Developer",
      ja: "制作者を支援",
      "zh-cn": "支持开发者",
      es: "Apoyar al desarrollador",
    },
    href: "https://github.com/sponsors/psephopaiktes",
    id: "love",
  },
];

let { title = null, current = null, children = null } = $props();
let drawer: HTMLDialogElement;

function openDrawer() {
  drawer.showModal();
}

function closeDrawer() {
  drawer.close();
}

function backdropClick(event: MouseEvent) {
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
        <h1>{title}</h1>
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

    <h1 class="u-textHidden">Figma Finder</h1>

    <hr />

    <ul>
      {#each pageList as page}
        <li>
          <a href={page.href} inert={current === page.id}>
            <svg-icon src="/img/icon/{page.id}.svg"></svg-icon>
            {i18n.t(page.label)}
          </a>
        </li>
      {/each}
    </ul>

    <hr />

    <ul>
      {#each extPageList as page}
        <li>
          <a href={page.href} target="_blank">
            <svg-icon src="/img/icon/{page.id}.svg"></svg-icon>
            {i18n.t(page.label)}
            <svg-icon src="/img/icon/open.svg"></svg-icon>
          </a>
        </li>
      {/each}
    </ul>

    <footer>
      <a href="https://hira.page" target="_blank">© Akira HIRATA</a>
    </footer>
  </dialog>
</nav>

<style>
  button {
    width: 40px;
    aspect-ratio: 1;
    font-size: 20px;
    border-radius: 8px;
    line-height: 100%;
    &:hover {
      background: rgb(from var(--color-main) r g b / 5%);
    }
  }

  header {
    display: flex;
    justify-content: stretch;
    align-items: center;
    gap: 8px;
    padding-inline: 8px;

    &::before {
      content: "";
      position: absolute;
      inset: 0 0 -24px;
      z-index: -1;
      background: rgb(from var(--color-base) r g b / 40%);
      mask-image: linear-gradient(#000 50%, transparent);
      mask-composite: intersect;
      backdrop-filter: blur(16px);
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
    padding: 8px;
    color: var(--color-main);
    background: var(--color-base);
    box-shadow:
      0 0 32px rgb(0 0 0 / 0.1),
      0 0 64px rgb(0 0 0 / 0.1);
    &::backdrop {
      background-color: rgb(0 0 0 / 0.1);
      backdrop-filter: blur(2px);
    }

    button {
      vertical-align: top;
    }
    h1 {
      display: inline-block;
      width: 31px;
      height: 20px;
      margin-inline-start: 52px;
      margin-block-start: 10px;
      mask-image: url(/img/logo-symbol.svg);
      mask-size: cover;
      background: currentColor;
      opacity: 0.4;
    }
    hr {
      margin-block-start: 16px;
      margin-inline: 16px;
      border: 0;
      border-top: 1px solid var(--color-main);
      opacity: 0.1;
      &:first-of-type {
        margin-block-start: 24;
      }
    }
    ul {
      margin-block-start: 16px;
      margin-inline: 8px;
      li {
        margin-block-start: 2px;
        height: 48px;
      }
      a {
        display: block;
        position: relative;
        padding: 0 16px 0 40px;
        line-height: 40px;
        border-radius: 6px;
        text-decoration: none;
        font-size: 14px;
        opacity: 0.8;
        &:hover {
          background: rgb(from var(--color-theme) r g b / 10%);
          opacity: 1;
        }
        &[inert] {
          background: rgb(from var(--color-theme) r g b / 20%);
          color: var(--color-theme);
          font-weight: bolder;
        }
        svg-icon {
          width: 20px;
          position: absolute;
          top: 10px;
          left: 10px;
          &:nth-of-type(2) {
            width: 14px;
            top: 13px;
            right: 13px;
            left: auto;
            opacity: 0.6;
          }
        }
      }
    }

    footer {
      position: absolute;
      inset: 0;
      top: auto;
      padding: 24px;
      text-align: center;
      a {
        opacity: 0.6;
        font-size: 0.8em;
        &:hover {
          opacity: 0.8;
        }
      }
    }
  }
</style>
