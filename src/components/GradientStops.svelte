<script lang="ts">
// @ts-nocheck
  import {flip} from 'svelte/animate'
  import {fade,scale} from 'svelte/transition'

  import { tooltip } from 'svooltip'

  import {gradient_stops, gradient_space, active_stop_index} from '../store/gradient'
  import {picker_value} from '../store/colorpicker'

  import {copyToClipboard} from '../utils/clipboard'
  import {randomNumber} from '../utils/numbers'
  import {whatsTheGamutDamnit} from '../utils/colorspace'

  import RangeSlider from './RangeSlider.svelte'
  import Hint from './Hint.svelte'

  type GradientStop = any

  // Drag-reorder state
  let dragging = $state(false)
  let dragStart = $state(null)       // start index of dragged unit (stop + optional hint)
  let dragLen = $state(0)            // length of dragged unit (1 or 2)
  let dropStart = $state(null)       // start index of target unit
  let dropPos = $state(null)         // 'before' | 'after'

  // ID helpers for stable keys
  function genId(prefix = 'id') {
    try { return (crypto?.randomUUID && crypto.randomUUID()) || `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}` }
    catch { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}` }
  }

  function ensureIds(list: GradientStop[]): GradientStop[] {
    return list.map(item => item?.id ? item : ({ ...item, id: genId(item.kind) }))
  }

  function colorAction(event: Event, position: number) {
    const target = event.target as HTMLSelectElement
    switch (target.value) {
      case 'Remove':
        if (colorStopCount() <= 1) break
        const newStops = [...$gradient_stops]
        newStops.splice(position, 2)
        $gradient_stops = newStops
        break
      case 'Reset':
        const resetStops = [...$gradient_stops]
        resetStops[position].position1 = undefined
        resetStops[position].position2 = undefined
        $gradient_stops = resetStops
        break
      case 'Duplicate':
        dupeStop(position)
        break
      case 'Copy CSS color':
        copyToClipboard($gradient_stops[position].color || '')
        break
      case 'Random color':
        const randomStops = [...$gradient_stops]
        randomStops[position].color = `oklch(80% 0.3 ${randomNumber(0,360)})`
        $gradient_stops = randomStops
        break
    }

    // reset
    target.selectedIndex = 0
  }

  function colorStopCount() {
    return ($gradient_stops || []).filter(s => s?.kind === 'stop').length
  }

  function dupeStop(pos: number) {
    const newStops: any[] = [...$gradient_stops]
    const clone = {
      id: genId('stop'),
      kind: 'stop',
      color: newStops[pos].color,
      position1: newStops[pos].position1,
      position2: newStops[pos].position2,
      auto: String(Number(newStops[pos].auto || 0))
    }

    newStops.splice(pos, 0, {id: genId('hint'), kind: 'hint', percentage: undefined, auto: ''})
    newStops.splice(pos, 0, clone)

    $gradient_stops = ensureIds(newStops)
  }

  function removePositionByIndex(index: number, pos: number) {
    const newStops: GradientStop[] = [...$gradient_stops]
    ;(newStops[index] as any)['position'+pos] = undefined

    // spec fix, cant have 2nd position without the 1st one
    if (pos === 1 && (newStops[index] as any).position2 !== undefined) {
      ;(newStops[index] as any)['position2'] = undefined
    }
    
    $gradient_stops = newStops
  }

  function pickColor(stop: GradientStop, e: Event) {
    const picker = document.getElementById('color-picker') as any

    // Seed the picker with the current stop color to avoid stale value flashes
    $picker_value = stop.color

    picker.setAnchor(e.target, 'right-panel')
    picker.setColor(stop.color)
    picker.showModal()

    // Ignore the initial emission from the store and only update on real changes
    let isFirst = true
    const unsub = picker_value.subscribe(value => {
      if (isFirst) { isFirst = false; return }
      if (value === stop.color) return
      stop.color = value
      $gradient_stops = [...$gradient_stops]
    })

    picker.addEventListener('closing', () => {
      unsub()
    })
  }

  function fieldsetInteractingStart(stop: GradientStop) {
    $active_stop_index = $gradient_stops.indexOf(stop)
  }

  function fieldsetInteractingEnd() {
    $active_stop_index = null
  }

  function fixIfEmptied(stop: GradientStop) {
      if (stop.percentage === null || stop.percentage === undefined) {
      stop.percentage = String(stop.auto || '')
      $gradient_stops = [...$gradient_stops]
    }
  }

  function unitBoundsForIndex(i: number) {
    // Drag units are a stop and its following hint (if present)
    const isStop = $gradient_stops[i]?.kind === 'stop'
    if (!isStop) return null
    const hasFollowingHint = $gradient_stops[i+1]?.kind === 'hint'
    return { start: i, length: hasFollowingHint ? 2 : 1 }
  }

  function beginDrag(e: DragEvent, i: number) {
    // prevent dragging from inputs/buttons
    if (e.target.closest('input, select, button')) return e.preventDefault()
    const unit = unitBoundsForIndex(i)
    if (!unit) return e.preventDefault()
    dragging = true
    dragStart = unit.start
    dragLen = unit.length
    try { e.dataTransfer.setData('text/plain', String(unit.start)) } catch {}
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragOver(e, i) {
    if (!dragging) return
    e.preventDefault()
    const target = unitBoundsForIndex(i)
    if (!target) return
    const rect = e.currentTarget.getBoundingClientRect()
    const mid = rect.top + rect.height / 2
    dropStart = target.start
    dropPos = e.clientY < mid ? 'before' : 'after'
  }

  function onDragLeave(e) {
    // keep indicator only when over a valid target
  }

  function interleaveHintsFromStops(stopsOnly) {
    const out = []
    for (let i = 0; i < stopsOnly.length; i++) {
      // Reset positions to allow updateStops to redistribute; preserve id
      const st = { ...stopsOnly[i], position1: null, position2: null }
      out.push(st)
      if (i < stopsOnly.length - 1) out.push({ id: genId('hint'), kind: 'hint', percentage: null })
    }
    return out
  }

  function performDrop(e, i) {
    if (!dragging) return
    e.preventDefault()
    const target = unitBoundsForIndex(i)
    if (!target) return

    let insertAt = target.start + (dropPos === 'after' ? target.length : 0)

    const list = [...$gradient_stops]
    const dragged = list.splice(dragStart, dragLen)

    // Adjust insert index if we removed items before it
    if (insertAt > dragStart) insertAt -= dragLen

    list.splice(insertAt, 0, ...dragged)

    // Rebuild to ensure exactly one hint between each adjacent pair of stops
    const stopsOnly = list.filter(s => s.kind === 'stop')
    const normalized = interleaveHintsFromStops(stopsOnly)

    $gradient_stops = updateStops(ensureIds(normalized))

    // reset drag state
    dragging = false
    dragStart = null
    dragLen = 0
    dropStart = null
    dropPos = null
  }

  function lastStopIndex() {
    for (let i = $gradient_stops.length - 1; i >= 0; i--) {
      if ($gradient_stops[i]?.kind === 'stop') return i
    }
    return null
  }

  function onDragOverEnd(e) {
    if (!dragging) return
    e.preventDefault()
    const last = lastStopIndex()
    if (last == null) return
    dropStart = last
    dropPos = 'after'
  }

  function dropAtEnd(e) {
    if (!dragging) return
    const last = lastStopIndex()
    if (last == null) return
    performDrop(e, last)
  }

  function endDrag() {
    dragging = false
    dragStart = null
    dragLen = 0
    dropStart = null
    dropPos = null
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
  {#each $gradient_stops as stop, i (stop.id || i)}
    <div in:fade="{{duration: 450}}" out:scale animate:flip="{{duration: 350, delay: 120}}">
    {#if stop.kind === 'stop'}
      					<fieldset
        ondragover={(e) => onDragOver(e, i)}
        ondrop={(e) => performDrop(e, i)}
        ondragend={endDrag}
        class:drop-before={dragging && dropStart === i && dropPos === 'before'}
        class:drop-after={dragging && dropStart === i && dropPos === 'after'}
        style="accent-color: {stop.color}; --brand: {stop.color}; --gs-glow-color: {stop.color}"
        class="stop control-set"
        onmouseenter={() => fieldsetInteractingStart(stop)}
        onfocusin={() => fieldsetInteractingStart(stop)}
        onmouseleave={() => fieldsetInteractingEnd()}
        onfocusout={() => fieldsetInteractingEnd()}
        oninput={(e) => slidingPosition(e, stop)}
      >
        <h4>Color {i}</h4>
        {#if i === 0}
          <Hint title="Color stop" copy="The color and position of that color on the gradient line.<br><br>The three dot menu has actions you can take on the color, like duplicate.<br><br>A color is not required in CSS to only be at a single position on the line, it may span the line by specifying a 2nd position." />
        {/if}
        <div class="chip color-stop" use:tooltip={{content: 'Gamut: '+ whatsTheGamutDamnit(stop.color), placement: 'top-start',}}>
          <button class="round" style="background-color: {stop.color}" onclick={e => pickColor(stop,e)} aria-label="Pick color"></button>
          <input type="text" class="color-string" style="caret-color: {stop.color}" bind:value={stop.color}/>
        </div>
        <div class="positions-pair">
          <button class="linked round" use:tooltip={{html: true, content: '<span class="rich-tooltip wide">A color can be a point in the line or span a chunk of it. Use the 2nd slider to span an area.<br><br>The sliders are 0 - 100% but you can manually input values beyond this.<br><br>Click to relink positions.</span>', placement: 'top-start',}} onclick={() => stop.position2 = stop.position1}>
            {#if stop.position1 === stop.position2}
              <svg class="linked-on" width="32" height="32" viewBox="0 0 24 24"
                ><path fill="currentColor" d="M7 17q-2.075 0-3.538-1.463T2 12q0-2.075 1.463-3.538T7 7h3q.425 0 .713.288T11 8q0 .425-.288.713T10 9H7q-1.25 0-2.125.875T4 12q0 1.25.875 2.125T7 15h3q.425 0 .713.288T11 16q0 .425-.288.713T10 17H7Zm2-4q-.425 0-.713-.288T8 12q0-.425.288-.713T9 11h6q.425 0 .713.288T16 12q0 .425-.288.713T15 13H9Zm5 4q-.425 0-.713-.288T13 16q0-.425.288-.713T14 15h3q1.25 0 2.125-.875T20 12q0-1.25-.875-2.125T17 9h-3q-.425 0-.713-.288T13 8q0-.425.288-.713T14 7h3q2.075 0 3.538 1.463T22 12q0 2.075-1.463 3.538T17 17h-3Z"/>
              </svg>
            {:else}
              <svg class="linked-off" width="32" height="32" viewBox="0 0 24 24"
                ><path fill="currentColor" d="m15.825 13l-2-2h2q.425 0 .713.288t.287.712q0 .425-.288.713t-.712.287Zm3.425 3.45l-1.5-1.55q.975-.275 1.613-1.063T20 12q0-1.25-.875-2.125T17 9h-3q-.425 0-.713-.288T13 8q0-.425.288-.713T14 7h3q2.075 0 3.538 1.438T22 12q0 1.425-.75 2.638t-2 1.812Zm-.15 5.45l-17-17q-.275-.275-.275-.7t.275-.7q.275-.275.7-.275t.7.275l17 17q.275.275.275.7t-.275.7q-.275.275-.7.275t-.7-.275ZM10 17H7q-2.075 0-3.538-1.463T2 12q0-1.75 1.063-3.088T5.75 7.15L7.6 9H7q-1.25 0-2.125.875T4 12q0 1.25.875 2.125T7 15h3q.425 0 .713.288T11 16q0 .425-.288.713T10 17Zm1.6-4H8.175q-.425 0-.713-.288T7.176 12q0-.425.288-.713T8.175 11h1.45l1.975 2Z"/>
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
        <button class="stop-actions" use:tooltip={{content: "Actions", offset: 15}}>
          <select tabindex="-1" onchange={(e) => colorAction(e,i)}>
            <option disabled selected>Color Stop Actions</option>
            <hr>
            <option>Duplicate</option>
            <option>Copy CSS color</option>
            <option>Random color</option>
            <hr>
            <option>Reset</option>
            <option disabled={colorStopCount() <= 1}>Remove</option>
          </select>
        </button>
        <div class="drag-handle" use:tooltip={{content: 'Drag to reorder'}} draggable="true" ondragstart={(e) => beginDrag(e, i)} role="button" aria-label="Drag to reorder" tabindex="0"></div>
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
  <!-- End drop zone to allow dropping after the last stop -->
  <div class="end-dropzone" ondragover={(e)=> onDragOverEnd(e)} ondrop={(e)=> dropAtEnd(e)} role="region" aria-label="Drop zone"></div>
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
    position: relative;
    margin-inline: var(--size-3);
    border-radius: var(--radius-3);
    box-shadow: var(--shadow-2);
    gap: var(--size-3);
    cursor: auto;
    /* Each stop carries its own glow color for the proximity sheen */
    --gs-glow-color: var(--brand);
  }

  @media (prefers-color-scheme: light) {
    .stop {
      background: white;
      border: 1px solid var(--surface-2);
    }
  }

  /* Drag-reorder indicators */
  .control-set.drop-before::before,
  .control-set.drop-after::after {
    content: "";
    position: absolute;
    left: var(--size-3);
    right: var(--size-3);
    height: 4px;
    background: color-mix(in oklch, var(--brand, var(--link)) 60%, transparent);
    border-radius: 999px;
  }
  .control-set.drop-before::before {
    top: 0;
    transform: translateY(-6px);
  }
  .control-set.drop-after::after {
    bottom: 0;
    transform: translateY(6px);
  }

  .stop-actions {
    position: absolute;
    /* shift left to make room for the drag handle on the far right */
    inset-inline-end: calc(var(--size-3) + var(--size-5) + var(--size-2));
    inset-block-start: var(--size-3);
    inline-size: var(--size-5);
    overflow: hidden;
    border-radius: var(--radius-round);
    padding-inline: 0;
    aspect-ratio: 1;
    border: none;
    box-shadow: 0 0 0 var(--_highlight-size) var(--_highlight);
  }

  /* Drag handle to initiate reordering */
  .drag-handle {
    position: absolute;
    inset-inline-end: var(--size-3);
    inset-block-start: var(--size-3);
    inline-size: var(--size-5);
    block-size: var(--size-5);
    border-radius: var(--radius-round);
    /* no solid background, just lines */
    box-shadow: var(--shadow-1);
    cursor: grab;
    /* three horizontal lines centered in the handle */
    background-image:
      linear-gradient(currentColor, currentColor),
      linear-gradient(currentColor, currentColor),
      linear-gradient(currentColor, currentColor);
    background-repeat: no-repeat;
    background-size: 70% 2px, 70% 2px, 70% 2px;
    background-position:
      50% calc(50% - 5px),
      50% 50%,
      50% calc(50% + 5px);
    color: var(--surface-4);
  }

  .drag-handle:active {
    cursor: grabbing;
  }

  /* ensure the handle stays clickable above other elements */
  .drag-handle { z-index: 2; }
  .stop-actions { z-index: 2; }

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

  .end-dropzone {
    height: var(--size-5);
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
