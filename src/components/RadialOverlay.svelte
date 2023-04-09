<script>
  import {radial_shape, radial_position, radial_named_position, radial_size
  } from '../store/radial.ts'

  export let w = 0
  export let h = 0

  function determineOverlaySize() {
    const quadrant = determineQuadrant()
    const pos = determineAbsPosition()
    const distances = calcDistances(pos)

    const furthestInline = distances.left > distances.right ? distances.left : distances.right
    const furthestBlock = distances.top > distances.bottom ? distances.top : distances.bottom
    const shortestInline = distances.left < distances.right ? distances.left : distances.right
    const shortestBlock = distances.top < distances.bottom ? distances.top : distances.bottom

    const larger  = furthestInline > furthestBlock ? furthestInline : furthestBlock
    const shorter = shortestInline < shortestBlock ? shortestInline : shortestBlock

    const longSide  = calcDiagonalLength({x: furthestInline, y: furthestBlock})
    const shortSide = calcDiagonalLength({x: shortestInline, y: shortestBlock})

    if ($radial_size == 'farthest-side') {
      if ($radial_shape == 'circle') return {
        w: larger * 2,
        h: larger * 2,
      }
      else return {
        w: furthestInline * 2,
        h: furthestBlock * 2,
      }
    }
    else if ($radial_size == 'farthest-corner') {
      if ($radial_shape == 'circle') return {
        w: longSide * 2,
        h: longSide * 2,
      }
      else {
        let furthestSide = {
          w: furthestInline * 2,
          h: furthestBlock * 2,
        }
        return {
          h: (longSide * furthestSide.h / furthestSide.w) * 2,
          w: (longSide * furthestSide.w / furthestSide.h) * 2,
        }
      }
    }
    else if ($radial_size == 'closest-side') {
      if ($radial_shape == 'circle') return {
        w: shorter * 2,
        h: shorter * 2,
      }
      else return {
        w: shortestInline * 2,
        h: shortestBlock * 2,
      }
    }
    else if ($radial_size == 'closest-corner') {
      if ($radial_shape == 'circle') return {
        w: shortSide * 2,
        h: shortSide * 2,
      }
      else {
        let closestSide = {
          w: shortestInline * 2,
          h: shortestBlock * 2,
        }
        return {
          h: (shortSide * closestSide.h / closestSide.w) * 2,
          w: (shortSide * closestSide.w / closestSide.h) * 2,
        }
      }
    }
    else return {
      w: w * 2,
      h: w * 2,
    }
  }

  function determineQuadrant() {
    let tophalve  = $radial_position.y < 50 ? 'n' : 's'
    let sidehalve = $radial_position.x < 50 ? 'w' : 'e'

    return tophalve + sidehalve
  }

  function determineAbsPosition() {
    // (maybe parse named ones)
    let x = percentToDecimal($radial_position.x)
    let y = percentToDecimal($radial_position.y)

    return {
      x: Math.round(w * x),
      y: Math.round(h * y),
    }
  }

  function calcDiagonalLength(pos) {
    return Math.sqrt(pos.x ** 2 + pos.y ** 2)
  }

  function calcDistances(pos) {
    return {
      left: pos.x,
      right: w - pos.x,
      top: pos.y,
      bottom: h - pos.y,
    }
  }

  function percentToDecimal(percent) {
    return percent / 100
  }

  $: size = determineOverlaySize(
    $radial_position,
    $radial_named_position,
    $radial_shape,
    $radial_size
  )

  // if contains ['closest-side', 'closest-corner', 'farthest-side']
</script>

<div class="overlay" style="left: {$radial_position.x || 'auto'}%; top: {$radial_position.y || 'auto'}%; {$radial_position.x && 'translate: -50% -50%;'}">
  <div class="dot"></div>
  <div class="edge" style="
    width:{size.w}px; 
    height:{size.h}px;
  "></div>
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
    border: 2px dashed var(--line-2);
    border-radius: 50%;
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