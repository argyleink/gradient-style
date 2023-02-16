<script>
  import {conic_angle} from '../store/conic.ts'
  import AngleIcon from './AngleIcon.svelte'
</script>

<fieldset class="control-set">
  <legend>Angle</legend>
  <div class="linear-angle slider-set">
    <input type="range" bind:value={$conic_angle} min="0" max="360" step="1" />
    <AngleIcon angle={$conic_angle} />
    <input type="number" bind:value={$conic_angle} min="0" max="360" step="1"  class="slider-percentage">
  </div>
</fieldset>