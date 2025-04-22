<script lang="ts">
import Layout from "@/lib/Layout.svelte";
import i18n from "@/lib/i18n.svelte";
import { marked } from "marked";
import { tick } from "svelte";

import DocumentFooter from "@/lib/ui/DocumentFooter.svelte";
import Pin from "@/lib/ui/Help/Pin.svelte";
import Welcome from "@/lib/ui/Help/Welcome.svelte";
import Nav from "@/lib/ui/Nav/Index.svelte";

import HelpCn from "@/lib/ui/Help/help.cn.md?raw";
import HelpEn from "@/lib/ui/Help/help.en.md?raw";
import HelpEs from "@/lib/ui/Help/help.es.md?raw";
import HelpJa from "@/lib/ui/Help/help.ja.md?raw";
import HelpKo from "@/lib/ui/Help/help.ko.md?raw";

marked.use({ gfm: true });

const showNav = location.search.includes("nav");
const isWelcome = location.search.includes("welcome");
let isPinned = $state(false);

onMount(async () => {
  const settings = await browser.action.getUserSettings();
  isPinned = settings.isOnToolbar;

  await tick();
  setTimeout(() => {
    if (location.hash) {
      const elm = document.querySelector(location.hash);
      if (elm) elm.scrollIntoView();
    }
  }, 100); // TODO:暫定
});

const title = isWelcome
  ? {
      en: "Welcome",
      ja: "ようこそ",
      "zh-cn": "欢迎",
      es: "Bienvenido",
      ko: "환영합니다",
    }
  : {
      en: "Help",
      ja: "ヘルプ",
      "zh-cn": "帮助",
      es: "Ayuda",
      ko: "도움말",
    };
</script>

<Layout {title}>
  {#if showNav}
    <Nav {title} current="help" />
  {:else if !isWelcome}
    <h1>{i18n.t(title)} - Figma Finder</h1>
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
      "zh-cn": marked(HelpCn) as string,
      es: marked(HelpEs) as string,
      ko: marked(HelpKo) as string,
    })}
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
