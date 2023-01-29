<script>
  import {
    gradient_type, 
    gradient_space, 
    gradient_interpolation,
    gradient_stops,
    linear_angle, 
    radial_shape, 
    radial_position, 
    radial_size, 
    conic_angle, 
    conic_position, 
  } from '../store.ts'

  const gradient_types = ['linear','radial','conic']

  const linear_directions = [
    'to right',
    'to bottom right',
    'to bottom',
    'to bottom left',
    'to left',
    'to top left',
    'to top',
    'to top right',
  ]

  const radial_shapes = ['circle', 'ellipse']
  const radial_sizes = ['closest-side', 'closest-corner', 'farthest-side', 'farthest-corner', '250px', '50vw', '50cqi']
  const radial_positions = ['center','top','top right','right','bottom right','bottom','bottom left','left','top left']

  function isCylindricalSpace(space) {
    return ['hsl','hwb','lch','oklch'].includes(space)
  }

  const gensyntax = {
    'linear': () => 
      `linear-gradient(${$linear_angle} ${spaceToString()}, ${stopsToStrings()})`,
    'radial': () => 
      `radial-gradient(${$radial_size} ${$radial_shape} at ${$radial_position} ${spaceToString()}, ${stopsToStrings()})`,
    'conic': () => 
      `conic-gradient(from ${$conic_angle}deg at ${$conic_position} ${spaceToString()}, ${stopsToStrings()})`
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

  $: user_gradient = gensyntax[$gradient_type](
    $linear_angle,
    $gradient_space,
    $gradient_interpolation,
    $gradient_stops,
    $radial_shape,
    $radial_size,
    $radial_position,
    $conic_angle,
    $conic_position
  )
</script>

<div class="gradient">

  <!-- output -->
  <input type="text" bind:value={user_gradient} onclick="this.select()" readonly />
  <!-- modern and legacy for copy -->

  <div class="preview" style={`background:${user_gradient}`}></div>

  <!-- todo: multiple gradients -->

  <div class="controls">
    <fieldset style="accent-color: {$gradient_stops[0].color}">
      <legend>Type</legend>
      {#each gradient_types as t}
        <div class="type-switch">
          <input type="radio" name="gradient-type" id="{t}-gradient" value={t} bind:group={$gradient_type}>
          <label for="{t}-gradient">{t}</label>
        </div>
      {/each}
    </fieldset>

    {#if $gradient_type === 'linear'}
      <fieldset>
        <legend>Direction</legend>
        <select name="named-directions" bind:value={$linear_angle}>
          {#each linear_directions as dir}
            <option value={dir}>{dir}</option>  
          {/each}
        </select>
      </fieldset>
    {/if}

    {#if $gradient_type === 'radial'}
      <fieldset>
        <legend>Size</legend>
        <select name="radial-size" bind:value={$radial_size}>
          {#each radial_sizes as size}
            <option value={size}>{size}</option>  
          {/each}
        </select>
      </fieldset>
      <fieldset>
        <legend>Shape</legend>
        <select name="radial-shape" bind:value={$radial_shape}>
          {#each radial_shapes as shape}
            <option value={shape}>{shape}</option>  
          {/each}
        </select>
      </fieldset>
      <fieldset>
        <legend>Position</legend>
        <select name="radial-position" bind:value={$radial_position}>
          {#each radial_positions as pos}
            <option value={pos}>{pos}</option>  
          {/each}
        </select>
      </fieldset>
    {/if}

    {#if $gradient_type === 'conic'}
      <fieldset>
        <legend>Angle</legend>
        <input type="range" bind:value={$conic_angle} min="0" max="360" step="1" />
      </fieldset>
      <fieldset>
        <legend>Position</legend>
        <select name="conic-position" bind:value={$conic_position}>
          {#each radial_positions as pos}
            <option value={pos}>{pos}</option>  
          {/each}
        </select>
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
          <option>longer</option>
          <option>decreasing</option>
          <option>increasing</option>
        </select>
      </fieldset>
    {/if}

    <!-- color stops -->
    {#each $gradient_stops as stop}
      {#if stop.kind === 'stop'}
        <fieldset>
          <legend>Color</legend>
          <div class="chip color-stop">
            <input class="round" type="color" bind:value="{stop.color}">
            <span>{stop.color}</span>
          </div>
          {#if stop.position1 != null}
            <input type="range" bind:value="{stop.position1}">
          {/if}
          {#if stop.position2 != null}
            <input type="range" bind:value="{stop.position2}">
          {/if}
        </fieldset>
      {/if}
      {#if stop.kind === 'hint'}
        <fieldset>
          <legend>Easing</legend>
          <div class="color-hint">
            <input type="range" bind:value="{stop.percentage}">
          </div>
        </fieldset>
      {/if}
    {/each}

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

  .preview {
    block-size: var(--size-content-1);
    max-inline-size: 100vw;
    animation: var(--animation-fade-out) reverse;
    resize: both;
    overflow: hidden;
  }

  .type-switch {
    display: flex;
    align-items: center;
    gap: var(--size-2);
  }

  .chip {
    background: var(--surface-2);
    border-radius: var(--radius-round);
    display: inline-flex;
    place-items: center;
    gap: var(--size-2);
    padding-block: var(--size-1);
    padding-inline: var(--size-2) var(--size-3);
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
</style>
