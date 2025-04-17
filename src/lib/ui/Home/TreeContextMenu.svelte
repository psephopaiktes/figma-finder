<script lang="ts">
import i18n from "@/lib/i18n.svelte";
import { getTargetUrl, store } from "@/lib/store.svelte";

let contextMenu: HTMLDialogElement;
let { event }: { event: MouseEvent | null } = $props();

$effect(() => {
  if (!event || store.targetProps[0] === "") return;
  event.preventDefault();

  if (contextMenu.matches(":popover-open")) {
    contextMenu.hidePopover();
    return;
  }

  const maxX = window.innerWidth - 200;
  contextMenu.style.left = `${Math.min(event.pageX, maxX)}px`;
  contextMenu.style.top = `${event.pageY - scrollY}px`;
  contextMenu.showPopover();

  document.addEventListener("click", () => contextMenu.hidePopover());
  return () =>
    document.removeEventListener("click", () => contextMenu.hidePopover());
});
</script>

<dialog popover="manual" bind:this={contextMenu} class="c-popover">
  <a href={getTargetUrl("browser")} target="_blank">
    {i18n.t({
      en: "Open in Browser",
      ja: "ブラウザで開く",
      "zh-cn": "在浏览器中打开",
      es: "Abrir en el navegador",
      ko: "브라우저에서 열기",
    })}
  </a>
  <a href={getTargetUrl("app")} target="_blank">
    {i18n.t({
      en: "Open in Desktop App",
      ja: "デスクトップアプリで開く",
      "zh-cn": "在桌面应用程序中打开",
      es: "Abrir en la aplicación de escritorio",
      ko: "데스크톱 앱에서 열기",
    })}
  </a>
  <hr />
  <button
    onclick={() => navigator.clipboard.writeText(getTargetUrl("browser"))}
  >
    {i18n.t({
      en: "Copy URL",
      ja: "URLをコピー",
      "zh-cn": "复制链接",
      es: "Copiar URL",
      ko: "URL 복사",
    })}
  </button>
</dialog>

<style>
  dialog {
    width: 200px;
  }
</style>
