<script>
  import {conic_angle} from '../store/conic.ts'
  import AngleIcon from './AngleIcon.svelte'
  import RangeSlider from './RangeSlider.svelte'
</script>

<fieldset class="control-set">
  <label>Angle</label>
  <div class="linear-angle slider-set">
    <AngleIcon angle={$conic_angle} />
    <RangeSlider bind:value={$conic_angle} min="0" max="360" step="1" style="--accent-color: var(--link);" />
    <div class="input-suffix">
      <input type="number" bind:value={$conic_angle} min="0" max="360" step="1"  class="slider-percentage">
      <sup>°</sup>
    </div>
  </div>
</fieldset>