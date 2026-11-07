import { describe, it, expect, beforeEach, vi } from 'vitest'
import { get } from 'svelte/store'

import { layers, active_layer_index, defaultLayer } from './layers'
import {
  custom_presets, saveCurrentAsPreset, applyCustomPreset, deleteCustomPreset,
  parseStored, presetLabel, STORAGE_KEY,
} from './customPresets'

const stack = (n: number) => Array.from({ length: n }, (_, i) => {
  const l = defaultLayer()
  l.name = `Layer ${i + 1}`
  l.stops[0].color = ['red', 'green', 'blue'][i] ?? '#000'
  return l
})

// Node's own experimental localStorage can shadow jsdom's, so use a plain in-memory one
function memoryStorage() {
  const data = new Map<string, string>()
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, String(v)),
    removeItem: (k: string) => void data.delete(k),
    clear: () => data.clear(),
  }
}

describe('custom presets (#74)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    custom_presets.set([])
    layers.set(stack(1))
    active_layer_index.set(0)
  })

  it('saves the current layers, newest first, and persists them', () => {
    saveCurrentAsPreset()
    layers.set(stack(2))
    saveCurrentAsPreset()

    const saved = get(custom_presets)
    expect(saved).toHaveLength(2)
    expect(saved[0].layers).toHaveLength(2)
    expect(saved[0].layers[0]).not.toHaveProperty('id')
    expect(saved[0].layers[0]).not.toHaveProperty('cachedCss')
    expect(parseStored(localStorage.getItem(STORAGE_KEY))).toEqual(saved)
  })

  it('does not save the same gradient twice', () => {
    const first = saveCurrentAsPreset()!
    const again = saveCurrentAsPreset()!
    expect(again.duplicate).toBe(true)
    expect(again.preset.id).toBe(first.preset.id)
    expect(get(custom_presets)).toHaveLength(1)
  })

  it('applies a single-layer preset to the active layer only', () => {
    const { preset } = saveCurrentAsPreset()!
    const three = stack(3)
    layers.set(three)
    active_layer_index.set(1)

    applyCustomPreset(preset)
    const after = get(layers)
    expect(after).toHaveLength(3)
    expect(after[1].stops[0].color).toBe('red')
    expect(after[1].id).toBe(three[1].id)       // keeps the layer's identity
    expect(after[1].name).toBe('Layer 2')
    expect(after[1].cachedCss?.modern).toContain('red')
    expect(after[0].stops[0].color).toBe('red') // untouched neighbours
    expect(after[2].stops[0].color).toBe('blue')
  })

  it('replaces the whole stack with a multi-layer preset', () => {
    layers.set(stack(3))
    active_layer_index.set(2)
    const { preset } = saveCurrentAsPreset()!
    layers.set(stack(1))
    active_layer_index.set(0)

    applyCustomPreset(preset)
    expect(get(layers).map(l => l.stops[0].color)).toEqual(['red', 'green', 'blue'])
    expect(get(active_layer_index)).toBe(2)
  })

  it('deletes', () => {
    const { preset } = saveCurrentAsPreset()!
    deleteCustomPreset(preset.id)
    expect(get(custom_presets)).toEqual([])
    expect(localStorage.getItem(STORAGE_KEY)).toBe('[]')
  })

  it('ignores corrupt storage', () => {
    expect(parseStored('{nope')).toEqual([])
    expect(parseStored('{"a":1}')).toEqual([])
    expect(parseStored('[{"id":"x","layers":[]}, null, {"id":"y","layers":[{"type":"linear","stops":[]}]}]')).toHaveLength(1)
  })

  it('labels presets', () => {
    const { preset } = saveCurrentAsPreset()!
    expect(presetLabel(preset)).toBe('linear, 2 colors')
  })
})
