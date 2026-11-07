import { writable, get } from 'svelte/store'

import { layers, active_layer_index, selectLayer, type GradientLayer } from './layers'
import { snapshotKey } from './history'
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

function isPreset(p: any): p is CustomPreset {
  return p && typeof p.id === 'string' && Array.isArray(p.layers) && p.layers.length > 0
    && p.layers.every((l: any) => l && typeof l.type === 'string' && Array.isArray(l.stops))
}

export function parseStored(raw: string | null): CustomPreset[] {
  if (!raw) return []
  try {
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list.filter(isPreset) : []
  }
  catch { return [] }
}

function load(): CustomPreset[] {
  try { return parseStored(localStorage.getItem(STORAGE_KEY)) }
  catch { return [] }
}

function persist(list: CustomPreset[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) }
  catch {} // private mode / quota: keep working in memory
}

export const custom_presets = writable<CustomPreset[]>([])

let started = false

/** Load saved presets and follow edits made in other tabs. Call from onMount. */
export function initCustomPresets(): () => void {
  custom_presets.set(load())
  if (started) return () => {}
  started = true
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) custom_presets.set(parseStored(e.newValue))
  }
  window.addEventListener('storage', onStorage)
  return () => {
    started = false
    window.removeEventListener('storage', onStorage)
  }
}

function strip(list: GradientLayer[]): SavedLayer[] {
  return list.map(({ id, cachedCss, ...rest }) => structuredClone(rest))
}

/** Identity of a preset's content, so saving the same gradient twice is a no-op. */
export function presetKey(p: { layers: SavedLayer[] }) {
  return snapshotKey(p.layers as GradientLayer[])
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

/**
 * Save the gradient currently in the editor. Returns the saved preset, or the
 * existing one when an identical gradient is already saved.
 */
export function saveCurrentAsPreset(): { preset: CustomPreset; duplicate: boolean } | null {
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
  if (existing) return { preset: existing, duplicate: true }

  const next = [candidate, ...saved].slice(0, MAX_PRESETS)
  custom_presets.set(next)
  persist(next)
  return { preset: candidate, duplicate: false }
}

export function deleteCustomPreset(id: string) {
  const next = get(custom_presets).filter(p => p.id !== id)
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
