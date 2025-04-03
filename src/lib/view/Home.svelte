<script lang="ts">
  import Layout from "@/lib/Layout.svelte";
  import { loadFiles } from "@/lib/store.svelte";
  import Nav from "@/lib/ui/Nav/Index.svelte";
  import { onMount } from "svelte";

  onMount(() => {
    loadFiles();
  });
</script>

<Layout>
  <Nav current="home">
    <input type="text" name="aa" id="" />
  </Nav>

  OK!
</Layout>

<style>
</style>
