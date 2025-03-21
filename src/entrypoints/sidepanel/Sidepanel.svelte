<script lang="ts">
  import Layout from "@/lib/Layout.svelte";
  import { store } from "@/lib/store.svelte";
  import Nav from "@/lib/ui/Nav/Index.svelte";
  import LoggedOut from "@/lib/view/LoggedOut.svelte";
</script>

<Layout>
  <Nav current="home">
    <input type="text" name="aa" id="" />
  </Nav>

  {#if !store.options.currentUser}
    <LoggedOut />
  {:else}
    OK
    <a href="/help.html#team-id" target="_blank">What is Team ID?</a>
  {/if}
</Layout>

<style>
</style>
