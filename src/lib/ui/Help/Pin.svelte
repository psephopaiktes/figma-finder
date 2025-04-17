<script lang="ts">
  import i18n from "@/lib/i18n.svelte";
</script>

<section>
  <svg-icon src="/img/icon/extension.svg">Extention Icon</svg-icon>
  <p>
    {@html i18n.t({
      en: "For easier access, <br>pin Figma Finder!",
      ja: "アクセスしやすいように、<br>Figma Finderを固定しましょう！",
      "zh-cn": "为了更方便地访问，<br>请固定 Figma Finder！",
      es: "¡Para un acceso más fácil, <br>fija Figma Finder!",
    })}
  </p>
  <img src="/img/pin-ss.webp" alt="how to pin screenshot" />
</section>

<style>
  section {
    position: absolute;
    top: 48px;
    right: 16px;
    width: 240px;
    padding: 8px;
    background: var(--color-theme);
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    line-height: 1.4;
    box-shadow: 2px 16px 64px -16px rgb(0 0 0 / 0.4);
    p {
      margin: 0;
      color: #fff;
      position: relative;
      text-wrap: balance;
      &::before,
      &::after {
        content: "";
        position: absolute;
        aspect-ratio: 1;
        background: var(--color-theme);
        border-radius: 6px;
      }
      &::before {
        bottom: calc(100% + 14px);
        right: 12px;
        width: 22px;
      }
      &::after {
        bottom: calc(100% + 32px);
        right: 40px;
        width: 16px;
      }
    }
    svg-icon {
      width: 2lh;
      float: inline-end;
      color: #000;
      opacity: 0.4;
    }
    img {
      margin-block-start: 8px;
      border-radius: 6px;
      aspect-ratio: 3 / 2;
    }

    @media (width < 960px) {
      position: relative;
      inset: 0;
      display: flex;
      width: 100%;
      margin-block-start: var(--sp-m);
      align-items: center;
      font-size: 16px;
      box-shadow: 2px 12px 48px -12px rgb(0 0 0 / 0.2);
      :global(br) {
        display: none;
      }
      p {
        flex: 1;
        overflow-wrap: anywhere;
        text-align: center;
        margin-block-start: 8px;
        &::before,
        &::after {
          display: none;
        }
      }
      svg-icon {
        float: revert;
        position: absolute;
        top: 6px;
        left: 6px;
      }
      img {
        margin: 0;
        width: min(45%, 160px);
      }
    }

    @media (width < 640px) {
      font-size: 12px;
      align-items: end;
      p {
        text-align: left;
      }
    }
  }
</style>
