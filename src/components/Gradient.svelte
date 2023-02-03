<script>
  import {gradient_type, gradient_space, gradient_interpolation, 
          gradient_stops, gradient_positions
  } from '../store/gradient.ts'
  import {linear_named_angle, linear_angle
  } from '../store/linear.ts'
  import {radial_shape, radial_position, radial_named_position, radial_size
  } from '../store/radial.ts'
  import {conic_angle, conic_position, conic_named_position
  } from '../store/conic.ts'

  import {linearAngleToString} from '../utils/linear.ts'
  import {isCylindricalSpace} from '../utils/colorspace.ts'

  import GradientStops from './GradientStops.svelte'
  import GradientColorSpace from './GradientColorSpace.svelte'
  import HueInterpolation from './HueInterpolation.svelte'
  import LinearAngle from './LinearAngle.svelte'

  import RadialSize from './RadialSize.svelte'
  import RadialShape from './RadialShape.svelte'
  import RadialPosition from './RadialPosition.svelte'

  import ConicAngle from './ConicAngle.svelte'
  import ConicPosition from './ConicPosition.svelte'

  import ColorPicker from './ColorPicker.svelte'
  import LayersPanel from './LayersPanel.svelte'

  const gensyntax = {
    'linear': () => 
      `linear-gradient(${linearAngleToString($linear_angle, $linear_named_angle)} ${spaceToString()}, ${stopsToStrings()})`,
    'radial': () => 
      `radial-gradient(${$radial_size} ${$radial_shape} at ${radialPositionToString()} ${spaceToString()}, ${stopsToStrings()})`,
    'conic': () => 
      `conic-gradient(from ${$conic_angle}deg at ${conicPositionToString()} ${spaceToString()}, ${stopsToStrings()})`
  }

  function spaceToString() {
    return isCylindricalSpace($gradient_space)
      ? `in ${$gradient_space} ${$gradient_interpolation} hue`
      : `in ${$gradient_space}`
  }

  function stopsToStrings() {
    return $gradient_stops
      .filter(s => s?.percentage !== '50')
      .map(s => {
        if (s.kind === 'stop') {
          if (s.position1 != null && s.position2 != null) 
            return s.color + ' ' + s.position1 + '% ' + s.position2 + '%'
          else if (s.position1 == null && s.position2 != null) {
            s.position1 = 50
            return s.color + ' ' + s.position1 + '% ' + s.position2 + '%'
          }
          else 
            return s.position1 != null
              ? s.color + ' ' + s.position1 + '%'
              : s.color
        }
        else if (s.kind === 'hint') {
          return s.percentage + '%'
        }
      })
      .join(', ')
  }

  function radialPositionToString() {
    if ($radial_position.x != null) {
      if ($radial_position.y == null)
        $radial_position.y = '50'
      return $radial_position.x + '% ' + $radial_position.y + '%'
    }
    else {
      return $radial_named_position
    }
  }

  function conicPositionToString() {
    if ($conic_position.x != null) {
      if ($conic_position.y == null)
        $conic_position.y = '50'
      return $conic_position.x + '% ' + $conic_position.y + '%'
    }
    else {
      return $conic_named_position
    }
  }

  function addStop() {
    $gradient_stops = [...$gradient_stops, {kind: 'stop', color: '#999999', position1: null, position2: null}]
  }

  $: user_gradient = gensyntax[$gradient_type](
    $gradient_space,
    $gradient_interpolation,
    $gradient_stops,
    $linear_named_angle,
    $linear_angle,
    $radial_shape,
    $radial_size,
    $radial_position,
    $radial_named_position,
    $conic_angle,
    $conic_position,
    $conic_named_position
  )
</script>

<main class="gradient">

  <contain-er style="container: layers-panel / inline-size;">
    <header class="brand">
      <div class="gradient-logo" style={`background:${user_gradient}`}></div>
      <h1>HDgradients</h1>
    </header>
    <LayersPanel />
  </contain-er>
  
  <contain-er style="container: preview-panel / inline-size;">
    <section class="preview-panel">
      <div class="preview" style={`background:${user_gradient}`}></div>
      <input type="text" bind:value={user_gradient} onclick="this.select()" 
        readonly />
      <!-- modern and legacy for copy -->
    </section>
  </contain-er>

  <contain-er style="container: control-panel / inline-size;">
    <section class="controls" style="accent-color: {$gradient_stops[0].color}">
      <ColorPicker />

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

      <GradientStops />

      <footer class="end-of-stops">
        <button class="add-color" on:click={() => addStop()}>Add a color</button>
      </footer>

    </section>
  </contain-er>
</main>

