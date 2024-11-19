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
  import Hint from './Hint.svelte'

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

<section class="gradient-stops">
  {#each $gradient_stops as stop, i (stop)}
    <div in:fade="{{duration: 450}}" out:scale animate:flip="{{duration: 350, delay: 120}}">
    {#if stop.kind === 'stop'}
      <fieldset
        style="accent-color: {stop.color}; --brand: {stop.color}"
        class="stop control-set"
        onmouseenter={() => fieldsetInteractingStart(stop)}
        onfocusin={() => fieldsetInteractingStart(stop)}
        onmouseleave={() => fieldsetInteractingEnd()}
        onfocusout={() => fieldsetInteractingEnd()}
        oninput={(e) => slidingPosition(e, stop)}
      >
        <h4>Color {i}</h4>
        {#if i === 0}
          <Hint title="Color stop" copy="The color and position of that color on the gradient line.<br><br>The three dot menu has actions you can take on the color, like duplicate or delete.<br><br>You can also delete a stop by double clicking it on the gradient line.<br><br>A color is not required in CSS to only be at a single position on the line, it may span the line by specifying a 2nd position." />
        {/if}
        <div class="chip color-stop" use:tooltip={{content: 'Gamut: '+ whatsTheGamutDamnit(stop.color), placement: 'top-start',}}>
          <button class="round" style="background-color: {stop.color}" onclick={e => pickColor(stop,e)}></button>
          <input type="text" class="color-string" style="caret-color: {stop.color}" bind:value={stop.color}/>
        </div>
        <div class="positions-pair">
          <button class="linked round" use:tooltip={{html: true, content: '<span class="rich-tooltip wide">A color can be a point in the line or span a chunk of it. Use the 2nd slider to span an area.<br><br>The sliders are 0 - 100% but you can manually input values beyond this.<br><br>Click to relink positions.</span>', placement: 'top-start',}} onclick={() => stop.position2 = stop.position1}>
            {#if stop.position1 === stop.position2}
              <svg class="linked-on" width="32" height="32" viewBox="0 0 24 24">
                <path fill="currentColor" d="M7 17q-2.075 0-3.538-1.463T2 12q0-2.075 1.463-3.538T7 7h3q.425 0 .713.288T11 8q0 .425-.288.713T10 9H7q-1.25 0-2.125.875T4 12q0 1.25.875 2.125T7 15h3q.425 0 .713.288T11 16q0 .425-.288.713T10 17H7Zm2-4q-.425 0-.713-.288T8 12q0-.425.288-.713T9 11h6q.425 0 .713.288T16 12q0 .425-.288.713T15 13H9Zm5 4q-.425 0-.713-.288T13 16q0-.425.288-.713T14 15h3q1.25 0 2.125-.875T20 12q0-1.25-.875-2.125T17 9h-3q-.425 0-.713-.288T13 8q0-.425.288-.713T14 7h3q2.075 0 3.538 1.463T22 12q0 2.075-1.463 3.538T17 17h-3Z"/>
              </svg>
            {:else}
              <svg class="linked-off" width="32" height="32" viewBox="0 0 24 24">
                <path fill="currentColor" d="m15.825 13l-2-2h2q.425 0 .713.288t.287.712q0 .425-.288.713t-.712.287Zm3.425 3.45l-1.5-1.55q.975-.275 1.613-1.063T20 12q0-1.25-.875-2.125T17 9h-3q-.425 0-.713-.288T13 8q0-.425.288-.713T14 7h3q2.075 0 3.538 1.438T22 12q0 1.425-.75 2.638t-2 1.812Zm-.15 5.45l-17-17q-.275-.275-.275-.7t.275-.7q.275-.275.7-.275t.7.275l17 17q.275.275.275.7t-.275.7q-.275.275-.7.275t-.7-.275ZM10 17H7q-2.075 0-3.538-1.463T2 12q0-1.75 1.063-3.088T5.75 7.15L7.6 9H7q-1.25 0-2.125.875T4 12q0 1.25.875 2.125T7 15h3q.425 0 .713.288T11 16q0 .425-.288.713T10 17Zm1.6-4H8.175q-.425 0-.713-.288T7.176 12q0-.425.288-.713T8.175 11h1.45l1.975 2Z"/>
              </svg>
            {/if}
          </button>
          <div class="stack">
            <div class="color-position slider-set">
              <RangeSlider bind:value={stop.position1} style="--accent-color: {stop.position1 === null ? 'var(--track-color)' : stop.color};"/>
              <div class="input-suffix">
                <input type="number" bind:value={stop.position1} class="slider-percentage">
                <sup>%</sup>
              </div>
            </div>
            <div class="color-position slider-set">
              <RangeSlider bind:value={stop.position2} style="--accent-color: {stop.position1 === stop.position2 ? 'var(--track-color)' : stop.color};"/>
              <div class="input-suffix">
                <input type="number" bind:value={stop.position2} class="slider-percentage">
                <sup>%</sup>
              </div>
            </div>
          </div>
        </div>
        <button class="stop-actions" use:tooltip={{content: "Actions", delay: [1000, 0], offset: 15}}>
          <select tabindex="-1" onchange={(e) => colorAction(e,i)}>
            <option disabled selected>Color Actions</option>
            <hr>
            <option>Duplicate</option>
            <option>Copy CSS color</option>
            <option>Random color</option>
            <hr>
            <option>Reset</option>
            <option disabled={$gradient_stops.length == 1}>Remove</option>
          </select>
        </button>
      </fieldset>
    {/if}
    {#if stop.kind === 'hint'}
      <fieldset
        class="hint control-set"
        onmouseenter={() => fieldsetInteractingStart(stop)}
        onfocusin={() => fieldsetInteractingStart(stop)}
        onmouseleave={() => fieldsetInteractingEnd()}
        onfocusout={() => fieldsetInteractingEnd()}
        oninput={() => fixIfEmptied(stop)}
      >
        <h4>Transition</h4>
        <div class="color-hint slider-set">
          {#if i === 1}
            <Hint title="Transition hint" copy="This adjusts the midpoint between these 2 color stops. Changing it is similar to changing easings.<br><br>It can also be used to create hard lines between colors." />
          {/if}
          <div use:tooltip={{html: true, content: '<span class="rich-tooltip">Transition hint<br>Adjusts the midpoint between 2 stops.<br><br>Delete value to reset.</span>', placement: 'top-start',}}>
            <svg width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M15 2c1.94 0 3.59.7 4.95 2.05C21.3 5.41 22 7.06 22 9c0 1.56-.5 2.96-1.42 4.2c-.94 1.23-2.14 2.07-3.61 2.5l.03-.32V15c0-2.19-.77-4.07-2.35-5.65S11.19 7 9 7h-.37l-.33.03c.43-1.47 1.27-2.67 2.5-3.61C12.04 2.5 13.44 2 15 2M9 8a7 7 0 0 1 7 7a7 7 0 0 1-7 7a7 7 0 0 1-7-7a7 7 0 0 1 7-7m0 2a5 5 0 0 0-5 5a5 5 0 0 0 5 5a5 5 0 0 0 5-5a5 5 0 0 0-5-5Z"/></svg>
          </div>
          <RangeSlider bind:value={stop.percentage}
            style="--accent-color: {stop.percentage == stop.auto ? 'var(--track-color)' : 'var(--link)'}"/>
          <div class="input-suffix">
            <input type="number" placeholder={stop.auto} bind:value={stop.percentage} class="slider-percentage">
            <sup>%</sup>
          </div>
        </div>
      </fieldset>
    {/if}
    </div>
  {/each}
</section>

<style>
  .gradient-stops {
    margin-block-start: var(--size-4);
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

  .stop-actions > select {
    --icon-arrow-down: url(https://api.iconify.design/mdi:dots-vertical.svg?color=%23adb5bd);
    --icon-arrow-up: url(https://api.iconify.design/mdi:dots-vertical.svg?color=%23adb5bd);
    position: absolute;
    inset-inline-end: -1.1ch;
  }

  .chip {
    display: flex;
    place-items: center start;
    gap: var(--size-2);
  }

  .round {
    inline-size: var(--size-4);
    block-size: var(--size-4);
    border-radius: var(--radius-round);
    padding: 0;
    flex-shrink: 0;
    border: none;
    box-shadow: var(--inner-shadow-0), 0 0 0 var(--_highlight-size) var(--_highlight);
    outline-offset: 4px;
  }

  .color-string {
    background: #0000;
    padding: 0;
    max-inline-size: calc(100% - var(--size-4));
    overflow-x: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .color-string:focus {
    outline: none;
  }

  .chip.color-stop::after {
    opacity: 0;
    content: url(https://api.iconify.design/material-symbols:edit.svg?color=%23ffffff);
    block-size: 20px;
    right: var(--size-8);
    position: absolute;
    transition: opacity .3s var(--ease-3);
  }

  .chip.color-stop:is(:global(:hover, :focus))::after {
    opacity: 1;
  }

  @media (prefers-color-scheme: light) {
    .chip.color-stop::after {
      content: url(https://api.iconify.design/material-symbols:edit.svg?color=%23111111);
    }
  }

  .color-position > :global(input[type="range"]) {
    --track-color: var(--surface-2);
  }

  .color-hint {
    margin-inline: var(--size-2)
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

  .positions-pair {
    display: flex;
    align-items: center;
    gap: var(--size-2);
  }

  .linked {
    --_ink-shadow: none;
    rotate: .75turn;
    box-shadow: 0 0 0 var(--_highlight-size) var(--_highlight);
  }

  .linked > * {
    grid-area: 1 / 1;
  }

  .linked-off {
    color: var(--surface-4);
  }

  .positions-pair > .stack {
    flex: 2;
  }
</style>
