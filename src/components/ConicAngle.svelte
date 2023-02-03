<script>
  import {conic_angle} from '../store/conic.ts'
  import AngleIcon from './AngleIcon.svelte'
</script>

<fieldset>
  <legend>Angle</legend>
  <div class="linear-angle slider-set">
    <input type="range" bind:value={$conic_angle} min="0" max="360" step="1" />
    <AngleIcon angle={$conic_angle} />
    {#if $conic_angle != null}
      <button class="remove container-absolute" type="reset" on:click={() => $conic_angle = 0}>✕</button>
    {/if}
  </div>
</fieldset>