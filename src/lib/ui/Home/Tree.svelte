<script lang="ts">
import { slide } from "svelte/transition";
import i18n from "@/lib/i18n.svelte";
import {
  getFigUrl,
  getTargetUrl,
  saveProjectOrder,
  store,
} from "@/lib/store.svelte";
import { formatEditedDate } from "@/lib/utility.svelte";
import type { Project } from "@/types";

import ContextMenu from "./TreeContextMenu.svelte";
import drag from "./TreeDragHandler.svelte";
import key from "./TreeKeyboardHandler.svelte";

let {
  projects,
  isInputed = false,
}: { projects: Record<string, Project>; isInputed: boolean } = $props();

let contextMenuEvent: MouseEvent | null = $state(null);

const handleClick = (e: MouseEvent) => {
  if ((e.ctrlKey && !e.metaKey) || (!e.ctrlKey && e.metaKey)) {
    e.preventDefault();
    open(getTargetUrl("browser"));
  }
  if (e.altKey) {
    e.preventDefault();
    open(getTargetUrl("app"));
  }
};

let lastSnapshot = "";
$effect(() => {
  if (
    !store.projectDataReady ||
    store.projectAccount !== store.options.currentUser
  )
    return;
  const snapshot = JSON.stringify(store.localProjectState);
  if (snapshot === store.projectOrderSaved) {
    lastSnapshot = snapshot;
    return;
  }
  if (snapshot === lastSnapshot) return;
  lastSnapshot = snapshot;
  void saveProjectOrder();
});
</script>

<svelte:window onkeydown={(e) => key.handleDocument(e)} />

<ContextMenu event={contextMenuEvent} />

<ul class={["projects", { "-grid": store.options.fileView === "grid" }]}>
  {#each store.localProjectState as localProject, index}
    {#if projects[localProject.id]}
      {@const project = projects[localProject.id]!}
      {@const fileCount = Object.keys(project.files).length}
      <li
        transition:slide
        draggable={!isInputed}
        ondragstart={(e) => drag.start(index, e)}
        ondragend={drag.end}
        ondragover={drag.over}
        ondragleave={drag.leave}
        ondrop={(e) => drag.ondrop(index, e)}
      >
        <details bind:open={localProject.open}>
          <summary
            oncontextmenu={(e) => {
              store.targetProps = [localProject.id, "project"];
              contextMenuEvent = e;
            }}
            onclick={(e) => {
              store.targetProps = [localProject.id, "project"];
              handleClick(e);
            }}
            onkeydown={(e) => {
              store.targetProps = [localProject.id, "project"];
              key.handleParent(e);
            }}
          >
            <span>{project.team}</span>
            <span>/</span>
            <h2 title={project.name}>{project.name}</h2>
            <small>
              {fileCount}
              {i18n.t({
                en: "files",
                ja: "ファイル",
                "zh-cn": "文件",
                es: "archivos",
                ko: "파일",
              })}
            </small>
            {#if !isInputed}
              <svg-icon src="/img/icon/drag.svg">draggable</svg-icon>
            {/if}
          </summary>

          <ul class="files">
            {#each Object.entries(project.files).sort( ([, fileA], [, fileB]) => fileA.name.localeCompare(fileB.name), ) as [fileId, file]}
              <li transition:slide>
                <a
                  href={getFigUrl(`file/${fileId}`)}
                  target="_blank"
                  oncontextmenu={(e) => {
                    store.targetProps = [fileId, "file"];
                    contextMenuEvent = e;
                  }}
                  onclick={(e) => {
                    store.targetProps = [fileId, "file"];
                    handleClick(e);
                  }}
                  onkeydown={(e) => {
                    store.targetProps = [fileId, "file"];
                    key.handleChild(e);
                  }}
                >
                  <img src={file.thumbnail_url || undefined} alt="" />
                  <h3 title={file.name}>{file.name}</h3>
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
  .projects {
    margin: var(--sp-m) var(--sp-m) 0;
    padding-block-end: calc(40px + var(--sp-m));
  }
  .projects > li {
    margin-block-start: var(--sp-xs);
    padding-block-start: var(--sp-xs);
    border-top: 2px solid transparent;
    :global {
      &.dragover {
        opacity: 0.9;
        border-color: rgb(from var(--color-theme) r g b / 0.6);
      }
      &.dragstart details {
        opacity: 0.8;
        border-style: dashed;
      }
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
      height: auto;
      height: calc-size(auto, size);
      opacity: 1;
    }

    summary {
      display: flex;
      height: 32px;
      padding-inline: 6px;
      gap: 0.5em;
      justify-content: start;
      align-items: center;
      border-radius: 4px;

      &::marker {
        content: "";
      }
      > * {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        line-height: 1.3;
      }
      span {
        opacity: 0.4;
        &:nth-of-type(2) {
          flex-shrink: 0;
        }
      }
      h2 {
        font-size: 1em;
        font-weight: 500;
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
        flex-shrink: 0;
      }
    }

    &[open] summary {
      span,
      h2 {
        white-space: initial;
        display: -webkit-box;
        text-overflow: ellipsis;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        line-clamp: 2;
      }
    }

    & summary::before {
      content: "";
      display: inline-block;
      width: 20px;
      aspect-ratio: 1;
      flex-shrink: 0;
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
    position: relative;
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
      background: rgb(from var(--color-theme) r g b / 0.2);
    }
  }

  .projects.-grid {
    .files {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
      gap: var(--sp-s);
      margin-block-start: var(--sp-s);
      padding: 4px;
    }
    .files > li {
      min-inline-size: 0;
      margin-block-start: 0;
    }
    .files li > a {
      min-inline-size: 0;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--sp-xs);
      padding: 0;

      img {
        display: block;
        grid-row: auto;
      }
      h3 {
        display: block;
        min-inline-size: 0;
        white-space: nowrap;
      }
      p {
        display: none;
      }
    }
    > li:first-of-type .files > li:first-of-type h3 {
      padding-inline-end: 20px;
    }
  }

  :global(.projects > li:first-of-type details:not([open]) summary) {
    background: rgb(from var(--color-theme) r g b / 0.1);
  }
  :global(.projects > li:first-of-type li:first-of-type a) {
    background: rgb(from var(--color-theme) r g b / 0.1);
    &::after {
      content: "";
      position: absolute;
      display: block;
      bottom: 4px;
      right: 8px;
      width: 16px;
      aspect-ratio: 1;
      mask-image: url(/img/icon/enter.svg);
      mask-size: cover;
      background: var(--color-theme);
    }
  }
</style>
