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

  import GradientType from './GradientType.svelte'
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
    $conic_angle,
    $conic_position,
    $conic_named_position
  )
</script>

<main class="gradient">

  <!-- output -->
  <div class="layers">
    <h4>Image Layers</h4>
    <input type="text" bind:value={user_gradient} onclick="this.select()" 
    readonly />
  </div>
  <!-- modern and legacy for copy -->

  <div class="preview" style={`background:${user_gradient}`}></div>

  <!-- todo: multiple gradients -->

  <div class="controls" style="accent-color: {$gradient_stops[0].color}">
    <ColorPicker />

    <GradientType />

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

    <button class="add-color" on:click={() => addStop()}>Add a color</button>

  </div>
</main>

<style>
  /* todo @property */
	.gradient {
    overflow: hidden;
		display: grid;
    grid-template-columns: var(--size-content-1) 1fr var(--size-content-2);
    row-gap: var(--size-3);
    block-size: 100vh;
    block-size: 100dvh;
	}

  .layers {
    display: grid;
    align-content: start;
    gap: var(--size-2);
    padding: var(--size-2);
    background: var(--surface-2);
  }

  .controls {
    display: grid;
    align-items: start;
    gap: var(--size-3);
    padding-block: var(--size-3);
    padding-inline: var(--size-3);
    background: var(--surface-2);
    max-block-size: 100%;
    overflow-y: auto;
  }

  input[readonly] {
    text-align: center;
  }

  :global(fieldset), 
  :global(.chip:has(.remove)) {
    position: relative;
  }

  :global(.chip > .remove) {
    inset-block-start: -0.75rem;
  }

  .preview {
    block-size: 30vh;
    max-inline-size: 100vw;
    animation: var(--animation-fade-out) reverse;
    resize: both;
    overflow: hidden;
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
    background: var(--surface-1);
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
</style>
