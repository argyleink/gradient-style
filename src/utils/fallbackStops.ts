import Color from 'colorjs.io'
import { isCylindricalSpace } from './colorspace'
import type { ParsedGradient } from '../lib/parseGradient'

// The classic (SDR) gradient is what a browser without `in <colorspace>` support renders, and
// those browsers always interpolate in sRGB. Copying the stops across 1:1 gives a different
// gradient: `in oklab` loses its bright midpoints, and `in oklch longer hue` from red to red is
// a full rainbow in modern browsers but a solid red in the fallback.
//
// This bakes the chosen interpolation into the stop list instead: it samples the real gradient
// (CSS Color 4 interpolation in the chosen space + hue mode, premultiplied alpha, transition hints)
// and adds sRGB stops wherever plain sRGB interpolation between neighbours would drift visibly.

// deltaE OK, ~1 just-noticeable difference is 0.02
const TOLERANCE = 0.02
// 2^5 = at most 32 sub-segments between two authored stops
const MAX_DEPTH = 5

const CSS_TO_COLORJS: Record<string, string> = {
  'display-p3': 'p3',
  'a98-rgb': 'a98rgb',
  'prophoto-rgb': 'prophoto',
  'xyz': 'xyz-d65',
}

export type FallbackStop = { color: string; pos: number }

type Rgba = [number, number, number, number]

const PCT = /^[-+]?\d*\.?\d+%?$/

function pctOf(v: any): number | null {
  if (v == null || v === '') return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  const s = String(v).trim()
  return PCT.test(s) ? parseFloat(s) : null
}

// sRGB clipped the way browsers draw an out-of-gamut gradient on an sRGB screen (and how
// the hex copy has always been made), so the fallback matches what people actually see
function toSrgb(c: Color): Rgba {
  const m = c.to('srgb').toGamut({ space: 'srgb', method: 'clip' })
  const [r, g, b] = m.coords.map(v => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0))
  const a = Number.isFinite(m.alpha as any) ? Number(m.alpha) : 1
  return [r, g, b, a]
}

// what a legacy browser draws between two sRGB stops: premultiplied sRGB lerp
function lerpLegacy(a: Rgba, b: Rgba, t: number): Rgba {
  const alpha = a[3] + (b[3] - a[3]) * t
  if (alpha === 0) return [0, 0, 0, 0]
  const ch = (i: number) => (a[i] * a[3] + (b[i] * b[3] - a[i] * a[3]) * t) / alpha
  return [ch(0), ch(1), ch(2), alpha]
}

function deltaOK(a: Rgba, b: Rgba): number {
  // compare over white-ish weighting of alpha: treat alpha as a 4th axis so a fade still counts
  const ca = new Color('srgb', [a[0], a[1], a[2]]).to('oklab').coords
  const cb = new Color('srgb', [b[0], b[1], b[2]]).to('oklab').coords
  const dl = ca[0] - cb[0], da = ca[1] - cb[1], db = ca[2] - cb[2]
  const dAlpha = a[3] - b[3]
  return Math.sqrt(dl * dl + da * da + db * db) * Math.min(a[3], b[3]) + Math.abs(dAlpha) * 0.5
}

function hex(c: Rgba): string {
  return new Color('srgb', [c[0], c[1], c[2]], c[3]).toString({ format: 'hex' })
}

type Resolved = { kind: 'stop'; color: Color; pos: number } | { kind: 'hint'; pos: number }

// Stops as parseGradient() returns them for the modern string (so this reads exactly what the
// browser reads, not the editor's auto/hint bookkeeping), resolved to percentages per
// CSS Images 4 §3.5.3: default ends, fixup against earlier stops and hints, even spacing.
function resolve(stops: ParsedGradient['stops']): Resolved[] | null {
  type Item = { kind: 'stop'; color: Color; pos: number | null } | { kind: 'hint'; pos: number }
  const items: Item[] = []
  for (const s of stops) {
    if (s.kind === 'hint') {
      const h = pctOf(s.percentage)
      // lengths (`10px`) can't be placed on a percentage line without the box size
      if (h == null) return null
      items.push({ kind: 'hint', pos: h })
      continue
    }
    let color: Color
    try { color = new Color(s.color) } catch { return null }
    const p1 = s.position1 == null ? null : pctOf(s.position1)
    const p2 = s.position2 == null ? null : pctOf(s.position2)
    if ((s.position1 != null && p1 == null) || (s.position2 != null && p2 == null)) return null
    items.push({ kind: 'stop', color, pos: p1 })
    if (p2 != null) items.push({ kind: 'stop', color, pos: p2 })
  }
  const colorItems = items.filter(i => i.kind === 'stop')
  if (colorItems.length < 2) return null
  if (colorItems[0].pos == null) colorItems[0].pos = 0
  if (colorItems.at(-1)!.pos == null) colorItems.at(-1)!.pos = 100

  // fixup: nothing sits before an earlier stop or hint
  let max = -Infinity
  for (const it of items) {
    if (it.pos == null) continue
    it.pos = Math.max(it.pos, max)
    max = it.pos
  }
  // runs of unpositioned stops spread evenly between their positioned neighbours
  for (let i = 0; i < colorItems.length; i++) {
    if (colorItems[i].pos != null) continue
    let j = i
    while (colorItems[j].pos == null) j++
    const from = colorItems[i - 1].pos!, to = colorItems[j].pos!
    for (let k = i; k < j; k++) colorItems[k].pos = from + ((to - from) * (k - i + 1)) / (j - i + 1)
    i = j
  }
  return items as Resolved[]
}

