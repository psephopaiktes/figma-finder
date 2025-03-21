<script lang="ts">
  import Layout from "@/lib/Layout.svelte";
  import Nav from "@/lib/UI/Nav/Index.svelte";
  import i18n from "@/lib/i18n.svelte";
  import { store } from "@/lib/store.svelte";

  const showNav = location.search.includes("nav");

  $effect(() => {
    storage.setItem("sync:options", store.options);
    document.documentElement.dataset.theme = store.options.theme;
  });
</script>

<Layout class="l-document c-document">
  {#if showNav}
    <Nav
      title={{
        en: "Options",
        ja: "設定",
        "zh-cn": "选项",
      }}
      current="options"
    />
  {/if}

  <h2>
    {i18n.t({ en: "Display Settings", ja: "表示設定", "zh-cn": "显示设置" })}
  </h2>
  <label>
    <h3>
      {i18n.t({ en: "Theme", ja: "テーマ", "zh-cn": "主题" })}
    </h3>

    <select bind:value={store.options.theme}>
      <option value="system">
        {i18n.t({ en: "System", ja: "システム", "zh-cn": "系统" })}
      </option>
      <option value="light">
        {i18n.t({ en: "Light", ja: "ライト", "zh-cn": "亮" })}
      </option>
      <option value="dark">
        {i18n.t({ en: "Dark", ja: "ダーク", "zh-cn": "暗" })}
      </option>
    </select>
  </label>

  <label>
    <h3>
      {i18n.t({ en: "Language", ja: "言語", "zh-cn": "语言" })}
    </h3>

    <select bind:value={store.options.locale}>
      <option value={null}>
        {i18n.t({ en: "System", ja: "システム", "zh-cn": "系统" })}
      </option>
      {#each Object.keys(i18n.locales) as locale}
        <option value={locale}>
          {i18n.locales[locale as keyof typeof i18n.locales].label}
        </option>
      {/each}
    </select>
  </label>

  <hr />

  <h2>{i18n.t({ en: "Team ID", ja: "チームID", "zh-cn": "团队ID" })}</h2>

  <hr />

  <h2>{i18n.t({ en: "Information", ja: "情報", "zh-cn": "信息" })}</h2>
  <!-- TODO: Helpに移動かな -->
  <h3>URL</h3>
  <ul>
    <li>
      <a href="https://TODO動的に" target="_blank">
        {i18n.t({ en: "Store Page", ja: "ストアページ", "zh-cn": "商店页面" })}
      </a>
    </li>
    <li>
      <a href="https://github.com/psephopaiktes/tabulasa" target="_blank">
        GitHub
      </a>
    </li>
    <li>
      <a href="https://hira.page" target="_blank">
        {i18n.t({
          en: "Author's Website",
          ja: "制作者HP",
          "zh-cn": "作者网站",
        })}
      </a>
    </li>
  </ul>

  <h3>
    {i18n.t({
      en: "Support the Developer",
      ja: "制作者を支援",
      "zh-cn": "支持开发者",
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
</style>
