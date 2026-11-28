/**
 * SVG path for the part of an ellipse that can actually be seen inside a
 * rectangle. The radial overlay used to draw its size guide as a dashed,
 * border-radius:50% div sized to the full ellipse; with a far-off center
 * (or a huge explicit size) that div was hundreds of thousands of pixels
 * wide and the browser re-rasterized the whole dashed outline on every
 * resize or drag (#77). Clipping the ellipse to the visible area first keeps
 * the drawn path a few viewport-lengths long no matter how big it is.
 */
export type Rect = { x0: number; y0: number; x1: number; y1: number }
export type Ellipse = { cx: number; cy: number; rx: number; ry: number }

const TAU = Math.PI * 2
const EPS = 1e-9

const fmt = (n: number) => Number(n.toFixed(3))

function pointAt(e: Ellipse, t: number) {
  return { x: e.cx + e.rx * Math.cos(t), y: e.cy + e.ry * Math.sin(t) }
}

function inside(r: Rect, p: { x: number; y: number }, slack = 1e-6) {
  return p.x >= r.x0 - slack && p.x <= r.x1 + slack && p.y >= r.y0 - slack && p.y <= r.y1 + slack
}

const norm = (t: number) => ((t % TAU) + TAU) % TAU

/** Parameter angles where the ellipse crosses the rectangle's edges. */
function crossings(e: Ellipse, r: Rect): number[] {
  const ts: number[] = []
  for (const x of [r.x0, r.x1]) {
    const c = (x - e.cx) / e.rx
    if (Math.abs(c) <= 1) {
      const a = Math.acos(c)
      ts.push(a, -a)
    }
  }
  for (const y of [r.y0, r.y1]) {
    const s = (y - e.cy) / e.ry
    if (Math.abs(s) <= 1) {
      const a = Math.asin(s)
      ts.push(a, Math.PI - a)
    }
  }
  const sorted = ts
    .map(norm)
    .filter(t => inside(r, pointAt(e, t), Math.max(1e-6, (e.rx + e.ry) * 1e-12)))
    .sort((a, b) => a - b)
  return sorted.filter((t, i) => i === 0 || t - sorted[i - 1] > EPS)
}

export function visibleEllipsePath(e: Ellipse, r: Rect): string {
  if (!(e.rx > 0 && e.ry > 0) || ![e.cx, e.cy, e.rx, e.ry].every(Number.isFinite)) return ''

  // Whole ellipse fits: draw it closed (two half arcs).
  if (e.cx - e.rx >= r.x0 && e.cx + e.rx <= r.x1 && e.cy - e.ry >= r.y0 && e.cy + e.ry <= r.y1) {
    const rx = fmt(e.rx), ry = fmt(e.ry)
    return `M${fmt(e.cx - e.rx)} ${fmt(e.cy)}A${rx} ${ry} 0 1 1 ${fmt(e.cx + e.rx)} ${fmt(e.cy)}A${rx} ${ry} 0 1 1 ${fmt(e.cx - e.rx)} ${fmt(e.cy)}Z`
  }

  const ts = crossings(e, r)
  // No crossings and not contained: the ellipse is entirely outside the
  // rectangle, or the rectangle sits entirely inside the ellipse.
  if (ts.length < 2) return ''

  let d = ''
  for (let i = 0; i < ts.length; i++) {
    const a = ts[i]
    const b = i + 1 < ts.length ? ts[i + 1] : ts[0] + TAU
    const span = b - a
    if (span <= EPS) continue
    if (!inside(r, pointAt(e, a + span / 2))) continue
    const p = pointAt(e, a), q = pointAt(e, b)
    // Increasing t runs clockwise on screen (y points down) = sweep flag 1.
    d += `M${fmt(p.x)} ${fmt(p.y)}A${fmt(e.rx)} ${fmt(e.ry)} 0 ${span > Math.PI ? 1 : 0} 1 ${fmt(q.x)} ${fmt(q.y)}`
  }
  return d
}
