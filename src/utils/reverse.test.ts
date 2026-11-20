import { describe, it, expect } from 'vitest'
import { updateStops, reverseStops } from './stops'
import { buildGradientStrings } from './gradientString'

const layer = (stops: any[], extra: any = {}) => buildGradientStrings({
  type: 'linear', space: 'srgb', interpolation: 'shorter', stops,
  linear: { named_angle: 'to right', angle: null },
  radial: { shape: 'circle', size: 'farthest-corner', named_position: 'center', position: { x: null, y: null } },
  conic: { angle: 0, named_position: 'center', position: { x: null, y: null } },
  ...extra,
} as any).classic

const s = (color: string, position1: any = null, position2: any = position1) => ({ kind: 'stop', color, position1, position2 })
const h = (percentage: any = null) => ({ kind: 'hint', percentage })

describe('reverseStops', () => {
  it('flips color order and keeps auto stops auto', () => {
    const stops = updateStops([s('red'), h(), s('lime'), h(), s('blue')] as any)
    expect(layer(reverseStops(stops))).toBe('linear-gradient(to right, #00f 0%, #0f0 50%, #f00 100%)')
  })

  it('mirrors explicit positions, spans and hints around 50%', () => {
    const stops = updateStops([s('red', '10', '30'), h('40'), s('blue', '70')] as any)
    expect(layer(reverseStops(stops))).toBe('linear-gradient(to right, #00f 30%, 60%, #f00 70% 90%)')
  })

  it('resolves CSS fixup before mirroring (Stripes preset spans start at 0%)', () => {
    const stripes = updateStops([s('#fff'), h(), s('#000', '0', '20'), h(), s('#fff', '0', '40'), h(), s('#000', '0', '60')] as any)
    expect(layer(reverseStops(stripes))).toBe(// visually black 0-60 (before the first stop), white 60-80, black 80-100
      'linear-gradient(to right, #000 40% 60%, #fff 60% 80%, #000 80% 100%, #fff 100%)')
  })

  it('mirrors lengths with calc()', () => {
    const stops = updateStops([s('red', '0', '20px'), h(), s('blue', '20px', '40px')] as any)
    expect(layer(reverseStops(stops), { repeating: true })).toBe(
      'repeating-linear-gradient(to right, #00f calc(100% - 40px) calc(100% - 20px), #f00 calc(100% - 20px) 100%)')
  })

  it('is its own inverse for explicit positions', () => {
    const stops = updateStops([s('red', '5', '25'), h('35'), s('lime', '50'), h(), s('blue', '80', '95')] as any)
    const before = layer(stops)
    expect(layer(reverseStops(reverseStops(stops)))).toBe(before)
  })

  it('leaves a single stop alone', () => {
    const one = updateStops([s('red')] as any)
    expect(reverseStops(one)).toBe(one)
  })
})

describe('span output', () => {
  it('keeps a span whose start sits on the auto slot (dragging the 2nd slider of a middle stop)', () => {
    const stops = updateStops([s('red'), h(), s('blue'), h(), s('lime')] as any)
    ;(stops[2] as any).position2 = '70'
    expect(layer(updateStops(stops))).toBe('linear-gradient(to right, #f00 0%, #00f 50% 70%, #0f0 100%)')
  })

  it('still writes a plain auto stop with one position', () => {
    const stops = updateStops([s('red'), h(), s('blue'), h(), s('lime')] as any)
    expect(layer(stops)).toBe('linear-gradient(to right, #f00 0%, #00f 50%, #0f0 100%)')
  })
})
