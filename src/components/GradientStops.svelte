<script>
  import {flip} from 'svelte/animate'
  import {fade} from 'svelte/transition'

  import {gradient_stops, gradient_space, active_stop_index} from '../store/gradient.ts'
  import {picker_value} from '../store/colorpicker.ts'
  import {updateStops} from '../utils/stops.ts'
  import {copyToClipboard} from '../utils/clipboard.ts'
  import {randomNumber} from '../utils/numbers.ts'

  import RangeSlider from './RangeSlider.svelte'

  function colorAction(event, position) {
    switch (event.target.value) {
      case 'Remove':
        removeStop(position)
        break
      case 'Reset':
        $gradient_stops[position].position1 = null
        $gradient_stops[position].position2 = null
        updateStops($gradient_stops)
        break
      case 'Duplicate':
        dupeStop(position)
        break
      case 'Copy CSS color':
        copyToClipboard($gradient_stops[position].color)
        break
      case 'Random color':
        $gradient_stops[position].color = `oklch(80% 0.3 ${randomNumber(0,360)})`
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

  function fixIfEmptied(stop) {
    if (stop.percentage === null) {
      stop.percentage = stop.auto
      $gradient_stops = [...$gradient_stops]
    }
  }

  function slidingPosition(e, stop) {
    if (stop.position1 == stop.position2) {
      stop.position1 = e.target.value
      stop.position2 = e.target.value
    }
    else {
      stop.position1 = e.target.value
    }
    $gradient_stops = [...$gradient_stops]
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
      <h4>Color</h4>
      <div class="chip color-stop">
        <button class="round" style="background-color: {stop.color}" on:click={e => pickColor(stop,e)}></button>
        <span class="color-string" contenteditable="true" bind:innerHTML={stop.color} spellcheck="false">{stop.color}</span>
      </div>
      <div class="stack">
        <div class="color-position slider-set">
          <RangeSlider on:input={(e) => slidingPosition(e, stop)} bind:value={stop.position1} style="--accent-color: {stop.position1 === null ? 'var(--gray-6)' : stop.color};"/>
          <input type="number" bind:value={stop.position1} class="slider-percentage">
        </div>
        <div class="color-position slider-set">
          <RangeSlider on:input={(e) => slidingPosition(e, stop)} bind:value={stop.position2} style="--accent-color: {stop.position1 === stop.position2 ? 'var(--gray-6)' : stop.color};"/>
          <input type="number" bind:value={stop.position2} class="slider-percentage">
        </div>
      </div>
      {#if $gradient_stops.length > 1}
        <button class="stop-actions">
          <select on:change={(e) => colorAction(e,i)}>
            <option>Color Actions</option>
            <option disabled>--</option>
            <option>Duplicate</option>
            <option>Copy CSS color</option>
            <option>Random color</option>
            <option disabled>--</option>
            <option>Reset</option>
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
      on:input={() => fixIfEmptied(stop)}
    >
      <h4>Transition</h4>
      <div class="color-hint slider-set">
        <!-- <input 
          type="range" 
          bind:value="{stop.percentage}" 
          style="accent-color: {stop.percentage == stop.auto ? 'var(--gray-6)' : 'var(--link)'}"
        /> -->
        <RangeSlider bind:value={stop.percentage} 
          style="--accent-color: {stop.percentage == stop.auto ? 'var(--gray-6)' : 'var(--link)'}"/>
        <!-- style="background: linear-gradient(to right in {$gradient_space}, {$gradient_stops[i-1]?.color}, {$gradient_stops[i+1]?.color})" -->
        <input type="number" placeholder={stop.auto} bind:value={stop.percentage} class="slider-percentage">
      </div>
    </fieldset>
  {/if}
  </div>
{/each}

<style>
  .color-stop {
    padding-inline-end: var(--size-2);
  }

  .control-set > h4 {
    block-size: 0;
    position: absolute;
    overflow: clip;
    visibility: hidden;
  }

  .stop {
    background: var(--surface-3);
    padding-inline: var(--size-3);
    margin-inline: var(--size-3);
    border-radius: var(--radius-3);
    box-shadow: var(--shadow-2);
    gap: var(--size-3);
  }

  @media (prefers-color-scheme: light) {
    .stop {
      background: white;
      border: 1px solid var(--surface-2);
    }
  }

  .stop-actions {
    position: absolute;
    inset-inline-end: var(--size-3);
    inset-block-start: var(--size-3);
    inline-size: var(--size-5);
    overflow: hidden;
    border-radius: var(--radius-round);
    padding-inline: 0;
    aspect-ratio: 1;
    border: none;
    box-shadow: 0 0 0 var(--_highlight-size) var(--_highlight);
  }

  @media (prefers-color-scheme: dark) {
    .stop-actions {
      box-shadow: 0 0 0 var(--_highlight-size) var(--_highlight);
    }
  }

  .stop-actions > select {
    --icon-arrow-down: url(https://api.iconify.design/mdi:dots-vertical.svg?color=%23adb5bd);
    --icon-arrow-up: url(https://api.iconify.design/mdi:dots-vertical.svg?color=%23adb5bd);
    position: absolute;
    inset-inline-end: -1.1ch;
  }

  .chip {
    display: inline-flex;
    place-items: center;
    gap: var(--size-2);
    justify-self: start;
    border-radius: var(--radius-round);
  }

  .chip:hover {
    background: var(--surface-2);
  }

  .round {
    inline-size: 2ch;
    block-size: 2ch;
    border-radius: var(--radius-round);
    padding: 0;
    flex-shrink: 0;
    border: none;
    box-shadow: var(--inner-shadow-0), 0 0 0 var(--_highlight-size) var(--_highlight);
    outline-offset: 4px;
  }

  .color-string {
    max-inline-size: 20ch;
    overflow-x: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .color-position > :global(input[type="range"]) {
    --track-color: var(--surface-2);
  }

  @media (prefers-color-scheme: light) {
    .chip {
      background: white;
    }

    .color-hint > :global(input[type="range"]) {
      --track-color: var(--surface-3);
    }
  }
</style>