<script>
  import { tooltip } from 'svooltip'

  import {gradient_stops, gradient_space, active_stop_index} from '../store/gradient.ts'
  import {conic_angle, conic_named_position, conic_position} from '../store/conic.ts'
  import {picker_value} from '../store/colorpicker.ts'

  import {namedPosToPercent} from '../utils/conic.ts'
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

  // Ghost stop preview state for hover on the ring
  let ghostPercent = $state(null)
  let showGhost = $state(false)

  const dragulaState = {
    moving: false,
    rotating: false,
    start: {x:null,y:null},
    delta: {x:null,y:null},
    left: null,
    top: null,
    stop: null,
    target: null,
    angle: null,
    lastAngle: null,
    centerX: null,
    centerY: null,
    // simplified pull-away state
    removedStop: null,
    removedIndex: null,
  }

  function pickColor(stop, e) {
    const picker = document.getElementById('color-picker')

    // Start the picker from the current stop color to avoid stale values
    $picker_value = stop.color

    picker.setAnchor(e.target)
    picker.setColor(stop.color)
    picker.showModal()

    // Ignore the initial emission which may be the seeded value or a stale one
    let isFirst = true
    const unsub = picker_value.subscribe(value => {
      if (isFirst) { isFirst = false; return }
      if (value === stop.color) return
      stop.color = value
      $gradient_stops = [...$gradient_stops]
    })

    picker.addEventListener('closing', () => {
      unsub()
    }, { once: true })
  }

  function percentToDecimal(percent) {
    return percent / 100
  }

  function determineAbsPosition() {
    let x = $conic_position.x
    let y = $conic_position.y

    if ($conic_named_position !== '--') {
      let namedPos = namedPosToPercent($conic_named_position)
      x = namedPos.x
      y = namedPos.y
    }

    return {
      x: Math.round(w * percentToDecimal(x)),
      y: Math.round(h * percentToDecimal(y)),
    }
  }

  function overlayPosition() {
    if ($conic_named_position != '--') {
      let abs = determineAbsPosition()
      return {
        x: abs.x + 'px',
        y: abs.y + 'px',
      }
    }
    else
      return {
        x: $conic_position.x + '%',
        y: $conic_position.y + '%',
      }
  }

  function dragula(node) {
    // all clicks, match stops and forward
    node.addEventListener('pointerdown', e => {
      const isStop = e.target.closest('[data-stop-index]')
      const isRotator = e.target.closest('.invisible-rotator')
      const isDrag = e.target.closest('.dragzone')
      const isRing = e.target.closest('.invisible-ring')

      if (isRing) {
        // Allow click-to-add without initiating any drag
        return
      }

      if (isDrag) {
        dragulaState.target = e.target
        if ($conic_named_position != '--') {
          let pos = namedPosToPercent($conic_named_position)
          dragulaState.left = pos.x
          dragulaState.top = pos.y
          $conic_named_position = '--'
          $conic_position = {
            x: pos.x,
            y: pos.y
          }
        }
        node.setPointerCapture(e.pointerId)
        dragIt(e.target)
      }
      else if (isRotator) {
        rotateIt(isRotator)
      }
      else if (isStop) {
        dragulaState.target = isStop
        dragulaState.start.x = e.screenX
        dragulaState.start.y = e.screenY
        dragulaState.stop = $gradient_stops[isStop.dataset.stopIndex]

        dragIt(isStop)
      }
    })

    // always watch pointer move
    let lastActiveIndex = null
    window.addEventListener('pointermove', e => {
      if (dragulaState.moving && dragulaState.stop) {
        // Capture pointer to avoid losing events during fast drags
        node.setPointerCapture(e.pointerId)

        // Determine ring center from the stops container
        const stopsEl = node.querySelector('.stops')
        if (stopsEl) {
          const rect = stopsEl.getBoundingClientRect()
          const cx = rect.left + rect.width / 2
          const cy = rect.top + rect.height / 2

          // Pull-away removal based on radial distance from the ring
          const dx = e.clientX - cx
          const dy = e.clientY - cy
          const dist = Math.hypot(dx, dy)
          // Estimate the ring radius: sample an existing stop or fallback
          let ringRadius = 59
          const sampleStop = node.querySelector('.stops .stop')
          if (sampleStop) {
            const srect = sampleStop.getBoundingClientRect()
            const sx = srect.left + srect.width / 2
            const sy = srect.top + srect.height / 2
            ringRadius = Math.hypot(sx - cx, sy - cy)
          }
          const radialDelta = Math.abs(dist - ringRadius)
          const armThresh = 75

          // Pull-away removal disabled

          // Compute the angle under the pointer in screen space [0,360)
          let deg = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI)
          if (deg < 0) deg += 360

          // Align to the visual orientation of the overlay and stops
          const dynamicOffset = computeVisualOffsetDeg(node)
          const baseOffset = normalizeDeg($conic_angle - 180)
          const offset = dynamicOffset ?? baseOffset

          const localDeg = normalizeDeg(deg - offset)
          // Map degrees to percent [0,100]
          const percent = Math.max(0, Math.min(100, Math.round((localDeg / 360) * 100)))

          // Track for UI feedback/tooltips
          dragulaState.angle = percent

          // Update positions on active or removed stop
          const targetStop = dragulaState.removedStop ?? dragulaState.stop
          if (targetStop) {
            if (targetStop.kind === 'stop') {
              if (targetStop.position1 === targetStop.position2)
                targetStop.position2 = percent

              if (dragulaState.target?.dataset.position === "1")
                targetStop.position1 = percent
              else
                targetStop.position2 = percent
            }
            else {
              targetStop.percentage = percent
            }
          }

          if (!dragulaState.removedStop) {
            $gradient_stops = [...$gradient_stops]
          }
        }
      }
      else if (dragulaState.moving) {
        let wpercent = w / 50
        let hpercent = h / 50
        dragulaState.left += e.movementX / wpercent
        dragulaState.top += e.movementY / hpercent
        
        $conic_position = {
          x: Math.round(dragulaState.left),
          y: Math.round(dragulaState.top)
        }
      }
      else if (dragulaState.rotating) {
        node.setPointerCapture(e.pointerId)

        if (typeof $conic_angle == 'string')
          $conic_angle = parseInt($conic_angle)

        // Calculate angle from center to mouse position
        const deltaX = e.clientX - dragulaState.centerX
        const deltaY = e.clientY - dragulaState.centerY
        let currentAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI)
        
        // Normalize to 0-360 range
        if (currentAngle < 0) currentAngle += 360
        
        if (dragulaState.lastAngle !== null) {
          // Calculate the angular difference
          let angleDiff = currentAngle - dragulaState.lastAngle
          
          // Handle wraparound (e.g., from 350° to 10°)
          if (angleDiff > 180) angleDiff -= 360
          if (angleDiff < -180) angleDiff += 360
          
          // Update the conic angle
          $conic_angle += angleDiff
          
          // Keep angle in 0-360 range
          if ($conic_angle >= 360) $conic_angle -= 360
          if ($conic_angle < 0) $conic_angle += 360

          // Round during drag to avoid fractional degrees
          $conic_angle = Math.round($conic_angle)
        }
        
        dragulaState.lastAngle = currentAngle
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

      // if (dragulaState.moving && Math.abs(dragulaState.start.y - e.screenY) > 50) {
      //   dragYdelta = null
      //   $gradient_stops = updateStops(removeStop($gradient_stops, $gradient_stops.indexOf(dragulaState.stop)))
      // }

      dragulaState.moving = false
      dragulaState.rotating = false
      dragulaState.angle = null
      dragulaState.stop = null
      dragulaState.target = null
      dragulaState.left = null
      dragulaState.top = null
      dragulaState.start.x = null
      dragulaState.start.y = null
      dragulaState.removedStop = null
      dragulaState.removedIndex = null

      $active_stop_index = null
    }

    window.addEventListener('pointerup', stopWatching)
    window.addEventListener('dragleave', stopWatching)
  }

  function dragIt(node) {
    dragulaState.moving = true

    if (dragulaState.stop) {
      if (dragulaState.stop.kind === 'hint')
        dragulaState.angle = parseInt(dragulaState.stop.percentage)
      else if (dragulaState.stop.kind === 'stop')
        dragulaState.angle = parseInt(node.dataset.position === "1" 
          ? dragulaState.stop.position1 
          : dragulaState.stop.position2) 
    }
    else {
      dragulaState.left = $conic_position.x
      dragulaState.top = $conic_position.y
    }
  }

  function rotateIt(node) {
    dragulaState.rotating = true
    // Get the center point of the preview area
    const previewRect = node.closest('.preview')?.getBoundingClientRect()
    if (previewRect) {
      dragulaState.centerX = previewRect.left + previewRect.width / 2
      dragulaState.centerY = previewRect.top + previewRect.height / 2
      dragulaState.lastAngle = null
    }
  }

  function mouseOut() {
    $active_stop_index = null
  }

  function deleteStop(stop) {
    // Deletion disabled
    return
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
      // Deletion disabled
      return
    }
  }

  function relinkStop(stop) {
    stop.position2 = stop.position1
    $gradient_stops = updateStops($gradient_stops)
  }

  function gradientAngle(ng) {
    return ng - 90
  }

  function normalizeDeg(a) {
    a = a % 360
    if (a < 0) a += 360
    return a
  }

  function computeVisualOffsetDeg(root) {
    try {
      const stopsEl = root?.querySelector('.stops')
      const sample = root?.querySelector('.stops .stop')
      if (!stopsEl || !sample) return null
      const rect = stopsEl.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const srect = sample.getBoundingClientRect()
      const sx = srect.left + srect.width / 2
      const sy = srect.top + srect.height / 2
      let screenDeg = Math.atan2(sy - cy, sx - cx) * (180 / Math.PI)
      if (screenDeg < 0) screenDeg += 360

      // Read declared percent from the first stop element
      const idx = parseInt(sample.dataset.stopIndex)
      const pos = sample.dataset.position === '2' ? 'position2' : 'position1'
      const declared = ($gradient_stops?.[idx]?.[pos] ?? 0)
      const declaredDeg = (parseFloat(declared) / 100) * 360

      const offset = normalizeDeg(screenDeg - declaredDeg)
      return offset
    } catch { return null }
  }

  // Compute percent around the ring from pointer position
  function computePercentFromPointer(e) {
    const root = e.currentTarget.closest('.conic-overlay')
    const stopsEl = root?.querySelector('.stops')
    if (!stopsEl) return 0
    const rect = stopsEl.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    let deg = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI)
    if (deg < 0) deg += 360

    // Prefer dynamic visual offset derived from an existing stop; fall back to theoretical base
    const dynamicOffset = computeVisualOffsetDeg(root)
    const baseOffset = normalizeDeg($conic_angle - 180)
    const offset = dynamicOffset ?? baseOffset

    const localDeg = normalizeDeg(deg - offset)
    const percent = Math.round((localDeg / 360) * 100)
    return percent
  }

  function addStop(e) {
    const percent = computePercentFromPointer(e)

    const colors = $gradient_stops.filter(s => s.kind === 'stop')
    let k = colors.findIndex(s => parseFloat(s.position1) > percent)
    if (k === -1) k = colors.length

    const arrIdx = k * 2
    const newStop = {
      kind: 'stop',
      color: `oklch(80% 0.3 ${randomNumber(0,360)})`,
      auto: percent,
      position1: percent,
      position2: percent,
      _manual: true,
    }

    if (k === colors.length) {
      $gradient_stops.splice(arrIdx, 0, {kind: 'hint', percentage: null}, newStop)
    } else {
      $gradient_stops.splice(arrIdx, 0, newStop, {kind: 'hint', percentage: null})
    }

    $gradient_stops = updateStops($gradient_stops)
  }

  function onRingMove(e) {
    const percent = computePercentFromPointer(e)
    ghostPercent = percent
    showGhost = true
  }

  function onRingEnter() {
    showGhost = true
  }

  function onRingLeave() {
    showGhost = false
    ghostPercent = null
  }

  let position = $derived(overlayPosition(
    $conic_position,
    $conic_named_position,
    w, h
  ))
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div use:dragula class="conic-overlay" style="
  rotate: {gradientAngle($conic_angle)}deg;
  left: {position.x}; 
  top: {position.y};
  {position.x && 'translate: -50% -50%;'}
