<script lang="ts">
  import Layout from "@/lib/Layout.svelte";
  import i18n from "@/lib/i18n";

  const title = i18n.t({
    en: "Help",
    jp: "ヘルプ",
  });

  let isWelcome = $state(false);
  let isPinned = $state(false);
  onMount(async () => {
    isWelcome = location.search.includes("welcome");
    const settings = await chrome.action.getUserSettings();
    isPinned = settings.isOnToolbar;
  });
</script>

<Layout current="help" {title}>
  <h1>{title}</h1>
  <p>isWelcome: {isWelcome ? "Welcomeです" : "ヘルプです"}</p>
  <p>isPinned: {isPinned ? "固定されてます" : "NOです"}</p>
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
