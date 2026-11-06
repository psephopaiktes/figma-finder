<script lang="ts">
import "@/style/index.css";
import "svg-mask-icon";
import type { Snippet } from "svelte";
import i18n from "@/lib/i18n.svelte";
import oauth from "@/lib/oauth.svelte";
import { loadOptions, store, tokens } from "@/lib/store.svelte";
import Loader from "@/lib/ui/Loader.svelte";
import type { AuthTokens } from "@/types";

type Props = {
  title?: string | null | Record<string, string>;
  onReload?: () => void | Promise<void>;
  children?: Snippet;
};
let { title = null, onReload, children }: Props = $props();

const tabTitle = $derived.by(() => {
  if (!title) {
    return "Figma Finder";
  }
  if (typeof title === "object") {
    return `${i18n.t(title)} - Figma Finder`;
  }
  return `${title} - Figma Finder`;
});

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
          ko: "새로고침하기 전에 잠시 기다려주세요。",
        }),
      );
      e.preventDefault();
      return;
    }
    localStorage.lastReloadTime = String(now);
    e.preventDefault();
    if (onReload) void onReload();
    else location.reload();
  }
};

onMount(() => {
  const unwatch = storage.watch<Record<string, AuthTokens>>(
    "local:auth",
    (value) => {
      store.auth = value ?? {};
    },
  );
  void (async () => {
    try {
      await loadOptions();
      if (
        store.options.currentUser &&
        (tokens()?.expires_at ?? 0) <= Date.now() + 30_000
      ) {
        await oauth.refreshTokens();
      }
      document.documentElement.dataset.theme = store.options.theme;
      document.documentElement.lang =
        store.options.locale || i18n.default_locale;
      console.log(
        "This site's code: \n%chttps://github.com/psephopaiktes/figma-finder",
        "padding: 16px 24px; margin: 8px 0px; border: 2px solid #fb0; border-radius: 16px; letter-spacing: .1em; font-size: large; font-weight: bold;",
      );
    } catch {
      console.warn("Account settings could not be loaded.");
    } finally {
      store.loading = false;
    }
  })();
  return unwatch;
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
  <main class="l-main">
    {@render children?.()}
  </main>
{/if}
