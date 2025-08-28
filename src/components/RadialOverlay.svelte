<script>
  import { tooltip } from 'svooltip'

  import {gradient_stops, gradient_space, active_stop_index} from '../store/gradient.ts'
  import {radial_shape, radial_position, radial_named_position, radial_size
  } from '../store/radial.ts'
  import {picker_value} from '../store/colorpicker.ts'

  import {namedPosToPercent} from '../utils/radial.ts'
  import {contrast_color_prefer_white} from '../utils/color.ts'
  import {updateStops, removeStop} from '../utils/stops.ts'
  import {randomNumber} from '../utils/numbers.ts'

  /**
   * @typedef {Object} Props
   * @property {any} [w]
   * @property {any} [h]
   */

  /** @type {Props} */
  let { w = null, h = null } = $props();
  let dragYdelta = null

  // Ghost stop preview state for hover on the gradient line
  let ghostPercent = $state(null)
  let showGhost = $state(false)

  const dragulaState = $state({
    moving: false,
    start: {x:null,y:null},
    delta: {x:null,y:null},
    left: null,
    top: null,
    stopIndex: null,
    target: null,
    // simplified pull-away state for radial
    removedStop: null,
    removedIndex: null,
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
    const onPointerDown = (e) => {
      const isStop = e.target.closest('[data-stop-index]')
      const isTrack = e.target.closest('.invisible-track')

      if (isStop) {
        e.preventDefault()
        e.stopPropagation()
        const idx = Number(isStop.dataset.stopIndex)
        $active_stop_index = idx
        dragulaState.target = isStop
        dragulaState.start.x = e.screenX
        dragulaState.start.y = e.screenY
        dragulaState.stopIndex = idx
        try { isStop.setPointerCapture(e.pointerId) } catch {}
        try { node.setPointerCapture(e.pointerId) } catch {}
        dragIt(isStop)
      }
      else if (isTrack) {
        // Allow click-to-add without starting a drag move of the center
        return
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
        try { node.setPointerCapture(e.pointerId) } catch {}
        dragIt(e.target)
      }
    }

    let lastActiveIndex = null
    const onPointerMove = (e) => {
      if (dragulaState.moving && dragulaState.stopIndex != null) {
        try { node.setPointerCapture(e.pointerId) } catch {}
        let apercent = (size.w / 2) / 100
        dragulaState.left += (e.movementX || e.movementY * -1) / apercent

          // Pull-away removal disabled
          const lineEl = node.querySelector('.line')
          if (lineEl) {
            const rect = lineEl.getBoundingClientRect()
            const cy = rect.top + rect.height / 2
            const perp = e.clientY - cy
            void perp
          }

        // Update positions using current index to avoid stale references
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
    }

    const stopWatching = (e) => {
      try { node.releasePointerCapture(e.pointerId) } catch {}

      dragulaState.moving = false
      dragulaState.stopIndex = null
      dragulaState.target = null
      dragulaState.start.x = null
      dragulaState.start.y = null
      dragulaState.removedStop = null
      dragulaState.removedIndex = null

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

  function dragIt(node) {
    dragulaState.moving = true

    if (dragulaState.stopIndex != null) {
      const s = $gradient_stops?.[dragulaState.stopIndex]
      if (!s) return
      if (s.kind === 'hint')
        dragulaState.left = parseInt(s.percentage)
      else if (s.kind === 'stop')
        dragulaState.left = parseInt(node.dataset.position === "1"
          ? s.position1
          : s.position2)
    }
    else {
      dragulaState.left = $radial_position.x
      dragulaState.top = $radial_position.y
    }
  }

  function gradientLineLength() {
    return size.w / 2 + 'px'
  }

  // Map a pointer event to a percent along the horizontal line
  function computePercentFromPointer(e) {
    const overlay = e.currentTarget.closest('.overlay')
    const lineEl = overlay?.querySelector('.line')
    if (!lineEl) return 0
    const rect = lineEl.getBoundingClientRect()
    const t = (e.clientX - rect.left) / rect.width
    const percent = Math.max(0, Math.min(100, Math.round(t * 100)))
    return percent
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
  <div class="invisible-track" onclick={addStop} onmousemove={onTrackMove} onmouseenter={onTrackEnter} onmouseleave={onTrackLeave}></div>
  <div class="line" style="width: {gradientLineLength(size)}">
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
          style="inset-inline-start: {stop.position1}%;inset-block-end: {dragulaState.stop == stop && dragYdelta !== null ? dragYdelta+'px':''}; --contrast-fill: {contrast_color_prefer_white(stop.color)}"
          onmouseleave={mouseOut}
          onkeydown={(e)=>handleKeypress(e,stop,'position1')}
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
    transform: translate(0%, -50%);
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
    z-index: 1;
  }

  .dragzone:hover {
    --_shadow-size: var(--size-10);
  }

  .stop-wrap {
    border-radius: var(--radius-round);
    translate: -50% 0;
  }

.invisible-track {
    pointer-events: auto;
    position: absolute;
    inset-block-start: 50%;
    inset-inline: 0;
    block-size: 1rem;
    transform: translateY(-50%);
    cursor: default;
    z-index: 0;
  }

  .ghost-stop-wrap {
    position: absolute;
    inset-block-start: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 1;
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
    z-index: 3; /* ensure stops/hints hover over track/ghost */
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
