<script>
  import {
    gradient_type, 
    gradient_angle, 
    gradient_space, 
    gradient_colors
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
      `linear-gradient(${$gradient_angle} in ${$gradient_space}, ${$gradient_colors.join(', ')})`,
    'radial': () => 
      `radial-gradient(circle at center in ${$gradient_space}, ${$gradient_colors.join(', ')})`,
    'conic': () => 
      `conic-gradient(in ${$gradient_space}, ${$gradient_colors.join(', ')})`
  }

  $: user_gradient = gensyntax[$gradient_type]($gradient_angle,$gradient_space,$gradient_colors)
</script>

<div class="gradient">
  <div class="preview" style={`background:${user_gradient}`}></div>

  <!-- todo: multiple gradients -->

  <div class="controls">
    <fieldset style="accent-color: {$gradient_colors[0]}">
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
      <legend>Colors</legend>
      {#each $gradient_colors as color}
        <input type="color" bind:value="{color}">  
      {/each}
      <!-- <color> <length-percentage> -->
    </fieldset>

    <!-- color hints -->
    <fieldset>
      <legend>Hints</legend>
      <input type="number" value="50">
    </fieldset>

    <!-- output -->
    <output>{user_gradient}</output>
    <!-- modern and legacy for copy -->
  </div>
</div>

<style>
  /* todo @property */
	.gradient {
		display: grid;
    gap: var(--size-3);
	}

  .controls {
    display: flex;
    flex-flow: row wrap;
    align-items: start;
    gap: var(--size-3);
    padding: var(--size-3);
  }

  output {
    max-inline-size: 100%;
    overflow: scroll;
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
</style>
