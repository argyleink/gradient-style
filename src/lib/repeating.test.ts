import { describe, it, expect } from 'vitest'
import { parseGradient, parseMultipleGradients } from './parseGradient'
import { buildGradientStrings } from '../utils/gradientString'
import { tileStops, updateStops } from '../utils/stops'
import { defaultLayer } from '../store/layers'
import { serializeUrl, deserializeUrl } from '../store/url'

describe('repeating gradients (#33)', () => {
  it('parses all three repeating-* functions', () => {
    expect(parseGradient('repeating-linear-gradient(45deg, red, blue 20%)')).toMatchObject({ type: 'linear', repeating: true })
    expect(parseGradient('repeating-radial-gradient(circle, red, blue 10%)')).toMatchObject({ type: 'radial', repeating: true })
    expect(parseGradient('repeating-conic-gradient(from 10deg, red 0 10deg, blue 0 20deg)')).toMatchObject({ type: 'conic', repeating: true })
    expect(parseGradient('linear-gradient(red, blue)').repeating).toBe(false)
  })

  it('keeps repeating layers when importing a multi-layer background', () => {
    const list = parseMultipleGradients('repeating-linear-gradient(red, blue 10%), conic-gradient(red, blue)')
    expect(list.map(g => [g.type, g.repeating])).toEqual([['linear', true], ['conic', false]])
  })

  it('emits repeating-* in both modern and classic output', () => {
    for (const type of ['linear', 'radial', 'conic']) {
      const layer = { ...defaultLayer(), type, repeating: true }
      const { modern, classic } = buildGradientStrings(layer)
      expect(modern.startsWith(`repeating-${type}-gradient(`)).toBe(true)
      expect(classic.startsWith(`repeating-${type}-gradient(`)).toBe(true)
    }
    const { modern } = buildGradientStrings(defaultLayer())
    expect(modern.startsWith('linear-gradient(')).toBe(true)
  })

  it('survives the URL hash for single and multi-layer state', () => {
    const single = deserializeUrl('#' + serializeUrl({ type: 'conic', repeating: 'true', stops: defaultLayer().stops })) as any
    expect(single.repeating).toBe('true')
    const multi = deserializeUrl('#' + serializeUrl({ layers: JSON.stringify([{ type: 'linear', repeating: true, stops: [] }]), active: '0' })) as any
    expect(multi.layers[0].repeating).toBe(true)
  })

  it('round-trips output back through the parser', () => {
    const layer = { ...defaultLayer(), type: 'radial', repeating: true }
    const parsed = parseGradient(buildGradientStrings(layer).modern)
    expect(parsed).toMatchObject({ type: 'radial', repeating: true })
  })
})

