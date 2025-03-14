<script lang="ts">
  import Layout from "@/lib/Layout.svelte";
  import Nav from "@/lib/Nav/Index.svelte";
  import i18n from "@/lib/i18n";
  import { store } from "@/lib/store.svelte";

  const title = i18n.t({
    en: "Options",
    jp: "設定",
    "zh-cn": "选项",
  });

  const isSidepanel = location.search.includes("sidepanel");

  $effect(() => {
    storage.setItem("sync:options", store.options);
    document.documentElement.dataset.theme = store.options.theme;
  });
</script>

<Layout class="l-document c-document">
  {#if isSidepanel}
    <Nav {title} current="options" />
  {/if}

  <h2>Editor</h2>
  <h3>Theme</h3>
  <ul>
    <li>
      <label>
        <input
          bind:group={store.options.theme}
          type="radio"
          name="theme"
          value="system"
        />
        {i18n.t({ en: "System", jp: "システム", "zh-cn": "系统" })}
      </label>
    </li>
    <li>
      <label>
        <input
          bind:group={store.options.theme}
          type="radio"
          name="theme"
          value="light"
        />
        {i18n.t({ en: "Light", jp: "ライト", "zh-cn": "亮" })}
      </label>
    </li>
    <li>
      <label>
        <input
          bind:group={store.options.theme}
          type="radio"
          name="theme"
          value="dark"
        />
        {i18n.t({ en: "Dark", jp: "ダーク", "zh-cn": "暗" })}
      </label>
    </li>
  </ul>

  <h3>Font</h3>
  <p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
    tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
    quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
    consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
    cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat
    non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
  </p>

  <hr />

  <h2>{i18n.t({ en: "Information", jp: "情報", "zh-cn": "信息" })}</h2>
  <h3>URL</h3>
  <ul>
    <li>
      <a href="https://TODO動的に" target="_blank">
        {i18n.t({ en: "Store Page", jp: "ストアページ", "zh-cn": "商店页面" })}
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
          jp: "制作者HP",
          "zh-cn": "作者网站",
        })}
      </a>
    </li>
  </ul>

  <h3>{i18n.t({ jp: "支援する", en: "Support", "zh-cn": "支持" })}</h3>
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
