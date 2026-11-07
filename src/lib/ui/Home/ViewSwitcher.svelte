<script lang="ts">
import i18n from "@/lib/i18n.svelte";
import { setFileView, store } from "@/lib/store.svelte";

const views = [
  {
    value: "list",
    label: {
      en: "List view",
      ja: "リスト表示",
      "zh-cn": "列表视图",
      es: "Vista de lista",
      ko: "목록 보기",
    },
  },
  {
    value: "grid",
    label: {
      en: "Grid view",
      ja: "グリッド表示",
      "zh-cn": "网格视图",
      es: "Vista de cuadrícula",
      ko: "그리드 보기",
    },
  },
] as const;
</script>

<div
  class="viewSwitcher"
  role="group"
  aria-label={i18n.t({
    en: "File view",
    ja: "ファイルの表示形式",
    "zh-cn": "文件视图",
    es: "Vista de archivos",
    ko: "파일 보기",
  })}
>
  {#each views as view}
    <button
      type="button"
      class="c-tooltip"
      aria-label={i18n.t(view.label)}
      title={i18n.t(view.label)}
      aria-pressed={store.options.fileView === view.value}
      onclick={() => setFileView(view.value)}
    >
      <svg-icon src={`/img/icon/${view.value}.svg`} aria-hidden="true"></svg-icon>
    </button>
  {/each}
</div>

<style>
  .viewSwitcher {
    position: fixed;
    inset-inline-start: var(--sp-m);
    inset-block-end: 8px;
    z-index: var(--z-main);
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px;
    border-radius: 8px;
    background: var(--color-base);
    color: var(--color-main);
    box-shadow: 2px 4px 16px rgb(0 0 0 / 0.2);

    button {
      display: grid;
      place-items: center;
      min-inline-size: 32px;
      min-block-size: 32px;
      border-radius: 4px;

      &[aria-pressed="true"] {
        background: rgb(from var(--color-main) r g b / 0.05);
      }
      &:hover {
        background: rgb(from var(--color-main) r g b / 0.1);
      }

      svg-icon {
        font-size: 24px;
      }
    }
  }

  @media (forced-colors: active) {
    button[aria-pressed="true"] {
      border: 1px solid ButtonText;
    }
  }
</style>
