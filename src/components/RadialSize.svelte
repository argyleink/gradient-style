<script>
  import {radial_size} from '../store/radial.ts'

  const radial_sizes = {
    'Spec Default': ['farthest-corner'],
    'Special Angles': ['closest-side', 'closest-corner', 'farthest-side'],
    'Lengths': ['250px', '50vw', '25rem'],
  }
</script>

<fieldset class="control-set">
  <legend>Size</legend>
  <select name="radial-size" bind:value={$radial_size}>
    {#each Object.entries(radial_sizes) as [key, val]}
      <optgroup label={key}>
        {#each val as entry}
          <option value={entry}>{entry}</option>  
        {/each}
      </optgroup>
    {/each}
  </select>
</fieldset>