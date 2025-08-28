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
    rotating: false,
    start: {x:null,y:null},
    delta: {x:null,y:null},
    left: null,
    stop: null,
    target: null,
    lastAngle: null,
    centerX: null,
    centerY: null,
    // simplified pull-away state
    removedStop: null,
    removedIndex: null,
  })

  // Ghost stop preview state for hover on the gradient line
  let ghostPercent = $state(null)
  let showGhost = $state(false)

  // Keep the visual angle in sync with named directions and preview size without mutating the store
  let visualAngleDeg = $derived(
    ($linear_named_angle !== '--' && w != null && h != null)
      ? Math.round(radToDeg(linear_keywords[$linear_named_angle](w, h)))
      : $linear_angle
  )

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
    let lastActiveIndex = null
    window.addEventListener('pointermove', e => {
      if (dragulaState.moving) {
        node.setPointerCapture(e.pointerId)
        let apercent = w / 100
        apercent = $linear_angle >= 180 ? -apercent : apercent
        dragulaState.left += (e.movementX || e.movementY * -1) / apercent

        // compute perpendicular distance to the rotated line
        const lineEl = node.querySelector('.line')
        if (lineEl) {
          const rect = lineEl.getBoundingClientRect()
          const cx = rect.left + rect.width / 2
          const cy = rect.top + rect.height / 2
          const rot = (($linear_angle - 90) * Math.PI) / 180
          const ux = Math.cos(rot), uy = Math.sin(rot)
          const nx = -uy, ny = ux
          const vx = e.clientX - cx
          const vy = e.clientY - cy
          const perp = vx * nx + vy * ny
          const absPerp = Math.abs(perp)

          const armThresh = 75

          // Pull-away removal
          if (absPerp >= armThresh && !dragulaState.removedStop && dragulaState.stop?.kind === 'stop') {
            const pos = $gradient_stops.indexOf(dragulaState.stop)
            if (pos !== -1) {
              // keep a working reference so we can update its position while removed
              dragulaState.removedStop = dragulaState.stop
              dragulaState.removedIndex = pos
              $gradient_stops = updateStops(removeStop($gradient_stops, pos))
            }
          }
          // Return to line: add back if previously removed
          else if (absPerp < armThresh && dragulaState.removedStop) {
            const idx = dragulaState.removedIndex ?? $gradient_stops.length
            // restore stop and a hint placeholder after it to keep pattern
            $gradient_stops.splice(idx, 0, dragulaState.removedStop, {kind: 'hint', percentage: null})
            $gradient_stops = updateStops($gradient_stops)
            // clear removed markers so we continue editing the live stop
            dragulaState.stop = dragulaState.removedStop
            dragulaState.removedStop = null
            dragulaState.removedIndex = null
          }
        }

        // Update positions: if removed, keep updating the temp stop so it comes back at the right place
        const targetStop = dragulaState.removedStop ?? dragulaState.stop
        if (targetStop) {
          if (targetStop.kind === 'stop') {
            if (targetStop.position1 === targetStop.position2)
              targetStop.position2 = Math.round(dragulaState.left)

            if (dragulaState.target?.dataset.position === "1")
              targetStop.position1 = Math.round(dragulaState.left)
            else
              targetStop.position2 = Math.round(dragulaState.left)
          }
          else {
            targetStop.percentage = Math.round(dragulaState.left)
          }
        }

        // if we're actively editing a stop still in the list, push changes
        if (!dragulaState.removedStop) {
          $gradient_stops = [...$gradient_stops]
        }
      }
      else if (dragulaState.rotating) {
        node.setPointerCapture(e.pointerId)
        $linear_named_angle = '--'

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

          // Update the linear angle
          $linear_angle += angleDiff

          // Keep angle in 0-360 range
          if ($linear_angle >= 360) $linear_angle -= 360
          if ($linear_angle < 0) $linear_angle += 360

          // Round during drag to avoid fractional degrees
          $linear_angle = Math.round($linear_angle)
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

      // If we ended with the stop removed, keep it removed. If it was reattached already, nothing to do.
      dragulaState.moving = false
      dragulaState.rotating = false
      dragulaState.stop = null
      dragulaState.target = null
      dragulaState.start.x = null
      dragulaState.start.y = null
      dragYdelta = null
      dragulaState.removedStop = null
      dragulaState.removedIndex = null

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

  function gradientLineLength(a) {
    if (!w && !h) return null
    a = degToRad(a)
    let l = Math.round(Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a)))
    return l + 'px'
  }

  function gradientAngle(ng) {
    return ng - 90
  }

  // Compute percent by projecting the mouse onto the rotated line axis to avoid drift
  function computePercentFromPointer(e) {
    // Find the visual line element and its center in screen space
    const overlay = e.currentTarget.parentElement
    const lineEl = overlay.querySelector('.line')
    if (!lineEl) return 0
    const lineRect = lineEl.getBoundingClientRect()
    const cx = lineRect.left + lineRect.width / 2
    const cy = lineRect.top + lineRect.height / 2

    // Direction unit vector of the line in screen space
    const rotDeg = ( $linear_angle - 90 )
    const rot = rotDeg * Math.PI / 180
    const ux = Math.cos(rot)
    const uy = Math.sin(rot)

    // Vector from center to pointer in screen space
    const px = e.clientX - cx
    const py = e.clientY - cy

    // Signed distance along the line axis
    const t = px * ux + py * uy

    // Visual line length in px
    const a = (Math.PI / 180) * $linear_angle
    const L = Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a))

    // Map [-L/2, L/2] -> [0,100]
    const percent = ((t + L / 2) / L) * 100
    return Math.round(percent)
  }

  function addStop(e) {
    let percent = computePercentFromPointer(e)

    // Determine insertion point among color stops
    const colors = $gradient_stops.filter(s => s.kind === 'stop')
    let k = colors.findIndex(s => parseFloat(s.position1) > percent)
    if (k === -1) k = colors.length // append at end

    // Map color index to full array index (pattern: stop, hint, stop, hint, ...)
    let arrIdx = k * 2

    const newStop = {
      kind: 'stop',
      color: `oklch(80% 0.3 ${randomNumber(0,360)})`,
      auto: percent,
      position1: percent,
      position2: percent,
      _manual: true,
    }

    if (k === colors.length) {
      // Appending after last color: need a hint between last and new
      $gradient_stops.splice(arrIdx, 0, {kind: 'hint', percentage: null}, newStop)
    } else {
      // Inserting before an existing color: keep existing hint between previous and new,
      // and add a new hint between new and next
      $gradient_stops.splice(arrIdx, 0, newStop, {kind: 'hint', percentage: null})
    }

    $gradient_stops = updateStops($gradient_stops)
  }

  function onTrackMove(e) {
    let percent = computePercentFromPointer(e)
    ghostPercent = percent
    showGhost = true
  }

  function onTrackEnter() {
    showGhost = true
  }

  function onTrackLeave() {
    showGhost = false
    ghostPercent = null
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
<div class="visual" style="--ng: {visualAngleDeg}deg"></div>
  <div class="dot"></div>
</div>
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div use:dragula class="linear-overlay" style="rotate: {gradientAngle(visualAngleDeg)}deg">
  <div class="invisible-rotator" use:tooltip={{content: $linear_named_angle == '--' ? `${$linear_angle}deg` : $linear_named_angle}}></div>
  <div class="invisible-track" onclick={addStop} onmousemove={onTrackMove} onmouseenter={onTrackEnter} onmouseleave={onTrackLeave}></div>
  <div class="line" style="width: {gradientLineLength(visualAngleDeg)}">
    {#if showGhost && ghostPercent !== null}
      <div class="ghost-stop-wrap" style="inset-inline-start: {ghostPercent}%">
        <div class="ghost-stop"></div>
      </div>
    {/if}
    {#each $gradient_stops as stop, i (stop)}
      {#if stop.kind === 'stop'}
        <div
          tabindex="0"
          use:tooltip={{content: `${stop.position1}%`}}
          class="stop-wrap"
          style="inset-inline-start: {stop.position1}%; --contrast-fill: {contrast_color_prefer_white(stop.color)}"
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
            style="inset-inline-start: {stop.position2}%; --contrast-fill: {contrast_color_prefer_white(stop.color)}"
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
    /* Remove the plus cursor; just use default */
    cursor: default;
    pointer-events: auto;
    position: absolute;
    block-size: 1rem;
    inline-size: 100%;
    inset-block-start: 50%;
    inset-inline-start: 0;
    transform: translateY(-50%);
  }

  .ghost-stop-wrap {
    position: absolute;
    inset-block-start: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
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

.stop-wrap {
    transition: none;
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
