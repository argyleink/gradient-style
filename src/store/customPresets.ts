import { writable, get } from 'svelte/store'

import { layers, active_layer_index, selectLayer, defaultLayer, type GradientLayer } from './layers'
import { buildGradientStrings } from '../utils/gradientString'

/*
 * Custom presets (#74)
 *
 * A saved gradient is a copy of the `layers` store (the editor's source of
 * truth) so it restores losslessly: stops, hints, spans, angle, positions,
 * color space and hue interpolation, and every layer of a multi-layer stack.
 * Persisted to localStorage and synced across tabs.
 */

type SavedLayer = Omit<GradientLayer, 'id' | 'cachedCss'>

export type CustomPreset = {
  id: string
  created: number
  layers: SavedLayer[]
  active: number
}

export const STORAGE_KEY = 'gradient-style:custom-presets'
export const MAX_PRESETS = 50

function uid(prefix: string) {
  try { return `${prefix}-${(crypto as any).randomUUID()}` }
  catch { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}` }
}

const isObj = (v: any) => v != null && typeof v === 'object' && !Array.isArray(v)

function isPreset(p: any): p is CustomPreset {
  return isObj(p) && typeof p.id === 'string' && Array.isArray(p.layers) && p.layers.length > 0
    && p.layers.every((l: any) => isObj(l) && typeof l.type === 'string' && Array.isArray(l.stops))
}

// Fill in any layer fields an older or hand-edited entry is missing, so rendering
// a swatch or applying it can't throw on e.g. `layer.radial.size`
function normalizeLayer(l: any): SavedLayer {
  const { id, cachedCss, ...base } = defaultLayer()
  return {
    ...base,
    ...l,
    linear: { ...base.linear, ...(isObj(l.linear) ? l.linear : {}) },
    radial: { ...base.radial, ...(isObj(l.radial) ? l.radial : {}), position: { ...base.radial.position, ...(isObj(l.radial?.position) ? l.radial.position : {}) } },
    conic: { ...base.conic, ...(isObj(l.conic) ? l.conic : {}), position: { ...base.conic.position, ...(isObj(l.conic?.position) ? l.conic.position : {}) } },
    stops: l.stops.filter(isObj),
  }
}

export function parseStored(raw: string | null): CustomPreset[] {
  if (!raw) return []
  try {
    const list = JSON.parse(raw)
    if (!Array.isArray(list)) return []
    return list.filter(isPreset).map(p => ({
      id: p.id,
      created: Number(p.created) || 0,
      active: Number.isFinite(p.active) ? p.active : 0,
      layers: p.layers.map(normalizeLayer),
    }))
  }
  catch { return [] }
}

function load(): CustomPreset[] {
  try { return parseStored(localStorage.getItem(STORAGE_KEY)) }
  catch { return [] }
}

/** false when the browser refused the write (private mode, quota): the change only lives in memory */
function persist(list: CustomPreset[]): boolean {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); return true }
  catch { return false }
}

export const custom_presets = writable<CustomPreset[]>([])

let listeners = 0
function onStorage(e: StorageEvent) {
  if (e.key === STORAGE_KEY) custom_presets.set(parseStored(e.newValue))
}

/** Load saved presets and follow edits made in other tabs. Call from onMount. */
export function initCustomPresets(): () => void {
  custom_presets.set(load())
  if (listeners++ === 0) window.addEventListener('storage', onStorage)
  return () => {
    if (--listeners === 0) window.removeEventListener('storage', onStorage)
  }
}

function strip(list: GradientLayer[]): SavedLayer[] {
  return list.map(({ id, cachedCss, ...rest }) => structuredClone(rest))
}

/**
 * Identity of a preset: the CSS each layer renders (plus its visibility), so the
 * same-looking gradient counts as a duplicate however it was built.
 */
export function presetKey(p: { layers: SavedLayer[] }) {
  return JSON.stringify(p.layers.map(l => [buildGradientStrings(l as any).modern, l.visible !== false]))
}

/** The CSS a preset renders, for its swatch. Hidden layers are skipped, like the preview. */
export function presetCss(p: CustomPreset): { modern: string; classic: string } {
  const visible = p.layers.filter(l => l.visible !== false)
  const built = (visible.length ? visible : p.layers).map(l => buildGradientStrings(l as any))
  return {
    modern: built.map(b => b.modern).join(', '),
    classic: built.map(b => b.classic).join(', '),
  }
}

export function presetLabel(p: CustomPreset): string {
  const colors = p.layers.reduce((n, l) => n + l.stops.filter((s: any) => s?.kind === 'stop').length, 0)
  const kind = p.layers.length > 1
    ? `${p.layers.length} layers`
    : `${p.layers[0].type}`
  return `${kind}, ${colors} colors`
}

export type SaveResult =
  | { status: 'saved'; preset: CustomPreset; persisted: boolean }
  | { status: 'duplicate'; preset: CustomPreset }
  | { status: 'full' }

/**
 * Save the gradient currently in the editor. An identical gradient that's
 * already saved is returned instead of a copy; at MAX_PRESETS nothing is
 * evicted, the caller is told the list is full.
 */
export function saveCurrentAsPreset(): SaveResult | null {
  const list = get(layers)
  if (!list?.length) return null

  const candidate: CustomPreset = {
    id: uid('preset'),
    created: Date.now(),
    layers: strip(list),
    active: get(active_layer_index) ?? 0,
  }

  const saved = get(custom_presets)
  const key = presetKey(candidate)
  const existing = saved.find(p => presetKey(p) === key)
  if (existing) return { status: 'duplicate', preset: existing }
  if (saved.length >= MAX_PRESETS) return { status: 'full' }

  const next = [candidate, ...saved]
  custom_presets.set(next)
  return { status: 'saved', preset: candidate, persisted: persist(next) }
}

/** Remove a saved gradient. Returns what's needed to put it back with restoreCustomPreset. */
export function deleteCustomPreset(id: string): { preset: CustomPreset; index: number } | null {
  const list = get(custom_presets)
  const index = list.findIndex(p => p.id === id)
  if (index === -1) return null
  const next = list.filter(p => p.id !== id)
  custom_presets.set(next)
  persist(next)
  return { preset: list[index], index }
}

/** Undo a delete: put the preset back where it was. */
export function restoreCustomPreset({ preset, index }: { preset: CustomPreset; index: number }) {
  const list = get(custom_presets)
  if (list.some(p => p.id === preset.id)) return
  const next = [...list]
  next.splice(Math.min(index, next.length), 0, preset)
  custom_presets.set(next)
  persist(next)
}

function hydrate(layer: SavedLayer, keep?: Partial<GradientLayer>): GradientLayer {
  const out = { ...structuredClone(layer), id: uid('layer'), ...keep } as GradientLayer
  out.cachedCss = buildGradientStrings(out)
  return out
}

/**
 * Apply a saved gradient. Like the built-in presets, a single-layer gradient
 * replaces the active layer (keeping its name, visibility and place in the
 * stack); a multi-layer gradient replaces the whole stack. Undoable.
 */
export function applyCustomPreset(p: CustomPreset) {
  const current = get(layers)
  const activeIdx = get(active_layer_index) ?? 0

  if (p.layers.length === 1 && current.length > 0) {
    const target = current[activeIdx] ?? current[0]
    const idx = current.indexOf(target)
    const next = [...current]
    next[idx] = hydrate(p.layers[0], { id: target.id, name: target.name, visible: target.visible })
    layers.set(next)
    selectLayer(idx)
    return
  }

  const restored = p.layers.map(l => hydrate(l))
  const idx = Math.max(0, Math.min(restored.length - 1, p.active ?? 0))
  layers.set(restored)
  selectLayer(idx)
}
