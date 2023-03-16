<script>
  import {gradient_positions} from '../store/gradient.ts'
  import {conic_position, conic_named_position} from '../store/conic.ts'
  import RangeSlider from './RangeSlider.svelte'
  import NamedDirections from './NamedDirections.svelte'

  function removeConicPositions() {
    $conic_position.x = null
    $conic_position.y = null
  }

  function ensurePositionPair() {
    if ($conic_position.y !== null && $conic_position.x === null)
      $conic_position.x = 50
  }
</script>

<fieldset class="control-set">
  <div class="label-select-combo">
    <label>Position</label>
    <NamedDirections id="conic-position" bind:selected={$conic_named_position} mode="position" />
    <select name="conic-position" bind:value={$conic_named_position} disabled={$conic_position.x !== null}>
      {#each gradient_positions as pos}
        <option value={pos}>{pos}</option>  
      {/each}
    </select>
  </div>
  <div class="stack">
    <div class="conic-position slider-set">
      <label>X</label>
      <RangeSlider bind:value={$conic_position.x} min="-100" max="200" step="1" emptytrack="true" />
      <input type="number" bind:value={$conic_position.x} min="-100" max="200" step="1"  class="slider-percentage">
    </div>
    <div class="conic-position slider-set">
      <label>Y</label>
      <RangeSlider bind:value={$conic_position.y} min="-100" max="200" step="1"  on:input={ensurePositionPair} emptytrack="true" />
      <input type="number" bind:value={$conic_position.y} min="-100" max="200" step="1" class="slider-percentage" on:input={ensurePositionPair}>
    </div>
    {#if $conic_position.y != null}
      <button class="remove" type="reset" on:click={() => removeConicPositions()}>reset</button>
    {/if}
  </div>
</fieldset>