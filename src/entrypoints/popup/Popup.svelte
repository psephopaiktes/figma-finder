<script lang="ts">
import i18n from "@/lib/i18n.svelte";
import { store, user } from "@/lib/store.svelte";
import { openSidePanel } from "@/lib/utils.svelte";
import Home from "@/lib/view/Home.svelte";

let needSidepanel = $state(false);

$effect(() => {
  if (store.loading) return;
  if (!user() || Object.keys(user()?.teams || {}).length <= 0) {
    needSidepanel = true;
  }
});
</script>

{#if needSidepanel}
  <section class="l-centeringContainer">
    <svg-icon src="/img/icon/info-circle.svg"></svg-icon>
    <h2>
      {i18n.t({
        en: "Setup is not complete",
        ja: "設定が完了していません",
        "zh-cn": "设置未完成",
        es: "La configuración no está completa",
      })}
    </h2>
    <p>
      {i18n.t({
        en: "Please complete the initial setup in the side panel.",
        ja: "サイドパネルで初期設定を行ってください",
        "zh-cn": "请在侧边面板中完成初始设置。",
        es: "Por favor, complete la configuración inicial en el panel lateral.",
      })}
    </p>
    <button
      onclick={() => {
        openSidePanel();
        window.close();
      }}
      class="c-button"
    >
      {i18n.t({
        en: "Open Side Panel",
        ja: "サイドパネルを開く",
        "zh-cn": "打开侧边面板",
        es: "Abrir panel lateral",
      })}
    </button>
  </section>
{:else}
  <Home />
{/if}

<style>
  svg-icon {
    font-size: 48px;
  }
  button {
    width: fit-content;
  }
</style>
