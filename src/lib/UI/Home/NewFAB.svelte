<a href="https://figma.new/" target="_blank">
  <!-- TODO 設定に応じてAppで開く? -->
  <svg-icon src="/img/icon/add.svg"> New File </svg-icon>
</a>

<style>
  a {
    position: fixed;
    bottom: 16px;
    right: 16px;
    width: 40px;
    aspect-ratio: 1;
    display: grid;
    place-content: center;
    font-size: 24px;
    border-radius: 8px;
    background-color: var(--color-theme);
    color: white;
    box-shadow: 4px 8px 16px -8px rgb(0 0 0 / 0.5);
    &:hover {
      scale: 1.05;
    }
  }
</style>
