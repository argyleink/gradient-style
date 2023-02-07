<script>
  import {gradient_stops, gradient_space} from '../store/gradient.ts'
  import {picker_value} from '../store/colorpicker.ts'

  function removeStopByIndex(pos) {
    $gradient_stops.splice(pos, 2)

    if ($gradient_stops.length === pos) {
      $gradient_stops.pop()
    }
    
    if ($gradient_stops.length === 1) {
      $gradient_stops[0].position1 = 0
      $gradient_stops[0].position2 = 0
    }

    $gradient_stops = $gradient_stops
  }

  function removePositionByIndex(index, pos) {
    $gradient_stops[index]['position'+pos] = null

    // spec fix, cant have 2nd position without the 1st one
    if (pos === 1 && $gradient_stops[index].position2 !== null)
      $gradient_stops[index]['position2'] = null      
  }

  function pickColor(stop, e) {
    const picker = document.getElementById('color-picker')

    picker.setAnchor(e.target)
    picker.setColor(stop.color)
    picker.showModal()

    const unsub = picker_value.subscribe(value => {
      stop.color = value
      $gradient_stops = [...$gradient_stops]
    })

    picker.addEventListener('closing', () => {
      unsub()
    })
  }
</script>

{#each $gradient_stops as stop, i}
  {#if stop.kind === 'stop'}
    <fieldset style="accent-color: {stop.color}">
      <legend>Color</legend>
      <div class="chip color-stop">
        <button class="round" style="background-color: {stop.color}" on:click={e => pickColor(stop,e)}></button>
        <span class="color-string">{stop.color}</span>
      </div>
      <div class="stack">
        <div class="color-position slider-set">
          <input type="range" bind:value="{stop.position1}" style="accent-color: {stop.position1 === null ? 'var(--gray-6)' : stop.color}">
          <input type="number" bind:value={stop.position1} class="slider-percentage">
        </div>
        <div class="color-position slider-set">
          <input type="range" bind:value="{stop.position2}" style="accent-color: {stop.position2 === null ? 'var(--gray-6)' : stop.color}">
          <input type="number" bind:value={stop.position2} class="slider-percentage">
        </div>
      </div>
      {#if $gradient_stops.length > 1}
        <button class="remove container-absolute" type="reset" on:click={() => removeStopByIndex(i)}>✕</button>
      {/if}
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

  .chip {
    border-radius: var(--radius-round);
    display: inline-flex;
    place-items: center;
    gap: var(--size-2);
    padding-block: var(--size-1);
    padding-inline: var(--size-2);
    box-shadow: var(--shadow-1);
    border: 1px solid var(--surface-2);
    background: var(--surface-1);
    justify-self: start;
    max-inline-size: 100%;
    overflow-x: auto;
  }

  .round {
    inline-size: 2ch;
    block-size: 2ch;
    border-radius: var(--radius-round);
    padding: 0;
    flex-shrink: 0;
    border: none;
    box-shadow: var(--inner-shadow-0);
    outline-offset: 4px;
  }

  .color-string {
    min-inline-size: max-content;
    padding-inline-end: var(--size-1);
    line-height: 1;
  }

  @media (prefers-color-scheme: light) {
    .chip {
      background: white;
    }
  }
</style>