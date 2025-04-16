<script lang="ts">
  import i18n from "@/lib/i18n.svelte";
  import { openSidePanel } from "@/lib/utility.svelte";
</script>

<section>
  <h1>
    Welcome
    <img src="/img/logo-symbol.svg" alt="Figma Finder" />
    <img src="/img/logo-type.svg" alt="Figma Finder" />
  </h1>
  <p>
    Figma&nbsp;Finder&nbsp;をインストールしていただきありがとうございます。このページはいつでもヘルプから確認できます。
  </p>

  <button onclick={openSidePanel} class="c-button">
    {i18n.t({
      en: "Run Figma Finder",
      ja: "Figma Finderを実行",
      "zh-cn": "运行Figma Finder",
      es: "Ejecutar Figma Finder",
    })}
  </button>
</section>

<style>
  section {
    display: grid;
    place-content: center;
    text-align: center;
    margin-inline: calc(50% - 50vw);
    padding: var(--sp-l);
    background: rgb(from var(--color-main) r g b / 0.05);
  }
</style>
