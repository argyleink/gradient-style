import { describe, it, expect } from 'vitest'
import { parseGradient } from './parseGradient'
import { buildGradientStrings } from '../utils/gradientString'

type Stop = { kind: 'stop'; color: string; auto?: any; position1?: any; position2?: any }
const stop = (color: string, p1?: any, p2?: any): Stop => ({ kind: 'stop', color, auto: null as any, position1: p1 ?? null, position2: p2 ?? null })
// stopWithAuto simulates the output of updateStops: auto is a number, positions may be strings (preset) or numbers (auto-assigned)
const stopWithAuto = (color: string, auto: number, p1?: any, p2?: any): Stop => ({ kind: 'stop', color, auto, position1: p1 ?? null, position2: p2 ?? null })
const hint = (pct: string | number) => ({ kind: 'hint' as const, auto: null as any, percentage: String(pct) })
// hintWithAuto simulates what updateStops produces for auto-managed hints
const hintWithAuto = (pct: number) => ({ kind: 'hint' as const, auto: pct, percentage: pct })

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

  it('preserves explicit span positions for stripe-style presets', () => {
    // Match the structure of the "Stripes" preset as a single layer
    const stripes = makeLayer({
      type: 'linear',
      space: 'oklab',
      linear: { named_angle: 'to right top', angle: null },
      stops: [
        stop('#fff'),                            // leading white, no positions
        hint(0),                                 // midpoint (auto-managed)
        stop('#000', 0, 20),
        hint(0),
        stop('#fff', 0, 40),
        hint(0),
        stop('#000', 0, 60),
        hint(0),
        stop('#fff', 0, 80),
        hint(0),
        stop('#000', 0, 100),
      ],
    })

    const { modern } = buildGradientStrings(stripes as any)

    // The output should contain both start and end positions for each black/white span,
    // not collapse them down to a single 0% position.
    expect(modern.replace(/\s+/g, ' ')).toContain('#000 0% 20%')
    expect(modern.replace(/\s+/g, ' ')).toContain('#fff 0% 40%')
    expect(modern.replace(/\s+/g, ' ')).toContain('#000 0% 60%')
    expect(modern.replace(/\s+/g, ' ')).toContain('#fff 0% 80%')
    expect(modern.replace(/\s+/g, ' ')).toContain('#000 0% 100%')
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

  it('stripes preset: auto-assigned first stop renders without trailing 0%', () => {
    // After updateStops the no-position leading stop gets auto=0, position1=0, position2=0 (numbers).
    // It should render as just the color name with no position suffix.
    const stripes = makeLayer({
      stops: [
        stopWithAuto('#fff', 0, 0, 0),   // auto-assigned both positions = 0
        hintWithAuto(10),
        stopWithAuto('#000', 20, '0', '20'),  // explicit string positions from preset
        hintWithAuto(30),
        stopWithAuto('#fff', 40, '0', '40'),
        hintWithAuto(50),
        stopWithAuto('#000', 60, '0', '60'),
        hintWithAuto(70),
        stopWithAuto('#fff', 80, '0', '80'),
        hintWithAuto(90),
        stopWithAuto('#000', 100, '0', '100'),
      ],
    })

    const { modern } = buildGradientStrings(stripes as any)
    const flat = modern.replace(/\s+/g, ' ')

    // Leading stop should have no position (not "#fff 0%")
    expect(flat).toMatch(/\(\s*to right in oklab,\s*#fff,/)

    // All span positions must be preserved
    expect(flat).toContain('#000 0% 20%')
    expect(flat).toContain('#fff 0% 40%')
    expect(flat).toContain('#000 0% 60%')
    expect(flat).toContain('#fff 0% 80%')
    expect(flat).toContain('#000 0% 100%')

    // Auto-computed midpoint hints (pct === auto) must not appear
    expect(flat).not.toContain('10%')
    expect(flat).not.toContain('30%')
    expect(flat).not.toContain('90%')
  })

  it('explicit string 0% on first stop span is preserved (not stripped as auto)', () => {
    // Neon Stripe-style: first stop has explicit position1='0' and position2='12' from a preset.
    // auto=0 for the first stop. With strict equality the string '0' must NOT be stripped.
    const neonStripe = makeLayer({
      stops: [
        stopWithAuto('#0ff', 0, '0', '12'),  // explicit string '0', auto=0 (number)
        hintWithAuto(6),
        stopWithAuto('#111', 13, '0', '24'),
      ],
    })

    const { modern } = buildGradientStrings(neonStripe as any)
    const flat = modern.replace(/\s+/g, ' ')

    // The explicit 0% start must be preserved so the span is fully described
    expect(flat).toContain('#0ff 0% 12%')
    expect(flat).toContain('#111 0% 24%')
  })
})
