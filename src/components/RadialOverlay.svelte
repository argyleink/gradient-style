<script>
  import {radial_shape, radial_position, radial_named_position, radial_size
  } from '../store/radial.ts'

  export let w = null
  export let h = null

  const dragulaState = {
    moving: false,
    start: {x:null,y:null},
    delta: {x:null,y:null},
    left: null,
    top: null,
    stop: null,
    target: null,
  }

  function determineOverlaySize() {
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
      w: parseInt($radial_size) * 2,
      h: parseInt($radial_size) * 2,
    }
  }

  function namedPosToPercent() {
    let x, y
    
    switch ($radial_named_position) {
      case 'top':
        x = 50
        y = 0
        break
      case 'right':
        x = 100
        y = 50
        break
      case 'bottom':
        x = 50
        y = 100
        break
      case 'left':
        x = 0
        y = 50
        break
      case 'top right':
        x = 100
        y = 0
        break
      case 'bottom right':
        x = 100
        y = 100
        break
      case 'bottom left':
        x = 0
        y = 100
        break
      case 'top left':
        x = 0
        y = 0
        break
      default:
        x = 50
        y = 50
        break
    }

    return {x,y}
  }

  function determineAbsPosition() {
    let x = $radial_position.x
    let y = $radial_position.y

    if ($radial_named_position !== '--') {
      let namedPos = namedPosToPercent()
      x = namedPos.x
      y = namedPos.y
    }

    return {
      x: Math.round(w * percentToDecimal(x)),
      y: Math.round(h * percentToDecimal(y)),
    }
  }

  function overlayPosition() {
    if ($radial_named_position != '--') {
      let abs = determineAbsPosition()
      return {
        x: abs.x + 'px',
        y: abs.y + 'px',
      }
    }
    else
      return {
        x: $radial_position.x + '%',
        y: $radial_position.y + '%',
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

  function dragula(node) {
    // all clicks, match stops and forward
    node.addEventListener('pointerdown', e => {
      const isStop = e.target.closest('[data-stop-index]')

      if (isStop) {
        // dragulaState.target = isStop
        // dragulaState.start.x = e.screenX
        // dragulaState.start.y = e.screenY
        // dragulaState.stop = $gradient_stops[isStop.dataset.stopIndex]

        // dragIt(isStop)
      }
      else {
        dragulaState.target = e.target
        if ($radial_named_position != '--') {
          let pos = namedPosToPercent()
          dragulaState.left = pos.x
          dragulaState.top = pos.y
          $radial_named_position = '--'
          $radial_position.x = pos.x
          $radial_position.y = pos.y
        }
        node.setPointerCapture(e.pointerId)
        dragIt(e.target)
      }
    })

    // always watch pointer move
    window.addEventListener('pointermove', e => {
      if (dragulaState.moving) {
        let apercent = w / 100
        dragulaState.left += e.movementX / apercent
        dragulaState.top += e.movementY / apercent

        // if (dragulaState.stop.kind === 'stop') {
        //   if (dragulaState.stop.position1 === dragulaState.stop.position2)
        //     dragulaState.stop.position2 = Math.round(dragulaState.left)

        //   if (dragulaState.target.dataset.position === "1")
        //     dragulaState.stop.position1 = Math.round(dragulaState.left)
        //   else
        //     dragulaState.stop.position2 = Math.round(dragulaState.left)
        // }
        // else
          // dragulaState.stop.percentage = Math.round(dragulaState.left)
        
        $radial_position.x = Math.round(dragulaState.left)
        $radial_position.y = Math.round(dragulaState.top)
      }
      
      // if (e.target.closest('[data-stop-index]'))
      //   $active_stop_index = e.target
      //     .closest('[data-stop-index]')
      //     .dataset.stopIndex
    })

    function stopWatching(e) {
      node.releasePointerCapture(e.pointerId)

      dragulaState.moving = false
      dragulaState.stop = null
      dragulaState.target = null
      dragulaState.left = null
      dragulaState.top = null

      // $active_stop_index = null
    }

    window.addEventListener('pointerup', stopWatching)
    window.addEventListener('dragleave', stopWatching)
  }

  function dragIt(node) {
    dragulaState.moving = true

    // if (dragulaState.stop.kind === 'hint')
    //   dragulaState.left = parseInt(dragulaState.stop.percentage)
    // else
    dragulaState.left = $radial_position.x
    dragulaState.top = $radial_position.y
  }

  $: size = determineOverlaySize(h,w,
    $radial_position,
    $radial_named_position,
    $radial_shape,
    $radial_size
  )

  $: position = overlayPosition(
    $radial_position,
    $radial_named_position
  )
</script>

<div class="overlay" style="
  left: {position.x}; 
  top: {position.y};
  {position.x && 'translate: -50% -50%;'}
">
  <div class="dot"></div>
  <div class="dragzone" use:dragula style="max-inline-size: {size.w * .2}px"></div>
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
  }

  .edge {
    pointer-events: none;
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

  .dragzone {
    cursor: move;
    pointer-events: auto;
    place-self: center;
    inline-size: var(--size-10);
    aspect-ratio: var(--ratio-square);
    border-radius: var(--radius-round);
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: 50%;
    transform: translate(-50%, -50%);
    transition: box-shadow .5s var(--ease-3);
    --_shadow-size: 0px;
    box-shadow: inset 0 0 0 var(--_shadow-size) hsl(0 0% 100% / 25%);
  }

  .dragzone:hover {
    --_shadow-size: var(--size-10);
  }
</style>