<script>
  import { fade } from 'svelte/transition'

  import {gradient_stops, gradient_space, active_stop_index} from '../store/gradient.ts'
  import {linear_angle, linear_named_angle} from '../store/linear.ts'
  import {picker_value} from '../store/colorpicker.ts'

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

<div class="linear-overlay" style="rotate: calc({$linear_angle}deg - 90deg)">
  <div class="line">
    {#each $gradient_stops as stop, i}
      {#if stop.kind === 'stop'}
        <div class="stop-wrap" style="inset-inline-start: {stop.position1}%">
          <div class="value-tip" style="--show: {$active_stop_index == i ? 1 : 0}">{stop.position1}%</div>
          <div class="stop">
            <button style="background-color: {stop.color}" on:click={e => pickColor(stop,e)}></button>
          </div>
        </div>
      {/if}
      {#if stop.kind === 'hint'}
        <div class="hint" style="inset-inline-start: {stop.percentage}%">
          <div class="value-tip" style="--show: {$active_stop_index == i ? 1 : 0}">{stop.percentage}%</div>
          <svg viewBox="0 0 24 15">
            <path d="M.99 9.415 9.649.955c.309-.303.676-.543 1.08-.707a3.396 3.396 0 0 1 2.552 0c.404.164.771.404 1.08.707l8.657 8.46C25.123 11.473 23.62 15 20.644 15H3.331C.356 15-1.115 11.473.99 9.415Z"/>
          </svg>
        </div>
      {/if}
    {/each}
  </div>
</div>

<style>
  .linear-overlay {
    display: grid;
    position: relative;
    grid-area: 1/1;
    align-content: center;
    inline-size: 100%;
    inset-inline-start: calc(var(--size-5) / 2 * -1);
    justify-self: center;
    pointer-events: none;
  }

  .line {
    position: relative;
    display: grid;
    grid-auto-flow: column;
    place-items: center;
    place-content: center space-between;
    block-size: 2px;
    inline-size: 100%;
    background: hsl(0 0% 100% / 50%);
  }

  .line::after {
    content: "";
    block-size: 2px;
    position: absolute;
    background: hsl(0 0% 100% / 10%);
    inline-size: 150cqmax;
    z-index: -1;
  }

  .stop-wrap {
    translate: 0 calc(var(--size-3) * -1);
  }

  .stop {
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    aspect-ratio: 1;
    inline-size: var(--size-5);
    border-radius: var(--radius-round);
    box-shadow: var(--shadow-2);
    border: .5px solid hsl(0 0% 0% / 15%);
  }

  .stop:is(:hover,:focus-visible) {
    background: white;
  }

  .stop > button {
    aspect-ratio: 1;
    inline-size: var(--size-3);
    border-radius: var(--radius-round);
    padding: 0;
    flex-shrink: 0;
    border: none;
    box-shadow: var(--inner-shadow-0);
    outline-offset: 8px;
  }

  .hint, .stop-wrap {
    position: absolute;
    max-inline-size: var(--size-5);
    display: grid;
    place-content: center;
    place-items: center;
    gap: var(--size-2);
  }

  .hint {
    translate: 0 -5px;
  }

  .hint > svg {
    max-inline-size: var(--size-5);
    fill: white;
    stroke-width: 0.5px;
    stroke: hsl(0 0% 0% / 15%);
    filter: drop-shadow(0px 2px 2px hsl(0 0% 0% / 10%));
  }

  :is(.hint > svg, .stop) {
    pointer-events: auto;
    touch-action: manipulation;
    cursor: grab;
  }

  :is(.hint > svg, .stop):active {
    cursor: grabbing;
  }

  .value-tip {
    opacity: var(--show);
    translate: 0 calc(var(--show) * -3px);
    transition: opacity .3s ease, translate .5s var(--ease-squish-3);
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    background: white;
    color: var(--gray-7);
    padding-inline: .25lh;
    border-radius: var(--radius-2);
  }
</style>