<script lang="ts">
  import i18n from "@/lib/i18n.svelte";

  let { value = $bindable() } = $props();
</script>

<form>
  <svg-icon src="/img/icon/search.svg"></svg-icon>
  <input
    type="search"
    autofocus
    placeholder={i18n.t({
      en: "Find Figma Files",
      ja: "Figmaファイルを探す",
      "zh-cn": "查找Figma文件",
      es: "Encontrar archivos de Figma",
    })}
    bind:value
  />
</form>

<style>
  form {
    display: grid;
    width: 100%;
  }

  svg-icon {
    grid-area: 1/-1;
    font-size: 20px;
    margin: 6px;
  }

  input {
    grid-area: 1/-1;
    height: 32px;
    cursor: text;
    border-radius: 6px;
    caret-color: var(--color-theme);
    background: rgb(from var(--color-main) r g b / 5%);
    padding-inline-start: 32px;

    &::placeholder {
      color: #aaa;
    }

    &::-webkit-search-cancel-button {
      -webkit-appearance: none;
      width: 24px;
      aspect-ratio: 1;
      cursor: pointer;
      margin: 4px;
      background: var(--color-main);
      mask-image: url(/img/icon/close.svg);
      mask-size: 100%;
    }
  }
</style>
