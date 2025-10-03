import { describe, it, expect } from 'vitest'
import { parseGradient } from './parseGradient'
import { buildGradientStrings } from '../utils/gradientString'

type Stop = { kind: 'stop'; color: string; auto?: any; position1?: any; position2?: any }
const stop = (color: string, p1?: any, p2?: any): Stop => ({ kind: 'stop', color, auto: null as any, position1: p1 ?? null, position2: p2 ?? null })
const hint = (pct: string | number) => ({ kind: 'hint' as const, auto: null as any, percentage: String(pct) })

const makeLayer = (overrides: Partial<import('../utils/gradientString').LayerSnapshot>) => ({
  type: 'linear',
  space: 'oklab',
  interpolation: 'shorter',
  stops: [stop('oklch(70% 0.5 340)', 0, 0), hint(50), stop('oklch(90% 0.5 200)', 100, 100)],
  linear: { named_angle: 'to right', angle: null },
  radial: { shape: 'circle', size: 'farthest-corner', named_position: 'center', position: { x: null, y: null } },
  conic: { angle: 0, named_position: 'center', position: { x: null, y: null } },
  ...overrides
} as any)

describe('round-trip: builder output parses back into app format', () => {
  it('linear modern/classic strings parse successfully', () => {
    const layer = makeLayer({ type: 'linear', linear: { named_angle: 'to right', angle: null } })
    const { modern, classic } = buildGradientStrings(layer as any)

    const parsedModern = parseGradient(modern)
    expect(parsedModern.type).toBe('linear')
    expect(parsedModern.space?.toLowerCase()).toBe('oklab')
    expect(parsedModern.stops.length).toBeGreaterThan(1)

    const parsedClassic = parseGradient(classic)
    expect(parsedClassic.type).toBe('linear')
    expect(parsedClassic.stops.length).toBeGreaterThan(1)
  })

  it('radial and conic builder outputs also parse successfully', () => {
    const radial = makeLayer({ type: 'radial', radial: { shape: 'circle', size: 'farthest-corner', named_position: 'center', position: { x: 50, y: 50 } } as any })
    const conic = makeLayer({ type: 'conic', conic: { angle: 0, named_position: 'center', position: { x: 50, y: 50 } } as any })

    const r = buildGradientStrings(radial as any)
    const c = buildGradientStrings(conic as any)

    expect(() => parseGradient(r.modern)).not.toThrow()
    expect(() => parseGradient(r.classic)).not.toThrow()
    expect(() => parseGradient(c.modern)).not.toThrow()
    expect(() => parseGradient(c.classic)).not.toThrow()
  })
})
