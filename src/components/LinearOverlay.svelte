<script>
  import { tooltip } from 'svooltip'

  import {gradient_stops, gradient_space, active_stop_index} from '../store/gradient.ts'
  import {linear_angle, linear_named_angle} from '../store/linear.ts'
  import {picker_value} from '../store/colorpicker.ts'

  import {updateStops, removeStop} from '../utils/stops.ts'
  import {linear_keywords} from'../utils/linear.ts'
  import {degToRad, radToDeg} from '../utils/radial.ts'
  import {contrast_color_prefer_white} from '../utils/color.ts'
  import {randomNumber} from '../utils/numbers.ts'

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
    stop: null,
    target: null,
  })

  linear_named_angle.subscribe(value => {
    if (value === '--') return
    let ng = linear_keywords[value](w,h)
    $linear_angle = radToDeg(ng)
  })

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

  function dragula(node) {
    // all clicks, match stops and forward
    node.addEventListener('pointerdown', e => {
      const isStop = e.target.closest('[data-stop-index]')
      const isRotator = e.target.closest('.invisible-rotator')

      if (isStop) {
        dragulaState.target = isStop
        dragulaState.start.x = e.screenX
        dragulaState.start.y = e.screenY
        dragulaState.stop = $gradient_stops[isStop.dataset.stopIndex]

        dragIt(isStop)
      }
      else if (isRotator) {
        rotateIt(isRotator)
      }
    })

    // always watch pointer move
    window.addEventListener('pointermove', e => {
      if (dragulaState.moving) {
        node.setPointerCapture(e.pointerId)
        let apercent = w / 100
        apercent = $linear_angle >= 180 ? -apercent : apercent
        dragulaState.left += (e.movementX || e.movementY * -1) / apercent

        // if (Math.abs(dragulaState.start.y - e.screenY) > 50)
        //   dragYdelta = dragulaState.start.y - e.screenY - 24
        // else
        //   dragYdelta = null

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
      else if (dragulaState.rotating) {
        node.setPointerCapture(e.pointerId)
        $linear_named_angle = '--'

        // if ($linear_angle < 90 || $linear_angle > 270) $linear_angle += e.movementX
        // else $linear_angle -= e.movementX
        $linear_angle += e.movementX
        $linear_angle += e.movementY

        // if ($linear_angle < 180) $linear_angle += e.movementY
        // else $linear_angle -= e.movementY

        if ($linear_angle > 360) $linear_angle = 0
        if ($linear_angle < 0) $linear_angle = 360
      }
      
      if (e.target.closest('[data-stop-index]'))
        $active_stop_index = e.target
          .closest('[data-stop-index]')
          .dataset.stopIndex
    })

    function stopWatching(e) {
      node.releasePointerCapture(e.pointerId)

      // if (dragulaState.moving && Math.abs(dragulaState.start.y - e.screenY) > 50) {
      //   dragYdelta = null
      //   $gradient_stops = updateStops(removeStop($gradient_stops, $gradient_stops.indexOf(dragulaState.stop)))
      // }

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

    if (dragulaState.stop.kind === 'hint')
      dragulaState.left = parseInt(dragulaState.stop.percentage)
    else
      dragulaState.left = parseInt(node.dataset.position === "1" 
        ? dragulaState.stop.position1 
        : dragulaState.stop.position2)        
  }

  function rotateIt(node) {
    dragulaState.rotating = true
  }

  function mouseOut() {
    $active_stop_index = null
  }

  function gradientLineLength(a) {
    if (!w && !h) return null
    a = degToRad(a)
    let l = Math.round(Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a)))
    return l + 'px'
  }

  function gradientAngle(ng) {
    return ng - 90
  }

  function addStop(e) {
    const bounds = e.target.getBoundingClientRect()
    const distance = e.clientX - bounds.x
    const percent = (distance / bounds.width * 100).toFixed()
    
    const upperLimit = $gradient_stops.findIndex(stop => 
      stop.position1 > percent)

    const newStop = {
      kind: 'stop', 
      color: `oklch(80% 0.3 ${randomNumber(0,360)})`, 
      auto: percent, 
      position1: percent, 
      position2: percent,
    }

    if (upperLimit > 1) {
      $gradient_stops.splice(upperLimit, 0, {kind: 'hint', percentage: null})
      $gradient_stops.splice(upperLimit, 0, newStop)
    }
    else {
      $gradient_stops.splice(upperLimit, 0, newStop)
      $gradient_stops.splice(upperLimit, 0, {kind: 'hint', percentage: null})
    }

    $gradient_stops = updateStops($gradient_stops)
  }

  function deleteStop(stop) {
    if ($gradient_stops.length <= 1) return
    $gradient_stops = updateStops(removeStop($gradient_stops, $gradient_stops.indexOf(stop)))
  }

  function relinkStop(stop) {
    stop.position2 = stop.position1
    $gradient_stops = updateStops($gradient_stops)
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
</script>

<div class="pie">
  {#if $linear_angle > 0}
    <div class="visual-vert"></div>
  {/if}
  <div class="visual" style="--ng: {$linear_angle}deg"></div>
  <div class="dot"></div>
</div>
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div use:dragula class="linear-overlay" style="rotate: {gradientAngle($linear_angle)}deg">
  <div class="invisible-rotator" use:tooltip={{content: $linear_named_angle == '--' ? `${$linear_angle}deg` : $linear_named_angle}}></div>
  <div class="invisible-track" onclick={addStop}></div>
  <div class="line" style="width: {gradientLineLength($linear_angle, h, w)}">
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
  .linear-overlay {
    --line-1: hsl(0 0% 100% / 90%);
    --line-2: hsl(0 0% 100% / 50%);

    position: relative;
    grid-area: 1/1;
    pointer-events: none;
    touch-action: none;
    will-change: rotate;
  }

  .line {
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: 50%;
    transform: translate(-50%, -50%);
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
    inline-size: 150cqmax;
    z-index: -1;
  }

  .invisible-track {
    cursor: copy;
    pointer-events: auto;
    position: absolute;
    block-size: 1rem;
    inline-size: 100%;
    inset-block-start: 50%;
    inset-inline-start: 0;
    transform: translateY(-50%);
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

  .pie {
    --line-1: hsl(0 0% 100% / 50%);
    --line-2: hsl(0 0% 100% / 10%);

    position: relative;
    grid-area: 1/1;
    display: grid;
    justify-content: center;
    align-items: center;
    pointer-events: none;
  }

  .visual {
    --ng: 0; 
    --thickness: 3px;
    --_inner: calc(70% - var(--thickness));
    --_outer: calc(var(--_inner) + 1px); 
    
    mask: radial-gradient(circle, #0000 var(--_inner), #000 var(--_outer));
    -webkit-mask: radial-gradient(circle, #0000 var(--_inner), #000 var(--_outer));
    background-image: conic-gradient(var(--line-1), var(--line-1) var(--ng), #0000 0);

    inline-size: var(--size-10);
    aspect-ratio: var(--ratio-square);
    border-radius: var(--radius-round);
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: 50%;
    transform: translate(-50%, -50%);
  }

  .visual-vert {
    --line-1: white;
    block-size: var(--size-10);
    inline-size: 3px;
    background-image: linear-gradient(to bottom, var(--line-1) 50%, #0000 0);
  }

  .dot {
    background: white;
    inline-size: var(--size-2);
    aspect-ratio: var(--ratio-square);
    border-radius: var(--radius-round);
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: 50%;
    transform: translate(-50%, -50%);
  }

  .invisible-rotator {
    pointer-events: auto;
    inline-size: var(--size-10);
    aspect-ratio: var(--ratio-square);
    border-radius: var(--radius-round);
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: 50%;
    transform: translate(-50%, -50%);
    cursor: ew-resize;
  }
</style>