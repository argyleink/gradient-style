import { describe, it, expect } from 'vitest'
import Color from 'colorjs.io'
import { emulateStops } from './fallbackStops'
import { buildGradientStrings } from './gradientString'
import { parseGradient } from '../lib/parseGradient'
import { updateStops } from './stops'

const stop = (color: string, p1?: any, p2?: any) => ({ kind: 'stop', color, position1: p1 ?? null, position2: p2 ?? null })
const hint = (p: any = null) => ({ kind: 'hint', percentage: p })
const layer = (space: string, interpolation: string, stops: any[], repeating = false) => ({
  type: 'linear', space, interpolation, repeating, stops: updateStops(stops as any),
  linear: { named_angle: 'to right', angle: null },
  radial: { shape: 'circle', size: 'farthest-corner', named_position: 'center', position: { x: null, y: null } },
  conic: { angle: 0, named_position: 'center', position: { x: null, y: null } },
}) as any

// what a browser without `in <space>` draws at `pos`: sRGB lerp between the classic stops
function legacyAt(classic: string, pos: number) {
  const stops = parseGradient(classic).stops.filter(s => s.kind === 'stop') as any[]
  const pts = stops.map((s, i) => ({ c: new Color(s.color).to('srgb'), p: s.position1 ? parseFloat(s.position1) : (i === 0 ? 0 : 100) }))
  const i = pts.findIndex(p => p.p >= pos)
  if (i <= 0) return pts[Math.max(0, i)].c
  const a = pts[i - 1], b = pts[i]
  return a.c.mix(b.c, (pos - a.p) / (b.p - a.p), { space: 'srgb' })
}

