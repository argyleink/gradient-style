import { writable, get } from 'svelte/store'
import { tick } from 'svelte'

import { layers, active_layer_index, selectLayer, type GradientLayer } from './layers'
import { buildGradientStrings } from '../utils/gradientString'

/*
 * Undo / redo
 *
 * The `layers` store is the single source of truth for everything a user can
 * edit (stops, angle, type, color space, interpolation, positions, layer
 * order/visibility/names), so history snapshots the layer list. The
 * single-value stores (gradient_type, linear_angle, ...) are mirrors of the
 * active layer and get re-synced through selectLayer() when a snapshot is applied.
 *
 * Bursts are coalesced into one step:
 *  - pointer interactions (drags on overlays, sliders, color areas) commit once,
 *    on pointerup
 *  - everything else (keyboard nudges, typing, selects) commits after the edits
 *    settle for SETTLE_MS
 */

export type HistorySnapshot = {
  layers: GradientLayer[]
  active: number
  key: string
}

export type HistoryState = { layers: GradientLayer[]; active: number }

const LIMIT = 100
const SETTLE_MS = 400

// identity of a snapshot: ignore ids and cached CSS, they're derived/random
export function snapshotKey(list: GradientLayer[]): string {
  return JSON.stringify(list.map(({ id, cachedCss, ...rest }) => rest))
}

function cloneLayers(list: GradientLayer[]): GradientLayer[] {
  return list.map(({ cachedCss, ...rest }) => structuredClone(rest) as GradientLayer)
}

function layerKey(layer: GradientLayer): string {
  const { id, cachedCss, ...rest } = layer
  return JSON.stringify(rest)
}

/**
 * Which layer to focus when moving from `from` to `target`: the first layer
 * whose content differs (matched by id), else, for pure reorders/no-ops, the
 * layer that was active in `from`, else the target's own active index.
 */
export function focusIndex(target: HistorySnapshot, from: HistorySnapshot): number {
  const before = new Map(from.layers.map(l => [l.id, layerKey(l)]))
  const changed = target.layers.findIndex(l => before.get(l.id) !== layerKey(l))
  if (changed !== -1) return changed
  const activeId = from.layers[from.active]?.id
  const same = target.layers.findIndex(l => l.id === activeId)
  return same !== -1 ? same : target.active
}

function takeSnapshot(state: HistoryState): HistorySnapshot {
  return {
    layers: cloneLayers(state.layers),
    active: state.active,
    key: snapshotKey(state.layers),
  }
}

/**
 * Framework-free undo/redo stack. `read` returns the live state, `write`
 * applies a snapshot back to the app.
 */
export function createHistory({ read, write, limit = LIMIT }: {
  read: () => HistoryState
  write: (snapshot: HistorySnapshot, focusIndex: number) => void
  limit?: number
}) {
  let past: HistorySnapshot[] = []
  let future: HistorySnapshot[] = []
  let present: HistorySnapshot = takeSnapshot(read())

  return {
    /** Push the live state as a new step if it differs from the last one. */
    record(): boolean {
      const next = takeSnapshot(read())
      if (next.key === present.key) return false
      past.push(present)
      if (past.length > limit) past.splice(0, past.length - limit)
      present = next
      future = []
      return true
    },
    /** Adopt the live state as the current step without creating a new one. */
    rebase() {
      present = takeSnapshot(read())
    },
    reset() {
      past = []
      future = []
      present = takeSnapshot(read())
    },
    undo(): boolean {
      const prev = past.pop()
      if (!prev) return false
      future.push(present)
      // focus the layer the undone edit happened on
      const focus = focusIndex(prev, present)
      present = prev
      write(prev, focus)
      return true
    },
    redo(): boolean {
      const next = future.pop()
      if (!next) return false
      past.push(present)
      const focus = focusIndex(next, present)
      present = next
      write(next, focus)
      return true
    },
    get canUndo() { return past.length > 0 },
    get canRedo() { return future.length > 0 },
    get size() { return { past: past.length, future: future.length } },
  }
}

// ---------------------------------------------------------------------------
// App wiring
// ---------------------------------------------------------------------------

export const can_undo = writable(false)
export const can_redo = writable(false)

let history: ReturnType<typeof createHistory> | null = null
let applying = false
let dirty = false
let pointerActive = false
let settleTimer: ReturnType<typeof setTimeout> | undefined

