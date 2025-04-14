<script lang="ts">
  import i18n from "@/lib/i18n.svelte";
  import { store } from "@/lib/store.svelte";
  import { figPath, isMac } from "@/lib/utility.svelte";
</script>

<header>
  <button
    class="c-button -small -lightGray c-tooltip"
    onclick={() => {
      for (const project of store.localProjectState) {
        project.open = false;
      }
    }}
    tabindex="-1"
    title={isMac ? "⌥L" : "Alt + L"}
  >
    <svg-icon src="/img/icon/collapse.svg"></svg-icon>
    <span>
      {i18n.t({
        en: "Collapse",
        ja: "折りたたむ",
        "zh-cn": "折叠",
        es: "Colapsar",
      })}
    </span>
  </button>

  <button
    class="c-button -small -lightGray c-tooltip"
    onclick={() => location.reload()}
    tabindex="-1"
    title={isMac ? "⌘R" : "Ctrl + R"}
  >
    <svg-icon src="/img/icon/refresh.svg"></svg-icon>
    <span>
      {i18n.t({
        en: "Reload",
        ja: "再読み込み",
        "zh-cn": "重新加载",
        es: "Recargar",
      })}
    </span>
  </button>

  <a
    href={figPath("files/recent")}
    target="_blank"
    class="c-button -small -lightGray"
    tabindex="-1"
  >
    <svg-icon src="/img/icon/open.svg"></svg-icon>
    <span>Figma</span>
  </a>
</header>

<style>
  header {
    height: 56px;
    padding-inline: var(--sp-m);
    display: flex;
    place-content: center;
    align-items: center;
    gap: 6px;
  }
  .c-button span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  :global(.l-main) {
    min-height: calc(100vh + 56px);
  }
</style>
