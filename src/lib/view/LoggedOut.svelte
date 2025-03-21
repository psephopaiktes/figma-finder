<script lang="ts">
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

<svg-icon src="/img/icon/login.svg"></svg-icon>
<button onclick={logIn}>
  {#if loading}
    <Loader />
  {:else}
    {i18n.t({
      en: "Log In to Figma",
      ja: "Figma にログイン",
      "zh-cn": "登录到 Figma",
    })}
  {/if}
</button>

<style>
  button {
    width: 320px;
    height: 48px;
    border-radius: 8px;
    background: var(--color-theme);
    color: var(--color-base);
  }
</style>
