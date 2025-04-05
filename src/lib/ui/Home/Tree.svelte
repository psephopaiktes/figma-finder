<script lang="ts">
  import { store } from "@/lib/store.svelte";
  import type { Project } from "@/types";
  import { slide } from "svelte/transition";

  let { projects }: { projects: Record<string, Project> } = $props();

  $effect(() => {
    // TODO: Changedが呼び出されすぎているのは気になる
    storage.setItem("local:projects", store.projects);
  });
</script>

<ul class="root">
  {#each store.projectOrder as id}
    {#if projects[id]}
      {@const project = projects[id]}
      {@const fileCount = Object.keys(project.files).length}
      <li transition:slide>
        <details bind:open={store.projects[id].open}>
          <summary>
            {project.team} - {project.name} ({fileCount} files)
            <span style="color: red">=</span>
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
      margin-top: var(--sp-m);
    }
  }

  details {
    border: 2px solid #ccc;
  }

  summary::marker {
    content: "(+) ";
  }
  details[open] > summary::marker {
    content: "(-) ";
  }
</style>
