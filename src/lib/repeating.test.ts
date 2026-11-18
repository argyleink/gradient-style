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
  // the Sunburst preset: two hard-edged rays, `a 0 5%, b 0 10%`
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