describe('classic (sRGB) fallback emulates the modern interpolation', () => {
  it('srgb gradients keep the 1:1 hex copy', () => {
    const { classic } = buildGradientStrings(layer('srgb', 'shorter', [stop('#00f'), hint(), stop('#ff0')]))
    expect(classic).toBe('linear-gradient(to right, #00f 0%, #ff0 100%)')
  })

  it('oklab blue to yellow keeps its bright midpoint instead of sRGB gray', () => {
    const { classic } = buildGradientStrings(layer('oklab', 'shorter', [stop('#00f'), hint(), stop('#ff0')]))
    const truth = Color.mix('#00f', '#ff0', 0.5, { space: 'oklab' }).to('srgb')
    for (const p of [25, 50, 75]) {
      const want = Color.mix('#00f', '#ff0', p / 100, { space: 'oklab' })
      expect(legacyAt(classic, p).deltaE(want, { method: 'OK' })).toBeLessThan(0.03)
    }
    // the old 1:1 copy was ~0.2 off at the midpoint
    expect(new Color('#00f').mix('#ff0', 0.5, { space: 'srgb' }).deltaE(truth, { method: 'OK' })).toBeGreaterThan(0.1)
  })

  it('oklch longer hue from red to red is a rainbow, not solid red', () => {
    const { classic } = buildGradientStrings(layer('oklch', 'longer', [stop('red'), hint(), stop('red')]))
    const hues = parseGradient(classic).stops
      .filter(s => s.kind === 'stop')
      .map((s: any) => new Color(s.color).to('oklch').coords[2])
      .filter(h => Number.isFinite(h))
    expect(Math.max(...hues) - Math.min(...hues)).toBeGreaterThan(300)
  })

  it('bakes a transition hint into the stops', () => {
    const { classic } = buildGradientStrings(layer('oklab', 'shorter', [stop('black'), hint(20), stop('white')]))
    // a 20% hint means the 50/50 blend lands at 20%
    const mid = Color.mix('black', 'white', 0.5, { space: 'oklab' })
    expect(legacyAt(classic, 20).deltaE(mid, { method: 'OK' })).toBeLessThan(0.03)
  })

  it('keeps hard edges, including stops pushed up to an earlier hint (Mmm Pie)', () => {
    const parsed = parseGradient('linear-gradient(in oklch, red, 26%, blue 0%, 50%, lime 0%)')
    const out = emulateStops(parsed.stops, 'oklch', 'shorter')!
    expect(out.filter(s => s.pos === 26).map(s => s.color)).toEqual(['#f00', '#00f'])
    expect(out.filter(s => s.pos === 50).map(s => s.color)).toEqual(['#00f', '#0f0'])
  })

  it('repeating gradients keep explicit ends so the tile period survives', () => {
    const { classic } = buildGradientStrings(layer('oklab', 'shorter', [stop('#00f', 0), hint(), stop('#ff0', 10)], true))
    expect(classic).toMatch(/^repeating-linear-gradient\(to right, #00f 0%,/)
    expect(classic).toMatch(/#ff0 10%\)$/)
  })

  it('keeps the list bounded for many stops (10-stop longer hue = 9 full hue turns)', () => {
    const hues = [0, 40, 80, 120, 160, 200, 240, 280, 320, 359]
    const l = layer('oklch', 'longer', hues.flatMap((h, i) => (i ? [hint(), stop(`oklch(70% .3 ${h})`)] : [stop(`oklch(70% .3 ${h})`)])))
    const { classic } = buildGradientStrings(l)
    expect(classic.split(',').length).toBeLessThanOrEqual(100)
  })

  it('falls back to the 1:1 copy for length positions it cannot place', () => {
    const parsed = parseGradient('repeating-linear-gradient(in oklab, red 10px, blue 20px)')
    expect(emulateStops(parsed.stops, 'oklab', 'shorter')).toBeNull()
    const { classic } = buildGradientStrings(layer('oklab', 'shorter', [stop('red', '10px'), hint(), stop('blue', '20px')], true))
    expect(classic).toBe('repeating-linear-gradient(to right, #f00 10px, #00f 20px)')
  })

  it('keeps a typed alpha on the first stop and on hard stops', () => {
    const { classic } = buildGradientStrings(layer('oklab', 'shorter', [stop('rgb(255 0 0 / .3)', '0%', '40%'), hint(), stop('rgb(0 0 255 / .6)', '40%', '100%')]))
    // colorjs parses alpha as a Number object; it used to read as opaque (#f00 / #00f)
    expect(classic).toBe('linear-gradient(to right, #ff00004d 40%, #00f9 40%)')
  })

  it('reads color(srgb ...) stops instead of turning them black', () => {
    const out = emulateStops(parseGradient('linear-gradient(in oklab, color(srgb .5 .2 .1), color(srgb .1 .4 .9))').stops, 'oklab', 'shorter')!
    expect(out[0].color).toBe('#7f331a')
    expect(out.at(-1)!.color).toBe('#1966e5')
  })

  it('a `none` hue borrows the hue it blends with, on each side of the stop', () => {
    const out = emulateStops(parseGradient('linear-gradient(in oklch, oklch(60% .2 30), oklch(70% .2 none), oklch(60% .2 250))').stops, 'oklch', 'shorter')!
    const at50 = out.filter(s => s.pos === 50).map(s => new Color(s.color).to('oklch').coords[2])
    // reddish coming in, blue going out: a jump at 50%, never the gray a hue-less stop converts to
    expect(at50).toHaveLength(2)
    expect(Math.abs(at50[0] - 30)).toBeLessThan(8)
    expect(Math.abs(at50[1] - 250)).toBeLessThan(8)
  })

  it('fading between two hues does not premultiply the hue', () => {
    const out = emulateStops(parseGradient('linear-gradient(in hsl, hsl(0 100% 50% / .1), hsl(240 100% 50% / .8))').stops, 'hsl', 'shorter')!
    const mid = out.find(s => s.pos === 50)!
    // shorter hue from 0 to 240 runs through 300 (magenta); premultiplied hue landed near 253
    expect(Math.abs(new Color(mid.color).to('hsl').coords[0] - 300)).toBeLessThan(3)
  })

  it('a solid gradient still writes two stops (one-stop gradients are invalid where the fallback runs)', () => {
    expect(buildGradientStrings(layer('oklab', 'shorter', [stop('red'), hint(), stop('red')])).classic).toBe('linear-gradient(to right, #f00 0%, #f00 100%)')
    expect(buildGradientStrings(layer('oklab', 'shorter', [stop('red', '50%'), hint(), stop('red', '50%')])).classic).toBe('linear-gradient(to right, #f00 50%, #f00 50%)')
  })
})
