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
    <button disabled class="add-layer">
      New layer
      <svg viewBox="0 0 24 24">
        <path fill="currentColor" d="M13 14h2v-3h3V9h-3V6h-2v3h-3v2h3v3Zm-5 4q-.825 0-1.413-.588T6 16V4q0-.825.588-1.413T8 2h12q.825 0 1.413.588T22 4v12q0 .825-.588 1.413T20 18H8Zm-4 4q-.825 0-1.413-.588T2 20V6h2v14h14v2H4Z"/>
      </svg>
    </button>
  </div>
</section>

<style>
  .layers {
    display: grid;
    align-content: start;
    gap: var(--size-2);
    padding-block: 1px var(--size-5);
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
    margin-block-start: var(--size-fluid-4);
    text-align: center;
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