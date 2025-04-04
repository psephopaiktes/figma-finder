<script lang="ts">
  import type { Project } from "@/types";
  let { projects }: { projects: Record<string, Project> } = $props();
</script>

<ul>
  {#each Object.entries(projects) as [id, project]}
    {@const fileCount = Object.keys(project.files).length}
    <li>
      <details open>
        <summary>{project.team} - {project.name} ( {fileCount} files )</summary>
        <ul>
          {#if fileCount === 0}
            <li>No files</li>
          {:else}
            {#each Object.entries(project.files) as [id, file]}
              <li>
                <a href={`https://figma.com/${id}`} target="_blank">
                  {file.name}
                </a>
              </li>
            {/each}
          {/if}
        </ul>
      </details>
    </li>
  {/each}
</ul>

<style>
  ul {
    margin-top: 80px;
    ul {
      margin-top: 8px;
    }
  }

  details > summary::marker {
    content: "(+) ";
  }
  details[open] > summary::marker {
    content: "(-) ";
  }
</style>
