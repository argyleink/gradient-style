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

  import GradientType from './GradientType.svelte'
  import LinearAngle from './LinearAngle.svelte'
  import RadialSize from './RadialSize.svelte'
  import RadialShape from './RadialShape.svelte'
  import RadialPosition from './RadialPosition.svelte'
  import ConicAngle from './ConicAngle.svelte'

  function isCylindricalSpace(space) {
    return ['hsl','hwb','lch','oklch'].includes(space)
  }

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

  function removeStopByIndex(pos) {
    $gradient_stops = $gradient_stops.filter((item, i) => i !== pos)
  }

  function removePositionByIndex(index, pos) {
    $gradient_stops[index]['position'+pos] = null

    // spec fix, cant have 2nd position without the 1st one
    if (pos === 1 && $gradient_stops[index].position2 !== null)
      $gradient_stops[index]['position2'] = null      
  }

  function addStop() {
    $gradient_stops = [...$gradient_stops, {kind: 'stop', color: '#999999', position1: null, position2: null}]
  }

  function removeConicPositions() {
    $conic_position.x = null
    $conic_position.y = null
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

<div class="gradient">

  <!-- output -->
  <input type="text" bind:value={user_gradient} onclick="this.select()" readonly />
  <!-- modern and legacy for copy -->

  <div class="preview" style={`background:${user_gradient}`}></div>

  <!-- todo: multiple gradients -->

  <div class="controls" style="accent-color: {$gradient_stops[0].color}">
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
      <fieldset>
        <legend>Position</legend>
        <select name="conic-position" bind:value={$conic_named_position} disabled={$conic_position.x !== null}>
          {#each gradient_positions as pos}
            <option value={pos}>{pos}</option>  
          {/each}
        </select>
        <div class="stack">
          <div class="chip conic-position">
            <input type="range" bind:value={$conic_position.x} min="-100" max="200" step="1" style="accent-color: {$conic_position.x === null ? 'gray' : 'inherit'}" />
            {#if $conic_position.x != null}
              <button class="remove container-absolute" type="reset" on:click={() => removeConicPositions()}>✕</button>
            {/if}
          </div>
          <div class="chip conic-position">
            <input type="range" bind:value={$conic_position.y} min="-100" max="200" step="1" style="accent-color: {$conic_position.y === null ? 'gray' : 'inherit'}" />
            {#if $conic_position.y != null}
              <button class="remove container-absolute" type="reset" on:click={() => removeConicPositions()}>✕</button>
            {/if}
          </div>
        </div>
      </fieldset>
    {/if}

    <fieldset>
      <legend>Color Space</legend>
      <select name="colorspace" id="in-colorspace" bind:value={$gradient_space}> 
        <optgroup label="Default colorspace">
          <option selected>oklab</option>
        </optgroup>
        <optgroup label="Cylinderical">
          <option>lch</option> 
          <option>oklch</option>
          <option>hsl</option>
          <option>hwb</option>
        </optgroup>
        <optgroup label="Polar">
          <option>lab</option>
          <option>srgb</option>
          <option>srgb-linear</option>
          <option>xyz</option>
        </optgroup>
      </select>
    </fieldset>

    {#if isCylindricalSpace($gradient_space)}
      <fieldset>
        <legend>Hue Interpolation</legend>
        <select name="colorspace" id="in-colorspace" bind:value={$gradient_interpolation}> 
          <optgroup label="Default interpolation">
            <option selected>shorter</option>
          </optgroup>
          <optgroup label="Other">
            <option>longer</option>
            <option>decreasing</option>
            <option>increasing</option>
          </optgroup>
        </select>
      </fieldset>
    {/if}

    <!-- color stops -->
    {#each $gradient_stops as stop, i}
      {#if stop.kind === 'stop'}
        <fieldset style="accent-color: {stop.color}">
          <legend>Color</legend>
          <div class="chip color-stop">
            <input class="round" type="color" bind:value="{stop.color}">
            <span>{stop.color}</span>
            <button class="remove container-absolute" type="reset" on:click={() => removeStopByIndex(i)}>✕</button>
          </div>
          <div class="stack">
            <div class="chip color-position">
              <input type="range" bind:value="{stop.position1}" style="accent-color: {stop.position1 === null ? 'gray' : stop.color}">
              {#if stop.position1 != null}
                <button class="remove container-absolute" type="reset" on:click={() => removePositionByIndex(i, 1)}>✕</button>
              {/if}
            </div>
            <div class="chip color-position">
              <input type="range" bind:value="{stop.position2}" style="accent-color: {stop.position2 === null ? 'gray' : 'auto'}">
              {#if stop.position2 != null}
                <button class="remove container-absolute" type="reset" on:click={() => removePositionByIndex(i, 2)}>✕</button>
              {/if}
            </div>
          </div>
        </fieldset>
      {/if}
      {#if stop.kind === 'hint'}
        <fieldset>
          <legend>Easing</legend>
          <div class="color-hint">
            <input type="range" bind:value="{stop.percentage}" style="background: linear-gradient(to right in {$gradient_space}, {$gradient_stops[i-1]?.color}, {$gradient_stops[i+1]?.color})">
          </div>
          <button class="remove container-absolute" type="reset" on:click={() => removeStopByIndex(i)}>✕</button>
        </fieldset>
      {/if}
    {/each}

    <button class="add-color" on:click={() => addStop()}>Add a color</button>

  </div>
</div>

<style>
  /* todo @property */
	.gradient {
		display: grid;
    gap: var(--size-3);
    padding-block: var(--size-3);
	}

  .controls {
    display: flex;
    flex-flow: row wrap;
    align-items: start;
    gap: var(--size-3);
    padding-inline: var(--size-3);
  }

  input[readonly] {
    text-align: center;
  }

  fieldset, 
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

  :global(.chip) {
    background: var(--surface-2);
    border-radius: var(--radius-round);
    display: inline-flex;
    place-items: center;
    gap: var(--size-2);
    padding-block: var(--size-1);
    padding-inline: var(--size-2);
  }

  .color-stop {
    padding-inline-end: var(--size-3);
  }

  input[type="color"].round {
    inline-size: 2ch;
    block-size: 2ch;
    border-radius: var(--radius-round);
    padding: 0;
  }

  input[type="color"].round::-webkit-color-swatch-wrapper {
    padding: 0;
    clip-path: circle(50%);
  }

  input[type="color"].round::-webkit-color-swatch {
    border: none;
  }

  .color-hint > input {
    appearance: none;
    accent-color: var(--surface-1);
    border-radius: var(--radius-round);
    block-size: 1rem;
  }

  .color-hint > input::-webkit-slider-thumb {
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
  
  .color-hint > input:active::-webkit-slider-thumb {
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
    transition: opacity .2s var(--ease-3);
  }

  fieldset:not(:hover, :focus-within) .remove {
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
