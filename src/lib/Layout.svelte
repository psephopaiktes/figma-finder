<script lang="ts">
import "@/style/index.css";
import "svg-mask-icon";
import i18n from "@/lib/i18n.svelte";
import oauth from "@/lib/oauth.svelte";
import { loadOptions, store } from "@/lib/store.svelte";

let { class: className = "", children } = $props();

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
});
</script>

<main class={["l-main", className]}>
  {@render children?.()}
</main>