describe('repeating output keeps the period intact', () => {
  // the Sun Rays preset: two hard-edged rays, `a 0 5%, b 0 10%`
  const rays = () => updateStops([
    { kind: 'stop', color: '#fc0', auto: null, position1: '0', position2: '5' },
    { kind: 'hint', auto: null, percentage: null },
    { kind: 'stop', color: '#f50', auto: null, position1: '0', position2: '10' },
  ] as any[])

  it('keeps the first stop span start, since the tile runs first→last stop', () => {
    const layer = { ...defaultLayer(), type: 'conic', repeating: true, stops: rays() }
    const { modern, classic } = buildGradientStrings(layer)
    expect(modern).toMatch(/#fc0\s+0% 5%/)
    expect(classic).toContain('#fc0 0% 5%')
  })

  it('still drops the redundant 0% for non-repeating gradients', () => {
    const layer = { ...defaultLayer(), type: 'conic', repeating: false, stops: rays() }
    expect(buildGradientStrings(layer).modern).toMatch(/#fc0\s+5%/)
  })

  it('classic conic at center from 0deg has no dangling comma', () => {
    const layer = { ...defaultLayer(), type: 'conic', stops: rays() }
    expect(buildGradientStrings(layer).classic).toMatch(/^conic-gradient\(#fc0 5%/)
  })
})

describe('tileStops', () => {
  const full = () => [
    { kind: 'stop', color: '#000', auto: '0', position1: '0', position2: '0' },
    { kind: 'hint', auto: '50', percentage: '50' },
    { kind: 'stop', color: '#fff', auto: '100', position1: '100', position2: '100' },
  ]

  it('squeezes a full 0–100% list into the first quarter', () => {
    const out = tileStops(full())
    expect(out.map(s => s.kind === 'stop' ? [s.position1, s.position2] : s.percentage))
      .toEqual([['0', '0'], '12.5', ['25', '25']])
  })

  it('leaves lists that already end short of 100% alone', () => {
    const short = full()
    short[2] = { ...short[2], position1: '40', position2: '40' }
    expect(tileStops(short)).toBe(short)
  })

  it('leaves non-percent lengths alone', () => {
    const px = full()
    px[2] = { ...px[2], position1: '100px', position2: '100px' }
    expect(tileStops(px)).toBe(px)
  })
})

describe('importing hand-written repeating gradients', () => {
  const stops = (css: string) => parseGradient(css).stops.map((s: any) => s.kind === 'stop' ? [s.color, s.position1, s.position2] : s.percentage)

  it('keeps px, em and deg stop positions instead of dropping them', () => {
    expect(stops('repeating-linear-gradient(45deg, #000 0 10px, #fff 10px 20px)')).toEqual([['#000', '0', '10px'], ['#fff', '10px', '20px']])
    expect(stops('repeating-linear-gradient(to right, red, blue 2em)')).toEqual([['red', null, null], ['blue', '2em', null]])
    expect(stops('repeating-conic-gradient(red 0deg 10deg, blue 10deg 20deg)')).toEqual([['red', '0deg', '10deg'], ['blue', '10deg', '20deg']])
    expect(stops('repeating-linear-gradient(red 0, 4px, blue 10px)')).toEqual([['red', '0', null], '4px', ['blue', '10px', null]])
  })

  it('does not read a stop position or the `at` position as the radial size', () => {
    expect(parseGradient('repeating-radial-gradient(circle, red 0%, blue 10%)').radial?.size).toBeNull()
    expect(parseGradient('repeating-radial-gradient(circle at 25% 25%, red 0%, blue 10%)').radial).toMatchObject({ size: null, position: { x: '25%', y: '25%' } })
    expect(parseGradient('radial-gradient(ellipse 40px 20px at 10% 20%, red, blue)').radial?.size).toBe('40px 20px')
  })

  it('reads conic from/at without swallowing the stops', () => {
    expect(parseGradient('repeating-conic-gradient(from 45deg at 30% 40% in oklch, red 0% 5%, blue 5% 10%)').conic).toEqual({ fromDeg: '45deg', namedPosition: null, position: { x: '30%', y: '40%' } })
    expect(parseGradient('linear-gradient(45deg, red, blue)').linear?.angleDeg).toBe('45deg')
  })

  it('round-trips length stops and length hints through the output', () => {
    const p = parseGradient('repeating-linear-gradient(90deg, red 0 10px, 4px, blue 10px 20px)')
    const layer = { ...defaultLayer(), type: 'linear', repeating: true, linear: { named_angle: 'to right', angle: 90 }, stops: updateStops(p.stops as any) }
    expect(buildGradientStrings(layer).modern.replace(/\s+/g, ' ')).toContain('red 0% 10px, 4px, blue 10px 20px')
  })
})

describe('import keeps explicit at-positions', () => {
  it('radial and conic `at x% y%` land in the custom position, not a named center', async () => {
    const { applyParsedToStores } = await import('./importGradient')
    const { get } = await import('svelte/store')
    const g = { ...(await import('../store/radial')), ...(await import('../store/conic')) }
    applyParsedToStores(parseGradient('radial-gradient(circle at 25% 75%, red, blue)'))
    expect([get(g.radial_named_position), get(g.radial_position)]).toEqual(['--', { x: '25', y: '75' }])
    applyParsedToStores(parseGradient('conic-gradient(from 45deg at 30% 40%, red, blue)'))
    expect([get(g.conic_named_position), get(g.conic_position)]).toEqual(['--', { x: '30', y: '40' }])
  })
})
