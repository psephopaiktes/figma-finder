<script lang="ts">
  import Layout from "@/lib/Layout.svelte";
  import i18n from "@/lib/i18n.svelte";
  import { marked } from "marked";

  import DocumentFooter from "@/lib/ui/DocumentFooter.svelte";
  import Pin from "@/lib/ui/Help/Pin.svelte";
  import Welcome from "@/lib/ui/Help/Welcome.svelte";
  import Nav from "@/lib/ui/Nav/Index.svelte";

  import HelpEn from "@/lib/ui/Help/help.en.md?raw";
  import HelpJa from "@/lib/ui/Help/help.ja.md?raw";

  marked.use({ gfm: true });

  const showNav = location.search.includes("nav");
  const isWelcome = location.search.includes("welcome");
  let isPinned = $state(false);

  onMount(async () => {
    const settings = await browser.action.getUserSettings();
    isPinned = settings.isOnToolbar;

    if (location.hash) {
      const elm = document.querySelector(location.hash);
      if (elm) elm.scrollIntoView();
    }
  });

  const title = isWelcome
    ? i18n.t({
        en: "Welcome",
        ja: "ようこそ",
        "zh-cn": "欢迎",
        es: "Bienvenido",
      })
    : i18n.t({
        en: "Help",
        ja: "ヘルプ",
        "zh-cn": "帮助",
        es: "Ayuda",
      });
</script>

<Layout {title}>
  {#if showNav}
    <Nav {title} current="help" />
  {:else if !isWelcome}
    <h1>{title} - Figma Finder</h1>
    <hr />
  {/if}

  {#if isWelcome}
    <Welcome />
  {/if}

  <div class="c-document">
    {#if !isPinned}
      <Pin />
    {/if}

    {@html i18n.t({
      en: marked(HelpEn) as string,
      ja: marked(HelpJa) as string,
      "zh-cn": marked(HelpJa) as string,
      es: marked(HelpJa) as string,
    })}
    <!-- TODO -->
  </div>

  <DocumentFooter />
</Layout>

<style>
  h1 {
    margin-block-start: var(--sp-xl);
    text-align: center;
  }
  hr {
    margin-block-start: var(--sp-xl);
    margin-block-end: var(--sp-xl);
    border: 0;
    border-top: 1px solid rgb(from var(--color-main) r g b / 0.1);
  }
</style>