function readState(): HistoryState {
  return { layers: get(layers), active: get(active_layer_index) ?? 0 }
}

function writeState(snapshot: HistorySnapshot, focusIndex: number) {
  applying = true
  const restored = snapshot.layers.map(l => {
    const layer = structuredClone(l)
    layer.cachedCss = buildGradientStrings(layer)
    return layer
  })
  const idx = Math.max(0, Math.min(restored.length - 1, focusIndex))
  layers.set(restored)
  active_layer_index.set(idx)
  selectLayer(idx) // re-sync the single-value stores the editor UI reads

  // Mirrors and component effects may normalize the state on the way back in
  // (and flush after tick()); absorb that into the current step instead of
  // recording it as a new edit, which would wipe the redo stack.
  tick().then(() => setTimeout(() => {
    history?.rebase()
    applying = false
    syncFlags()
  }, 0))
}

function syncFlags() {
  can_undo.set(!!history && (history.canUndo || dirty))
  can_redo.set(!!history && !dirty && history.canRedo)
}

function commit() {
  clearTimeout(settleTimer)
  if (!history || !dirty) return
  dirty = false
  history.record()
  syncFlags()
}

function onLayersChange() {
  if (!history || applying) return
  dirty = true
  clearTimeout(settleTimer)
  if (!pointerActive) settleTimer = setTimeout(commit, SETTLE_MS)
  syncFlags()
}

function onPointerDown() {
  // a new gesture starts a new step
  commit()
  pointerActive = true
}

function onPointerUp() {
  if (!pointerActive) return
  pointerActive = false
  // layer updates flush after tick(); let the last mutation land first
  setTimeout(commit, 0)
}

// Native popups (classic <select> dropdowns, context menus) can swallow the
// pointerup. A mouse move with no buttons held, a context menu or the page
// hiding all mean the gesture is over.
function onPointerMove(e: PointerEvent) {
  if (pointerActive && e.pointerType === 'mouse' && e.buttons === 0) onPointerUp()
}

function onGestureBreak() {
  if (pointerActive) onPointerUp()
}

// app-level undo/redo is off while a gesture or a modal (color picker, import
// dialog) is in flight: they hold references to the live stop objects
function blocked() {
  return pointerActive || !!document.querySelector('dialog[open]')
}

export function undo() {
  if (!history || applying || blocked()) return false
  commit()
  const ok = history.undo()
  syncFlags()
  return ok
}

export function redo() {
  if (!history || applying || blocked()) return false
  commit()
  const ok = history.redo()
  syncFlags()
  return ok
}

/**
 * Start recording. Call once the initial state (URL restore) has landed.
 * Returns a teardown function.
 */
let teardown: (() => void) | null = null

export function initHistory(): () => void {
  teardown?.()
  let unsubscribe = () => {}
  let alive = true

  // wait for the restore's mirrored layer updates to flush before taking the baseline
  tick().then(() => setTimeout(() => {
    if (!alive) return
    history = createHistory({ read: readState, write: writeState })
    unsubscribe = layers.subscribe(onLayersChange)
    dirty = false // the subscribe call fires immediately with the baseline
    syncFlags()
  }, 0))

  window.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true })
  window.addEventListener('pointerup', onPointerUp, { capture: true, passive: true })
  window.addEventListener('pointercancel', onPointerUp, { capture: true, passive: true })
  window.addEventListener('pointermove', onPointerMove, { capture: true, passive: true })
  window.addEventListener('contextmenu', onGestureBreak, { capture: true })
  window.addEventListener('blur', onGestureBreak)
  document.addEventListener('visibilitychange', onGestureBreak)

  return teardown = () => {
    teardown = null
    alive = false
    unsubscribe()
    clearTimeout(settleTimer)
    window.removeEventListener('pointerdown', onPointerDown, { capture: true })
    window.removeEventListener('pointerup', onPointerUp, { capture: true })
    window.removeEventListener('pointercancel', onPointerUp, { capture: true })
    window.removeEventListener('pointermove', onPointerMove, { capture: true })
    window.removeEventListener('contextmenu', onGestureBreak, { capture: true })
    window.removeEventListener('blur', onGestureBreak)
    document.removeEventListener('visibilitychange', onGestureBreak)
    history = null
    dirty = false
    pointerActive = false
    syncFlags()
  }
}
