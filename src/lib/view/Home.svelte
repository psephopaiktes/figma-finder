<script lang="ts">
  import Layout from "@/lib/Layout.svelte";
  import { loadFiles } from "@/lib/store.svelte";
  import { store } from "@/lib/store.svelte";
  import Input from "@/lib/ui/Home/Input.svelte";
  import Tree from "@/lib/ui/Home/Tree.svelte";
  import Loader from "@/lib/ui/Loader.svelte";
  import Nav from "@/lib/ui/Nav/Index.svelte";
  import type { File, Project } from "@/types";
  import Fuse from "fuse.js";
  import { onMount } from "svelte";

  let loading = $state(true);
  let query = $state("");

  let filterdProjects: Record<string, Project> = $derived.by(() => {
    if (!query.trim()) {
      return store.projects;
    }

    const filteredProjects: Record<string, Project> = {};

    for (const [projectId, project] of Object.entries(store.projects)) {
      const fileItems = Object.entries(project.files).map(([fileId, file]) => ({
        id: fileId,
        name: file.name,
      }));

      const options = {
        keys: ["name"],
        includeScore: true,
        threshold: 0.4,
        ignoreLocation: true,
        useExtendedSearch: true,
      };
      const fuse = new Fuse(fileItems, options);
      const searchResults = fuse.search(query);

      const filteredFiles: Record<string, File> = {};
      for (const result of searchResults) {
        const fileId = result.item.id;
        filteredFiles[fileId] = project.files[fileId];
      }

      filteredProjects[projectId] = {
        ...project,
        files: filteredFiles,
      };
    }

    return filteredProjects;
  });

  onMount(async () => {
    await loadFiles();
    loading = false;
  });

  $effect(() => {});
</script>

<Layout>
  <Nav current="home">
    <Input bind:value={query} />
  </Nav>

  {#if Object.keys(store.projects).length !== 0}
    <Tree projects={filterdProjects} />
  {:else if loading}
    <Loader />
  {:else}
    No Project
  {/if}
</Layout>

<style>
</style>
