<script lang="ts">
  import Layout from "@/lib/Layout.svelte";
  import i18n from "@/lib/i18n";

  const title = i18n.t({
    en: "Help",
    jp: "ヘルプ",
    "zh-cn": "帮助",
  });

  let isWelcome = $state(false);
  let isPinned = $state(false);
  onMount(async () => {
    isWelcome = location.search.includes("welcome");
    const settings = await chrome.action.getUserSettings();
    isPinned = settings.isOnToolbar;
  });

  const runFF = async () => {
    if (import.meta.env.CHROME) {
      const queryOptions = { active: true, currentWindow: true };
      const [tab] = await browser.tabs.query(queryOptions);
      chrome.sidePanel.open({ windowId: tab.windowId });
    } else {
      // @ts-ignore
      browser.sidebarAction.open();
    }
  };
</script>

<Layout current="help" {title} class="l-document" showNav={!isWelcome}>
  {#if !isPinned}
    <p>ピンしてね！</p>
  {/if}

  {#if isWelcome}
    <h1>Welcome!</h1>
    <button onclick={runFF}> FigmaFinderを実行する </button>
  {/if}

  <h1>{title}</h1>
  <p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
    tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
    quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
    consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
    cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat
    non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
  </p>
</Layout>

<style>
</style>
