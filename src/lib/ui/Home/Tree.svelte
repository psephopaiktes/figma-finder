<script lang="ts">
import type { Project } from "@/types";
import { slide } from "svelte/transition";
let { projects }: { projects: Record<string, Project> } = $props();
</script>

<ul class="root">
  {#each Object.entries(projects) as [id, project]}
    {@const fileCount = Object.keys(project.files).length}
    <li transition:slide>
      <details open>
        <summary>{project.team} - {project.name} ( {fileCount} files )</summary>
        <ul>
          {#each Object.entries(project.files) as [id, file]}
            <li transition:slide>
              <a href={`https://figma.com/${id}`} target="_blank">
                {file.name}
              </a>
            </li>
          {/each}
        </ul>
      </details>
    </li>
  {/each}
</ul>

<style>
  .root {
    margin-top: 80px;
    > li {
      margin-top: 32px;
    }
  }

  details {
    border: 2px solid #ccc;
  }

  details > summary::marker {
    content: "(+) ";
  }
  details[open] > summary::marker {
    content: "(-) ";
  }
</style>
