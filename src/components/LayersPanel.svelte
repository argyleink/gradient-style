<script>
  import GradientType from './GradientType.svelte'

  import {layers} from '../store/layers.ts'
</script>

<section class="layers">
  <h2>Image Layers</h2>
  <!-- {#each layers as layer}
    <div class="layer selected">
      <span contenteditable>{layer}</span> 
      <GradientType />
    </div>
  {/each} -->
  <div class="layer selected">
    <span contenteditable bind:textContent={$layers}></span> 
    <GradientType />
  </div>
  
  <footer class="end-of-layers">
    <button disabled class="add-layer">Add gradient</button>
  </footer>
</section>

<style>
  .layers {
    display: grid;
    align-content: start;
    gap: var(--size-2);
    padding: var(--size-5);
    background: var(--surface-2);
    padding-block-end: var(--size-fluid-5);
  }

  @media (prefers-color-scheme: light) {
    .layers {
      background: var(--surface-1);
    }
  }

  @media (min-width: 1024px) {
    .layers {
      block-size: 100%;
      max-block-size: 100vh;
      max-block-size: 100dvh;
      overflow-y: auto;
      overflow-x: hidden;
    }
  }

  .layer {
    cursor: pointer;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-block: var(--size-2);
    border-block-end: 1px solid var(--surface-3);
  }

  .layer:first-of-type {
    border-block-start: 1px solid var(--surface-3);
  }

  .layer.selected::after {
    content: "";
    display: block;
    position: absolute;
    inset-inline-end: calc(var(--size-5) * -1 - 1ch);
    height: 2ch;
    width: 2ch;
    background: var(--surface-1);
    transform: rotateZ(45deg);
  }

  .layers > h2 {
    font-size: var(--font-size-1);
    margin-block-end: var(--size-2);
  }

  .end-of-layers {
    margin-block-start: var(--size-fluid-4);
    text-align: center;
  }
</style>