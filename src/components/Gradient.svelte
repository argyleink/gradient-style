<script>
  import { onMount } from 'svelte'

  import Color from 'colorjs.io'

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
  import {updateStops} from '../utils/stops.ts'

  import GradientStops from './GradientStops.svelte'
  import GradientColorSpace from './GradientColorSpace.svelte'
  import HueInterpolation from './HueInterpolation.svelte'

  import LinearAngle from './LinearAngle.svelte'
  import LinearOverlay from './LinearOverlay.svelte'

  import RadialSize from './RadialSize.svelte'
  import RadialShape from './RadialShape.svelte'
  import RadialPosition from './RadialPosition.svelte'

  import ConicAngle from './ConicAngle.svelte'
  import ConicPosition from './ConicPosition.svelte'

  import ColorPicker from './ColorPicker.svelte'
  import LayersPanel from './LayersPanel.svelte'
  import Prism from './PrismJS.svelte'

  let preview_resizer
  let box_width
  let box_height

  onMount(() => {
    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries.at(0)
      box_width = entry.contentBoxSize[0].inlineSize
      box_height = entry.contentBoxSize[0].blockSize
    })

    resizeObserver.observe(preview_resizer)
  })

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
      `linear-gradient(${linearAngleToString($linear_angle, $linear_named_angle)}, ${stopsToStrings({convert_colors: true, new_lines: false})})`,
    'radial': () => 
      `radial-gradient(
      ${$radial_size} ${$radial_shape} at ${radialPositionToString()}, 
      ${stopsToStrings({convert_colors: true, new_lines: false})}
    )`,
    'conic': () => 
      `conic-gradient(
      from ${$conic_angle}deg at ${conicPositionToString()}, 
      ${stopsToStrings({convert_colors: true, new_lines: false})}
    )`
  }

  function spaceToString() {
    return isCylindricalSpace($gradient_space)
      ? `in ${$gradient_space} ${$gradient_interpolation} hue`
      : `in ${$gradient_space}`
  }

  function maybeConvertColor(color, convert_colors) {
    if (convert_colors) {
      return new Color(color).to('srgb').toString({ format: 'hex' })
    }
    else {
      return color
    }
  }

  function stopsToStrings({convert_colors, new_lines} = {convert_colors: false, new_lines: true}) {
    return $gradient_stops
      .filter(s => !s?.auto || s?.percentage != s?.auto)
      .filter(s => s?.percentage !== null)
      .map(s => {
        if (s.kind === 'stop') {
          if (s.position1 != null && s.position2 != null) 
            return maybeConvertColor(s.color, convert_colors) + ' ' + s.position1 + '% ' + s.position2 + '%'
          else if (s.position1 == null && s.position2 != null) {
            s.position1 = '0'
            s.position2 = '0'
            return maybeConvertColor(s.color, convert_colors) + ' ' + s.position1 + '% ' + s.position2 + '%'
          }
          else 
            return s.position1 != null && s.position1 != s.auto
              ? maybeConvertColor(s.color, convert_colors) + ' ' + s.position1 + '%'
              : maybeConvertColor(s.color, convert_colors)
        }
        else if (s.kind === 'hint') {
          return s.percentage + '%'
        }
      })
      .join(new_lines == true ? ',\n      ' : ', ')
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
    const newList = [
      ...$gradient_stops,
      {kind: 'hint', percentage: null},
      {kind: 'stop', color: `oklch(80% 0.3 ${randomNumber(0,360)})`, position1: null, position2: null},
    ]
    $gradient_stops = updateStops(newList)
  }

  function showCodePane() {
    document.querySelector('.code-preview-panel').scrollIntoView({
      behavior: 'smooth'
    })
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

  <contain-er style="container: layers-panel / inline-size; z-index: var(--layer-1)">
    <header class="brand">
      <div class="gradient-logo" style="background:{user_gradient}"></div>
      <h1>gRADiants</h1>
    </header>
    <ColorPicker />
    <LayersPanel />
  </contain-er>
  
  <contain-er style="container: preview-panel / inline-size;">
    <div class="inline-snap-panels">
      <section class="preview-panel">
        <div class="gradient-actions">
          <button on:click={e => showCodePane()}>Get Code</button>
        </div>
        <div class="preview">
          <div bind:this={preview_resizer} class="resizer" style="background: {user_gradient}"></div>  
          {#if $gradient_type === 'linear'}
            <LinearOverlay w={box_width} h={box_height} />
          {/if}
        </div>
      </section>
      <section class="code-preview-panel">
        <h4>Modern HD gradient snippet</h4>
        <Prism modern_gradient={user_gradient} />
        <br>
        <h4>Classic gradient snippet</h4>
        <Prism classic_gradient={classic_gradient} />
      </section>
    </div>
  </contain-er>

  <contain-er style="container: control-panel / inline-size; z-index: var(--layer-1)">
    <section class="controls">
      <header>
        <h2>{$layers}</h2>
      </header>

      <h3>{$gradient_type} Gradient Settings</h3>

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
    max-inline-size: 90%;
    max-inline-size: 90cqi;
    animation: var(--animation-fade-out) reverse;
    background: var(--gradient-checkerboard);
    box-shadow: var(--shadow-6);
  }

  .preview > div {
    grid-area: 1/1;
  }

  .resizer {
    resize: both;
    overflow: hidden;
    block-size: 30vh;
    max-inline-size: 100%;
    aspect-ratio: var(--ratio-widescreen);
  }

  @media (min-width: 1024px) {
    .resizer {
      block-size: 50vh;
    }
  }

  .controls {
    display: grid;
    gap: var(--size-1);
    align-content: start;
    background: var(--surface-2);
    padding-block: var(--size-2) var(--size-fluid-5);
    accent-color: var(--surface-3);
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
    place-content: center;
    inline-size: 100cqi;
    block-size: 100cqb;
    overflow: hidden;
    position: relative;
  }

  .code-preview-panel {
    display: grid;
    gap: var(--size-2);
    align-content: center;
    justify-items: flex-start;
    justify-content: center;
  }

  .inline-snap-panels {
    display: grid;
    grid-template-columns: 100cqi 100cqi;
    min-block-size: 100%;
    max-block-size: 100vh;
    max-block-size: 100dvh;
    overflow: auto;
    scroll-snap-type: x mandatory;
  }

  .inline-snap-panels > section {
    scroll-snap-align: center;
  }

  .gradient-actions {
    position: absolute;
    inset-block-start: var(--size-3);
    inset-inline-end: var(--size-3);
  }

  .controls > header {
    padding-inline: var(--size-5);
    display: grid;
    margin-block: var(--size-4);
  }

  .controls > header > h2 {
    font-size: var(--font-size-2);
  }

  .controls > header > p {
    text-transform: uppercase;
    font-size: var(--font-size-0);
  }

  h3 {
    display: flex;
    align-items: center;
    color: var(--link);
    padding-inline: var(--size-5);
    max-inline-size: 100%;
    font-size: var(--font-size-0);
    text-transform: uppercase;
    font-weight: var(--font-weight-6);
    margin-block-end: var(--size-2);
  }

  h3:not(:first-of-type) {
    margin-block-start: var(--size-4); 
  }

  :global(.control-set) {
    border-inline: none;
    border-block-end: none;
    border-radius: 0;
    border-color: var(--surface-3);
    display: grid;
    gap: var(--size-2);
    padding-inline: var(--size-5);
    padding-block: var(--size-3);
  }

  :global(.control-set:focus-within) {
    border-color: var(--link);
  }

  :global(.control-set:focus-within legend) {
    color: var(--link);
  }

  :global(.control-set > select) {
    place-self: start;
  }

  :global(.control-set) {
    position: relative;
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
    direction: rtl;
    max-inline-size: 4.8ch;
    padding-block: 0;
    padding-inline-end: 0;
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

  :global(select) {
    --icon-arrow-down: url(https://api.iconify.design/ic:keyboard-arrow-down.svg?color=%23adb5bd);
    --icon-arrow-up: url(https://api.iconify.design/ic:keyboard-arrow-up.svg?color=%23adb5bd);
    --_bg-light: #fff;
    --_bg-dark: var(--surface-3);
    --_bg: var(--_bg-light);
    background-color: var(--_bg);
    
    appearance: none;
    background-image: var(--icon-arrow-down);
    background-position: calc(100% - 1ch) center;
    background-size: 3ex;
    background-repeat: no-repeat;
    padding-block: 0.75ch;
    padding-inline: 1.75ch 3ch;
    line-height: 1.5;
  }
    
  :global(select):is(:hover,:focus) {
    background-color: var(--_bg);
  }

  :global(select:not([disabled])) {
    box-shadow: var(--shadow-3);
  }
  
  :global(select:not([disabled])):is(:hover, :focus) {
    background-image: var(--icon-arrow-up);
  }

  :global(select[disabled]) {
    cursor: not-allowed;
  }
  
  @media (prefers-color-scheme: dark) {
    :global(select) {
      --_bg: var(--_bg-dark);
    }
  }
</style>
