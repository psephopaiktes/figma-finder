<script lang="ts">
import "@/style/index.css";
import "svg-mask-icon";
import Nav from "@/lib/Nav/Index.svelte";
import { loadOptions, store } from "@/lib/store.svelte";

onMount(async () => {
  await loadOptions();
  document.documentElement.dataset.theme = store.options.theme;

  console.log(
    "This site's code: \n%chttps://github.com/psephopaiktes/figma-finder",
    "padding: 16px 24px; margin: 8px 0px; border: 2px solid #fb0; border-radius: 16px; letter-spacing: .1em; font-size: large; font-weight: bold;",
  );
});

let { title = "Tabulasa", current = "", children } = $props();
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<Nav {current} />

<main class="l-main">
  {@render children()}
</main>

<style>
</style>
