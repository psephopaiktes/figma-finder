<script lang="ts">
  import { store } from "@/lib/store.svelte";
  import type { Project } from "@/types";
  import { slide } from "svelte/transition";

  let {
    projects,
    isInputed = false,
  }: { projects: Record<string, Project>; isInputed: boolean } = $props();
  let dragIndex = $state(0);

  $inspect(store.localProjectState);

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
</script>

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
        ondrop={(event) => ondrop(index, event)}
      >
        <details bind:open={localProject.open} onchange={saveState}>
          <summary>
            {project.team} / {project.name}
            <small>{fileCount}files</small>
            {#if !isInputed}
              <svg-icon src="/img/icon/drag.svg">draggable</svg-icon>
            {/if}
          </summary>
          <ul>
            {#each Object.entries(project.files).sort( ([, fileA], [, fileB]) => fileA.name.localeCompare(fileB.name), ) as [fileId, file]}
              <li transition:slide>
                <a href={`https://figma.com/${fileId}`} target="_blank">
                  {file.name}
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
    margin-inline: var(--sp-m);
    > li {
      margin-block-start: var(--sp-xs);
      padding-block-start: var(--sp-xs);
    }
  }

  details {
    border: 2px solid rgb(from var(--color-main) r g b / 0.1);
    border-radius: 10px;
    padding: 4px;

    &::details-content {
      display: block;
      height: 0;
      opacity: 0;
      overflow: hidden;
      transition: 0.2s ease-out allow-discrete;
    }

    &[open]::details-content {
      height: calc-size(auto, size);
      opacity: 1;
      overflow: auto;
    }

    summary {
      display: flex;
      height: 32px;
      padding-inline: 6px;
      gap: 4px;
      justify-content: start;
      align-items: center;
      &::marker {
        content: "";
      }
      small {
        flex: 1;
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
</style>
