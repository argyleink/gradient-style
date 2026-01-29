import { writable, get } from 'svelte/store'
import { tick } from 'svelte'

import { gradient_type, gradient_space, gradient_interpolation, gradient_stops, gradient_angles } from './gradient'
import { linear_angle, linear_named_angle } from './linear'
import { radial_shape, radial_position, radial_named_position, radial_size } from './radial'
import { conic_angle, conic_position, conic_named_position } from './conic'

import { buildGradientStrings } from '../utils/gradientString'

// Pending mutations for batching rapid store updates via Svelte's tick()
let pendingLayerUpdates: ((l: GradientLayer) => void)[] = []
// Track the target layer index when updates are queued to prevent applying to wrong layer
let pendingLayerIndex: number | null = null
// Track whether a tick-based flush is already scheduled
let flushScheduled = false

// Minimal layer shape mirroring the single-store shape
export type GradientLayer = {
  id: string
  name: string
  visible: boolean
  type: string
  space: string
  interpolation: string
  stops: any[]
  linear: { named_angle: string | null; angle: string | number | null }
  radial: { shape: string; size: string; named_position: string; position: { x: number | null; y: number | null } }
  conic: { angle: string | number; named_position: string; position: { x: number | null; y: number | null } }
  cachedCss?: { modern: string; classic: string }
}

function uid() {
  try { return (crypto as any)?.randomUUID?.() ?? `layer-${Date.now()}-${Math.random().toString(36).slice(2)}` }
  catch { return `layer-${Date.now()}-${Math.random().toString(36).slice(2)}` }
}

export const layers = writable<GradientLayer[]>([])
export const active_layer_index = writable<number>(0)

let isApplyingLayerToStores = false // guard to prevent feedback loops

function snapshotFromStores(): GradientLayer {
  const layer: GradientLayer = {
    id: uid(),
    name: 'Layer',
    visible: true,
    type: get(gradient_type),
    space: get(gradient_space),
    interpolation: get(gradient_interpolation),
    stops: structuredClone(get(gradient_stops)),
    linear: {
      named_angle: get(linear_named_angle),
      angle: get(linear_angle),
    },
    radial: {
      shape: get(radial_shape),
      size: get(radial_size),
      named_position: get(radial_named_position),
      position: { ...get(radial_position) },
    },
    conic: {
      angle: get(conic_angle),
      named_position: get(conic_named_position),
      position: { ...get(conic_position) },
    },
  }

  layer.cachedCss = buildGradientStrings(layer)
  return layer
}

function applyLayerToStores(layer: GradientLayer) {
  isApplyingLayerToStores = true
  try {
    gradient_type.set(layer.type)
    gradient_space.set(layer.space)
    gradient_interpolation.set(layer.interpolation)

    linear_named_angle.set((layer.linear.named_angle as any) ?? '--')
    linear_angle.set(layer.linear.angle as any)

    radial_shape.set(layer.radial.shape)
    radial_size.set(layer.radial.size)
    radial_named_position.set(layer.radial.named_position)
    radial_position.set({ ...layer.radial.position })

    conic_angle.set(layer.conic.angle as any)
    conic_named_position.set(layer.conic.named_position)
    conic_position.set({ ...layer.conic.position })

    gradient_stops.set(structuredClone(layer.stops))
  }
  finally {
    // release in next microtask to let subscribers flush
    queueMicrotask(() => { isApplyingLayerToStores = false })
  }
}

// Flush pending layer updates - called via tick() to batch multiple store changes
async function flushPendingUpdates() {
  // Wait for Svelte to finish processing current reactive updates
  await tick()
  
  // Capture state AFTER tick() resolves - this ensures all synchronous updates
  // that triggered before the await are included
  const targetIdx = pendingLayerIndex
  const updates = pendingLayerUpdates
  const list = get(layers)
  
  // Reset state to allow new batches to form
  pendingLayerUpdates = []
  flushScheduled = false
  pendingLayerIndex = null
  
  // Verify we have updates and target layer still exists and is valid
  if (!updates.length || targetIdx === null || !list.length || targetIdx < 0 || targetIdx >= list.length) {
    return
  }
  
  const copy = [...list]
  const layer = { ...copy[targetIdx],
    linear: { ...copy[targetIdx].linear },
    radial: { ...copy[targetIdx].radial, position: { ...copy[targetIdx].radial.position } },
    conic: { ...copy[targetIdx].conic, position: { ...copy[targetIdx].conic.position } },
  }
  
  // Apply all pending mutations in order
  for (const m of updates) {
    m(layer)
  }
  
  layer.cachedCss = buildGradientStrings(layer)
  copy[targetIdx] = layer
  layers.set(copy)
}

