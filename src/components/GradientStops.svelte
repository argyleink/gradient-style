<script>
  import {gradient_stops, gradient_space} from '../store/gradient.ts'

  function removeStopByIndex(pos) {
    $gradient_stops = $gradient_stops.filter((item, i) => i !== pos)
  }

  function removePositionByIndex(index, pos) {
    $gradient_stops[index]['position'+pos] = null

    // spec fix, cant have 2nd position without the 1st one
    if (pos === 1 && $gradient_stops[index].position2 !== null)
      $gradient_stops[index]['position2'] = null      
  }
</script>

{#each $gradient_stops as stop, i}
  {#if stop.kind === 'stop'}
    <fieldset style="accent-color: {stop.color}">
      <legend>Color</legend>
      <div class="chip color-stop">
        <input class="round" type="color" bind:value="{stop.color}">
        <span>{stop.color}</span>
        <button class="remove container-absolute" type="reset" on:click={() => removeStopByIndex(i)}>✕</button>
      </div>
      <div class="stack">
        <div class="chip color-position">
          <input type="range" bind:value="{stop.position1}" style="accent-color: {stop.position1 === null ? 'gray' : stop.color}">
          {#if stop.position1 != null}
            <button class="remove container-absolute" type="reset" on:click={() => removePositionByIndex(i, 1)}>✕</button>
          {/if}
        </div>
        <div class="chip color-position">
          <input type="range" bind:value="{stop.position2}" style="accent-color: {stop.position2 === null ? 'gray' : 'auto'}">
          {#if stop.position2 != null}
            <button class="remove container-absolute" type="reset" on:click={() => removePositionByIndex(i, 2)}>✕</button>
          {/if}
        </div>
      </div>
    </fieldset>
  {/if}
  {#if stop.kind === 'hint'}
    <fieldset>
      <legend>Easing</legend>
      <div class="color-hint">
        <input 
          type="range" 
          bind:value="{stop.percentage}" 
          style="background: linear-gradient(to right in {$gradient_space}, {$gradient_stops[i-1]?.color}, {$gradient_stops[i+1]?.color})"
        />
      </div>
      <button class="remove container-absolute" type="reset" on:click={() => removeStopByIndex(i)}>✕</button>
    </fieldset>
  {/if}
{/each}

<style>
  .color-stop {
    padding-inline-end: var(--size-3);
  }
</style>