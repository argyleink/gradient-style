<script>
  import {radial_shape, radial_position, radial_named_position, radial_size
  } from '../store/radial.ts'

  export let w = 0
  export let h = 0

  function fullCircleSize() {
    return w * Math.SQRT2 || w
  }

  // if contains ['closest-side', 'closest-corner', 'farthest-side']
</script>

<div class="overlay" style="left: {$radial_position.x || 'auto'}%; top: {$radial_position.y || 'auto'}%; {$radial_position.x && 'translate: -50% -50%;'}">
  <div class="dot"></div>
  <div class="edge" style="width:{fullCircleSize()}px; {$radial_shape == 'circle' ? 'aspect-ratio: 1;' : `height:${h}px;`}"></div>
</div>

<style>
  .overlay {
    --line-1: hsl(0 0% 100% / 90%);
    --line-2: hsl(0 0% 100% / 50%);
    position: relative;
    grid-area: 1/1;
    display: grid;
    pointer-events: none;
    touch-action: manipulation;
  }

  .edge {
    position: absolute;
    place-self: center;
    border: 1px dashed var(--line-1);
    border-radius: var(--radius-round);
  }

  .dot {
    place-self: center;
    background: white;
    inline-size: var(--size-2);
    aspect-ratio: var(--ratio-square);
    border-radius: var(--radius-round);
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: 50%;
    transform: translate(-50%, -50%);
  }
</style>