">
  <div class="pie" style="rotate: {$conic_angle * -1 + 90}deg">
    {#if $conic_angle > 0}
      <div class="visual-vert"></div>
    {/if}
    <div class="visual" style="--ng: {$conic_angle}deg"></div>
    <div class="dotted visual"></div>
    <div class="dot"></div>
  </div>
  <div class="invisible-rotator" use:tooltip={{content: `${$conic_angle}deg`}}></div>
  <div tabindex="0" class="dragzone" use:tooltip={{content: $conic_named_position == '--' ? `${position.x} ${position.y}` : $conic_named_position}} use:dragula style="max-inline-size: {w * .2}px"></div>
  <div class="invisible-ring" onclick={addStop} onmousemove={onRingMove} onmouseenter={onRingEnter} onmouseleave={onRingLeave}></div>
  <div class="stops" style="rotate: -90deg; translate: 0px -12px">
    {#if showGhost && ghostPercent !== null}
      <div class="ghost-stop-wrap" style="transform: rotateZ({(360 * (parseInt(ghostPercent) / 100))}deg) translate(0, 59px)">
        <div class="ghost-stop"></div>
      </div>
    {/if}
    {#each $gradient_stops as stop, i (stop)}
      {#if stop.kind === 'stop'}
        <div 
          tabindex="0"
          use:tooltip={{content: `${stop.position1}%`}}
          class="stop-wrap" 
          style="transform: rotateZ({(360 * (parseInt(stop.position1) / 100))}deg) translate(0, 59px)"
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
            style="transform: rotateZ({(360 * (parseInt(stop.position2) / 100))}deg) translate(0, 59px)"
            onmouseleave={mouseOut} 
            onkeydown={(e)=>handleKeypress(e,stop,'position2')}
            ondblclick={()=>relinkStop(stop)}
          >
            <div class="stop" data-stop-index={i} data-position="2" style="opacity: {Number(stop.position2) < Number(stop.position1) ? 0.5 : 1}">
              <button class="stop-color" style="background-color: {stop.color}" onclick={e => pickColor(stop,e)} use:tooltip={{content: stop.color}}></button>
            </div>
          </div>
        {/if}
      {/if}
      {#if stop.kind === 'hint'}
        <div 
          class="hint" 
          tabindex="0"
          use:tooltip={{content: stop.percentage != null ? `${stop.percentage}%` : ''}}
          data-stop-index={i} 
          style="
            transform: rotateZ({(360 * (parseInt(stop.percentage) / 100))}deg) translate(0, 85px);
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
  .conic-overlay {
    --line-1: hsl(0 0% 100% / 90%);
    --line-2: hsl(0 0% 100% / 50%);

    position: relative;
    grid-area: 1/1;
    display: grid;
    pointer-events: none;
    touch-action: none;
    will-change: translate, left, top;
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

  .invisible-ring {
    pointer-events: auto;
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    z-index: 0;
  }

  .stop-wrap {
    border-radius: var(--radius-round);
    translate: -50% 0;
    z-index: 3;
  }

  .ghost-stop-wrap {
    position: absolute;
    z-index: 1;
    pointer-events: none;
    translate: -50% 0;
  }

  .ghost-stop {
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in oklch, var(--surface-1) 40%, transparent);
    aspect-ratio: 1;
    inline-size: var(--size-5);
    border-radius: var(--radius-round);
    border: .25rem solid var(--line-2);
    box-shadow: none;
    opacity: 0.8;
  }

  .stop-wrap:has(:global(+ .stop-wrap)) .stop {
    clip-path: inset(0 0 0 50%);
  }

  .stop-wrap + .stop-wrap .stop {
    clip-path: inset(0 50% 0 0);
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
    z-index: 3;
  }

  .hint {
    translate: -50% 0%;
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

    rotate: 90deg;
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

    inline-size: var(--size-11);
    aspect-ratio: var(--ratio-square);
    border-radius: var(--radius-round);
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: 50%;
    transform: translate(-50%, -50%);
  }

  .visual:not(.dotted) {
    --line-1: white;
  }

  .dotted.visual {
    background-image: repeating-conic-gradient(
      var(--line-1), var(--line-1) 2%, 
      #0000 0%, #0000 4%
    );
  }

  .visual-vert {
    --line-1: white;
    block-size: var(--size-11);
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
    inline-size: var(--size-11);
    aspect-ratio: var(--ratio-square);
    border-radius: var(--radius-round);
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: 50%;
    transform: translate(-50%, -50%);
    cursor: ew-resize;
  }

  .dragzone {
    cursor: move;
    pointer-events: auto;
    place-self: center;
    inline-size: var(--size-8);
    aspect-ratio: var(--ratio-square);
    border-radius: var(--radius-round);
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: 50%;
    transform: translate(-50%, -50%);
    transition: box-shadow .5s var(--ease-3);
    --_shadow-size: 0px;
    box-shadow: inset 0 0 0 var(--_shadow-size) hsl(0 0% 100% / 25%);
    /* Ensure the position control is above ghost/hint/stop elements */
    z-index: 5;
  }

  .dragzone:hover {
    --_shadow-size: var(--size-11);
  }

  .stops {
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: 50%;
    display: grid;
    place-items: center;
    place-content: center;
    /* Let pointer events fall through unless on interactive children */
    pointer-events: none;
  }
</style>