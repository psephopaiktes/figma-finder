<script lang="ts">
  import i18n from "@/lib/i18n.svelte";
  import { store } from "@/lib/store.svelte";
  import { formatEditedDate } from "@/lib/utils.svelte";
  import type { Project } from "@/types";
  import { slide } from "svelte/transition";

  let {
    projects,
    isInputed = false,
  }: { projects: Record<string, Project>; isInputed: boolean } = $props();

  let dragIndex = $state(0);
  let contextMenuProps = $state({ id: "", type: "" });

  const saveState = () => {
    storage.setItem<string>(
      "local:localProjectState",
      JSON.stringify(store.localProjectState), //WXT対策
    );
  };

  const dragstart = (index: number) => {
    dragIndex = index;
  };

  const dragover = (event: DragEvent) => {
    event.preventDefault();
    (event.currentTarget as HTMLElement).style.borderTop =
      "2px solid rgb(from var(--color-theme) r g b / 0.4)";
  };

  const dragleave = (event: DragEvent) => {
    (event.currentTarget as HTMLElement).style.borderTop = "";
  };

  const ondrop = (index: number, event: DragEvent) => {
    event.preventDefault();
    (event.currentTarget as HTMLElement).style.borderTop = "";
    if (index === dragIndex) return;

    const moveProject = { ...store.localProjectState[dragIndex] };
    store.localProjectState.splice(dragIndex, 1);

    if (dragIndex < index) {
      store.localProjectState.splice(index - 1, 0, moveProject);
    } else {
      store.localProjectState.splice(index, 0, moveProject);
    }

    saveState();
  };

  const openContextMenu = (
    event: MouseEvent,
    id: string,
    type: "project" | "file",
  ) => {
    event.preventDefault();
    const contextMenu = document.getElementById("contextMenu");

    if (!contextMenu) return;
    if (contextMenu.matches(":popover-open")) {
      contextMenu.hidePopover();
      return;
    }

    contextMenuProps.id = id;
    contextMenuProps.type = type;

    // TODO: XYの最大値を設定。できれば画面幅
    contextMenu.style.top = `${event.pageY - scrollY}px`;
    contextMenu.style.left = `${event.pageX}px`;
    contextMenu.showPopover();

    // それかメニュー以外の場所をクリックしたらメニューを閉じる
    document.addEventListener("click", () => {
      contextMenu.hidePopover();
    });
  };
</script>

<dialog popover="manual" id="contextMenu" class="c-popover">
  <a
    href={contextMenuProps.type === "file"
      ? `https://figma.com/file/${contextMenuProps.id}`
      : `https://figma.com/files/project/${contextMenuProps.id}`}
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
    href={contextMenuProps.type === "file"
      ? `figma://file/${contextMenuProps.id}`
      : `figma://files/project/${contextMenuProps.id}`}
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
        contextMenuProps.type === "file"
          ? `https://figma.com/file/${contextMenuProps.id}`
          : `https://figma.com/files/project/${contextMenuProps.id}`;
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

<ul class="root">
  {#each store.localProjectState as localProject, index}
    {#if projects[localProject.id]}
      {@const project = projects[localProject.id]}
      {@const fileCount = Object.keys(project.files).length}
      <li
        transition:slide
        draggable={!isInputed}
        ondragstart={() => dragstart(index)}
        ondragover={dragover}
        ondragleave={dragleave}
        ondrop={(e) => ondrop(index, e)}
      >
        <details bind:open={localProject.open} onchange={saveState}>
          <summary
            oncontextmenu={(e) =>
              openContextMenu(e, localProject.id, "project")}
          >
            <span>{project.team} /</span>
            {project.name}
            <small>{fileCount}files</small>
            {#if !isInputed}
              <svg-icon src="/img/icon/drag.svg">draggable</svg-icon>
            {/if}
          </summary>
          <ul class="files">
            {#each Object.entries(project.files).sort( ([, fileA], [, fileB]) => fileA.name.localeCompare(fileB.name), ) as [fileId, file]}
              <li transition:slide>
                <a
                  href={store.options.openInApp
                    ? `figma://file/${fileId}`
                    : `https://figma.com/file/${fileId}`}
                  target="_blank"
                  oncontextmenu={(e) => openContextMenu(e, fileId, "file")}
                >
                  <img src={file.thumbnail_url} alt="thumbnail" />
                  <h3>{file.name}</h3>
                  <p>{formatEditedDate(file.last_modified)}</p>
                </a>
              </li>
            {/each}
          </ul>
        </details>
      </li>
    {/if}
  {/each}
</ul>

<style>
  .root {
    margin: var(--sp-m) var(--sp-m) 0;
    > li {
      margin-block-start: var(--sp-xs);
      padding-block-start: var(--sp-xs);
    }
  }

  details {
    border: 2px solid rgb(from var(--color-main) r g b / 0.1);
    border-radius: 10px;
    padding: 6px;

    &::details-content {
      display: block;
      height: 0;
      opacity: 0;
      transition: 0.2s ease-out allow-discrete;
    }

    &[open]::details-content {
      height: calc-size(auto, size);
      opacity: 1;
    }

    summary {
      display: flex;
      height: 32px;
      padding-inline: 6px;
      gap: 4px;
      justify-content: start;
      align-items: center;
      border-radius: 4px;
      &::marker {
        content: "";
      }
      span {
        opacity: 0.4;
      }
      small {
        flex: 1;
        font-size: 11px;
        opacity: 0.4;
      }
      svg-icon {
        width: 16px;
        aspect-ratio: 1;
        margin: 2px;
        opacity: 0.6;
        cursor: move;
      }
    }
    & summary::before {
      content: "";
      display: inline-block;
      width: 20px;
      aspect-ratio: 1;
      background: var(--color-main);
      mask-image: url(/img/icon/folder.svg);
      mask-size: 100%;
    }
    &[open] summary::before {
      mask-image: url(/img/icon/folder-open.svg);
    }
  }

  .files li {
    margin-block-start: var(--sp-xs);
  }
  .files li > a {
    display: grid;
    grid-template-columns: 96px 1fr;
    grid-template-rows: auto auto;
    gap: 2px 8px;
    align-items: center;
    padding: 4px;
    border-radius: 4px;
    img {
      grid-row: 1 / span 2;
      background: rgb(from var(--color-main) r g b / 0.1);
      border: 1px solid rgb(from var(--color-main) r g b / 0.1);
      width: 100%;
      aspect-ratio: 96 / 54;
      object-fit: cover;
      border-radius: 4px;
    }
    h3 {
      font-size: 1rem;
      line-height: 1.3;
      font-weight: 500;
      overflow: hidden;
      display: -webkit-box;
      text-overflow: ellipsis;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      align-self: end;
    }
    p {
      opacity: 0.4;
      font-size: 10px;
      align-self: start;
    }

    &:hover {
      background: rgb(from var(--color-theme) r g b / 0.1);
    }
  }

  #contextMenu {
    width: 200px;
  }
</style>