// Batch multiple rapid store updates into a single layer update to reduce renders
function updateActiveLayer(mutator: (l: GradientLayer) => void) {
  const currentIdx = get(active_layer_index) ?? 0
  
  // If layer changed since pending updates were queued, discard stale updates
  if (pendingLayerIndex !== null && pendingLayerIndex !== currentIdx) {
    pendingLayerUpdates = []
    pendingLayerIndex = null
  }
  
  // Track which layer these updates are for
  if (pendingLayerIndex === null) {
    pendingLayerIndex = currentIdx
  }
  
  pendingLayerUpdates.push(mutator)
  
  // Schedule a flush via Svelte's tick() if not already scheduled
  // tick() returns a promise that resolves after pending state changes are applied
  // All synchronous store subscriptions will add their mutators before tick() resolves
  if (!flushScheduled) {
    flushScheduled = true
    flushPendingUpdates()
  }
}

// Public API
export function addLayer({ seed = 'duplicate', position = 'top' as 'top' | 'bottom' } = {}) {
  const base = seed === 'duplicate' ? snapshotFromStores() : defaultLayer()

  // If explicitly creating a new layer, replace stops with two random semi-transparent colors
  if (seed === 'new') {
    function rand(min: number, max: number) { return Math.random() * (max - min) + min }
    function randomOKLCH() {
      const L = Math.round(rand(60, 85))
      const C = rand(0.20, 0.35).toFixed(2)
      const H = Math.round(rand(0, 360))
      return `oklch(${L}% ${C} ${H})`
    }
    base.stops = [
      { kind: 'stop', color: randomOKLCH(), auto: '0', position1: '0', position2: '0' },
      { kind: 'hint', auto: '50', percentage: '50' },
      { kind: 'stop', color: randomOKLCH(), auto: '100', position1: '100', position2: '100' },
    ]
    // Assign random named angle
    try {
      const idx = Math.floor(rand(0, gradient_angles.length))
      base.linear.named_angle = gradient_angles[idx]
      base.linear.angle = null
    } catch {}
  }

  // Set opacity of each stop color to 50% for the new layer
  function withAlpha(color: string, alpha: number) {
    const a = Math.max(0, Math.min(1, alpha))
    // hex: #rgb, #rrggbb, #rgba, #rrggbbaa
    if (/^#([0-9a-f]{3,8})$/i.test(color)) {
      const hex = color.replace('#','')
      // expand 3/4-digit hex
      let r,g,b,al
      if (hex.length === 3 || hex.length === 4) {
        r = parseInt(hex[0]+hex[0], 16)
        g = parseInt(hex[1]+hex[1], 16)
        b = parseInt(hex[2]+hex[2], 16)
        al = hex.length === 4 ? parseInt(hex[3]+hex[3], 16) / 255 : a
      } else {
        r = parseInt(hex.slice(0,2), 16)
        g = parseInt(hex.slice(2,4), 16)
        b = parseInt(hex.slice(4,6), 16)
        al = hex.length >= 8 ? parseInt(hex.slice(6,8), 16) / 255 : a
      }
      const aHex = (Math.round((a) * 255)).toString(16).padStart(2,'0')
      return `#${[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('')}${aHex}`
    }
    // oklch(...)
    if (/^oklch\(/i.test(color)) {
      // If already has alpha, replace it; otherwise append
      if (/\/\s*\d*\.?\d+\s*\)$/.test(color)) {
        return color.replace(/\/(.*)\)/, `/ ${a})`)
      }
      return color.replace(/\)$/,' / '+a+')')
    }
    // generic function color with ) at end; append slash alpha if not present
    if (/\(/.test(color) && !/\//.test(color)) {
      return color.replace(/\)$/,' / '+a+')')
    }
    return color
  }

  base.stops = base.stops.map(s => s?.kind === 'stop' ? { ...s, color: withAlpha(s.color, 0.5) } : s)
  base.cachedCss = buildGradientStrings(base)

  const list = get(layers)
  const next = position === 'top' ? [base, ...list] : [...list, base]
  layers.set(next)
  const newIndex = position === 'top' ? 0 : next.length - 1
  active_layer_index.set(newIndex)
  // Apply the newly active layer to sync single-value stores (especially for fresh "new" layers)
  applyLayerToStores(base)
}

export function selectLayer(index: number) {
  const list = get(layers)
  if (index < 0 || index >= list.length) return
  active_layer_index.set(index)
  applyLayerToStores(list[index])
}

