<script lang="ts">
import i18n from "@/lib/i18n.svelte";
</script>

<footer>
  <section>
    <h3>
      {i18n.t({
        en: "Support the Developer🙏",
        ja: "制作者を支援🙏",
        "zh-cn": "支持开发者🙏",
        es: "Apoyar al desarrollador🙏",
        ko: "개발자 지원🙏",
      })}
    </h3>
    <ul>
      <li>
        <a href="https://paypal.me/psephopaiktes" target="_blank"> PayPal </a>
      </li>
      <li>
        <a href="https://github.com/sponsors/psephopaiktes" target="_blank">
          GitHub sponsors
        </a>
      </li>
      <li>
        <a href="https://ko-fi.com/psephopaiktes" target="_blank"> Ko-fi </a>
      </li>
      <li>
        <a href="https://buymeacoffee.com/psephopaiktes" target="_blank">
          Buy me a coffee
        </a>
      </li>
    </ul>
  </section>
  <section>
    <h3>URLs</h3>
    <ul>
      <li>
        <a
          href={import.meta.env.CHROME
            ? "https://chrome.google.com/webstore/detail/klifomaejfaibpkbigbpljdmelbkehbe"
            : "TODO"}
          target="_blank"
        >
          {i18n.t({
            en: "Store Page",
            ja: "ストアページ",
            "zh-cn": "商店页面",
            es: "Página de la tienda",
            ko: "스토어 페이지",
          })}
        </a>
      </li>
      <li>
        <a href="https://github.com/psephopaiktes/figma-finder" target="_blank">
          GitHub
        </a>
      </li>
      <li>
        <a href="https://hira.page" target="_blank">
          {i18n.t({
            en: "Author's Website",
            ja: "制作者HP",
            "zh-cn": "作者网站",
            es: "Sitio web del autor",
            ko: "제작자 홈페이지",
          })}
        </a>
      </li>
    </ul>
  </section>

  <img src="/img/logo-symbol.svg" alt="Figma Finder" />

  <small>
    <a href="https://hira.page" target="_blank"> © Akira HIRATA </a>
  </small>
</footer>

<style>
  footer {
    --bounce: -240px;
    position: sticky;
    top: 100vh;
    display: flex;
    justify-content: center;
    align-items: start;
    gap: var(--sp-2xl);
    margin-inline: calc(50% - 50vw);
    margin-block-start: calc(var(--sp-2xl) + var(--bounce));
    margin-block-end: var(--bounce);
    padding: var(--sp-xl) var(--sp-m) calc(var(--sp-2xl) - var(--bounce));

    background-color: var(--color-main);
    background-image: linear-gradient(
        0deg,
        transparent 96%,
        rgb(from var(--color-base) r g b / 0.08) 96%
      ),
      linear-gradient(
        90deg,
        transparent 96%,
        rgb(from var(--color-base) r g b / 0.08) 96%
      );
    background-size: var(--sp-s) var(--sp-s);
    color: var(--color-base);
    border-top: 16px solid var(--color-theme);
  }
  img {
    width: min(30%, 160px);
    aspect-ratio: 147 / 96;
    filter: invert(0.3);
    @media (width < 640px) {
      display: none;
    }
  }
  h3 {
    margin: 0;
    opacity: revert;
  }
  li {
    margin-block-start: var(--sp-s);
    margin-inline-start: 0.5em;
    padding-inline-start: 0.5em;
    &::marker {
      content: "-";
      color: var(--color-theme);
    }
  }
  a {
    opacity: 0.8;
    &:hover {
      opacity: 1;
    }
  }
  small {
    position: absolute;
    bottom: calc(var(--sp-m) - var(--bounce));
    opacity: 0.6;
  }
</style>
