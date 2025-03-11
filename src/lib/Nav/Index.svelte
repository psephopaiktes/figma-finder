<script lang="ts">
import i18n from "@/lib/i18n";
import { browserMenu } from "./browserMenu";

let { current = "" } = $props();

let drawer: HTMLDialogElement;
const browserName =
  import.meta.env.BROWSER.charAt(0).toUpperCase() +
  import.meta.env.BROWSER.slice(1);

function openBrowserPage(url: string) {
  try {
    browser.tabs.update({ url });
  } catch (error) {
    console.error("This feature can't be used in this environment.");
  }
}

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

<nav>
  <button
    class="l-navButton"
    onclick={openDrawer}
    tabindex="2"
    title={i18n.t({ en: "Menu", jp: "メニュー" })}
  >
    <svg-icon
      src="/img/icon/menu.svg"
      alt={i18n.t({ en: "Menu", jp: "メニュー" })}
    />
  </button>

  <dialog bind:this={drawer} onclick={backdropClick}>
    <h1>
      <svg-icon src="/img/logo.svg" alt="Tabulasa" />
    </h1>

    <hr />

    <ul>
      <li>
        <a
          href="/newtab.html"
          class:current={current === "editor"}
          inert={current === "editor"}
          onclick={(e) => {
            e.preventDefault();
            closeDrawer();
            location.href = browser.runtime.getURL("/newtab.html");
          }}
        >
          <svg-icon src="/img/icon/editor.svg" alt="editor" />
          Editor
        </a>
      </li>
      <li>
        <a
          href="/options.html"
          class:current={current === "options"}
          inert={current === "options"}
          onclick={(e) => {
            e.preventDefault();
            closeDrawer();
            location.href = browser.runtime.getURL("/options.html");
          }}
        >
          <svg-icon src="/img/icon/customize.svg" alt="customize" />
          Options
        </a>
      </li>
    </ul>

    {#if import.meta.env.CHROME}
      <hr />

      <h3>{browserName}</h3>
      <ul>
        {#each browserMenu as item}
          <li>
            <a href={item.url} onclick={() => openBrowserPage(item.url)}>
              <svg-icon
                src={`/img/icon/${item.id}.svg`}
                alt={i18n.t(item.label)}
              />
              {i18n.t(item.label)}
            </a>
          </li>
        {/each}
      </ul>
    {/if}

    <footer>
      <a href="https://hira.page" target="_blank"> © Akira HIRATA </a>
    </footer>
  </dialog>
</nav>

<style>
  nav > button {
    font-size: 32px;
    background-color: var(--color-base);
    border-radius: 8px;
    line-height: 100%;
    &:hover {
      scale: 1.1;
    }
  }

  dialog {
    --w: 256px;
    width: var(--w);
    height: 100vh;
    max-height: 100vh;
    overscroll-behavior: contain;
    margin: 0;

    background: var(--color-base);
    border: 0;

    translate: calc(-1 * var(--w)) 0;
    transition:
      translate 0.2s ease-in,
      overlay 0.2s ease-in allow-discrete,
      display 0.2s ease-in allow-discrete;

    &[open] {
      translate: 0 0;
      box-shadow:
        0 0 32px rgb(0 0 0 / 0.1),
        0 0 64px rgb(0 0 0 / 0.1);
      @starting-style {
        translate: calc(-1 * var(--w)) 0;
      }
    }
    &::backdrop {
      background-color: rgb(0 0 0 / 0.1);
      backdrop-filter: blur(2px);
    }

    h1 {
      margin: 0;
      color: var(--color-theme);
      text-align: center;
      padding: 48px 0 40px;
      svg-icon {
        width: 140px;
        height: auto;
        aspect-ratio: 6;
      }
    }
    hr {
      margin-top: 8px;
      border: 0;
      border-top: 1px solid var(--color-main);
      opacity: 0.1;
    }
    h3 {
      margin: 20px 16px 0;
      font-size: 13px;
      opacity: 0.6;
      font-weight: normal;
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
    p {
      margin: 64px 16px 32px;
      a {
        text-decoration: none;
        opacity: 0.4;
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
