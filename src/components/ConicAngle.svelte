<script>
  import {conic_angle} from '../store/conic.ts'
  import AngleIcon from './AngleIcon.svelte'
</script>

<fieldset>
  <legend>Angle</legend>
  <div class="chip linear-angle">
    <input type="range" bind:value={$conic_angle} min="0" max="360" step="1" />
    <AngleIcon angle={$conic_angle} />
  </div>
</fieldset>