export function needsEmulation(space: string): boolean {
  // legacy gradients already interpolate in sRGB; every other space (hsl included, even with
  // `shorter hue`) takes a different path between the same two colors
  return !!space && space !== 'srgb'
}

// Returns explicit sRGB stops that render like the modern gradient, or null when the stops
// can't be resolved to percentages (lengths) and the 1:1 copy should be used.
export function emulateStops(stops: ParsedGradient['stops'], space: string, interpolation: string): FallbackStop[] | null {
  if (!needsEmulation(space)) return null
  const resolved = resolve(stops)
  if (!resolved) return null
  const colorStops = resolved.filter((r): r is Extract<Resolved, { kind: 'stop' }> => r.kind === 'stop')
  if (colorStops.length < 2) return null

  const spaceId = CSS_TO_COLORJS[space] ?? space
  const hue = isCylindricalSpace(space) ? (interpolation || 'shorter') : 'shorter'
  try { Color.Space.get(spaceId) } catch { return null }

  const out: FallbackStop[] = []
  const push = (c: Rgba, pos: number) => {
    const color = hex(c)
    const p = Math.round(pos * 100) / 100
    const last = out.at(-1)
    if (last && last.color === color && last.pos === p) return
    out.push({ color, pos: p })
  }

  // walk pairs of adjacent color stops with the hint (if any) between them
  let prevIdx = resolved.findIndex(r => r.kind === 'stop')
  const first = resolved[prevIdx] as Extract<Resolved, { kind: 'stop' }>
  push(toSrgb(first.color), first.pos)

  for (let i = prevIdx + 1; i < resolved.length; i++) {
    const r = resolved[i]
    if (r.kind !== 'stop') continue
    const A = resolved[prevIdx] as Extract<Resolved, { kind: 'stop' }>
    const B = r
    const hintR = resolved.slice(prevIdx + 1, i).find(x => x.kind === 'hint') as Extract<Resolved, { kind: 'hint' }> | undefined
    prevIdx = i

    const span = B.pos - A.pos
    if (span <= 0) {
      // hard stop: both colors at the same position
      push(toSrgb(B.color), B.pos)
      continue
    }

    // transition hint as a fraction of the segment (CSS Images 4 §3.5.3)
    let H = hintR == null ? 0.5 : (hintR.pos - A.pos) / span
    if (H <= 0) { push(toSrgb(B.color), A.pos); push(toSrgb(B.color), B.pos); continue }
    if (H >= 1) { push(toSrgb(A.color), B.pos); push(toSrgb(B.color), B.pos); continue }
    const exp = Math.log(0.5) / Math.log(H)
    const weight = (t: number) => (H === 0.5 ? t : Math.pow(t, exp))

    const range = Color.range(A.color, B.color, { space: spaceId, hue, premultiplied: true } as any)
    const truth = (t: number) => toSrgb(range(weight(t)) as any)

    const split = (t0: number, c0: Rgba, t1: number, c1: Rgba, depth: number) => {
      let worst = 0
      for (const f of [0.25, 0.5, 0.75]) {
        const t = t0 + (t1 - t0) * f
        worst = Math.max(worst, deltaOK(truth(t), lerpLegacy(c0, c1, f)))
      }
      if (worst <= TOLERANCE || depth >= MAX_DEPTH) return
      const tm = (t0 + t1) / 2
      const cm = truth(tm)
      split(t0, c0, tm, cm, depth + 1)
      push(cm, A.pos + span * tm)
      split(tm, cm, t1, c1, depth + 1)
    }

    const c0 = truth(0), c1 = truth(1)
    split(0, c0, 1, c1, 0)
    push(c1, B.pos)
  }

  return out
}

// `#hex pos%` list for the classic output: a color held across a span is written once with two
// positions (`#fc0 0% 5%`), a non-repeating gradient's default 0%/100% ends are dropped
export function fallbackStopsToString(list: FallbackStop[], { repeating = false } = {}): string {
  const parts: string[] = []
  for (let i = 0; i < list.length; i++) {
    const s = list[i]
    const next = list[i + 1]
    const isFirst = i === 0
    if (next && next.color === s.color && next.pos > s.pos) {
      const isLast = i + 1 === list.length - 1
      const a = isFirst && s.pos === 0 && !repeating ? null : s.pos + '%'
      const b = isLast && next.pos === 100 && !repeating ? null : next.pos + '%'
      parts.push([s.color, a ?? (b ? '0%' : null), b].filter(Boolean).join(' '))
      i++
      continue
    }
    const isEnd = (isFirst && s.pos === 0) || (i === list.length - 1 && s.pos === 100)
    parts.push(isEnd && !repeating ? s.color : `${s.color} ${s.pos}%`)
  }
  return parts.join(', ')
}
