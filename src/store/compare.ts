import { writable, get } from 'svelte/store'

import { layers, active_layer_index, selectLayer, type GradientLayer } from './layers'
import { gradient_grain } from './gradient'
import { buildGradientStrings } from '../utils/gradientString'

/*
 * A/B compare (#101)
 *
 * Pin the current gradient as A, keep editing (that's B), then flip between
 * the two. Both versions stay fully editable: flipping stashes whatever is
 * on screen and loads the other one into the editor, so tweaks made to A
 * survive a round trip. `other` always holds the version that is NOT on
 * screen. Flips go through the normal layer stores, so the URL follows along
 * and a flip is one undo step like any other edit.
 */

export type CompareSlot = { layers: GradientLayer[]; active: number; grain: number }
export type CompareState = { other: CompareSlot | null; showing: 'a' | 'b' }

export const compare = writable<CompareState>({ other: null, showing: 'b' })

function capture(): CompareSlot {
  return {
    layers: get(layers).map(({ cachedCss, ...rest }) => structuredClone(rest) as GradientLayer),
    active: get(active_layer_index) ?? 0,
    grain: get(gradient_grain) ?? 0,
  }
}

function apply(slot: CompareSlot) {
  const restored = slot.layers.map(l => {
    const layer = structuredClone(l)
    layer.cachedCss = buildGradientStrings(layer)
    return layer
  })
  const idx = Math.max(0, Math.min(restored.length - 1, slot.active))
  layers.set(restored)
  active_layer_index.set(idx)
  gradient_grain.set(slot.grain ?? 0)
  selectLayer(idx) // re-sync the single-value stores the editor reads
}

// the color picker and import dialog hold references to live stop objects
function busy() {
  return typeof document !== 'undefined' && !!document.querySelector('dialog[open]')
}

/** Pin what's on screen as A; you keep editing B (a copy of it). */
export function pinA() {
  if (!get(layers).length) return
  compare.set({ other: capture(), showing: 'b' })
}

/** Load A or B into the editor, stashing the one on screen. */
export function show(which: 'a' | 'b') {
  const state = get(compare)
  if (!state.other || state.showing === which || busy()) return false
  const current = capture()
  apply(state.other)
  compare.set({ other: current, showing: which })
  return true
}

export function toggleAB() {
  return show(get(compare).showing === 'a' ? 'b' : 'a')
}

/** Stop comparing and keep whichever version is on screen. */
export function unpin() {
  compare.set({ other: null, showing: 'b' })
}
