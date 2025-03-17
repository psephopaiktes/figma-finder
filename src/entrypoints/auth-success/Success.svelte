<script lang="ts">
import Layout from "@/lib/Layout.svelte";
import i18n from "@/lib/i18n.svelte";

onMount(async () => {});

const runFF = async () => {
  // TODO: ボタンごとComponent化
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

<Layout class="l-document c-document">
  <h1>Autho Lized!</h1>
  <button onclick={runFF}>
    {i18n.t({
      en: "Run Figma Finder",
      ja: "Figma Finderを実行する",
      "zh-cn": "运行Figma Finder",
    })}
  </button>

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
