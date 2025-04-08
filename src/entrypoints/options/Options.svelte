<script lang="ts">
  import Layout from "@/lib/Layout.svelte";
  import i18n from "@/lib/i18n.svelte";
  import { store } from "@/lib/store.svelte";
  import Nav from "@/lib/ui/Nav/Index.svelte";
  import TeamSetting from "@/lib/ui/TeamSetting.svelte";

  const showNav = location.search.includes("nav");
  const title = i18n.t({
    en: "Options",
    ja: "オプション",
    "zh-cn": "选项",
    es: "Opciones",
  });

  $effect(() => {
    storage.setItem("sync:options", store.options);
    document.documentElement.dataset.theme = store.options.theme;
  });
</script>

<Layout class="l-document c-document" {title}>
  {#if showNav}
    <Nav {title} current="options" />
  {/if}

  <h2>
    {i18n.t({
      en: "Display Settings",
      ja: "表示設定",
      "zh-cn": "显示设置",
      es: "Configuración de pantalla",
    })}
  </h2>

  <label>
    <h3>
      {i18n.t({ en: "Language", ja: "言語", "zh-cn": "语言", es: "Idioma" })}
    </h3>
    <select bind:value={store.options.locale}>
      <option value={null}>
        {i18n.t({
          en: "System",
          ja: "システム",
          "zh-cn": "系统",
          es: "Sistema",
        })}
      </option>
      {#each Object.keys(i18n.locales) as locale}
        <option value={locale}>
          {i18n.locales[locale as keyof typeof i18n.locales].label}
        </option>
      {/each}
    </select>
  </label>

  <label>
    <h3>
      {i18n.t({ en: "Theme", ja: "テーマ", "zh-cn": "主题", es: "Tema" })}
    </h3>

    <select bind:value={store.options.theme}>
      <option value="system">
        {i18n.t({
          en: "System",
          ja: "システム",
          "zh-cn": "系统",
          es: "Sistema",
        })}
      </option>
      <option value="light">
        {i18n.t({ en: "Light", ja: "ライト", "zh-cn": "亮", es: "Luz" })}
      </option>
      <option value="dark">
        {i18n.t({ en: "Dark", ja: "ダーク", "zh-cn": "暗", es: "Oscuro" })}
      </option>
    </select>
  </label>

  <h3>
    {i18n.t({
      en: "File Opening Method",
      ja: "ファイルの開き方",
      "zh-cn": "文件打开方式",
      es: "Método de apertura de archivos",
    })}
  </h3>
  <p>
    <label>
      <input type="radio" bind:group={store.options.openInApp} value={false} />
      {i18n.t({
        en: "Open in Browser",
        ja: "ブラウザで開く",
        "zh-cn": "在浏览器中打开",
        es: "Abrir en el navegador",
      })}
    </label>
  </p>
  <p>
    <label>
      <input type="radio" bind:group={store.options.openInApp} value={true} />
      {i18n.t({
        en: "Open in Desktop App",
        ja: "デスクトップアプリで開く",
        "zh-cn": "在桌面应用程序中打开",
        es: "Abrir en la aplicación de escritorio",
      })}
    </label>
  </p>

  {#if store.options.currentUser}
    <hr />

    <h2>
      {i18n.t({
        en: "Team ID",
        ja: "チームID",
        "zh-cn": "团队ID",
        es: "ID del equipo",
      })}
    </h2>
    <TeamSetting />
  {/if}

  <hr />

  <h2>
    {i18n.t({
      en: "Information",
      ja: "情報",
      "zh-cn": "信息",
      es: "Información",
    })}
  </h2>
  <h3>URL</h3>
  <ul>
    <li>
      <a href="https://TODO動的に" target="_blank">
        {i18n.t({
          en: "Store Page",
          ja: "ストアページ",
          "zh-cn": "商店页面",
          es: "Página de la tienda",
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
        })}
      </a>
    </li>
  </ul>

  <h3>
    {i18n.t({
      en: "Support the Developer🙏",
      ja: "制作者を支援🙏",
      "zh-cn": "支持开发者🙏",
      es: "Apoyar al desarrollador🙏",
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

  <hr />
  <footer>
    <a href="https://hira.page" target="_blank"> © Akira HIRATA </a>
  </footer>
</Layout>

<style>
  ul {
    list-style: disc;
    margin-block-start: 0.8rem;
    padding-inline-start: 1.5em;
  }
  li > a {
    color: var(--color-theme);
    text-decoration: none;
  }
  select {
    border: 2px solid rgb(from var(--color-main) r g b / 0.1);
    border-radius: 4px;
    padding: 0.2em 0.4em;
    margin-block-start: 0.6rem;
  }
  input[type="radio"] {
    width: 1em;
    aspect-ratio: 1;
    margin: calc(1lh - 1em) 0;
    vertical-align: middle;
    appearance: none;
    border-radius: 50%;
    border: 1px solid rgb(from var(--color-main) r g b / 0.6);
    &:checked {
      background: var(--color-theme);
      box-shadow: var(--color-base) 0 0 0 2px inset;
    }
  }
</style>
