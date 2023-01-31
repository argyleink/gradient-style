<script>
  import {conic_angle} from '../store/conic.ts'
</script>

<fieldset>
  <legend>Angle</legend>
  <input type="range" bind:value={$conic_angle} min="0" max="360" step="1" />
</fieldset>