<script lang="ts">
  import "@/style/index.css";
  import "svg-mask-icon";
  import i18n from "@/lib/i18n.svelte";
  import oauth from "@/lib/oauth.svelte";
  import { loadOptions, store } from "@/lib/store.svelte";
  import Loader from "@/lib/ui/Loader.svelte";

  let { title = null, class: className = "", children } = $props();

  const tabTitle = title ? `${title} - Figma Finder` : "Figma Finder";

  const reload = (e: KeyboardEvent) => {
    if (
      ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r") ||
      e.key === "F5"
    ) {
      const now = Date.now();
      if (now - +(localStorage.lastReloadTime || 0) < 500) {
        alert(
          i18n.t({
            en: "Please wait a moment before reloading.",
            ja: "リロードするまでしばらくお待ちください。",
            "zh-cn": "请稍等片刻再重新加载。",
            es: "Espere un momento antes de volver a cargar.",
          }),
        );
        e.preventDefault();
        return;
      }
      localStorage.lastReloadTime = String(now);
      e.preventDefault();
      location.reload();
    }
  };

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

<svelte:window onkeydown={(e) => reload(e)} />

<svelte:head>
  <title>{tabTitle}</title>
</svelte:head>

{#if store.loading}
  <main class="l-centeringContainer">
    <Loader />
  </main>
{:else}
  <main class={["l-main", className]}>
    {@render children?.()}
  </main>
{/if}