<style>
	.gradient {
		display: grid;
    gap: var(--size-2);
	}

  @media (min-width: 1024px) {
    .gradient {
      overflow: hidden;
      grid-template-columns: var(--size-14) 1fr var(--size-14);
    }
  }

  .preview {
    margin-inline: auto;
    margin-block-start: var(--size-fluid-4);
    block-size: 30vh;
    max-inline-size: 90%;
    aspect-ratio: var(--ratio-widescreen);
    animation: var(--animation-fade-out) reverse;
    resize: both;
    overflow: hidden;
    box-shadow: var(--shadow-3);
  }

  .controls {
    display: grid;
    gap: var(--size-3);
  }

  .controls {
    background: var(--surface-2);
    padding-block-end: var(--size-fluid-5);
  }

  @media (min-width: 1024px) {
    .controls {
      block-size: 100%;
      max-block-size: 100vh;
      max-block-size: 100dvh;
      overflow-y: auto;
    }
  }

  .brand {
    min-block-size: var(--size-content-1);
    display: grid;
    place-content: center;
    background: var(--surface-3);
    gap: var(--size-2);
  }

  .brand :global(> h1) {
    font-size: var(--font-size-3);
  }

  .preview-panel {
    display: grid;
    place-content: center;
    gap: var(--size-fluid-3);
  }

  input[readonly] {
    text-align: center;
  }

  .controls > :global(fieldset) {
    margin-inline: var(--size-3);
    display: grid;
    gap: var(--size-2);
  }

  :global(fieldset), 
  :global(.chip:has(.remove)) {
    position: relative;
  }

  :global(.chip > .remove) {
    inset-block-start: -0.75rem;
  }

  @media (min-width: 1024px) {
    .preview {
      block-size: 50vh;
    }
  }

  :global(.radio-pair) {
    display: flex;
    align-items: center;
    gap: var(--size-2);
  }

  .gradient :global(input[type="range"]) {
    inline-size: 100%;
  }

  :global(.chip) {
    border-radius: var(--radius-round);
    display: inline-flex;
    place-items: center;
    gap: var(--size-2);
    padding-block: var(--size-1);
    padding-inline: var(--size-2);
  }

  :global(input[type="color"].round) {
    inline-size: 2ch;
    block-size: 2ch;
    border-radius: var(--radius-round);
    padding: 0;
  }

  :global(.chip:has(input[type="color"])) {
    background: var(--surface-1);
    justify-self: start;
  }

  :global(input[type="color"].round::-webkit-color-swatch-wrapper) {
    padding: 0;
    clip-path: circle(50%);
  }

  :global(input[type="color"].round::-webkit-color-swatch) {
    border: none;
  }

  :global(.color-hint > input) {
    appearance: none;
    accent-color: var(--surface-1);
    border-radius: var(--radius-round);
    block-size: 1rem;
  }

  :global(.color-hint > input::-webkit-slider-thumb) {
    --_border-size: 4px;
    
    cursor: grab;
    appearance: none;
    accent-color: var(--surface-1);
    border: 4px solid white;
    height: calc(1rem + (var(--_border-size) * 2));
    aspect-ratio: 1;
    border-radius: var(--radius-round);
    box-shadow: var(--shadow-2), var(--inner-shadow-2);
  }
  
  :global(.color-hint > input:active::-webkit-slider-thumb) {
    cursor: grabbing;
  }

  .add-color {
    align-self: end;
  }

  :global(.remove) {
    aspect-ratio: 1;
    padding: var(--size-1);
    border-radius: var(--radius-round);
    line-height: .75;
    font-size: var(--font-size-0);
    inline-size: var(--size-5);
    transition: opacity .2s var(--ease-3);
  }

  :global(fieldset:not(:hover, :focus-within) .remove) {
    opacity: 0;
  }

  :global(.container-absolute) {
    position: absolute;
    inset-block-start: -1.5rem;
    inset-inline-end: -0.5rem;
  }

  :global(.stack) {
    display: inline-grid;
    gap: var(--size-2);
  }

  :global(.percentage-value) {
    min-inline-size: 4ch; 
    text-align: end;
  }

  .end-of-stops {
    padding: var(--size-3);
    margin-block-start: var(--size-fluid-4);
    text-align: center;
  }

  .gradient-logo {
    -webkit-mask: url(https://api.iconify.design/game-icons:bookshelf.svg) 
      center / contain
      no-repeat;
    mask: url(https://api.iconify.design/game-icons:bookshelf.svg) 
      center / contain
      no-repeat;
    inline-size: var(--size-10);
    aspect-ratio: var(--ratio-square);
    justify-self: center;
  }
</style>
