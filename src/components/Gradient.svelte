<script>
  import { onMount } from 'svelte'

  import Color from 'colorjs.io'
  import { tooltip } from 'svooltip'
  import 'svooltip/styles.css'

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
  import {stateAsString, deserializeUrl, restoreStateFromUrl} from '../store/url.ts'

  import {linearAngleToString} from '../utils/linear.ts'
  import {isCylindricalSpace} from '../utils/colorspace.ts'
  import {updateStops} from '../utils/stops.ts'
  import {randomNumber} from '../utils/numbers.ts'

  import GradientStops from './GradientStops.svelte'
  import GradientColorSpace from './GradientColorSpace.svelte'
  import HueInterpolation from './HueInterpolation.svelte'

  import LinearOverlay from './LinearOverlay.svelte'
  import RadialOverlay from './RadialOverlay.svelte'
  import ColorPicker from './ColorPicker.svelte'
  import LayersPanel from './LayersPanel.svelte'
  import Presets from './Presets.svelte'
  import Prism from './PrismJS.svelte'

  let preview_resizer
  let preview_hd = true
  let box_width
  let box_height
  let metatag

  onMount(async () => {
    const {stateAsString, restoreStateFromUrl} = await import('../store/url.ts')
    const restore = restoreStateFromUrl()
    metatag = document.querySelector('#browsertheme')

    if (restore) {
      if (restore.type)               $gradient_type = restore.type
      if (restore.space)              $gradient_space = restore.space
      if (restore.interpolation)      $gradient_interpolation = restore.interpolation

      if (restore.linear_named_angle) $linear_named_angle = restore.linear_named_angle
      if (restore.linear_angle)       $linear_angle = parseInt(restore.linear_angle)

      if (restore.radial_shape)       $radial_shape = restore.radial_shape
      if (restore.radial_position)    $radial_position = restore.radial_position
      if (restore.radial_named_position) $radial_named_position = restore.radial_named_position
      if (restore.radial_size)        $radial_size = restore.radial_size

      if (restore.conic_angle)        $conic_angle = restore.conic_angle
      if (restore.conic_position)     $conic_position = restore.conic_position
      if (restore.conic_named_position) $conic_named_position = restore.conic_named_position

      // last, to kickoff render
      if (restore.stops)              $gradient_stops = updateStops(restore.stops)
    }

    stateAsString.subscribe(state => {
      clearTimeout(window.syncStateTimer)
      window.syncStateTimer = setTimeout(() => {
        state && window.history.replaceState({}, "", '#'+state)
      }, 500)
    })

    gradient_stops.subscribe(state => {
      const [first] = state
      if (!metatag) return
      metatag.content = new Color(first.color).to('srgb').toString({ format: 'hex' })
    })

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
      ${stopsToStrings({new_lines: false})}
    )`,
    'radial': () => 
      `radial-gradient(
      ${$radial_size} ${$radial_shape} at ${radialPositionToString()} ${spaceToString()}, 
      ${stopsToStrings({new_lines: false})}
    )`,
    'conic': () => 
      `conic-gradient(
      from ${$conic_angle}deg at ${conicPositionToString()} ${spaceToString()}, 
      ${stopsToStrings({new_lines: false})}
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
    return isCylindricalSpace($gradient_space) && $gradient_interpolation !== 'shorter'
      ? `in ${$gradient_space} ${$gradient_interpolation} hue`
      : `in ${$gradient_space}`
  }

  function maybeConvertColor(color, convert_colors) {
    if (convert_colors) {
      try {
        return new Color(color).to('srgb').toString({ format: 'hex' })
      }
      catch {}
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
          if (s.position1 != null && s.position2 != null && s.position1 != s.position2) 
            return maybeConvertColor(s.color, convert_colors) + ' ' + s.position1 + '% ' + s.position2 + '%'
          else if (s.position1 == null && s.position2 != null) {
            s.position1 = '0'
            s.position2 = '100'
            return maybeConvertColor(s.color, convert_colors) + ' ' + s.position1 + '% ' + s.position2 + '%'
          }
          else {
            let stop1 = s.position1 != null && s.position1 != s.auto
              ? maybeConvertColor(s.color, convert_colors) + ' ' + s.position1 + '%'
              : maybeConvertColor(s.color, convert_colors)
            let stop2 = s.position2 != null
              ? ' ' + s.position2 + '%'
              : ''
            
            return stop1 + stop2
          }
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

  function addStop() {
    const newList = [
      ...$gradient_stops,
      {kind: 'hint', percentage: null},
      {kind: 'stop', color: `oklch(80% 0.3 ${randomNumber(0,360)})`, position1: null, position2: null},
    ]
    $gradient_stops = updateStops(newList)
  }

  function showCodePane() {
    document.querySelector('.code-preview-panel .panel-actions button').focus()
  }

  function showEditorPane() {
    document.querySelector('.preview-panel .panel-actions button').focus()
  }

  function globalAction(event) {
    switch (event.target.value) {
      case 'Start new':
        $gradient_type = 'linear'
        $gradient_space = 'oklab'
        $gradient_stops = [
          {kind: 'stop', color: '#000', auto: '0', position1: '0', position2: '0'}, 
          {kind: 'hint', auto: '50', percentage: '50'},
          {kind: 'stop', color: '#fff', auto: '100', position1: '100', position2: '100'},
        ]
        $linear_named_angle = 'to right'
        break
      case 'Provide feedback':
        window.open('https://discord.gg/nm4mkWxF')
        break
    }

    // reset
    event.target.selectedIndex = 0
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

<div class="color-wrap" style={`--user-classic: ${classic_gradient}; --user-modern: ${user_gradient}; background: var(--user-classic); background: ${preview_hd ? 'var(--user-modern)':'var(--user-classic)'};`}>
<main class="gradient-builder">

  <contain-er style="container: layers-panel / inline-size; z-index: var(--layer-1)">
    <div class="primary-sidebar">
      <header class="brand">
        <div class="gradient-logo" style="background:{preview_hd ? user_gradient : classic_gradient}"></div>
        <h1 class="brand-name">HD G<b>rad</b>ients</h1>
      </header>
      <ColorPicker />
      <LayersPanel />
      <Presets />
    </div>
  </contain-er>
  
  <contain-er style="container: preview-panel / inline-size;">
    <div class="inline-snap-panels">
      <section class="preview-panel">
        <div class="panel-actions">
          <button on:click={e => showCodePane()} use:tooltip={{content: "Get the CSS"}}>
            <span class="sr-only">Get the CSS code</span>
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path fill="currentColor" d="M16.7 17.3q-.275.275-.688.275t-.712-.3q-.3-.3-.3-.712t.3-.713l3.875-3.875l-3.9-3.9Q15 7.8 15.012 7.388T15.3 6.7q.275-.275.7-.275t.7.275l4.6 4.6q.3.3.3.7t-.3.7l-4.6 4.6Zm-9.4 0l-4.6-4.6q-.3-.3-.3-.7t.3-.7l4.6-4.6q.275-.275.7-.287t.725.287q.3.3.3.713t-.3.712l-3.9 3.9l3.9 3.9q.275.275.263.688T8.7 17.3q-.275.275-.7.275t-.7-.275Z"/>
            </svg>
          </button>
        </div>
        <div class="preview">
          <label class="hd-switch" use:tooltip={{html: true, content: '<span class="rich-tooltip">Toggle between high and standard gradient previews.<br><br>(HDR) high dynamic range.</span>', delay: [1000, 0]}}>
            <span class="sr-only">HD on or off?</span>
            {#if preview_hd == true}
              <svg width="32" height="32" viewBox="0 0 20 20"><path fill="currentColor" d="M4.75 4A2.75 2.75 0 0 0 2 6.75v6.5A2.75 2.75 0 0 0 4.75 16h10.5A2.75 2.75 0 0 0 18 13.25v-6.5A2.75 2.75 0 0 0 15.25 4H4.75ZM4.5 7.5A.5.5 0 0 1 5 8v1.5h2V8a.5.5 0 0 1 1 0v4a.5.5 0 0 1-1 0v-1.5H5V12a.5.5 0 0 1-1 0V8a.5.5 0 0 1 .5-.5ZM9 8a.5.5 0 0 1 .5-.5h.25A2.25 2.25 0 0 1 12 9.75v.5a2.25 2.25 0 0 1-2.25 2.25H9.5A.5.5 0 0 1 9 12V8Zm1 3.475c.57-.116 1-.62 1-1.225v-.5c0-.605-.43-1.11-1-1.225v2.95ZM13 8a.5.5 0 0 1 .5-.5h1a1.5 1.5 0 0 1 .868 2.724l.6 1.6a.5.5 0 0 1-.936.352l-.629-1.676H14V12a.5.5 0 0 1-1 0V8Zm1 1.5h.5a.5.5 0 0 0 0-1H14v1Z"/></svg>
            {/if}
            {#if preview_hd == false}
              <svg width="32" height="32" viewBox="0 0 20 20"><path fill="currentColor" d="M2.854 2.146a.5.5 0 1 0-.708.708l1.416 1.415A2.75 2.75 0 0 0 2 6.75v6.5A2.75 2.75 0 0 0 4.75 16h10.543l1.853 1.854a.5.5 0 0 0 .708-.708l-15-15Zm8.38 9.795a2.241 2.241 0 0 1-1.484.559H9.5A.5.5 0 0 1 9 12V9.707l1 1v.768c.195-.04.374-.125.524-.244l.71.71ZM8 8.707V12a.5.5 0 0 1-1 0v-1.5H5V12a.5.5 0 0 1-1 0V8a.5.5 0 0 1 1 0v1.5h2V8c0-.085.021-.165.058-.235L8 8.707Zm4 1.043v.129l1 1V8a.5.5 0 0 1 .5-.5h1a1.5 1.5 0 0 1 .868 2.724l.6 1.6a.5.5 0 0 1-.936.352l-.629-1.676H14v1.379l3.254 3.254A2.74 2.74 0 0 0 18 13.25v-6.5A2.75 2.75 0 0 0 15.25 4H6.121l3.5 3.5h.129A2.25 2.25 0 0 1 12 9.75Zm2-.25h.5a.5.5 0 0 0 0-1H14v1Z"/></svg>
            {/if}
            <input class="sr-only" bind:checked={preview_hd} type="checkbox" name="hd-gradient">
          </label>
          <div 
            bind:this={preview_resizer} 
            class="resizer" 
            style={`background: ${classic_gradient};  ${preview_hd == true ? `background: ${user_gradient};` : ''} ${box_width ? `width: ${box_width}px; height: ${box_height}px;`:'width: 50cqi;'}`}>
          </div>  
          {#if $gradient_type === 'linear'}
            <LinearOverlay w={box_width} h={box_height} />
          {/if}
          {#if $gradient_type === 'radial'}
            <RadialOverlay w={box_width} h={box_height} />
          {/if}
        </div>
      </section>
      <section class="code-preview-panel">
        <div class="panel-actions">
          <button on:click={e => showEditorPane()} use:tooltip={{content: "Back to the editor"}}>
            <span class="sr-only">Back to editor</span>
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="m10.875 19.3l-6.6-6.6q-.15-.15-.213-.325T4 12q0-.2.063-.375t.212-.325l6.6-6.6q.275-.275.688-.287t.712.287q.3.275.313.688T12.3 6.1L7.4 11h11.175q.425 0 .713.288t.287.712q0 .425-.287.713t-.713.287H7.4l4.9 4.9q.275.275.288.7t-.288.7q-.275.3-.7.3t-.725-.3Z"/>
            </svg>
          </button>
        </div>
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
      <div class="menu-bar">
        <button class="global-actions">
          <select tabindex="-1" on:change={globalAction}>
            <option disabled selected>Actions</option>
            <option disabled>--</option>
            <option>Start new</option>
            <option disabled>Copy modern CSS</option>
            <option disabled>Copy classic CSS</option>
            <option disabled>Reset all stops to auto</option>
            <option disabled>--</option>
            <option disabled>Toggle light & dark</option>
            <option>Provide feedback</option>
          </select>
        </button>
      </div>

      <GradientColorSpace />

      {#if isCylindricalSpace($gradient_space)}
        <HueInterpolation />
      {/if}

      <GradientStops />

      <footer class="end-of-stops">
        <button class="add-color" on:click={() => addStop()}>
          Add a random color
          <svg viewBox="0 0 24 24">
            <path fill="currentColor" d="m17 3l5.25 4.5L17 12l5.25 4.5L17 21v-3h-2.74l-2.82-2.82l2.12-2.12L15.5 15H17V9h-1.5l-9 9H2v-3h3.26l9-9H17V3M2 6h4.5l2.82 2.82l-2.12 2.12L5.26 9H2V6Z"/>
          </svg>
        </button>
      </footer>

    </section>
  </contain-er>
</main>
</div>

<style>
  .color-wrap {
    background: Canvas;
    padding: var(--size-3);
  }

  @media (prefers-color-scheme: light) {
    .color-wrap {
      background: #ddd;
    }
  }

	.gradient-builder {
    --link: var(--surface-4);
		display: grid;
    border-radius: var(--radius-3);
    box-shadow: var(--shadow-3);
    overflow: hidden;
	}

  @media (min-width: 1024px) {
    .gradient-builder {
      grid-template-columns: var(--size-14) 1fr var(--size-14);
      grid-template-rows: calc(100vh - (var(--size-3) * 2));
      grid-template-rows: calc(100dvh - (var(--size-3) * 2));
    }
  }

  .preview {
    display: grid;
    margin-inline: auto;
    animation: var(--animation-fade-out) reverse;
    background: var(--gradient-checkerboard);
    box-shadow: var(--shadow-6);
  }

  .preview > * {
    grid-area: 1/1;
  }

  .resizer {
    resize: both;
    overflow: hidden;
    min-block-size: 80px;
    max-inline-size: 100cqi;
    max-block-size: 100cqb;
    aspect-ratio: var(--ratio-widescreen);
  }

  @media (min-width: 1024px) {
    .resizer {
      block-size: 50vh;
    }
  }

  .menu-bar {
    display: flex;
    justify-content: end;
    align-items: center;
    gap: var(--size-3);
    padding-inline: var(--size-3);
    position: sticky;
    z-index: 1;
    inset-block-start: 0;
    block-size: var(--size-8);
  }

  .menu-bar > select {
    box-shadow: none;
  }

  .menu-bar-icon {
    padding: var(--size-1);
    border-radius: var(--radius-round);
    aspect-ratio: var(--ratio-square);
    box-shadow: 0 0 0 var(--_highlight-size) var(--_highlight);

    --_bg: transparent;
    --_icon-size: var(--size-4);
    --_border: none;
  }

  .controls {
    display: grid;
    gap: var(--size-1);
    align-content: start;
    background: var(--surface-2);
    padding-block: 0 var(--size-fluid-5);
    accent-color: var(--surface-3);
  }

  @media (min-width: 1024px) {
    .controls {
      block-size: 100%;
      max-block-size: 100vh;
      max-block-size: 100dvh;
      overflow-y: auto;
      overscroll-behavior: contain;
    }
  }

  .controls {
    counter-reset: count 0;
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
    overflow: hidden;
    position: relative;
  }

  @media (max-width: 1024px) {
    .preview-panel {
      margin-block: var(--size-6);
    }
  }

  .code-preview-panel {
    display: grid;
    gap: var(--size-2);
    padding-block: var(--size-6);
    align-content: center;
    justify-items: flex-start;
    justify-content: center;
    position: relative;
  }

  @media (max-width: 1024px) {
    .code-preview-panel {
      display: none;
    }
  }

  .code-preview-panel .panel-actions {
    inset-inline: var(--size-3) auto;
  }

  .inline-snap-panels {
    background-color: var(--surface-1);
    display: grid;
    grid-template-columns: 100cqi 100cqi;
    min-block-size: 100%;
    overflow: auto;
    overscroll-behavior: contain;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
  }

  @media (min-width: 1024px) {
    .inline-snap-panels {
      max-block-size: 100vh;
      max-block-size: 100dvh;
    }
  }

  @media (prefers-color-scheme: light) {
    .inline-snap-panels {
      background: var(--surface-4);
    }
  }

  .inline-snap-panels > section {
    scroll-snap-align: center;
  }

  .panel-actions {
    position: absolute;
    inset-block-start: var(--size-3);
    inset-inline-end: var(--size-3);
  }

  .panel-actions > button {
    padding: var(--size-2);
    border-radius: var(--radius-round);
    --_bg: var(--surface-1);
  }

  :global(.control-set) {
    border: none;
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

  :global(.label-select-combo) {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  :global(.radio-pair) {
    display: flex;
    align-items: center;
    gap: var(--size-2);
  }

  :global(.input-suffix) {
    display: flex;
    align-items: center;
  }

  :global(.input-suffix > sup) {
    color: var(--text-2);
  }

  .gradient-builder :global(input[type="range"]) {
    inline-size: 100%;
  }

  :global(.slider-set) {
    display: inline-flex;
    place-items: center;
    gap: var(--size-2);
  }

  :global(.slider-set > label) {
    color: var(--text-2);
    font-size: var(--font-size-0);
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
    padding-block: var(--size-1);
    padding-inline: var(--size-2);
    font-size: var(--font-size-0);
    justify-self: end;
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
    max-inline-size: 2em;
    padding-block: 0;
    padding-inline-end: .25ch;
    padding-inline-start: 0;
    -moz-appearance:textfield;
    background: none;
  }

  /* @media (prefers-color-scheme: dark) {
    :global(.slider-percentage) {
      background: var(--surface-1);
    }
  } */

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
    --retro-stripes: linear-gradient(to top, #000 1%, 0%, #0000 8%, 0%, #000 10%, 0%, #0000 16%, 0%, #000 19%, 0%, #0000 24%, 0%, #000 28%, 0%, #0000 32%, 0%, #000 37%, 0%, #0000 40%, 0%, #000 46%, 0%, #0000 48%, 0%, #000 55%, 0%, #0000 56%, 0%, #000 57%);
    mask: var(--retro-stripes);
    -webkit-mask: var(--retro-stripes);
    inline-size: var(--size-10);
    inline-size: 35cqi;
    aspect-ratio: var(--ratio-square);
    border-radius: var(--radius-round);
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

  :global(.sr-only) {
    inline-size: 0;
    block-size: 0;
    overflow: hidden;
    visibility: hidden;
    white-space: nowrap;
    position: absolute;
  }
  
  @media (prefers-color-scheme: dark) {
    :global(select) {
      --_bg: var(--_bg-dark);
    }
  }

  .primary-sidebar {
    display: grid;
    background: var(--surface-2);
    block-size: 100%;
    align-content: start;
    grid-template-rows: auto [layers] 1fr auto [footer-links] auto;
  }

  @media (prefers-color-scheme: light) {
    .primary-sidebar {
      background: var(--surface-1);
    }
  }

  .brand-name:hover > b {
    color: cyan;
    color: color(display-p3 0 1 1);
  }

  .footer-links {
    display: flex;
    gap: var(--size-2);
    background: var(--surface-3);
    padding: var(--size-3);
  }

  @media (prefers-color-scheme: light) {
    .footer-links {
      background: white;
    }
  }

  .footer-links > .icon-button {
    border-radius: var(--radius-round);
    aspect-ratio: var(--ratio-square);
    padding: var(--size-2);
/*     box-shadow: 0 0 0 var(--_highlight-size) var(--_highlight); */
    --_bg: none;
    --_border: none;
  }

  .hd-switch {
    cursor: pointer;
    position: absolute;
    inset-block-start: calc(var(--size-7) * -1);
    inset-inline-start: -3px;
    display: flex;
    gap: var(--size-1);
    place-items: center;
  }

  .hd-switch > svg {
    color: var(--text-1);
    box-shadow: var(--shadow-1);
  }

  .global-actions {
    position: relative;
    inline-size: var(--size-7);
    overflow: hidden;
    border-radius: var(--radius-round);
    padding-inline: 0;
    aspect-ratio: 1;
    border: none;
    box-shadow: 0 0 0 var(--_highlight-size) var(--_highlight);
    background-image: url(https://api.iconify.design/material-symbols:settings-rounded.svg?color=%23adb5bd);
    background-position: center;
    background-repeat: no-repeat;
    background-size: 75%;
  }

  .global-actions:not(:focus-within) {
    --_bg: transparent;
  }

  .global-actions:not(:active,:focus) select {
    opacity: 0;
  }

  .global-actions > select {
    position: absolute;
  }
</style>
