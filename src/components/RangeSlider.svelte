<script>
  import { createEventDispatcher } from 'svelte'
  import { writable } from 'svelte/store'

  const dispatch = createEventDispatcher()

  export let style = 'none'
  export let value
  export let min = 0
  export let max = 100
  export let step = 1
  export let emptytrack = 'none'

  function dispatchChange() {
    dispatch('change', { value })
  }
</script>

<input 
  type="range" 
  class="range-slider {emptytrack && 'no-track-fill'}" 
  style="{style!='none'?style:''}; --track-fill: {value / (max || 100) * 100}%"
  bind:value={value}
  on:input={dispatchChange}
  min={min}
  max={max}
  step={step}
>

<style>
  .range-slider {
    --track-height: .5ex;
    --track-fill: 0%;
    --track-color: var(--surface-3);
    --thumb-size: 2ex;
    --thumb-offset: -.8ex;
    --thumb-highlight-size: 0px;

    --highlight-light: hsl(var(--gray-5-hsl)/25%);
    --highlight-dark: hsl(var(--gray-12-hsl)/25%);
    --thumb-highlight-color: var(--highlight-light);

    inline-size: 100%;
    appearance: none;
    outline-offset: 5px;
    background: none;
    margin: 1ex 0;
    display: block;
  }

  .no-track-fill {
    --accent-color: var(--track-color); 
    --thumb-color: white;
  }

  @media (prefers-color-scheme: dark) {
    .range-slider {
      --track-color: var(--surface-1);
      --thumb-highlight-color: var(--highlight-dark);
    }

    .no-track-fill {
      --thumb-color: var(--surface-4);
    }
  }

  .range-slider::-webkit-slider-runnable-track {
    appearance: none;
    block-size: var(--track-height);
    background: linear-gradient(to right, 
      transparent var(--track-fill), 
      var(--track-color) 0%), 
      var(--accent-color);
    border-radius: 5ex;
  }

  .range-slider::-moz-range-track {
    appearance: none;
    block-size: var(--track-height);
    background: linear-gradient(to right, transparent var(--track-fill), var(--track-color) 0%), var(--accent-color);
    border-radius: 5ex;
  }

  .range-slider::-webkit-slider-thumb {
    appearance: none;
    cursor: ew-resize;
    block-size: var(--thumb-size);
    inline-size: var(--thumb-size);
    background: var(--thumb-color, var(--accent-color));
    box-shadow: var(--shadow-4), 0 0 0 var(--thumb-highlight-size) var(--thumb-highlight-color);
    border-radius: 50%;
    margin-block-start: var(--thumb-offset);
  }

  @media (prefers-reduced-motion: no-preference) {
    .range-slider::-webkit-slider-thumb {
      transition: box-shadow .1s;
    }
  }

  .range-slider::-moz-range-thumb {
    appearance: none;
    cursor: ew-resize;
    block-size: var(--thumb-size);
    inline-size: var(--thumb-size);
    background: var(--thumb-color, var(--accent-color));
    box-shadow: var(--shadow-4), 0 0 0 var(--thumb-highlight-size) var(--thumb-highlight-color);
    border-radius: 50%;
    margin-block-start: var(--thumb-offset);
  }

  @media (prefers-reduced-motion: no-preference) {
    .range-slider::-moz-range-thumb {
      transition: box-shadow .1s;
    }
  }

  .range-slider:is(:hover, :active) {
    --thumb-highlight-size: 8px;
  }
</style>