<script>
  import {
    gradient_type, 
    gradient_angle, 
    gradient_space, 
    gradient_stops
  } from '../store.ts'

  const gradient_types = ['linear','radial','conic']

  const gradient_directions = [
    'to right',
    'to bottom',
    'to bottom right',
    'to bottom left',
    'to left',
    'to top',
    'to top right',
    'to top left',
  ]

  const gensyntax = {
    'linear': () => 
      `linear-gradient(${$gradient_angle} in ${$gradient_space}, ${stopsToStrings()})`,
    'radial': () => 
      `radial-gradient(circle at center in ${$gradient_space}, ${stopsToStrings()})`,
    'conic': () => 
      `conic-gradient(in ${$gradient_space}, ${stopsToStrings()})`
  }

  function stopsToStrings() {
    return $gradient_stops
      .filter(s => s?.percentage !== '50')
      .map(s => {
        if (s.kind === 'stop') {
          return s.size
            ? s.color + ' ' + s.size
            : s.color
        }
        else if (s.kind === 'hint') {
          return s.percentage + '%'
        }
      })
      .join(', ')
  }

  $: user_gradient = gensyntax[$gradient_type](
    $gradient_angle,
    $gradient_space,
    $gradient_stops
  )
</script>

<div class="gradient">

  <!-- output -->
  <input type="text" bind:value={user_gradient} onclick="this.select()" readonly />
  <!-- modern and legacy for copy -->

  <div class="preview" style={`background:${user_gradient}`}></div>

  <!-- todo: multiple gradients -->

  <div class="controls">
    <fieldset style="accent-color: {$gradient_stops[0]}">
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
        <select name="named-directions" bind:value={$gradient_angle}>
          {#each gradient_directions as dir}
            <option value={dir}>{dir}</option>  
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

    <!-- color stops -->
    <fieldset>
      <legend>Colors & Hints</legend>
      {#each $gradient_stops as stop}
        {#if stop.kind === 'stop'}
          <div class="chip color-stop">
            <input class="round" type="color" bind:value="{stop.color}">
            <span>{stop.color}</span>
            {#if stop.size}
              <span>{stop.size}</span>
            {/if}
          </div>
        {/if}
        {#if stop.kind === 'hint'}
          <div class="chip color-hint">
            <input type="range" bind:value="{stop.percentage}">
          </div>
        {/if}
      {/each}
    </fieldset>
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
    min-block-size: var(--size-content-1);
    animation: var(--animation-fade-out) reverse;
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
