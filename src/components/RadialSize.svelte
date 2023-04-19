<script>
  import {radial_size, radial_shape} from '../store/radial.ts'

  radial_shape.subscribe(state => {
    const pair = $radial_size.split(' ')
    if (state === 'circle' && pair.length === 2) {
      $radial_size = pair[0]
    }
    else if (state === 'ellipse' && pair.length === 1) {
      $radial_size = pair[0] + ' 300px'
    }
  })

  const circle_sizes = {
    'Default': ['farthest-corner'],
    'Special Angles': ['closest-side', 'closest-corner', 'farthest-side'],
    'Lengths': ['50px', '200px', '500px'],
  }

  const ellipse_sizes = {
    'Default': ['farthest-corner'],
    'Special Angles': ['closest-side', 'closest-corner', 'farthest-side'],
    'Lengths': ['50px 300px', '200px 300px', '500px 300px'],
  }

  function getSizes() {
    return $radial_shape === 'circle'
      ? circle_sizes
      : ellipse_sizes
  }
</script>

<fieldset class="control-set">
  <div class="label-select-combo">
    <label>Size</label>
    <select name="radial-size" bind:value={$radial_size}>
      {#each Object.entries(getSizes($radial_shape)) as [key, val]}
        <optgroup label={key}>
          {#each val as entry}
            <option value={entry}>{entry}</option>  
          {/each}
        </optgroup>
      {/each}
    </select>
  </div>
</fieldset>