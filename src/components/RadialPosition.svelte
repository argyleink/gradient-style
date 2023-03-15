<script>
  import {gradient_positions} from '../store/gradient.ts'
  import {radial_position, radial_named_position} from '../store/radial.ts'
  import RangeSlider from './RangeSlider.svelte'

  function removeRadialPositions() {
    $radial_position.x = null
    $radial_position.y = null
  }

  function ensureRadialPair() {
    if ($radial_position.y !== null && $radial_position.x === null)
      $radial_position.x = 50
  }
</script>

<fieldset class="control-set">
  <div class="label-select-combo">
    <label>Position</label>
    <select name="radial-position" bind:value={$radial_named_position} disabled={$radial_position.x !== null}>
      {#each gradient_positions as pos}
        <option value={pos}>{pos}</option>  
      {/each}
    </select>
  </div>
  <div class="stack">
    <div class="radial-position slider-set">
      <span>X</span>
      <RangeSlider 
        bind:value={$radial_position.x} 
        min="-100" max="200" 
        step="1" 
        emptytrack 
      />
      <input type="number" bind:value={$radial_position.x} min="-100" max="200" step="1"  class="slider-percentage">
    </div>
    <div class="radial-position slider-set">
      <span>Y</span>
      <RangeSlider 
        bind:value={$radial_position.y} 
        min="-100" max="200" 
        step="1" 
        emptytrack 
        on:input={ensureRadialPair}
      />
      <input type="number" bind:value={$radial_position.y} min="-100" max="200" step="1" on:input={ensureRadialPair} class="slider-percentage">
    </div>
    {#if $radial_position.y != null}
      <button class="remove" type="reset" on:click={() => removeRadialPositions()}>Reset</button>
    {/if}
  </div>
</fieldset>