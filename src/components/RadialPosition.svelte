<script>
  import {gradient_positions} from '../store/gradient.ts'
  import {radial_position, radial_named_position} from '../store/radial.ts'
  import {namedPosToPercent} from '../utils/radial.ts'

  import RangeSlider from './RangeSlider.svelte'
  import NamedDirections from './NamedDirections.svelte'

  radial_named_position.subscribe(value => {
    if (value === '--') return
    const {x,y} = namedPosToPercent(value)
    $radial_position.x = x
    $radial_position.y = y
  })

  function resetNamedPosition() {
    if ($radial_named_position !== '--')
      $radial_named_position = '--'
  }

  function ensureRadialPair() {
    if ($radial_position.y !== null && $radial_position.x === null)
      $radial_position.x = 50
  }
</script>

<fieldset class="control-set">
  <div class="label-select-combo">
    <label>Position</label>
    <NamedDirections id="radial-position" bind:selected={$radial_named_position} mode="position" />
    <select name="radial-position" bind:value={$radial_named_position}>
      <button>
        <selectedcontent></selectedcontent>
      </button>
      <option disabled>--</option>
      {#each gradient_positions as pos}
        <option value={pos}>{pos}</option>  
      {/each}
    </select>
  </div>
  <div class="stack">
    <div class="radial-position slider-set">
      <label>X</label>
      <RangeSlider 
        bind:value={$radial_position.x} 
        min="-100" max="200" 
        step="1" 
        emptytrack 
        on:change={resetNamedPosition}
      />
      <div class="input-suffix">
        <input type="number" bind:value={$radial_position.x} min="-100" max="200" step="1"  class="slider-percentage">
        <sup>%</sup>
      </div>
    </div>
    <div class="radial-position slider-set">
      <label>Y</label>
      <RangeSlider 
        bind:value={$radial_position.y} 
        min="-100" max="200" 
        step="1" 
        emptytrack 
        on:change={() => {
          ensureRadialPair()
          resetNamedPosition()
        }}
      />
      <div class="input-suffix">
        <input type="number" bind:value={$radial_position.y} min="-100" max="200" step="1" oninput={ensureRadialPair} class="slider-percentage">
        <sup>%</sup>
      </div>
    </div>
  </div>
</fieldset>