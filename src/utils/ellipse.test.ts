import { describe, it, expect } from 'vitest'
import { visibleEllipsePath } from './ellipse'

const box = { x0: -800, y0: -450, x1: 1600, y1: 900 } // 800x450 preview + its own size of padding

// Total path length of the arcs, sampled, so tests don't depend on string shape
function arcs(d: string) {
  return [...d.matchAll(/M(-?[\d.]+) (-?[\d.]+)A(-?[\d.]+) (-?[\d.]+) 0 ([01]) 1 (-?[\d.]+) (-?[\d.]+)/g)]
    .map(m => m.slice(1).map(Number))
}

describe('visibleEllipsePath (#77)', () => {
  it('draws a contained ellipse closed and whole', () => {
    const d = visibleEllipsePath({ cx: 400, cy: 225, rx: 300, ry: 200 }, box)
    expect(d.endsWith('Z')).toBe(true)
    expect(arcs(d)).toHaveLength(1) // first arc matches the M..A pattern, the second is chained
  })

  it('keeps a huge far-off circle to a short visible arc', () => {
    // radial at 20000% 20000% farthest-corner on an 800x450 box (the issue URL)
    const cx = 160000, cy = 90000
    const r = Math.hypot(cx, cy)
    const d = visibleEllipsePath({ cx, cy, rx: r, ry: r }, box)
    const segs = arcs(d)
    expect(segs.length).toBe(1)
    const [px, py, , , large, qx, qy] = segs[0]
    expect(large).toBe(0)
    // both endpoints sit on the padded box and on the circle
    for (const [x, y] of [[px, py], [qx, qy]]) {
      expect(Math.abs(Math.hypot(x - cx, y - cy) - r)).toBeLessThan(0.05)
      const onEdge = [Math.abs(x - box.x0), Math.abs(x - box.x1), Math.abs(y - box.y0), Math.abs(y - box.y1)]
      expect(Math.min(...onEdge)).toBeLessThan(0.01)
    }
    // the chord is box-sized, not circle-sized
    expect(Math.hypot(qx - px, qy - py)).toBeLessThan(Math.hypot(2400, 1350) + 1)
  })

  it('returns nothing when the preview sits entirely inside the ellipse', () => {
    expect(visibleEllipsePath({ cx: 400, cy: 225, rx: 1e6, ry: 1e6 }, box)).toBe('')
  })

  it('returns nothing when the ellipse is entirely off to the side', () => {
    expect(visibleEllipsePath({ cx: 1e6, cy: 1e6, rx: 50, ry: 50 }, box)).toBe('')
  })

  it('splits into separate arcs when the ellipse pokes out of two sides', () => {
    // wide flat ellipse centered on the box: left and right caps are clipped away
    const d = visibleEllipsePath({ cx: 400, cy: 225, rx: 5000, ry: 300 }, box)
    const segs = arcs(d)
    expect(segs.length).toBe(2)
    for (const [px, py, , , , qx, qy] of segs) {
      expect(Math.abs(px - qx)).toBeCloseTo(2400, 0) // spans the padded box width
      expect(Math.abs(py - 225)).toBeCloseTo(Math.abs(qy - 225), 1)
    }
  })

  it('ignores degenerate sizes', () => {
    expect(visibleEllipsePath({ cx: 0, cy: 0, rx: 0, ry: 10 }, box)).toBe('')
    expect(visibleEllipsePath({ cx: NaN, cy: 0, rx: 10, ry: 10 }, box)).toBe('')
  })
})
