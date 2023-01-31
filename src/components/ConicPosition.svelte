<script>
  import {gradient_positions} from '../store/gradient.ts'
  import {conic_position, conic_named_position} from '../store/conic.ts'

  function removeConicPositions() {
    $conic_position.x = null
    $conic_position.y = null
  }
</script>

<fieldset>
  <legend>Position</legend>
  <select name="conic-position" bind:value={$conic_named_position} disabled={$conic_position.x !== null}>
    {#each gradient_positions as pos}
      <option value={pos}>{pos}</option>  
    {/each}
  </select>
  <div class="stack">
    <div class="chip conic-position">
      <input type="range" bind:value={$conic_position.x} min="-100" max="200" step="1" style="accent-color: {$conic_position.x === null ? 'gray' : 'inherit'}" />
      {#if $conic_position.x != null}
        <button class="remove container-absolute" type="reset" on:click={() => removeConicPositions()}>✕</button>
      {/if}
    </div>
    <div class="chip conic-position">
      <input type="range" bind:value={$conic_position.y} min="-100" max="200" step="1" style="accent-color: {$conic_position.y === null ? 'gray' : 'inherit'}" />
      {#if $conic_position.y != null}
        <button class="remove container-absolute" type="reset" on:click={() => removeConicPositions()}>✕</button>
      {/if}
    </div>
  </div>
</fieldset>