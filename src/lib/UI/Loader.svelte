<script lang="ts">
  // by Astrit Malsia
  // Released under the MIT license
  // URL：https://codepen.io/astrit
</script>

<div class="figma">
  <div class="top">
    <div class="pill-left"></div>
    <div class="pill-center"></div>
    <div class="pill-right"></div>
    <div class="line-container">
      <div class="middle-line"></div>
    </div>
  </div>
  <div class="middle">
    <div class="petal"></div>
    <div class="circle"></div>
  </div>
  <div class="bottom">
    <div class="drip"></div>
  </div>
  Loading...
</div>

<style>
  div {
    box-sizing: content-box;
  }

  .figma {
    display: inline-block;
    width: 22px;
    height: 32px;
    position: relative;
    overflow: hidden;
    text-indent: 200%;
  }

  .top {
    display: flex;
    margin: auto;
    width: 22px;
    height: 12px;
  }

  .middle {
    display: flex;
    margin: -2px auto auto;
    width: 22px;
    height: 12px;
    animation: middle-rotate 4s cubic-bezier(0.33, 1, 0.68, 1) infinite;
  }

  .bottom {
    margin: -2px auto auto;
    width: 22px;
    height: 12px;
    animation: bottom-rotate 4s cubic-bezier(0.33, 1, 0.68, 1) infinite;
  }

  .pill-left {
    width: 4px;
    height: 8px;
    border-left: 2px solid currentColor;
    border-top: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;
    animation: pill-left-move 4s cubic-bezier(0.12, 0, 0.39, 0) infinite;
  }

  .pill-center {
    width: 10px;
    height: 8px;
    border-top: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    animation: pill-center-scale 4s cubic-bezier(0.12, 0, 0.39, 0) infinite;
  }

  .pill-right {
    width: 4px;
    height: 8px;
    border-right: 2px solid currentColor;
    border-top: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
    animation: pill-right-move 4s cubic-bezier(0.12, 0, 0.39, 0) infinite;
  }

  .line-container {
    position: absolute;
    top: -1px;
    width: 18px;
    height: 10px;
    border-radius: 10px;
    border: 2px solid transparent;
    overflow: hidden;
    animation: line-container-scale 4s cubic-bezier(0.12, 0, 0.39, 0) infinite;
  }
  .middle-line {
    width: 2px;
    height: 10px;
    background-color: currentColor;
    margin: 0 auto;
    animation: middle-line-move 4s cubic-bezier(0.12, 0, 0.39, 0) infinite;
  }

  .petal {
    width: 8px;
    height: 8px;
    border: 2px solid currentColor;
    border-radius: 10px 0 0 10px;
    transform: translate(8px);
    transform-origin: right center;
    animation: petal-move 4s cubic-bezier(0.33, 1, 0.68, 1) infinite;
  }

  .circle {
    width: 8px;
    height: 8px;
    margin-left: -2px;
    border: 2px solid currentColor;
    border-radius: 10px;
    transform-origin: left center;
    animation: circle-move 4s cubic-bezier(0.33, 1, 0.68, 1) infinite;
  }

  .drip {
    width: 8px;
    height: 8px;
    border: 2px solid currentColor;
    border-radius: 10px 0 10px 10px;
    transform-origin: top right;
    animation: drip-move 4s cubic-bezier(0.33, 1, 0.68, 1) infinite;
  }

  @keyframes middle-rotate {
    0% {
      transform: rotateY(-90.1deg);
    }
    22% {
      transform: rotateY(-90.1deg);
    }
    30% {
      transform: rotateY(0);
    }
    72% {
      transform: rotateY(0);
    }
    80% {
      transform: rotateY(90.1deg);
    }
    to {
      transform: rotateY(90.1deg);
    }
  }
  @keyframes bottom-rotate {
    0% {
      transform: rotateY(-90.1deg);
    }
    26% {
      transform: rotateY(-90.1deg);
    }
    32% {
      transform: rotateY(0);
    }
    70% {
      transform: rotateY(0);
    }
    76% {
      transform: rotateY(90.1deg);
    }
    to {
      transform: rotateY(90.1deg);
    }
  }

  @keyframes pill-left-move {
    0% {
      transform: translate(5px);
    }
    5% {
      transform: translate(0);
    }
    10% {
      transform: translate(5px);
    }
    15% {
      transform: translate(0);
    }
    20% {
      transform: translate(5px);
    }
    25% {
      transform: translate(0);
    }
    75% {
      transform: translate(0);
    }
    80% {
      transform: translate(5px);
    }
    85% {
      transform: translate(0);
    }
    90% {
      transform: translate(5px);
    }
    95% {
      transform: translate(0);
    }
    to {
      transform: translate(5px);
    }
  }
  @keyframes pill-center-scale {
    0% {
      transform: scaleX(0.1);
    }
    5% {
      transform: scaleX(1.1);
    }
    10% {
      transform: scaleX(0.1);
    }
    15% {
      transform: scaleX(1.1);
    }
    20% {
      transform: scaleX(0.1);
    }
    25% {
      transform: scaleX(1.1);
    }
    75% {
      transform: scaleX(1.1);
    }
    80% {
      transform: scaleX(0.1);
    }
    85% {
      transform: scaleX(1.1);
    }
    90% {
      transform: scaleX(0.1);
    }
    95% {
      transform: scaleX(1.1);
    }
    to {
      transform: scaleX(0.1);
    }
  }
  @keyframes pill-right-move {
    0% {
      transform: translate(-5px);
    }
    5% {
      transform: translate(0);
    }
    10% {
      transform: translate(-5px);
    }
    15% {
      transform: translate(0);
    }
    20% {
      transform: translate(-5px);
    }
    25% {
      transform: translate(0);
    }
    75% {
      transform: translate(0);
    }
    80% {
      transform: translate(-5px);
    }
    85% {
      transform: translate(0);
    }
    90% {
      transform: translate(-5px);
    }
    95% {
      transform: translate(0);
    }
    to {
      transform: translate(-5px);
    }
  }
  @keyframes line-container-scale {
    0% {
      transform: scaleX(0.5);
    }
    5% {
      transform: scaleX(1);
    }
    10% {
      transform: scaleX(0.5);
    }
    15% {
      transform: scaleX(1);
    }
    20% {
      transform: scaleX(0.5);
    }
    25% {
      transform: scaleX(1);
    }
    75% {
      transform: scaleX(1);
    }
    80% {
      transform: scaleX(0.5);
    }
    85% {
      transform: scaleX(1);
    }
    90% {
      transform: scaleX(0.5);
    }
    95% {
      transform: scaleX(1);
    }
    to {
      transform: scaleX(0.5);
    }
  }
  @keyframes middle-line-move {
    0% {
      transform: translate(-9px);
    }
    5% {
      transform: translate(0);
    }
    10% {
      transform: translate(9px);
    }
    10.1% {
      transform: translate(-9px);
    }
    15% {
      transform: translate(0);
    }
    20% {
      transform: translate(9px);
    }
    20.1% {
      transform: translate(-9px);
    }
    25% {
      transform: translate(0);
    }
    75% {
      transform: translate(0);
    }
    80% {
      transform: translate(9px);
    }
    80.1% {
      transform: translate(-9px);
    }
    85% {
      transform: translate(0);
    }
    90% {
      transform: translate(9px);
    }
    90.1% {
      transform: translate(-9px);
    }
    95% {
      transform: translate(0);
    }
    to {
      transform: translate(9px);
    }
  }
  @keyframes petal-move {
    22% {
      transform: scaleX(0.01);
    }
    28% {
      transform: scaleX(1);
    }
    74% {
      transform: scaleX(1);
    }
    80% {
      transform: scaleX(0.01);
    }
    to {
      transform: scaleX(0.01);
    }
  }
  @keyframes circle-move {
    24% {
      transform: scaleX(0.01);
    }
    30% {
      transform: scaleX(1);
    }
    72% {
      transform: scaleX(1);
    }
    78% {
      transform: scaleX(0.01);
    }
    to {
      transform: scaleX(1);
    }
  }
  @keyframes drip-move {
    26% {
      transform: scale(0.01);
    }
    32% {
      transform: scale(1);
    }
    68% {
      transform: scale(1);
    }
    74% {
      transform: scale(0.01);
    }
    to {
      transform: scale(0.01);
    }
  }
</style>
