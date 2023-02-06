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
  import {layers} from '../store/layers.ts'

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
  import Prism from "./PrismJS.svelte";

  const gensyntax = {
    'linear': () => 
      `linear-gradient(
      ${linearAngleToString($linear_angle, $linear_named_angle)} ${spaceToString()}, 
      ${stopsToStrings()}
    )`,
    'radial': () => 
      `radial-gradient(
      ${$radial_size} ${$radial_shape} at ${radialPositionToString()} ${spaceToString()}, 
      ${stopsToStrings()}
    )`,
    'conic': () => 
      `conic-gradient(
      from ${$conic_angle}deg at ${conicPositionToString()} ${spaceToString()}, 
      ${stopsToStrings()}
    )`
  }

  const genClassicSyntax = {
    'linear': () => 
      `linear-gradient(
      ${linearAngleToString($linear_angle, $linear_named_angle)}, ${stopsToStrings()}
    )`,
    'radial': () => 
      `radial-gradient(
      ${$radial_size} ${$radial_shape} at ${radialPositionToString()}, 
      ${stopsToStrings()}
    )`,
    'conic': () => 
      `conic-gradient(
      from ${$conic_angle}deg at ${conicPositionToString()}, 
      ${stopsToStrings()}
    )`
  }

  function spaceToString() {
    return isCylindricalSpace($gradient_space)
      ? `in ${$gradient_space} ${$gradient_interpolation} hue`
      : `in ${$gradient_space}`
  }

  function stopsToStrings() {
    return $gradient_stops
      .filter(s => s?.percentage !== '50')
      .filter(s => s?.percentage !== null)
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
      .join(',\n      ')
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

  function randomNumber(min, max) {
    return Math.trunc(Math.random() * (max - min) + min)
  }

  function addStop() {
    $gradient_stops = [
      ...$gradient_stops,
      {kind: 'hint', percentage: null},
      {kind: 'stop', color: `oklch(80% 0.3 ${randomNumber(0,360)})`, position1: null, position2: null},
    ]
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

  $: classic_gradient = genClassicSyntax[$gradient_type](
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
    <ColorPicker />
    <LayersPanel />
  </contain-er>
  
  <contain-er style="container: preview-panel / inline-size;">
    <section class="preview-panel">
      <div class="preview">
        <div style={`background:${user_gradient}`}></div>  
      </div>
      <Prism modern_gradient={user_gradient} classic_gradient={classic_gradient} />
    </section>
  </contain-er>

  <contain-er style="container: control-panel / inline-size;">
    <section class="controls" style="accent-color: {$gradient_stops[0].color}">
      <header>
        <p>Image Layer</p>
        <h2>{$layers}</h2>
      </header>

      <h3>Settings</h3>

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

      <h3>Color stops</h3>
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
    display: grid;
    margin-inline: auto;
    block-size: 30vh;
    max-inline-size: 90%;
    aspect-ratio: var(--ratio-widescreen);
    animation: var(--animation-fade-out) reverse;
    resize: both;
    overflow: hidden;
    background: var(--gradient-checkerboard);
    box-shadow: var(--shadow-6);
  }

  .controls {
    display: grid;
    gap: var(--size-1);
  }

  .controls {
    background: var(--surface-2);
    padding-block: var(--size-2) var(--size-fluid-5);
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

  @media (prefers-color-scheme: light) {
    .controls {
      background: var(--surface-1);
    }

    .gradient {
      background: var(--surface-4);
    }

    .brand {
      background: white;
    }
  }

  .brand :global(> h1) {
    font-size: var(--font-size-3);
  }

  .preview-panel {
    display: grid;
    place-content: space-between center;
    gap: var(--size-fluid-5);
    padding-block: var(--size-fluid-5);

    min-block-size: 100%;
    max-block-size: 100vh;
    max-block-size: 100dvh;
    overflow-y: auto;
  }

  .controls > header {
    padding-inline: var(--size-2);
    display: grid;
    margin-block: var(--size-4);
    text-align: end;
    justify-content: end;
  }

  .controls > header > h2 {
    font-size: var(--font-size-2);
  }

  .controls > header > p {
    text-transform: uppercase;
    font-size: var(--font-size-0);
  }

  h3 {
    color: var(--link);
    padding-inline: .7rem;
    max-inline-size: 100%;
    background: var(--surface-3);
    padding-block: 0.5rem;
    font-size: var(--font-size-0);
    text-transform: uppercase;
    font-weight: var(--font-weight-6);
    margin-block-end: var(--size-2);
  }

  @media (prefers-color-scheme: light) {
    h3 {
      background: var(--surface-2);
    }
  }

  h3:not(:first-of-type) {
    margin-block-start: var(--size-4); 
  }

  .controls > :global(fieldset) {
    border-inline: none;
    border-block-end: none;
    border-color: var(--surface-3);
    display: grid;
    gap: var(--size-2);
    padding-inline: var(--size-2);
  }

  :global(fieldset > select) {
    justify-self: start;
  }

  :global(fieldset) {
    position: relative;
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

  :global(.slider-set) {
    display: inline-flex;
    place-items: center;
    gap: var(--size-2);
  }

  @media (prefers-color-scheme: light) {
    :global(select) {
      background: white;
      box-shadow: var(--shadow-3);
      border: 1px solid var(--surface-2);
    }
  }

  :global(input[type="color"].round::-webkit-color-swatch-wrapper) {
    padding: 0;
    clip-path: circle(50%);
  }

  :global(input[type="color"].round::-webkit-color-swatch) {
    border: none;
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

  /* :global(fieldset:not(:hover, :focus-within) .remove) {
    opacity: 0;
  } */

  :global(.container-absolute) {
    position: absolute;
    inset-block-start: -1.5rem;
    inset-inline-end: .5rem;
  }

  :global(.stack) {
    display: inline-grid;
    gap: var(--size-2);
  }

  :global(.percentage-value) {
    min-inline-size: 4ch; 
    text-align: end;
  }

  :global(.slider-percentage) {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    text-align: end;
    max-inline-size: 5ch;
    padding-block: 0;
    /* background: none; */
    -moz-appearance:textfield;
  }

  :global(.slider-percentage::-webkit-outer-spin-button),
  :global(.slider-percentage::-webkit-inner-spin-button) {
      -webkit-appearance: none;
      margin: 0;
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
