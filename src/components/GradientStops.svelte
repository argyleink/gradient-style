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
      </div>
      <div class="stack">
        <div class="color-position slider-set">
          <input type="range" bind:value="{stop.position1}" style="accent-color: {stop.position1 === null ? 'gray' : stop.color}">
          <input type="number" bind:value={stop.position1} class="slider-percentage">
        </div>
        <div class="color-position slider-set">
          <input type="range" bind:value="{stop.position2}" style="accent-color: {stop.position2 === null ? 'gray' : 'auto'}">
          <input type="number" bind:value={stop.position2} class="slider-percentage">
        </div>
      </div>
      <button class="remove container-absolute" type="reset" on:click={() => removeStopByIndex(i)}>✕</button>
    </fieldset>
  {/if}
  {#if stop.kind === 'hint'}
    <fieldset>
      <legend>Easing</legend>
      <div class="color-hint slider-set">
        <input 
          type="range" 
          bind:value="{stop.percentage}" 
          style="background: linear-gradient(to right in {$gradient_space}, {$gradient_stops[i-1]?.color}, {$gradient_stops[i+1]?.color})"
        />
        <input type="number" bind:value={stop.percentage} class="slider-percentage">
      </div>
      <button class="remove container-absolute" type="reset" on:click={() => removeStopByIndex(i)}>✕</button>
    </fieldset>
  {/if}
{/each}

<style>
  .color-stop {
    padding-inline-end: var(--size-3);
  }

  .color-hint > input[type="range"] {
    appearance: none;
    accent-color: var(--surface-1);
    border-radius: var(--radius-round);
    block-size: 1rem;
  }

  .color-hint > input[type="range"]::-webkit-slider-thumb {
    --_border-size: 4px;
    
    cursor: grab;
    appearance: none;
    accent-color: var(--surface-1);
    border: 4px solid white;
    height: calc(1rem + (var(--_border-size) * 2));
    aspect-ratio: 1;
    border-radius: var(--radius-round);
    box-shadow: var(--shadow-2), var(--inner-shadow-2);
  }
  
  .color-hint > input[type="range"]:active::-webkit-slider-thumb {
    cursor: grabbing;
  }
</style>