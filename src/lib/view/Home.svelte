<script lang="ts">
  import Layout from "@/lib/Layout.svelte";
  import { loadFiles } from "@/lib/store.svelte";
  import { store } from "@/lib/store.svelte";
  import Input from "@/lib/ui/Home/Input.svelte";
  import Loader from "@/lib/ui/Loader.svelte";
  import Nav from "@/lib/ui/Nav/Index.svelte";
  import { onMount } from "svelte";

  let loading = $state(true);

  onMount(async () => {
    await loadFiles();
    loading = false;
  });
</script>

<Layout>
  <Nav current="home">
    <Input />
  </Nav>

  {#if Object.keys(store.projects).length !== 0}
    <ul>
      {#each Object.entries(store.projects) as [id, project]}
        <li>
          <a href="/project/{id}">{project.team} - {project.name}</a>
        </li>
      {/each}
    </ul>
  {:else if loading}
    <Loader />
  {:else}
    No Project
  {/if}
</Layout>

<style>
</style>
