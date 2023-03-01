<script>
  import {isCylindricalSpace} from '../utils/colorspace.ts'

  import {gradient_type, gradient_space} from '../store/gradient.ts'
  import {layers} from '../store/layers.ts'

  import GradientType from './GradientType.svelte'
  import LinearAngle from './LinearAngle.svelte'
  import RadialSize from './RadialSize.svelte'
  import RadialShape from './RadialShape.svelte'
  import RadialPosition from './RadialPosition.svelte'
  import ConicAngle from './ConicAngle.svelte'
  import ConicPosition from './ConicPosition.svelte'
  import HueInterpolation from './HueInterpolation.svelte'
  import GradientColorSpace from './GradientColorSpace.svelte'
</script>

<section class="layers">
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

  {#if $gradient_type === 'linear'}
    <LinearAngle />
  {/if}

  {#if $gradient_type === 'radial'}
    <RadialSize />
    <RadialShape />
    <RadialPosition />
  {/if}

  {#if $gradient_type === 'conic'}
    <ConicAngle />
    <ConicPosition />
  {/if}

  <GradientColorSpace />

  {#if isCylindricalSpace($gradient_space)}
    <HueInterpolation />
  {/if}

  <div class="end-of-layers">
    <button class="add-layer" title="Add a layer">
      <span class="sr-only">New layer</span>
      <svg viewBox="0 0 24 24">
        <path fill="currentColor" d="M11 19v-6H5v-2h6V5h2v6h6v2h-6v6h-2Z"/>
      </svg>
    </button>
  </div>
</section>

<style>
  .layers {
    display: grid;
    grid-template-rows: auto auto auto 1fr;
    align-content: start;
    gap: var(--size-2);
    padding-block: 1px;
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
    position: sticky;
    inset-block-start: 0;
    z-index: 1;
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
    place-self: end;
  }

  .add-layer {
    margin: var(--size-3);
    border-radius: var(--radius-round);
    aspect-ratio: var(--ratio-square);
    
    --_bg: var(--surface-3);
    --_icon-size: var(--size-6);
  }

  @media (prefers-color-scheme: light) {
    .layers {
      background: var(--surface-1);
    }

    .layer {
      background: white;
    }
  }
</style>