<script>
  import {linear_angle, linear_named_angle} from '../store/linear.ts'
  import AngleIcon from './AngleIcon.svelte'

  const linear_directions = [
    '--',
    'to right',
    'to left',
    'to bottom right',
    'to bottom',
    'to bottom left',
    'to top right',
    'to top',
    'to top left',
  ]

  function blurNamedAngle() {
    $linear_named_angle = '--'
  }
</script>

<fieldset class="stack control-set">
  <legend>Angle</legend>
  <select name="named-directions" bind:value={$linear_named_angle}>
    {#each linear_directions as dir}
      <option value={dir}>{dir}</option>  
    {/each}
  </select>
  <div class="linear-angle slider-set">
    <input on:input={blurNamedAngle} type="range" bind:value={$linear_angle} min="0" max="360" step="1" style="accent-color: {$linear_angle === null ? 'var(--gray-5)' : 'inherit'}" />
    <AngleIcon angle={$linear_angle} />
    <input type="number" bind:value={$linear_angle} min="0" max="360" step="1"  class="slider-percentage">
  </div>
</fieldset>