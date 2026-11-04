<script lang="ts">
import i18n from "@/lib/i18n.svelte";
import { isMac } from "@/lib/utility.svelte";

let {
  mainText,
  subText,
  icon = "info-circle",
}: {
  mainText: Record<string, string>;
  subText?: Record<string, string>;
  icon?: string;
} = $props();
</script>

<section class="l-centeringContainer">
  <svg-icon src={`/img/icon/${icon}.svg`}></svg-icon>

  <p>
    {i18n.t(mainText)}
  </p>

  {#if subText}<small>{i18n.t(subText)}</small>{/if}

  <button
    class="c-button c-tooltip"
    onclick={() => {
      storage.removeItems(["local:localProjectState", "local:projects"]);
      location.reload();
    }}
    title={isMac ? "⌘R" : "Ctrl + R"}
  >
    <svg-icon src="/img/icon/refresh.svg"></svg-icon>
    {i18n.t({
      en: "Reload",
      ja: "再読み込み",
      "zh-cn": "重新加载",
      es: "Recargar",
      ko: "새로고침",
    })}
  </button>
</section>

<style>
  section > svg-icon {
    font-size: 32px;
  }
  small {
    display: block;
    opacity: 0.8;
    text-wrap: balance;
  }
</style>
