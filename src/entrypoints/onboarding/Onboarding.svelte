<script lang="ts">
  import Layout from "@/lib/Layout.svelte";
  import i18n from "@/lib/i18n.svelte";
  import oauth from "@/lib/oauth.svelte";
  import { user } from "@/lib/store.svelte";
  import Loader from "@/lib/ui/Loader.svelte";
  import Nav from "@/lib/ui/Nav/Index.svelte";
  import TeamSetting from "@/lib/ui/TeamSetting.svelte";

  let loading = $state(false);
  const logIn = async () => {
    loading = true;
    await oauth.logIn();
    location.reload();
  };
</script>

<Layout>
  <Nav current="home" />

  <div class="c-document">
    {#if !user()}
      <h2>STEP 1 <small>/ 2</small></h2>
      <p>
        {i18n.t({
          en: "Login with Figma Account.",
          ja: "Figma アカウントでログインしてください。",
          "zh-cn": "使用 Figma 帐户登录。",
          es: "Inicia sesión con tu cuenta de Figma.",
        })}
      </p>
      <button onclick={logIn} class="c-button">
        {#if loading}
          <Loader size="24px" />
        {:else}
          <svg-icon src="/img/icon/login.svg"></svg-icon>
          {i18n.t({
            en: "Log In",
            ja: "ログイン",
            "zh-cn": "登录",
            es: "Iniciar sesión",
          })}
        {/if}
      </button>
    {:else}
      <h2>STEP 2 <small>/ 2</small></h2>
      <TeamSetting />

      <a
        href="/sidepanel.html"
        class="c-button"
        inert={Object.keys(user()?.teams || {}).length == 0}
      >
        {i18n.t({
          en: "Start",
          ja: "開始する",
          "zh-cn": "开始",
          es: "Comenzar",
        })}
      </a>
    {/if}
  </div>
</Layout>

<style>
  button,
  a.c-button {
    margin-block-start: var(--sp-m);
  }
  h2 small {
    opacity: 0.6;
  }
</style>
