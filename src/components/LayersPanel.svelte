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

  <div class="end-of-layers">
    <button disabled class="add-layer">Add gradient</button>
  </div>
</section>

<style>
  .layers {
    display: grid;
    align-content: start;
    gap: var(--size-2);
    padding-block: var(--size-5);
  }

  @media (prefers-color-scheme: light) {
    .layers {
      background: var(--surface-1);
    }
  }

  @media (min-width: 1024px) {
    .layers {
      max-block-size: calc(100cqb - var(--size-content-1));
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
    padding-inline: var(--size-5);
    background: var(--surface-3);
    box-shadow: var(--shadow-2);
  }

  .layers > h2 {
    color: var(--link);
    font-size: var(--font-size-0);
    text-transform: uppercase;
    font-weight: var(--font-weight-6);
    margin-block-end: var(--size-2);
    margin-inline: var(--size-5);
  }

  .end-of-layers {
    margin-block-start: var(--size-fluid-4);
    text-align: center;
  }
</style>