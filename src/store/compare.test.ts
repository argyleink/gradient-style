import { describe, it, expect, beforeEach } from 'vitest'
import { get } from 'svelte/store'
import { compare, pinA, show, toggleAB, unpin } from './compare'
import { layers, active_layer_index, defaultLayer, selectLayer } from './layers'
import { gradient_grain, gradient_space } from './gradient'
import { initHistory, undo, redo } from './history'

const wait = (ms: number) => new Promise(r => setTimeout(r, ms))

function edit(fn: (l: any) => void) {
  const list = structuredClone(get(layers))
  fn(list[get(active_layer_index) ?? 0])
  layers.set(list)
}
const space = () => get(layers)[get(active_layer_index) ?? 0].space

beforeEach(() => {
  unpin()
  const l = defaultLayer()
  l.space = 'oklab'
  layers.set([l])
  active_layer_index.set(0)
  gradient_grain.set(0)
  selectLayer(0)
})

describe('A/B compare (#101)', () => {
  it('does nothing until A is pinned', () => {
    expect(show('a')).toBe(false)
    expect(toggleAB()).toBe(false)
    expect(space()).toBe('oklab')
  })

  it('pin, edit B, flip to A and back, edits on both sides survive', () => {
    pinA()
    edit(l => { l.space = 'srgb' })
    gradient_grain.set(12)

    expect(show('a')).toBe(true)
    expect(space()).toBe('oklab')
    expect(get(gradient_grain)).toBe(0)
    expect(get(gradient_space)).toBe('oklab') // editor mirrors re-synced
    expect(get(compare).showing).toBe('a')

    edit(l => { l.space = 'display-p3' }) // tweak A
    expect(toggleAB()).toBe(true)
    expect(space()).toBe('srgb')
    expect(get(gradient_grain)).toBe(12)

    expect(toggleAB()).toBe(true)
    expect(space()).toBe('display-p3')
  })

  it('rebuilds cached CSS for the version it loads', () => {
    pinA()
    edit(l => { l.space = 'srgb'; l.cachedCss = { modern: 'stale', classic: 'stale' } })
    show('a')
    expect(get(layers)[0].cachedCss.modern).toContain('oklab')
  })

  it('keeps multi-layer stacks and the focused layer', () => {
    const two = [defaultLayer(), defaultLayer()]
    two[1].space = 'hsl'
    layers.set(two); active_layer_index.set(1); selectLayer(1)
    pinA()
    layers.set([defaultLayer()]); active_layer_index.set(0); selectLayer(0)
    show('a')
    expect(get(layers)).toHaveLength(2)
    expect(get(active_layer_index)).toBe(1)
    expect(get(gradient_space)).toBe('hsl')
  })

  it('unpin keeps whatever is on screen', () => {
    pinA()
    edit(l => { l.space = 'srgb' })
    show('a')
    unpin()
    expect(space()).toBe('oklab')
    expect(get(compare).other).toBe(null)
    expect(show('b')).toBe(false)
  })

  it('a pinned A is a copy, later edits to B never leak into it', () => {
    pinA()
    edit(l => { l.stops[0].color = 'red' })
    show('a')
    expect(get(layers)[0].stops[0].color).not.toBe('red')
  })

  it('each version keeps its own undo stack, and a flip is not an undo step', async () => {
    const stop = initHistory()
    await wait(20)
    edit(l => { l.space = 'srgb' }) // shared past
    await wait(450)
    pinA() // A = srgb
    edit(l => { l.space = 'hsl' }) // B edit
    await wait(450)

    show('a')
    await wait(20)
    expect(space()).toBe('srgb')
    // undo on A walks A's own past (back to oklab), never into B's hsl
    expect(undo()).toBe(true)
    await wait(20)
    expect(space()).toBe('oklab')
    expect(redo()).toBe(true)
    await wait(20)
    expect(space()).toBe('srgb')

    show('b')
    await wait(20)
    expect(space()).toBe('hsl')
    expect(undo()).toBe(true) // B's last edit
    await wait(20)
    expect(space()).toBe('srgb')
    stop()
  })
})
