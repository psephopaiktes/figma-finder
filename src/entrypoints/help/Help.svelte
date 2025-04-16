<script lang="ts">
  import Layout from "@/lib/Layout.svelte";
  import i18n from "@/lib/i18n.svelte";
  import DocumentFooter from "@/lib/ui/DocumentFooter.svelte";
  import Pin from "@/lib/ui/Help/Pin.svelte";
  import Welcome from "@/lib/ui/Help/Welcome.svelte";
  import Nav from "@/lib/ui/Nav/Index.svelte";

  const showNav = location.search.includes("nav");
  const isWelcome = location.search.includes("welcome");
  let isPinned = $state(false);

  onMount(async () => {
    const settings = await browser.action.getUserSettings();
    isPinned = settings.isOnToolbar;
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

<Layout class="l-document c-document" {title}>
  {#if showNav}
    <Nav {title} current="help" />
  {/if}

  {#if isWelcome}
    <Welcome />
  {/if}

  {#if !isPinned}
    <Pin />
  {/if}

  <p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
    tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
    quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
    consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
    cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat
    non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
  </p>

  <DocumentFooter />
</Layout>

<style>
</style>
