<script>
  import { tooltip } from 'svooltip'

  import {gradient_stops, gradient_space, active_stop_index} from '../store/gradient.ts'
  import {radial_shape, radial_position, radial_named_position, radial_size
  } from '../store/radial.ts'
  import {picker_value} from '../store/colorpicker.ts'

  import {namedPosToPercent} from '../utils/radial.ts'
  import {contrast_color_prefer_white} from '../utils/color.ts'

  /**
   * @typedef {Object} Props
   * @property {any} [w]
   * @property {any} [h]
   */

  /** @type {Props} */
  let { w = null, h = null } = $props();
  let dragYdelta = null

  const dragulaState = $state({
    moving: false,
    start: {x:null,y:null},
    delta: {x:null,y:null},
    left: null,
    top: null,
    stop: null,
    target: null,
  })

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
    else {
      if ($radial_shape === 'circle') {
        return {
          w: parseInt($radial_size) * 2,
          h: parseInt($radial_size) * 2,
        }
      }
      else {
        let [w,h] = $radial_size.split(' ')
        return {
          w: parseInt(w) * 2,
          h: parseInt(h) * 2,
        }
      }
    }
  }

  function determineAbsPosition() {
    let x = $radial_position.x
    let y = $radial_position.y

    if ($radial_named_position !== '--') {
      let namedPos = namedPosToPercent($radial_named_position)
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
        dragulaState.target = isStop
        dragulaState.start.x = e.screenX
        dragulaState.start.y = e.screenY
        dragulaState.stop = $gradient_stops[isStop.dataset.stopIndex]

        dragIt(isStop)
      }
      else {
        dragulaState.target = e.target
        if ($radial_named_position != '--') {
          let pos = namedPosToPercent($radial_named_position)
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
    let lastActiveIndex = null
    window.addEventListener('pointermove', e => {
      if (dragulaState.moving && dragulaState.stop) {
        let apercent = (size.w / 2) / 100
        dragulaState.left += (e.movementX || e.movementY * -1) / apercent

        if (dragulaState.stop.kind === 'stop') {
          if (dragulaState.stop.position1 === dragulaState.stop.position2)
            dragulaState.stop.position2 = Math.round(dragulaState.left)

          if (dragulaState.target.dataset.position === "1")
            dragulaState.stop.position1 = Math.round(dragulaState.left)
          else
            dragulaState.stop.position2 = Math.round(dragulaState.left)
        }
        else
          dragulaState.stop.percentage = Math.round(dragulaState.left)

        $gradient_stops = [...$gradient_stops]
      }
      else if (dragulaState.moving) {
        let wpercent = (size.w / 2) / 100
        let hpercent = (size.h / 2) / 100
        dragulaState.left += e.movementX / wpercent
        dragulaState.top += e.movementY / hpercent
        
        $radial_position.x = Math.round(dragulaState.left)
        $radial_position.y = Math.round(dragulaState.top)
      }
      
      const target = e.target.closest('[data-stop-index]')
      if (target) {
        const idx = target.dataset.stopIndex
        if (lastActiveIndex !== idx) {
          $active_stop_index = idx
          lastActiveIndex = idx
        }
      }
    })

    function stopWatching(e) {
      node.releasePointerCapture(e.pointerId)

      dragulaState.moving = false
      dragulaState.rotating = false
      dragulaState.stop = null
      dragulaState.target = null
      dragulaState.start.x = null
      dragulaState.start.y = null

      $active_stop_index = null
    }

    window.addEventListener('pointerup', stopWatching)
    window.addEventListener('dragleave', stopWatching)
  }

  function dragIt(node) {
    dragulaState.moving = true

    if (dragulaState.stop) {
      if (dragulaState.stop.kind === 'hint')
        dragulaState.left = parseInt(dragulaState.stop.percentage)
      else if (dragulaState.stop.kind === 'stop')
        dragulaState.left = parseInt(node.dataset.position === "1" 
          ? dragulaState.stop.position1 
          : dragulaState.stop.position2) 
    }
    else {
      dragulaState.left = $radial_position.x
      dragulaState.top = $radial_position.y
    }
  }

  function gradientLineLength() {
    return size.w / 2 + 'px'
  }

  function mouseOut() {
    $active_stop_index = null
  }

  function deleteStop(stop) {
    if ($gradient_stops.length <= 1) return
    $gradient_stops = updateStops(removeStop($gradient_stops, $gradient_stops.indexOf(stop)))
  }

  function handleKeypress(e, stop, prop) {
    if (e.target.classList.contains('stop-color')) return

    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
      e.preventDefault()

      if (['ArrowLeft','ArrowDown'].includes(e.key)) {
        if (stop.hasOwnProperty('position1') && stop.position1 === stop.position2)
          stop.position2 -= 1
        stop[prop] -= 1
      }
      else {
        if (stop.hasOwnProperty('position1') && stop.position1 === stop.position2)
          stop.position2 += 1
        stop[prop] += 1
      }

      $gradient_stops = $gradient_stops
    }
    else if (['Backspace','Delete'].includes(e.key)) {
      deleteStop(stop)
    }
  }

  function relinkStop(stop) {
    stop.position2 = stop.position1
    $gradient_stops = updateStops($gradient_stops)
  }

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

  let size = $derived(determineOverlaySize(h,w,
    $radial_position,
    $radial_named_position,
    $radial_shape,
    $radial_size
  ))

  let position = $derived(overlayPosition(
    $radial_position,
    $radial_named_position,
    w, h
  ))
</script>

<div class="overlay" use:dragula  style="
  left: {position.x}; 
  top: {position.y};
  {position.x && 'translate: -50% -50%;'}
">
  <div class="dot"></div>
  <div tabindex="0" class="dragzone" use:tooltip={{content: $radial_named_position == '--' ? `${position.x} ${position.y}` : $radial_named_position}} style="max-inline-size: {size.w * .2}px"></div>
  <div class="edge" style="
    width:{size.w}px; 
    height:{size.h}px;
  "></div>
  <div class="line" style="width: {gradientLineLength(size)}">
    {#each $gradient_stops as stop, i (stop)}
      {#if stop.kind === 'stop'}
        <div 
          tabindex="0"
          use:tooltip={{content: `${stop.position1}%`}}
          class="stop-wrap" 
          style="inset-inline-start: {stop.position1}%;inset-block-end: {dragulaState.stop == stop && dragYdelta !== null ? dragYdelta+'px':''}; --contrast-fill: {contrast_color_prefer_white(stop.color)}" 
          onmouseleave={mouseOut} 
          onkeydown={(e)=>handleKeypress(e,stop,'position1')}
          ondblclick={()=>deleteStop(stop)}
        >
          <div class="stop" data-stop-index={i} data-position="1">
            <button class="stop-color" style="background-color: {stop.color}" onclick={e => pickColor(stop,e)} use:tooltip={{content: stop.color}}></button>
          </div>
        </div>
        {#if stop.position1 !== stop.position2}
          <div 
            tabindex="0"
            use:tooltip={{content: `${stop.position2}%`}}
            class="stop-wrap" 
            style="inset-inline-start: {stop.position2}%; --contrast-fill: {contrast_color_prefer_white(stop.color)}; inset-block-end: {dragulaState.stop == stop && dragYdelta !== null ? dragYdelta+'px':''};" 
            onmouseleave={mouseOut} 
            onkeydown={(e)=>handleKeypress(e,stop,'position2')}
            ondblclick={()=>relinkStop(stop)}
          >
            <div class="stop" data-stop-index={i} data-position="2">
              <button class="stop-color" style="background-color: {stop.color}" onclick={e => pickColor(stop,e)} use:tooltip={{content: stop.color}}></button>
            </div>
          </div>
        {/if}
      {/if}
      {#if stop.kind === 'hint'}
        <div 
          class="hint" 
          tabindex="0"
          use:tooltip={{content: `${stop.percentage}%`}}
          data-stop-index={i} 
          style="
            inset-inline-start: {stop.percentage}%; 
            visibility: {stop.percentage == stop.auto ? 'hidden' : 'inherit'}
          " 
          onmouseleave={mouseOut}
          onkeydown={(e)=>handleKeypress(e,stop,'percentage')}
        >
          <svg viewBox="0 0 256 256">
            <path d="M216.49 168.49a12 12 0 0 1-17 0L128 97l-71.51 71.49a12 12 0 0 1-17-17l80-80a12 12 0 0 1 17 0l80 80a12 12 0 0 1 0 17Z"/>
          </svg>
        </div>
      {/if}
    {/each}
  </div>
</div>

<style>
  .overlay {
    --line-1: hsl(0 0% 100% / 90%);
    --line-2: hsl(0 0% 100% / 50%);
    position: relative;
    grid-area: 1/1;
    display: grid;
    pointer-events: none;
    touch-action: none;
    will-change: translate, left, top;
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

  .line {
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: 50%;
    display: grid;
    grid-auto-flow: column;
    place-items: center;
    place-content: center space-between;
    block-size: 2px;
    inline-size: 100%;
    background: var(--line-1);
  }

  .line::after {
    content: "";
    block-size: 2px;
    position: absolute;
    background: repeating-linear-gradient(to right, #0000 0 5px, var(--line-2) 0 10px);
    inline-size: 400cqmax;
    z-index: -1;
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

  .stop-wrap {
    border-radius: var(--radius-round);
    translate: -50% 0;
  }

  .stop-wrap:has(:global(+ .stop-wrap)) .stop {
    clip-path: inset(0 50% 0 0);
  }

  .stop-wrap + .stop-wrap .stop {
    clip-path: inset(0 0 0 50%);
  }

  .stop {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--contrast-fill, white);
    aspect-ratio: 1;
    inline-size: var(--size-5);
    border-radius: var(--radius-round);
    border: .5px solid hsl(0 0% 0% / 15%);
  }

  @media (prefers-reduced-motion: no-preference) {
    .stop {
      animation: 
        var(--animation-scale-up) reverse,
        var(--animation-fade-out) reverse;
      animation-duration: 250ms;
    }
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
    translate: -50% 50%;
  }

  .hint > svg {
    max-inline-size: var(--size-5);
    fill: white;
    stroke-width: 0.5px;
    stroke: hsl(0 0% 0% / 15%);
  }

  :is(:global(.hint > svg, .stop)) {
    pointer-events: auto;
    touch-action: manipulation;
    cursor: grab;
    user-select: none;
  }

  :is(:global(.hint > svg, .stop)):active {
    cursor: grabbing;
  }
</style>