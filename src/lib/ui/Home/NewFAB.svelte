<script lang="ts">
import i18n from "@/lib/i18n.svelte";
import { getFigUrl } from "@/lib/store.svelte";
</script>

<a
  href={getFigUrl("design/new")}
  target="_blank"
  class="c-tooltip"
  title={i18n.t({
    en: "New File",
    ja: "新規ファイル",
    "zh-cn": "新文件",
    es: "Nuevo archivo",
    ko: "새 파일",
  })}
  tabindex="-1"
>
  <svg-icon src="/img/icon/add.svg">New File</svg-icon>
</a>

<style>
  a {
    position: fixed;
    bottom: 8px;
    right: 8px;
    width: 40px;
    aspect-ratio: 1;
    display: grid;
    place-content: center;
    font-size: 24px;
    border-radius: 8px;
    background-color: var(--color-theme);
    color: white;
    box-shadow: 4px 8px 16px -8px rgb(0 0 0 / 0.5);
    &:hover {
      scale: 1.05;
    }
    &::after {
      left: auto;
      right: 0;
      transform: none;
    }
  }
</style>
