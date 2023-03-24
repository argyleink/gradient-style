<script>
  import { tooltip } from 'svooltip'
  import {gradient_positions, gradient_angles} from '../store/gradient.ts'

  export let id = 'named-directions'
  export let selected = 'center'
  export let mode = 'position'
</script>

<fieldset id={id} class="angle-matrix">
  {#if mode === 'position'}
    {#each gradient_positions as d}
      <input type="radio" class="matrix-dot" name="{id}-group" value={d} title={d} bind:group={selected} use:tooltip={{content: d}}>
    {/each}
  {/if}
  {#if mode === 'angle'}
    {#each gradient_angles as d}
      <input type="radio" class="matrix-dot" name="{id}-group" value={d} title={d} bind:group={selected} use:tooltip={{content: d}}>
    {/each}
  {/if}
</fieldset> 

<style>
  .angle-matrix {
    display: grid;
    place-content: center;
    grid: var(--size-7) / var(--size-7);
    border: none;
    padding: 0;
  }

  .matrix-dot {
    --_size: var(--size-2);
    max-inline-size: var(--_size);
    max-block-size: var(--_size);
    grid-area: 1/1;
    appearance: none;
    aspect-ratio: 1;
    background: var(--surface-4);
    border-radius: var(--radius-round);
    padding: 0;
  }

  .matrix-dot:checked {
    background: var(--text-2);
  }
  
  .matrix-dot[value="center"] { place-self: center }
  .matrix-dot:is([value="top left"],[value="to top left"]) { place-self: start }
  .matrix-dot:is([value="top"],[value="to top"]) { place-self: start center }
  .matrix-dot:is([value="top right"],[value="to top right"]) { place-self: start end }
  .matrix-dot:is([value="right"],[value="to right"]) { place-self: center end }
  .matrix-dot:is([value="bottom right"],[value="to bottom right"]) { place-self: end }
  .matrix-dot:is([value="bottom"], [value="to bottom"]) { place-self: end center }
  .matrix-dot:is([value="bottom left"],[value="to bottom left"]) { place-self: end start }
  .matrix-dot:is([value="left"],[value="to left"]) { place-self: center start }
</style>