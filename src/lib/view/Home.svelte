<script lang="ts">
  import Layout from "@/lib/Layout.svelte";
  import { loadFiles } from "@/lib/store.svelte";
  import { store } from "@/lib/store.svelte";
  import Input from "@/lib/ui/Home/Input.svelte";
  import Tree from "@/lib/ui/Home/Tree.svelte";
  import Loader from "@/lib/ui/Loader.svelte";
  import Nav from "@/lib/ui/Nav/Index.svelte";
  import { onMount } from "svelte";

  let loading = $state(true);
  let query = $state("");

  onMount(async () => {
    await loadFiles();
    loading = false;
  });
</script>

<Layout>
  <Nav current="home">
    <Input bind:value={query} />
  </Nav>

  {#if Object.keys(store.projects).length !== 0}
    <p>{query}</p>
    <Tree />
  {:else if loading}
    <Loader />
  {:else}
    No Project
  {/if}
</Layout>

<style>
</style>
