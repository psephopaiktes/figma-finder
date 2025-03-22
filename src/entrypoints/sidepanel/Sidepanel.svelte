<script lang="ts">
import { user } from "@/lib/store.svelte";
import Home from "@/lib/view/Home.svelte";
import Onborading from "@/lib/view/Onborading.svelte";
</script>

{#if !user() || !user()?.teams}
  <Onborading />
{:else}
  <Home />
{/if}