export function moveLayer(from: number, to: number) {
  const list = [...get(layers)]
  if (from === to) return
  if (from < 0 || from >= list.length || to < 0 || to >= list.length) return
  const [moved] = list.splice(from, 1)
  list.splice(to, 0, moved)
  const active = get(active_layer_index)
  let nextActive = active
  if (active === from) nextActive = to
  else if (from < active && to >= active) nextActive = active - 1
  else if (from > active && to <= active) nextActive = active + 1
  layers.set(list)
  active_layer_index.set(Math.max(0, Math.min(list.length - 1, nextActive)))
}

export function moveLayerUp(index: number) {
  moveLayer(index, Math.max(0, index - 1))
}

export function moveLayerDown(index: number) {
  const list = get(layers)
  moveLayer(index, Math.min(list.length - 1, index + 1))
}

export function moveLayerToTop(index: number) {
  moveLayer(index, 0)
}

export function moveLayerToBottom(index: number) {
  const list = get(layers)
  moveLayer(index, list.length - 1)
}

export function toggleLayerVisibility(index: number) {
  updateActiveLayerList((copy) => {
    if (!copy[index]) return
    copy[index] = { ...copy[index], visible: !copy[index].visible }
  })
}

export function deleteLayer(index: number) {
  const list = [...get(layers)]
  if (list.length <= 1) return // keep at least one layer
  if (index < 0 || index >= list.length) return
  list.splice(index, 1)
  let nextActive = get(active_layer_index)
  if (nextActive === index) nextActive = Math.max(0, index - 1)
  else if (index < nextActive) nextActive = nextActive - 1
  layers.set(list)
  active_layer_index.set(nextActive)
  // Apply newly active layer to stores to keep UI in sync
  const cur = list[nextActive]
  if (cur) applyLayerToStores(cur)
}

function updateActiveLayerList(mutator: (arr: GradientLayer[]) => void) {
  const list = get(layers)
  const copy = [...list]
  mutator(copy)
  layers.set(copy)
}

export function defaultLayer(): GradientLayer {
  // A tiny default; reuse current stores if you prefer
  const layer: GradientLayer = {
    id: uid(),
    name: 'Layer',
    visible: true,
    type: 'linear',
    space: 'oklab',
    interpolation: 'shorter',
    stops: [
      { kind: 'stop', color: '#000', auto: '0', position1: '0', position2: '0' },
      { kind: 'hint', auto: '50', percentage: '50' },
      { kind: 'stop', color: '#fff', auto: '100', position1: '100', position2: '100' },
    ],
    linear: { named_angle: 'to right', angle: '90' },
    radial: { shape: 'circle', size: 'farthest-corner', named_position: 'center', position: { x: null, y: null } },
    conic: { angle: '0', named_position: 'center', position: { x: null, y: null } },
  }
  layer.cachedCss = buildGradientStrings(layer)
  return layer
}

// Initialize with a snapshot of current single-stores
if (get(layers).length === 0) {
  layers.set([snapshotFromStores()])
  active_layer_index.set(0)
}

// Subscriptions: mirror single-store changes into the active layer, unless we're applying a layer
gradient_type.subscribe(v => { if (!isApplyingLayerToStores) updateActiveLayer(l => { l.type = v }) })
gradient_space.subscribe(v => { if (!isApplyingLayerToStores) updateActiveLayer(l => { l.space = v }) })
gradient_interpolation.subscribe(v => { if (!isApplyingLayerToStores) updateActiveLayer(l => { l.interpolation = v }) })
linear_named_angle.subscribe(v => { if (!isApplyingLayerToStores) updateActiveLayer(l => { l.linear.named_angle = v as any }) })
linear_angle.subscribe(v => { if (!isApplyingLayerToStores) updateActiveLayer(l => { l.linear.angle = v as any }) })
radial_shape.subscribe(v => { if (!isApplyingLayerToStores) updateActiveLayer(l => { l.radial.shape = v }) })
radial_size.subscribe(v => { if (!isApplyingLayerToStores) updateActiveLayer(l => { l.radial.size = v }) })
radial_named_position.subscribe(v => { if (!isApplyingLayerToStores) updateActiveLayer(l => { l.radial.named_position = v }) })
radial_position.subscribe(v => { if (!isApplyingLayerToStores) updateActiveLayer(l => { l.radial.position = { ...(v as any) } }) })
conic_angle.subscribe(v => { if (!isApplyingLayerToStores) updateActiveLayer(l => { l.conic.angle = v as any }) })
conic_named_position.subscribe(v => { if (!isApplyingLayerToStores) updateActiveLayer(l => { l.conic.named_position = v }) })
conic_position.subscribe(v => { if (!isApplyingLayerToStores) updateActiveLayer(l => { l.conic.position = { ...(v as any) } }) })
// Use structuredClone for a faster deep clone than JSON.parse/stringify
gradient_stops.subscribe(v => { if (!isApplyingLayerToStores) updateActiveLayer(l => { l.stops = structuredClone(v) }) })
