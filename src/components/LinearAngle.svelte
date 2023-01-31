<script>
  import {linear_angle, linear_named_angle} from '../store/linear.ts'

  const linear_directions = [
    'to right',
    'to bottom right',
    'to bottom',
    'to bottom left',
    'to left',
    'to top left',
    'to top',
    'to top right',
  ]
</script>

<fieldset class="stack">
  <legend>Angle</legend>
  <select name="named-directions" bind:value={$linear_named_angle} disabled={$linear_angle !== null}>
    {#each linear_directions as dir}
      <option value={dir}>{dir}</option>  
    {/each}
  </select>
  <div class="chip linear-angle">
    <input type="range" bind:value={$linear_angle} min="0" max="360" step="1" style="accent-color: {$linear_angle === null ? 'gray' : 'inherit'}" />
    {#if $linear_angle != null}
      <button class="remove container-absolute" type="reset" on:click={() => $linear_angle = null}>✕</button>
    {/if}
  </div>
</fieldset>

<style>

</style>