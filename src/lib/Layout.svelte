<script lang="ts">
  import "@/style/index.css";
  import "svg-mask-icon";
  import i18n from "@/lib/i18n.svelte";
  import oauth from "@/lib/oauth.svelte";
  import { loadOptions, store } from "@/lib/store.svelte";
  import Loader from "@/lib/ui/Loader.svelte";

  let { title = null, class: className = "", children } = $props();

  const tabTitle = title ? `${title} - Figma Finder` : "Figma Finder";

  onMount(async () => {
    await loadOptions();

    if (
      store.options.currentUser &&
      store.options.users[store.options.currentUser].expires_at <= Date.now()
    ) {
      const success = await oauth.refreshTokens();
      if (!success) {
        console.warn("Token refresh failed.");
      }
    }

    document.documentElement.dataset.theme = store.options.theme;
    document.documentElement.lang = store.options.locale || i18n.default_locale;

    console.log(
      "This site's code: \n%chttps://github.com/psephopaiktes/figma-finder",
      "padding: 16px 24px; margin: 8px 0px; border: 2px solid #fb0; border-radius: 16px; letter-spacing: .1em; font-size: large; font-weight: bold;",
    );

    store.loading = false;
  });
</script>

<svelte:head>
  <title>{tabTitle}</title>
</svelte:head>

{#if store.loading}
  <main class="loading">
    <Loader />
  </main>
{:else}
  <main class={["l-main", className]}>
    {@render children?.()}
  </main>
{/if}

<style>
  main.loading {
    display: grid;
    place-content: center;
    height: 100vh;
    animation: twinkle 0.5s ease-in-out infinite alternate;
  }
  @keyframes twinkle {
    0% {
      opacity: 0.4;
    }
    100% {
      opacity: 0.8;
    }
  }
</style>
