<script lang="ts">
  import Layout from "@/lib/Layout.svelte";
  import i18n from "@/lib/i18n.svelte";
  import { loadFiles } from "@/lib/store.svelte";
  import { store } from "@/lib/store.svelte";
  import Input from "@/lib/ui/Home/Input.svelte";
  import NewFAB from "@/lib/ui/Home/NewFAB.svelte";
  import Tree from "@/lib/ui/Home/Tree.svelte";
  import Loader from "@/lib/ui/Loader.svelte";
  import Nav from "@/lib/ui/Nav/Index.svelte";
  import type { File, Project } from "@/types";
  import Fuse from "fuse.js";
  import { onMount } from "svelte";

  let loading = $state(true);
  let query = $state("");

  let isInputed: boolean = $derived.by(() => {
    return query.trim().length > 0;
  });

  onMount(async () => {
    await loadFiles();
    loading = false;
  });

  let filterdProjects: Record<string, Project> = $derived.by(() => {
    if (!isInputed) {
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
        threshold: 0.2,
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

      if (Object.keys(filteredFiles).length > 0) {
        filteredProjects[projectId] = {
          ...project,
          files: filteredFiles,
        };
      }
    }

    return filteredProjects;
  });

  const openFirst = () => {
    alert("submit");
    // const input = event.target as HTMLInputElement;
    // query = input.value;
  };
</script>

<Layout>
  <Nav current="home">
    <Input bind:value={query} submit={openFirst} />
  </Nav>

  {#if Object.keys(store.projects).length !== 0}
    <Tree projects={filterdProjects} {isInputed} />
  {:else if loading}
    <section class="l-centeringContainer">
      <Loader />
    </section>
  {:else}
    <section class="l-centeringContainer">
      <p>
        {i18n.t({
          en: "No projects found.",
          ja: "プロジェクトがありません。",
          "zh-cn": "没有找到项目。",
          es: "No se encontraron proyectos.",
        })}
      </p>
    </section>
  {/if}

  <NewFAB />
</Layout>

<style>
  p {
    opacity: 0.6;
  }
</style>
