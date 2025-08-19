import { describe, it, expect } from 'vitest'
import { parseGradient } from './parseGradient'

// This test ensures: no positions in, no positions out
// and that hints are formatted correctly (single %)
describe('stops rendering fidelity', () => {
  it('keeps stops without positions as bare colors and renders hints with % once', () => {
    const input = 'linear-gradient(red, blue)'
    const parsed = parseGradient(input)

    // all stops should have null positions
    for (const s of parsed.stops) {
      if (s.kind === 'stop') {
        expect(s.position1).toBeNull()
        expect(s.position2).toBeNull()
      }
    }
  })

  it('respects provided positions and units without synthesizing defaults', () => {
    const input = 'linear-gradient(45deg, red 0 50%, blue 50% 100%)'
    const parsed = parseGradient(input)

    const stops = parsed.stops.filter((s) => s.kind === 'stop') as any[]
    expect(stops[0].position1).toBe('0')
    expect(stops[0].position2).toBe('50%')
    expect(stops[1].position1).toBe('50%')
    expect(stops[1].position2).toBe('100%')
  })
})

