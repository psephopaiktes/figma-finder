<script lang="ts">
  // by Astrit Malsia
  // Released under the MIT license
  // URL：https://codepen.io/astrit

  let { size = "32px" } = $props();
</script>

<div class="figma" style="font-size: {size};">
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
  @keyframes twinkle {
    0% {
      opacity: 0.4;
    }
    100% {
      opacity: 0.8;
    }
  }

  div {
    box-sizing: content-box;
  }

  .figma {
    display: inline-block;
    opacity: 0.6;
    animation: twinkle 0.5s ease-in-out infinite alternate;
    width: 1em;
    aspect-ratio: 1;
    position: relative;
    overflow: hidden;
    text-indent: 200%;
  }

  .top {
    display: flex;
    margin: auto;
    width: 0.6875em;
    height: 0.375em;
  }

  .middle {
    display: flex;
    margin: -0.0625em auto auto;
    width: 0.6875em;
    height: 0.375em;
    animation: middle-rotate 4s cubic-bezier(0.33, 1, 0.68, 1) infinite;
  }

  .bottom {
    margin: -0.0625em auto auto;
    width: 0.6875em;
    height: 0.375em;
    animation: bottom-rotate 4s cubic-bezier(0.33, 1, 0.68, 1) infinite;
  }

  .pill-left {
    width: 0.125em;
    height: 0.25em;
    border-left: 0.0625em solid currentColor;
    border-top: 0.0625em solid currentColor;
    border-bottom: 0.0625em solid currentColor;
    border-top-left-radius: 0.3125em;
    border-bottom-left-radius: 0.3125em;
    animation: pill-left-move 4s cubic-bezier(0.12, 0, 0.39, 0) infinite;
  }

  .pill-center {
    width: 0.3125em;
    height: 0.25em;
    border-top: 0.0625em solid currentColor;
    border-bottom: 0.0625em solid currentColor;
    animation: pill-center-scale 4s cubic-bezier(0.12, 0, 0.39, 0) infinite;
  }

  .pill-right {
    width: 0.125em;
    height: 0.25em;
    border-right: 0.0625em solid currentColor;
    border-top: 0.0625em solid currentColor;
    border-bottom: 0.0625em solid currentColor;
    border-top-right-radius: 0.3125em;
    border-bottom-right-radius: 0.3125em;
    animation: pill-right-move 4s cubic-bezier(0.12, 0, 0.39, 0) infinite;
  }

  .line-container {
    position: absolute;
    top: -0.03125em;
    width: 0.5625em;
    height: 0.3125em;
    border-radius: 0.3125em;
    border: 0.0625em solid transparent;
    overflow: hidden;
    animation: line-container-scale 4s cubic-bezier(0.12, 0, 0.39, 0) infinite;
  }
  .middle-line {
    width: 0.0625em;
    height: 0.3125em;
    background-color: currentColor;
    margin: 0 auto;
    animation: middle-line-move 4s cubic-bezier(0.12, 0, 0.39, 0) infinite;
  }

  .petal {
    width: 0.25em;
    height: 0.25em;
    border: 0.0625em solid currentColor;
    border-radius: 0.3125em 0 0 0.3125em;
    transform: translate(0.25em);
    transform-origin: right center;
    animation: petal-move 4s cubic-bezier(0.33, 1, 0.68, 1) infinite;
  }

  .circle {
    width: 0.25em;
    height: 0.25em;
    margin-left: -0.0625em;
    border: 0.0625em solid currentColor;
    border-radius: 0.3125em;
    transform-origin: left center;
    animation: circle-move 4s cubic-bezier(0.33, 1, 0.68, 1) infinite;
  }

  .drip {
    width: 0.25em;
    height: 0.25em;
    border: 0.0625em solid currentColor;
    border-radius: 0.3125em 0 0.3125em 0.3125em;
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
      transform: translate(0.15625em);
    }
    5% {
      transform: translate(0);
    }
    10% {
      transform: translate(0.15625em);
    }
    15% {
      transform: translate(0);
    }
    20% {
      transform: translate(0.15625em);
    }
    25% {
      transform: translate(0);
    }
    75% {
      transform: translate(0);
    }
    80% {
      transform: translate(0.15625em);
    }
    85% {
      transform: translate(0);
    }
    90% {
      transform: translate(0.15625em);
    }
    95% {
      transform: translate(0);
    }
    to {
      transform: translate(0.15625em);
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
      transform: translate(-0.15625em);
    }
    5% {
      transform: translate(0);
    }
    10% {
      transform: translate(-0.15625em);
    }
    15% {
      transform: translate(0);
    }
    20% {
      transform: translate(-0.15625em);
    }
    25% {
      transform: translate(0);
    }
    75% {
      transform: translate(0);
    }
    80% {
      transform: translate(-0.15625em);
    }
    85% {
      transform: translate(0);
    }
    90% {
      transform: translate(-0.15625em);
    }
    95% {
      transform: translate(0);
    }
    to {
      transform: translate(-0.15625em);
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
      transform: translate(-0.28125em);
    }
    5% {
      transform: translate(0);
    }
    10% {
      transform: translate(0.28125em);
    }
    10.1% {
      transform: translate(-0.28125em);
    }
    15% {
      transform: translate(0);
    }
    20% {
      transform: translate(0.28125em);
    }
    20.1% {
      transform: translate(-0.28125em);
    }
    25% {
      transform: translate(0);
    }
    75% {
      transform: translate(0);
    }
    80% {
      transform: translate(0.28125em);
    }
    80.1% {
      transform: translate(-0.28125em);
    }
    85% {
      transform: translate(0);
    }
    90% {
      transform: translate(0.28125em);
    }
    90.1% {
      transform: translate(-0.28125em);
    }
    95% {
      transform: translate(0);
    }
    to {
      transform: translate(0.28125em);
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
