<script>
  import {flip} from 'svelte/animate'
  import {fade} from 'svelte/transition'

  import {gradient_stops, gradient_space, active_stop_index} from '../store/gradient.ts'
  import {picker_value} from '../store/colorpicker.ts'
  import {updateStops} from '../utils/stops.ts'

  function colorAction(event, position) {
    switch (event.target.value) {
      case 'Remove':
        removeStop(position)
        break
      case 'Reset':
        // resetStop(position)
        break
      case 'Duplicate':
        dupeStop(position)
        break
      case 'Copy CSS color':
        // copyStopColor(position)
        break
    }

    // reset
    event.target.selectedIndex = 0
  }

  function removeStop(pos) {
    $gradient_stops.splice(pos, 2)

    if ($gradient_stops.length === pos) {
      $gradient_stops.pop()
    }
    
    if ($gradient_stops.length === 1) {
      $gradient_stops[0].position1 = 0
      $gradient_stops[0].position2 = 0
    }

    $gradient_stops = updateStops($gradient_stops)
  }

  function dupeStop(pos) {
    const clone = {
      kind: 'stop', 
      color: $gradient_stops[pos].color, 
      position1: $gradient_stops[pos].position1, 
      position2: $gradient_stops[pos].position2,
    }

    $gradient_stops.splice(pos, 0, {kind: 'hint', percentage: null})
    $gradient_stops.splice(pos, 0, clone)

    $gradient_stops = updateStops($gradient_stops)
  }

  function removePositionByIndex(index, pos) {
    $gradient_stops[index]['position'+pos] = null

    // spec fix, cant have 2nd position without the 1st one
    if (pos === 1 && $gradient_stops[index].position2 !== null)
      $gradient_stops[index]['position2'] = null      
  }

  function pickColor(stop, e) {
    const picker = document.getElementById('color-picker')

    picker.setAnchor(e.target, 'right-panel')
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

  function fieldsetInteractingStart(stop) {
    $active_stop_index = $gradient_stops.indexOf(stop)
  }

  function fieldsetInteractingEnd(stop) {
    $active_stop_index = null
  }
</script>

{#each $gradient_stops as stop, i (stop)}
  <div in:fade="{{duration: 250}}" animate:flip="{{duration: 180}}">
  {#if stop.kind === 'stop'}
    <fieldset 
      style="accent-color: {stop.color}" 
      class="stop control-set"
      on:mouseenter={() => fieldsetInteractingStart(stop)} 
      on:focusin={() => fieldsetInteractingStart(stop)} 
      on:mouseleave={() => fieldsetInteractingEnd()} 
      on:focusout={() => fieldsetInteractingEnd()}
    >
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
        <button class="stop-actions">
          <select on:change={(e) => colorAction(e,i)}>
            <option>Color Actions</option>
            <option disabled>--</option>
            <option>Duplicate</option>
            <option disabled>Pick new color</option>
            <option disabled>Copy CSS color</option>
            <option disabled>Random color</option>
            <option disabled>--</option>
            <option disabled>Reset</option>
            <option>Remove</option>
          </select>
        </button>
      {/if}
    </fieldset>
  {/if}
  {#if stop.kind === 'hint'}
    <fieldset
      class="hint control-set" 
      on:mouseenter={() => fieldsetInteractingStart(stop)} 
      on:focusin={() => fieldsetInteractingStart(stop)} 
      on:mouseleave={() => fieldsetInteractingEnd()} 
      on:focusout={() => fieldsetInteractingEnd()}
    >
      <legend>Transition</legend>
      <div class="color-hint slider-set">
        <input 
          type="range" 
          bind:value="{stop.percentage}" 
        />
        <!-- style="background: linear-gradient(to right in {$gradient_space}, {$gradient_stops[i-1]?.color}, {$gradient_stops[i+1]?.color})" -->
        <input type="number" placeholder={stop.auto} bind:value={stop.percentage} class="slider-percentage">
      </div>
    </fieldset>
  {/if}
  </div>
{/each}

<style>
  .color-stop {
    padding-inline-end: var(--size-3);
  }

  .control-set > legend {
    block-size: 0;
    overflow: hidden;
    visibility: hidden;
  }

  .stop {
    background: var(--surface-3);
    padding-inline: var(--size-3);
    margin-inline: var(--size-3);
    border-radius: var(--radius-3);
    box-shadow: var(--shadow-2);
  }

  .stop-actions {
    position: absolute;
    inset-inline-end: var(--size-1);
    inset-block-start: var(--size-1);
    inline-size: var(--size-5);
    overflow: hidden;
    border-radius: var(--radius-round);
    padding-inline: 0;
    aspect-ratio: 1;
  }

  .stop-actions > select {
    position: absolute;
    inset-inline-end: -1.25ch;
  }

  .chip {
    display: inline-flex;
    place-items: center;
    gap: var(--size-2);
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
  }

  @media (prefers-color-scheme: light) {
    .chip {
      background: white;
    }
  }
</style>