<script>
  import {flip} from 'svelte/animate'
  import {fade,scale} from 'svelte/transition'

  import { tooltip } from 'svooltip'

  import {gradient_stops, gradient_space, active_stop_index} from '../store/gradient.ts'
  import {picker_value} from '../store/colorpicker.ts'
  import {updateStops, removeStop} from '../utils/stops.ts'
  import {copyToClipboard} from '../utils/clipboard.ts'
  import {randomNumber} from '../utils/numbers.ts'
  import {whatsTheGamutDamnit} from '../utils/colorspace.ts'

  import RangeSlider from './RangeSlider.svelte'

  function colorAction(event, position) {
    switch (event.target.value) {
      case 'Remove':
        $gradient_stops = updateStops(removeStop($gradient_stops, position))
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
    const range = [
      stop.position1 + 1,
      stop.position1 + 2,
      stop.position1 - 1,
      stop.position1 - 2,
    ]
    if (range.includes(stop.position2)) {
      stop.position2 = stop.position1
    }
    $gradient_stops = [...$gradient_stops]
  }
</script>

{#each $gradient_stops as stop, i (stop)}
  <div in:fade="{{duration: 450}}" out:scale animate:flip="{{duration: 350, delay: 120}}">
  {#if stop.kind === 'stop'}
    <fieldset 
      style="accent-color: {stop.color}" 
      class="stop control-set"
      on:mouseenter={() => fieldsetInteractingStart(stop)} 
      on:focusin={() => fieldsetInteractingStart(stop)} 
      on:mouseleave={() => fieldsetInteractingEnd()} 
      on:focusout={() => fieldsetInteractingEnd()}
      on:input={(e) => slidingPosition(e, stop)}
    >
      <h4>Color {i}</h4>
      <div class="chip color-stop" use:tooltip={{content: whatsTheGamutDamnit(stop.color), placement: 'top-start',}}>
        <button class="round" style="background-color: {stop.color}" on:click={e => pickColor(stop,e)}></button>
        <span class="color-string" contenteditable="true" bind:innerHTML={stop.color} spellcheck="false">{stop.color}</span>
      </div>
      <div class="stack">
        <div class="color-position slider-set">
          <RangeSlider bind:value={stop.position1} style="--accent-color: {stop.position1 === null ? 'var(--track-color)' : stop.color};"/>
          <input type="number" bind:value={stop.position1} class="slider-percentage">
        </div>
        <div class="color-position slider-set">
          <RangeSlider bind:value={stop.position2} style="--accent-color: {stop.position1 === stop.position2 ? 'var(--track-color)' : stop.color};"/>
          <input type="number" bind:value={stop.position2} class="slider-percentage">
        </div>
      </div>
      <button class="stop-actions" use:tooltip={{content: "Actions", delay: [1000, 0], offset: 15}}>
        <select on:change={(e) => colorAction(e,i)}>
          <option>Color Actions</option>
          <option disabled>--</option>
          <option>Duplicate</option>
          <option>Copy CSS color</option>
          <option>Random color</option>
          <option disabled>--</option>
          <option>Reset</option>
          <option disabled={$gradient_stops.length == 1}>Remove</option>
        </select>
      </button>
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
        <div use:tooltip={{html: true, content: '<span class="rich-tooltip"><u>Transition Hint:</u><br>Adjusts the midpoint between 2 stops.<br><br>Delete to reset.</span>', placement: 'top-start',}}>
          <svg width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M15 2c1.94 0 3.59.7 4.95 2.05C21.3 5.41 22 7.06 22 9c0 1.56-.5 2.96-1.42 4.2c-.94 1.23-2.14 2.07-3.61 2.5l.03-.32V15c0-2.19-.77-4.07-2.35-5.65S11.19 7 9 7h-.37l-.33.03c.43-1.47 1.27-2.67 2.5-3.61C12.04 2.5 13.44 2 15 2M9 8a7 7 0 0 1 7 7a7 7 0 0 1-7 7a7 7 0 0 1-7-7a7 7 0 0 1 7-7m0 2a5 5 0 0 0-5 5a5 5 0 0 0 5 5a5 5 0 0 0 5-5a5 5 0 0 0-5-5Z"/></svg>
        </div>
        <RangeSlider bind:value={stop.percentage} 
          style="--accent-color: {stop.percentage == stop.auto ? 'var(--track-color)' : 'var(--link)'}"/>
        <input type="number" placeholder={stop.auto} bind:value={stop.percentage} class="slider-percentage">
      </div>
    </fieldset>
  {/if}
  </div>
{/each}

<style>
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
    display: grid;
    grid-template-columns: auto 1fr;
    place-items: center start;
    gap: var(--size-2);
    border-radius: var(--radius-round);
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
    max-inline-size: calc(100% - var(--size-4));
    overflow-x: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .color-string:focus {
    outline: none;
  }

  .color-position > :global(input[type="range"]) {
    --track-color: var(--surface-2);
  }

  .color-hint svg {
    color: var(--surface-4);
    inline-size: var(--size-6);
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