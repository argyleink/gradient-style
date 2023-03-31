<script>
  import {gradient_positions} from '../store/gradient.ts'
  import {conic_position, conic_named_position} from '../store/conic.ts'
  import RangeSlider from './RangeSlider.svelte'
  import NamedDirections from './NamedDirections.svelte'

  function removeConicPositions() {
    $conic_position.x = null
    $conic_position.y = null
  }

  function resetNamedPosition() {
    if ($conic_named_position !== '--')
      $conic_named_position = '--'
  }

  function ensurePositionPair() {
    if ($conic_position.y !== null && $conic_position.x === null)
      $conic_position.x = 50
  }
</script>

<fieldset class="control-set">
  <div class="label-select-combo">
    <label>Position</label>
    <NamedDirections id="conic-position" bind:selected={$conic_named_position} mode="position" on:change={removeConicPositions} />
    <select name="conic-position" bind:value={$conic_named_position} on:change={removeConicPositions}>
      <option disabled>--</option>
      {#each gradient_positions as pos}
        <option value={pos}>{pos}</option>  
      {/each}
    </select>
  </div>
  <div class="stack">
    <div class="conic-position slider-set">
      <label>X</label>
      <RangeSlider bind:value={$conic_position.x} min="-100" max="200" step="1" emptytrack="true" on:change={resetNamedPosition} />
      <div class="input-suffix">
        <input type="number" bind:value={$conic_position.x} min="-100" max="200" step="1"  class="slider-percentage">
        <sup>%</sup>
      </div>
    </div>
    <div class="conic-position slider-set">
      <label>Y</label>
      <RangeSlider bind:value={$conic_position.y} min="-100" max="200" step="1" emptytrack="true" on:change={() => {
        ensurePositionPair()
        resetNamedPosition()
      }} />
      <div class="input-suffix">
        <input type="number" bind:value={$conic_position.y} min="-100" max="200" step="1" class="slider-percentage" on:change={ensurePositionPair}>
        <sup>%</sup>
      </div>
    </div>
  </div>
</fieldset>