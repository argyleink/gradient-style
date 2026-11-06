import { describe, it, expect } from 'vitest'
import { createHistory, snapshotKey, type HistoryState } from './history'
import { defaultLayer } from './layers'

function setup() {
  let state: HistoryState = { layers: [defaultLayer()], active: 0 }
  const writes: number[] = []
  const history = createHistory({
    read: () => state,
    write: (snap, focus) => {
      state = { layers: structuredClone(snap.layers), active: focus }
      writes.push(focus)
    },
  })
  const edit = (fn: (s: HistoryState) => void) => {
    const next = structuredClone(state)
    fn(next)
    state = next
  }
  return { history, edit, get state() { return state }, writes }
}

describe('undo/redo history', () => {
  it('starts empty', () => {
    const { history } = setup()
    expect(history.canUndo).toBe(false)
    expect(history.canRedo).toBe(false)
    expect(history.undo()).toBe(false)
    expect(history.redo()).toBe(false)
  })

  it('ignores records with no real change (ids and cached css are not edits)', () => {
    const t = setup()
    t.edit(s => { s.layers[0].id = 'other'; s.layers[0].cachedCss = { modern: 'x', classic: 'y' } })
    expect(t.history.record()).toBe(false)
    expect(t.history.canUndo).toBe(false)
  })

  it('undoes and redoes edits in order', () => {
    const t = setup()
    t.edit(s => { s.layers[0].space = 'oklch' }); t.history.record()
    t.edit(s => { s.layers[0].type = 'radial' }); t.history.record()

    t.history.undo()
    expect(t.state.layers[0].type).toBe('linear')
    expect(t.state.layers[0].space).toBe('oklch')
    t.history.undo()
    expect(t.state.layers[0].space).toBe('oklab')
    expect(t.history.canUndo).toBe(false)

    t.history.redo()
    t.history.redo()
    expect(t.state.layers[0].type).toBe('radial')
    expect(t.history.canRedo).toBe(false)
  })

  it('a new edit after undo clears redo', () => {
    const t = setup()
    t.edit(s => { s.layers[0].space = 'oklch' }); t.history.record()
    t.history.undo()
    expect(t.history.canRedo).toBe(true)
    t.edit(s => { s.layers[0].space = 'srgb' }); t.history.record()
    expect(t.history.canRedo).toBe(false)
  })

  it('snapshots are isolated from later in-place mutation', () => {
    const t = setup()
    t.edit(s => { s.layers[0].stops[0].color = 'red' }); t.history.record()
    // simulate code that mutates the live stop object in place (overlays do this)
    t.state.layers[0].stops[0].color = 'blue'
    t.history.record()
    t.history.undo()
    expect(t.state.layers[0].stops[0].color).toBe('red')
  })

  it('undo focuses the layer the undone edit happened on', () => {
    const t = setup()
    t.edit(s => { s.layers.push(defaultLayer()); s.active = 1 }); t.history.record()
    t.edit(s => { s.layers[1].space = 'srgb' }); t.history.record()
    // user selects another layer (not an edit), then undoes
    t.edit(s => { s.active = 0 })
    t.history.undo()
    expect(t.writes.at(-1)).toBe(1)
    // undoing a layer add falls back to the restored snapshot's own active index
    t.history.undo()
    expect(t.state.layers).toHaveLength(1)
    expect(t.writes.at(-1)).toBe(0)
  })

  it('rebase adopts normalization without adding a step', () => {
    const t = setup()
    t.edit(s => { s.layers[0].space = 'oklch' }); t.history.record()
    t.history.undo()
    t.edit(s => { s.layers[0].stops[0].auto = '0' }) // e.g. updateStops() normalizing
    t.history.rebase()
    expect(t.history.canRedo).toBe(true)
    expect(t.history.record()).toBe(false)
  })

  it('caps the stack', () => {
    let state: HistoryState = { layers: [defaultLayer()], active: 0 }
    const history = createHistory({ read: () => state, write: () => {}, limit: 3 })
    for (let i = 0; i < 10; i++) {
      state = structuredClone(state)
      state.layers[0].linear.angle = String(i)
      history.record()
    }
    expect(history.size.past).toBe(3)
  })

  it('snapshotKey ignores ids and cachedCss only', () => {
    const a = defaultLayer()
    const b = { ...structuredClone(a), id: 'b', cachedCss: undefined }
    expect(snapshotKey([a])).toBe(snapshotKey([b]))
    expect(snapshotKey([a])).not.toBe(snapshotKey([{ ...b, visible: false }]))
  })
})
