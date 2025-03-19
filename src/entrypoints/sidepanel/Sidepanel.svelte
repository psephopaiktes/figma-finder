<script lang="ts">
  import Layout from "@/lib/Layout.svelte";
  import Nav from "@/lib/Nav/Index.svelte";
  import Loader from "@/lib/UI/Loader.svelte";
  import i18n from "@/lib/i18n.svelte";
  import oauth from "@/lib/oauth.svelte";

  let loading = $state(false);
  const logIn = async () => {
    loading = true;
    await oauth.logIn();
    location.reload();
  };
</script>

<Layout>
  <Nav current="home">
    <input type="text" name="aa" id="" />
  </Nav>

  <h1>SidePanel</h1>
  <h3>
    {i18n.t({ en: "english", ja: "日本語", "zh-cn": "簡体中文" })}
  </h3>

  <button onclick={logIn}>
    {#if loading}
      <Loader />
    {:else}
      Sign In to Figma
    {/if}
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
  button {
    width: 320px;
    height: 48px;
    border-radius: 8px;
    background: var(--color-theme);
    color: var(--color-base);
  }
</style>
