<script>
  import {radial_size, radial_shape} from '../store/radial.ts'

  radial_shape.subscribe(state => {
    const current = $radial_size
    const parts = (current || '').split(/\s+/)

    const KEYWORDS = ['closest-side', 'closest-corner', 'farthest-side', 'farthest-corner']
    const isKeyword = (v) => KEYWORDS.includes(v)
    const isPx = (v) => /^\d+px$/.test((v || '').trim())

    if (state === 'ellipse') {
      // Keep keywords as-is; ensure two px values for lengths
      if (isKeyword(current)) return
      if (parts.length === 2 && isPx(parts[0]) && isPx(parts[1])) return
      if (isPx(current)) {
        $radial_size = `${current.trim()} 300px`
      }
      else if (!current) {
        $radial_size = '500px 300px'
      }
      else {
        $radial_size = '500px 300px'
      }
    }
    else if (state === 'circle') {
      // Keep keywords as-is; collapse two px values to the first
      if (isKeyword(current)) return
      if (parts.length === 2 && isPx(parts[0]) && isPx(parts[1])) {
        $radial_size = parts[0]
      }
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

  function optionExists(val) {
    if (!val) return false
    const sizes = getSizes()
    for (const [, list] of Object.entries(sizes)) {
      if (list.includes(val)) return true
    }
    return false
  }
</script>

<fieldset class="control-set">
  <div class="label-select-combo">
    <label>Size</label>
    <select name="radial-size" bind:value={$radial_size}>
      <button>
        <selectedcontent></selectedcontent>
      </button>
      {#if !optionExists($radial_size)}
        <option value={$radial_size}>{$radial_size}</option>
      {/if}
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