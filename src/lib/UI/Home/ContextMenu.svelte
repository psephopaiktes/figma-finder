<script lang="ts">
import i18n from "@/lib/i18n.svelte";

let {
  event = $bindable(),
  id = $bindable(),
  type = $bindable(),
}: {
  event: MouseEvent | null;
  id: string;
  type: "file" | "project";
} = $props();

$effect(() => {
  const contextMenu = document.getElementById("contextMenu");

  if (!contextMenu || !event || id === "") return;
  event.preventDefault();

  if (contextMenu.matches(":popover-open")) {
    contextMenu.hidePopover();
    return;
  }

  const maxX = window.innerWidth - 200;
  contextMenu.style.left = `${Math.min(event.pageX, maxX)}px`;
  contextMenu.style.top = `${event.pageY - scrollY}px`;
  contextMenu.showPopover();

  document.addEventListener("click", () => {
    contextMenu.hidePopover();
  });
});
</script>

<dialog popover="manual" id="contextMenu" class="c-popover">
  <a
    href={type === "file"
      ? `https://figma.com/file/${id}`
      : `https://figma.com/files/project/${id}`}
    target="_blank"
  >
    {i18n.t({
      en: "Open in Browser",
      ja: "ブラウザで開く",
      "zh-cn": "在浏览器中打开",
      es: "Abrir en el navegador",
    })}
  </a>
  <a
    href={type === "file"
      ? `figma://file/${id}`
      : `figma://files/project/${id}`}
    target="_blank"
  >
    {i18n.t({
      en: "Open in Desktop App",
      ja: "デスクトップアプリで開く",
      "zh-cn": "在桌面应用程序中打开",
      es: "Abrir en la aplicación de escritorio",
    })}
  </a>
  <hr />
  <button
    onclick={() => {
      const url =
        type === "file"
          ? `https://figma.com/file/${id}`
          : `https://figma.com/files/project/${id}`;
      navigator.clipboard.writeText(url);
    }}
  >
    {i18n.t({
      en: "Copy URL",
      ja: "URLをコピー",
      "zh-cn": "复制链接",
      es: "Copiar URL",
    })}
  </button>
</dialog>

<style>
  #contextMenu {
    width: 200px;
  }
</style>
