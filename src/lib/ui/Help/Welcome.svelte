<script lang="ts">
  import i18n from "@/lib/i18n.svelte";
  import { openSidePanel } from "@/lib/utility.svelte";
</script>

<section>
  <h1>Welcome 🎉</h1>

  <div class="logo">
    <img src="/img/logo-symbol.svg" alt="Logo Symbol" width="147" height="96" />
    <img src="/img/logo-type.svg" alt="Figma Finder" width="512" height="104" />
  </div>

  <p>
    {@html i18n.t({
      en: "Thank you for installing!<br>This page can be checked from the help at any time.",
      ja: "インストールしていただきありがとうございます。<br>このページはいつでもヘルプから確認できます。",
      "zh-cn": "感谢您的安装！<br>此页面可以随时从帮助中查看。",
      es: "¡Gracias por instalar!<br>Esta página se puede consultar desde la ayuda en cualquier momento.",
    })}
  </p>

  <button onclick={openSidePanel} class="c-button -gray">
    <svg-icon src="/img/icon/play.svg"></svg-icon>
    {i18n.t({
      en: "Run Figma Finder",
      ja: "Figma Finder を実行",
      "zh-cn": "运行Figma Finder",
      es: "Ejecutar Figma Finder",
    })}
  </button>
</section>

<style>
  section {
    display: grid;
    place-content: center;
    place-items: center;
    gap: var(--sp-m);
    margin-inline: calc(50% - 50vw);
    padding-block: var(--sp-xl);

    --bg: color-mix(in srgb, var(--color-base), var(--color-main) 3%);
    background-image: radial-gradient(
        circle farthest-side at top center,
        var(--bg) 60%,
        rgb(from var(--bg) r g b / 0.9)
      ),
      linear-gradient(transparent 96%, var(--color-main) 96%),
      linear-gradient(90deg, transparent 96%, var(--color-main) 96%);
    background-size:
      cover,
      var(--sp-s) var(--sp-s),
      var(--sp-s) var(--sp-s);
  }

  .logo {
    margin-block-start: var(--sp-m);
    display: flex;
    gap: 1.5rem;
    justify-content: center;
    align-items: center;
    opacity: 0.4;
    img {
      height: 4rem;
      width: auto;
    }
  }

  p {
    text-wrap: balance;
    text-align: center;
  }
</style>
