<script lang="ts">
  import Layout from "@/lib/Layout.svelte";
  import i18n from "@/lib/i18n.svelte";
  import oauth from "@/lib/oauth.svelte";
  import { store, user } from "@/lib/store.svelte";
  import Loader from "@/lib/ui/Loader.svelte";
  import Nav from "@/lib/ui/Nav/Index.svelte";

  let loading = $state(false);
  const logIn = async () => {
    loading = true;
    await oauth.logIn();
    location.reload();
  };
</script>

<Layout class="l-document c-document">
  <Nav current="home" />

  {#if !user()}
    <h2>STEP 1 <small>/ 2</small></h2>
    <p>Login with Figma Account.</p>
    <button onclick={logIn} class="c-button">
      {#if loading}
        <Loader size="24px" />
      {:else}
        <svg-icon src="/img/icon/login.svg"></svg-icon>
        {i18n.t({
          en: "Log In to Figma",
          ja: "Figma にログイン",
          "zh-cn": "登录到 Figma",
        })}
      {/if}
    </button>
  {:else}
    <h2>STEP 2 <small>/ 2</small></h2>
    <p>Input your Team ID to add.</p>
    <p><a href="/help.html#team-id" target="_blank">What is Team ID?</a></p>

    {user()?.teams}
  {/if}
</Layout>

<style>
  button {
    margin-block-start: var(--sp-l);
  }
</style>
