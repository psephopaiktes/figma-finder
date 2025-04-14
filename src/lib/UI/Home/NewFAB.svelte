<script lang="ts">
import i18n from "@/lib/i18n.svelte";
import { figPath } from "@/lib/utility.svelte";
</script>

<a
  href={figPath("design/new")}
  target="_blank"
  class="c-tooltip"
  title={i18n.t({
    en: "New File",
    ja: "新規ファイル",
    "zh-cn": "新文件",
    es: "Nuevo archivo",
  })}
>
  <svg-icon src="/img/icon/add.svg">New File</svg-icon>
</a>

<style>
  a {
    position: fixed;
    bottom: 16px;
    right: 16px;
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
