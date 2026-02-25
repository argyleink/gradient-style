import { describe, it, expect } from 'vitest'
import { updateStops } from '../utils/stops'
import { buildGradientStrings } from '../utils/gradientString'

describe('stripes preset round-trip', () => {
  function makeStripeStops() {
    const presetStops = [
      {color: '#fff'},
      {kind: 'hint', auto: null, percentage: null},
      {color: '#000', position1: '0', position2: '20'},
      {kind: 'hint', auto: null, percentage: null},
      {color: '#fff', position1: '0', position2: '40'},
      {kind: 'hint', auto: null, percentage: null},
      {color: '#000', position1: '0', position2: '60'},
      {kind: 'hint', auto: null, percentage: null},
      {color: '#fff', position1: '0', position2: '80'},
      {kind: 'hint', auto: null, percentage: null},
      {color: '#000', position1: '0', position2: '100'},
    ]
    return presetStops.map(stop => {
      if (stop.kind !== 'hint') {
        return {
          kind: 'stop',
          color: (stop as any).color,
          auto: null,
          position1: ((stop as any).position1 ?? null),
          position2: ((stop as any).position2 ?? null),
        }
      } else return stop
    })
  }

  it('preserves span positions after multiple updateStops calls', () => {
    let stops = updateStops(makeStripeStops() as any)
    stops = updateStops(stops)  // second call simulates user interaction
    stops = updateStops(stops)  // third call

    const colorStops = stops.filter((s: any) => s.kind === 'stop')
    expect(colorStops[1].position2).toBe('20')
    expect(colorStops[2].position2).toBe('40')
    expect(colorStops[3].position2).toBe('60')
    expect(colorStops[4].position2).toBe('80')
    expect(colorStops[5].position2).toBe('100')
  })

  it('produces correct CSS after multiple updateStops calls', () => {
    let stops = updateStops(makeStripeStops() as any)
    stops = updateStops(stops)  // second call simulates user interaction

    const layer = {
      type: 'linear', space: 'oklab', interpolation: 'shorter',
      stops,
      linear: { named_angle: 'to top right', angle: null },
      radial: { shape: 'circle', size: 'farthest-corner', named_position: 'center', position: { x: null, y: null } },
      conic: { angle: 0, named_position: 'center', position: { x: null, y: null } },
    }
    const { modern } = buildGradientStrings(layer as any)
    const flat = modern.replace(/\s+/g, ' ')
    expect(flat).toContain('#000 0% 20%')
    expect(flat).toContain('#fff 0% 40%')
    expect(flat).toContain('#000 0% 60%')
    expect(flat).toContain('#fff 0% 80%')
    expect(flat).toContain('#000 0% 100%')
  })
})
