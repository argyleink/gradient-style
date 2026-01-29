<script lang="ts">
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
    start: {x: null as number | null, y: null as number | null},
    delta: {x: null as number | null, y: null as number | null},
    left: null as number | null,
    stopIndex: null as number | null,
    target: null as HTMLElement | null,
    lastAngle: null as number | null,
    centerX: null as number | null,
    centerY: null as number | null,
    // simplified pull-away state
    removedStop: null as any,
    removedIndex: null as number | null,
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

  // Snap named angle when numeric angle matches a named value (e.g., via slider)
  const NAMED_ANGLES = [
    ['to top', 0],
    ['to top right', 45],
    ['to right', 90],
    ['to bottom right', 135],
    ['to bottom', 180],
    ['to bottom left', 225],
    ['to left', 270],
    ['to top left', 315],
  ]

  $effect(() => {
    if (dragulaState.rotating) return
    const val = Number($linear_angle)
    if (Number.isNaN(val)) return
    const match = NAMED_ANGLES.find(([_, deg]) => deg === ((val % 360) + 360) % 360)
    if (match && $linear_named_angle !== match[0]) {
      // Update named angle so UI reflects the keyword state
      $linear_named_angle = match[0]
    }
  })

  function pickColor(stop: any, e: Event) {
    const picker = document.getElementById('color-picker') as any

    // Start the picker from the current stop color to avoid stale values
    $picker_value = stop.color

    picker.setAnchor((e as PointerEvent).target as HTMLElement)
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

  function dragula(node: HTMLElement) {
    // Define handlers so we can clean them up on destroy
    const onPointerDown = (e: PointerEvent) => {
      const isStop = (e.target as HTMLElement)?.closest('[data-stop-index]')
      const isRotator = (e.target as HTMLElement)?.closest('.invisible-rotator')

      if (isStop) {
        // If clicking the color swatch, let the click go through (no drag)
        if ((e.target as HTMLElement)?.closest('.stop-color')) return
        const idx = Number(isStop.dataset.stopIndex)
        $active_stop_index = idx
        dragulaState.target = isStop
        dragulaState.start.x = e.screenX
        dragulaState.start.y = e.screenY
        dragulaState.stopIndex = idx
        // Do not start dragging yet; wait for movement threshold in pointermove
      }
      else if (isRotator) {
        try { node.setPointerCapture(e.pointerId) } catch {}
        // If starting rotation from a named angle, normalize numeric angle first to avoid a visual jump
        if ($linear_named_angle !== '--') {
          // Align the numeric store with the visual angle immediately
          $linear_angle = visualAngleDeg
          $linear_named_angle = '--'
        }
        // Initialize rotation anchor from current pointer so the first delta starts from here
        const previewRect = isRotator.closest('.preview')?.getBoundingClientRect()
        if (previewRect) {
          dragulaState.centerX = previewRect.left + previewRect.width / 2
          dragulaState.centerY = previewRect.top + previewRect.height / 2
          const deltaX = e.clientX - dragulaState.centerX
          const deltaY = e.clientY - dragulaState.centerY
          let currentAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI)
          if (currentAngle < 0) currentAngle += 360
          dragulaState.lastAngle = currentAngle
        }
        rotateIt(isRotator)
      }
    }

    let lastActiveIndex: number | null = null
    const onPointerMove = (e: PointerEvent) => {
      // Arm drag on small movement to preserve click/dblclick behavior
      if (!dragulaState.moving && dragulaState.stopIndex != null) {
        const dx = (e.screenX ?? 0) - (dragulaState.start.x ?? 0)
        const dy = (e.screenY ?? 0) - (dragulaState.start.y ?? 0)
        if (Math.hypot(dx, dy) > 3) {
          dragulaState.moving = true
          try { node.setPointerCapture(e.pointerId) } catch {}
          dragIt(dragulaState.target)
        }
      }
      if (dragulaState.moving) {
        try { node.setPointerCapture(e.pointerId) } catch {}
        // Project pointer movement onto the line axis for natural dragging in any orientation
        const rot = (visualAngleDeg - 90) * Math.PI / 180
        const ux = Math.cos(rot)
        const uy = Math.sin(rot)
        const dot = (e.movementX || 0) * ux + (e.movementY || 0) * uy
        const a = visualAngleDeg * Math.PI / 180
        const L = Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a)) || 1
        const deltaPercent = (dot / L) * 100
        dragulaState.left += deltaPercent
        // Clamp within 0-100
        if (dragulaState.left < 0) dragulaState.left = 0
        if (dragulaState.left > 100) dragulaState.left = 100

        // compute perpendicular distance to the rotated line (removals disabled)
        // Retain math for potential future features, but do not remove stops when pulling away
        const lineEl = node.querySelector('.line') as HTMLElement
        if (lineEl) {
          const rect = lineEl.getBoundingClientRect()
          const cx = rect.left + rect.width / 2
          const cy = rect.top + rect.height / 2
          const rot = ((visualAngleDeg - 90) * Math.PI) / 180
          const ux = Math.cos(rot), uy = Math.sin(rot)
          const nx = -uy, ny = ux
          const vx = e.clientX - cx
          const vy = e.clientY - cy
          const perp = vx * nx + vy * ny

          const removeArm = 36
          const insertArm = 24
          if (Math.abs(perp) > removeArm && dragulaState.stopIndex != null && !dragulaState.removedStop) {
            // Remove stop if more than one color stop remains
            const colorCount = ($gradient_stops || []).filter(s => s?.kind === 'stop').length
            if (colorCount > 1) {
              dragulaState.removedStop = { ...( $gradient_stops[dragulaState.stopIndex] ) }
              dragulaState.removedIndex = dragulaState.stopIndex
              $gradient_stops = updateStops(removeStop($gradient_stops, dragulaState.stopIndex))
              dragulaState.stopIndex = null
            }
          }
          else if (Math.abs(perp) <= insertArm && dragulaState.removedStop && dragulaState.stopIndex == null) {
            // Reinsert near current left percent
            const percent = Math.max(0, Math.min(100, Math.round(dragulaState.left)))
            const colors = $gradient_stops.filter(s => s.kind === 'stop')
            let k = colors.findIndex(s => parseFloat(s.position1 as string) > percent)
            if (k === -1) k = colors.length
            const arrIdx = k * 2
            const newStop = {
              kind: 'stop',
              color: dragulaState.removedStop.color,
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
            dragulaState.stopIndex = arrIdx
            dragulaState.removedStop = null
            dragulaState.removedIndex = null
          }
        }

        // Update positions by current index from the store to avoid stale references
        const idx = dragulaState.stopIndex
        const targetStop = $gradient_stops?.[idx]
        if (targetStop) {
          if (targetStop.kind === 'stop') {
            if (targetStop.position1 === targetStop.position2)
              targetStop.position2 = Math.round(dragulaState.left)

            if (dragulaState.target?.dataset.position === "1")
              targetStop.position1 = Math.round(dragulaState.left)
            else
              targetStop.position2 = Math.round(dragulaState.left)
          } else {
            targetStop.percentage = Math.round(dragulaState.left)
          }
          $gradient_stops = [...$gradient_stops]
        }
      }
      else if (dragulaState.rotating) {
        try { node.setPointerCapture(e.pointerId) } catch {}
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

      const target = (e.target as HTMLElement)?.closest('[data-stop-index]')
      if (target) {
        const idx = target.dataset.stopIndex
        if (lastActiveIndex !== idx) {
          $active_stop_index = idx
          lastActiveIndex = idx
        }
      }
    }

    const stopWatching = (e: PointerEvent) => {
      try { node.releasePointerCapture(e.pointerId) } catch {}

      // If we ended with the stop removed and never reinserted, keep it removed. If reattached already, nothing to do.
      const wasRotating = dragulaState.rotating
      dragulaState.moving = false
      dragulaState.rotating = false
      dragulaState.stopIndex = null
      dragulaState.target = null
      dragulaState.start.x = null
      dragulaState.start.y = null
      dragYdelta = null
      dragulaState.removedStop = null
      dragulaState.removedIndex = null

      // Snap to a named direction if very close to it
      if (wasRotating && $linear_angle != null) {
        const val = Number($linear_angle)
        if (!Number.isNaN(val)) {
          const names = [
            ['to top', 0],
            ['to top right', 45],
            ['to right', 90],
            ['to bottom right', 135],
            ['to bottom', 180],
            ['to bottom left', 225],
            ['to left', 270],
            ['to top left', 315],
          ]
          const tol = 1 // degree tolerance
          for (const [name, deg] of names) {
            const d = Math.abs((((val - deg) % 360) + 540) % 360 - 180)
            if (d <= tol) { $linear_named_angle = name; break }
          }
        }
      }

      $active_stop_index = null
    }

    node.addEventListener('pointerdown', onPointerDown, { passive: false })
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', stopWatching)
    window.addEventListener('dragleave', stopWatching)

    return {
      destroy() {
        node.removeEventListener('pointerdown', onPointerDown)
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', stopWatching)
        window.removeEventListener('dragleave', stopWatching)
      }
    }
  }

  function dragIt(node: HTMLElement | null) {
    dragulaState.moving = true

    const idx = dragulaState.stopIndex
    const s = $gradient_stops?.[idx as number]
    if (!s || !node) return
    if (s.kind === 'hint')
      dragulaState.left = parseInt(s.percentage as string)
    else
      dragulaState.left = parseInt(node.dataset.position === "1"
        ? (s.position1 as string)
        : (s.position2 as string))
  }

  function rotateIt(node: HTMLElement) {
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

  function gradientLineLength(a: number) {
    if (!w && !h) return null
    a = degToRad(a)
    let l = Math.round(Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a)))
    return l + 'px'
  }

  function gradientAngle(ng: number) {
    return ng - 90
  }

  // Compute percent by projecting the mouse onto the rotated line axis to avoid drift
  function computePercentFromPointer(e: PointerEvent) {
    // Find the visual line element and its center in screen space
    const overlay = e.currentTarget?.parentElement as HTMLElement
    const lineEl = overlay.querySelector('.line') as HTMLElement
    if (!lineEl) return 0
    const lineRect = lineEl.getBoundingClientRect()
    const cx = lineRect.left + lineRect.width / 2
    const cy = lineRect.top + lineRect.height / 2

    // Direction unit vector of the line in screen space
    const rotDeg = ( visualAngleDeg - 90 )
    const rot = rotDeg * Math.PI / 180
    const ux = Math.cos(rot)
    const uy = Math.sin(rot)

    // Vector from center to pointer in screen space
    const px = e.clientX - cx
    const py = e.clientY - cy

    // Signed distance along the line axis
    const t = px * ux + py * uy

    // Visual line length in px
    const a = (Math.PI / 180) * visualAngleDeg
    const L = Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a))

    // Map [-L/2, L/2] -> [0,100]
    const percent = ((t + L / 2) / L) * 100
    return Math.round(percent)
  }

  function addStop(e: PointerEvent) {
    let percent = computePercentFromPointer(e)

    // Determine insertion point among color stops
    const colors = $gradient_stops.filter(s => s.kind === 'stop')
    let k = colors.findIndex(s => parseFloat(s.position1 as string) > percent)
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

  function onTrackMove(e: PointerEvent) {
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

  function colorStopCount() {
    return ($gradient_stops || []).filter(s => s?.kind === 'stop').length
  }

  function deleteStop(stop: any) {
    // Do not allow removing the last remaining color stop
    if (colorStopCount() <= 1) return
    $gradient_stops = updateStops(removeStop($gradient_stops, $gradient_stops.indexOf(stop)))
  }

  function relinkStop(stop: any) {
    stop.position2 = stop.position1
    $gradient_stops = updateStops($gradient_stops)
  }

  function handleKeypress(e: KeyboardEvent, stop: any, prop: string) {
    if ((e.target as HTMLElement)?.classList.contains('stop-color')) return

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
      e.preventDefault()
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
  <div class="invisible-track" onclick={(e: MouseEvent) => addStop(e as PointerEvent)} onmousemove={(e: MouseEvent) => onTrackMove(e as PointerEvent)} onmouseenter={onTrackEnter} onmouseleave={onTrackLeave}></div>
  <div class="line" style="width: {gradientLineLength(visualAngleDeg)}">
    {#if showGhost && ghostPercent !== null}
      <div class="ghost-stop-wrap" style="inset-inline-start: {ghostPercent}%">
        <div class="ghost-stop"></div>
      </div>
    {/if}
    {#each $gradient_stops as stop, i (stop.id || i)}
      {#if stop.kind === 'stop'}
        <div
          tabindex="0"
          use:tooltip={{content: `${stop.position1}%`}}
          class="stop-wrap"
          style="inset-inline-start: {stop.position1}%; --contrast-fill: {contrast_color_prefer_white(stop.color)}"
          onmouseleave={mouseOut}
          onkeydown={(e: KeyboardEvent)=>handleKeypress(e,stop,'position1')}
        >
          <div class="stop" data-stop-index={i} data-position="1" ondblclick={()=>deleteStop(stop)}>
            <button class="stop-color" style="background-color: {stop.color}" onclick={(e: MouseEvent) => pickColor(stop,e)} use:tooltip={{content: stop.color}}></button>
          </div>
        </div>
        {#if stop.position1 !== stop.position2}
          <div
            tabindex="0"
            use:tooltip={{content: `${stop.position2}%`}}
            class="stop-wrap"
            style="inset-inline-start: {stop.position2}%; --contrast-fill: {contrast_color_prefer_white(stop.color)}"
            onmouseleave={mouseOut}
            onkeydown={(e: KeyboardEvent)=>handleKeypress(e,stop,'position2')}
            ondblclick={()=>relinkStop(stop)}
          >
            <div class="stop" data-stop-index={i} data-position="2" style="opacity: {Number(stop.position2) < Number(stop.position1) ? 0.5 : 1}">
              <button class="stop-color" style="background-color: {stop.color}" onclick={(e: MouseEvent) => pickColor(stop,e)} use:tooltip={{content: stop.color}}></button>
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
          onkeydown={(e: KeyboardEvent)=>handleKeypress(e,stop,'percentage')}
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
