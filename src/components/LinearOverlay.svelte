<script>
  import {gradient_stops, gradient_space, active_stop_index} from '../store/gradient.ts'
  import {linear_angle, linear_named_angle} from '../store/linear.ts'
  import {picker_value} from '../store/colorpicker.ts'

  import {updateStops} from '../utils/stops.ts'
  import {linear_keywords} from'../utils/linear.ts'
  import {degToRad, radToDeg} from '../utils/radial.ts'
  import {contrast_color_prefer_white} from '../utils/color.ts'
  import {randomNumber} from '../utils/numbers.ts'

  export let w = null
  export let h = null

  const dragulaState = {
    moving: false,
    left: null,
    stop: null,
    target: null,
  }

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
        dragulaState.stop = $gradient_stops[isStop.dataset.stopIndex]

        dragIt(isStop)
      }
      else if (isRotator) {
        rotateIt(isRotator)
      }
    })

    // always watch pointer move
    window.addEventListener('pointermove', e => {
      if (dragulaState.moving && e.movementX) {
        node.setPointerCapture(e.pointerId)
        let apercent = w / 100
        apercent = $linear_angle >= 180 ? -apercent : apercent
        dragulaState.left += e.movementX / apercent

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
        $linear_angle += e.movementX
      }
      
      if (e.target.closest('[data-stop-index]'))
        $active_stop_index = e.target
          .closest('[data-stop-index]')
          .dataset.stopIndex
    })

    function stopWatching(e) {
      node.releasePointerCapture(e.pointerId)
      dragulaState.moving = false
      dragulaState.rotating = false
      dragulaState.stop = false
      dragulaState.target = false
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
</script>

<div class="pie">
  {#if $linear_angle > 0}
    <div class="visual-vert"></div>
  {/if}
  <div class="visual" style="--ng: {$linear_angle}deg"></div>
</div>
<div use:dragula class="linear-overlay" style="rotate: {gradientAngle($linear_angle)}deg">
  <div class="invisible-rotator"></div>
  <div class="invisible-track" on:click={addStop}></div>
  <div class="line" style="width: {gradientLineLength($linear_angle, h, w)}">
    {#each $gradient_stops as stop, i}
      {#if stop.kind === 'stop'}
        <div class="stop-wrap" style="inset-inline-start: {stop.position1}%; --contrast-fill: {contrast_color_prefer_white(stop.color)}" on:mouseleave={mouseOut}>
          <div class="value-tip" style="--show: {$active_stop_index == i ? 1 : 0}; rotate: calc(90deg - {$linear_angle}deg)">{stop.position1}%</div>
          <div class="stop" {stop} data-stop-index={i} data-position="1">
            <button style="background-color: {stop.color}" on:click={e => pickColor(stop,e)}></button>
          </div>
        </div>
        {#if stop.position1 !== stop.position2 && stop.position2 !== stop.auto}
          <div class="stop-wrap" style="inset-inline-start: {stop.position2}%; --contrast-fill: {contrast_color_prefer_white(stop.color)}" on:mouseleave={mouseOut}>
            <div class="value-tip" style="--show: {$active_stop_index == i ? 1 : 0}; rotate: calc(90deg - {$linear_angle}deg)">{stop.position2}%</div>
            <div class="stop" {stop} data-position="2">
              <button style="background-color: {stop.color}" on:click={e => pickColor(stop,e)}></button>
            </div>
          </div>
        {/if}
      {/if}
      {#if stop.kind === 'hint'}
        <div class="hint" {stop} data-stop-index={i} style="inset-inline-start: {stop.percentage}%" on:mouseleave={mouseOut}>
          <div class="value-tip" style="--show: {$active_stop_index == i ? 1 : 0}; rotate: calc(90deg - {$linear_angle}deg)">{stop.percentage}%</div>
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
    touch-action: manipulation;
/*     transition: rotate 300ms ease-out; */
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
    translate: -50% calc(var(--size-3) * -1);
  }

  .stop-wrap:has(+ .stop-wrap) .stop {
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
/*     transition: inset 30ms ease-out; */
  }

  .hint {
    translate: 0 -5px;
  }

  .hint > svg {
    max-inline-size: var(--size-5);
    fill: white;
    stroke-width: 0.5px;
    stroke: hsl(0 0% 0% / 15%);
  }

  :is(.hint > svg, .stop) {
    pointer-events: auto;
    touch-action: manipulation;
    cursor: grab;
    user-select: none;
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
    box-shadow: var(--shadow-2);
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

  .invisible-rotator {
    pointer-events: auto;
    cursor: ew-resize;
    inline-size: var(--size-10);
    aspect-ratio: var(--ratio-square);
    border-radius: var(--radius-round);
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: 50%;
    transform: translate(-50%, -50%);
  }
</style>