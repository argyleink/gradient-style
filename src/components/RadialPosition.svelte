<script>
  import {gradient_positions} from '../store/gradient.ts'
  import {radial_position, radial_named_position} from '../store/radial.ts'

  function removeRadialPositions() {
    $radial_position.x = null
    $radial_position.y = null
  }

  function ensureRadialPair() {
    if ($radial_position.y !== null && $radial_position.x === null)
      $radial_position.x = 50
  }
</script>

<fieldset class="control-set">
  <legend>Position</legend>
  <select name="radial-position" bind:value={$radial_named_position} disabled={$radial_position.x !== null}>
    {#each gradient_positions as pos}
      <option value={pos}>{pos}</option>  
    {/each}
  </select>
  <div class="stack">
    <div class="radial-position slider-set">
      <input 
        type="range"
        bind:value={$radial_position.x} 
        min="-100" max="200" 
        step="1" 
        style="accent-color: {$radial_position.x === null ? 'var(--gray-6)' : 'inherit'}" 
      />
      <input type="number" bind:value={$radial_position.x} min="-100" max="200" step="1"  class="slider-percentage">
    </div>
    <div class="radial-position slider-set">
      <input 
        type="range"
        bind:value={$radial_position.y} 
        min="-100" max="200" 
        step="1" 
        style="accent-color: {$radial_position.y === null ? 'var(--gray-6)' : 'inherit'}" 
        on:input={ensureRadialPair}
      />
      <input type="number" bind:value={$radial_position.y} min="-100" max="200" step="1" on:input={ensureRadialPair} class="slider-percentage">
    </div>
    {#if $radial_position.y != null}
      <button class="remove container-absolute" type="reset" on:click={() => removeRadialPositions()}>✕</button>
    {/if}
  </div>
</fieldset>