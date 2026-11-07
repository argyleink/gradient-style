import { describe, it, expect } from 'vitest'
import { updateStops } from './stops'
import { serializeUrl, deserializeUrl } from '../store/url'

// The Stripes preset: hard stops spanning `0% N%`
const stripes = () => [
  { kind: 'stop', color: '#fff', auto: null, position1: null, position2: null },
  { kind: 'hint', auto: null, percentage: null },
  { kind: 'stop', color: '#000', auto: null, position1: '0', position2: '20' },
  { kind: 'hint', auto: null, percentage: null },
  { kind: 'stop', color: '#fff', auto: null, position1: '0', position2: '40' },
  { kind: 'hint', auto: null, percentage: null },
  { kind: 'stop', color: '#000', auto: null, position1: '0', position2: '60' },
  { kind: 'hint', auto: null, percentage: null },
  { kind: 'stop', color: '#fff', auto: null, position1: '0', position2: '80' },
  { kind: 'hint', auto: null, percentage: null },
  { kind: 'stop', color: '#000', auto: null, position1: '0', position2: '100' },
] as any[]

const spans = (stops: any[]) =>
  stops.filter(s => s.kind === 'stop').slice(1).map(s => [String(s.position1), String(s.position2)])

describe('updateStops keeps explicit spans (#119)', () => {
  const expected = [['0', '20'], ['0', '40'], ['0', '60'], ['0', '80'], ['0', '100']]

  it('survives a second normalization pass', () => {
    const once = updateStops(stripes())
    expect(spans(once)).toEqual(expected)
    expect(spans(updateStops(once))).toEqual(expected)
  })

  it('survives a URL round trip (reload / shared link)', () => {
    const applied = updateStops(stripes())
    const hash = serializeUrl({ type: 'linear', stops: applied })
    const restored = deserializeUrl('#' + hash) as any
    expect(spans(updateStops(restored.stops))).toEqual(expected)
  })

  it('still relinks an auto-positioned stop when stops are redistributed', () => {
    // 3 auto stops: middle one sits at 50 (linked p1 = p2 = auto)
    const three = updateStops([
      { kind: 'stop', color: 'red' },
      { kind: 'hint', percentage: null },
      { kind: 'stop', color: 'green' },
      { kind: 'hint', percentage: null },
      { kind: 'stop', color: 'blue' },
    ] as any[])
    expect([three[2].position1, three[2].position2]).toEqual([50, 50])

    // add a 4th stop: the middle stop moves to the new auto slot and stays linked
    const four = updateStops([...three, { kind: 'hint', percentage: null }, { kind: 'stop', color: 'white' }] as any[])
    expect(four[2].position1).toBe(four[2].position2)
    expect(four[2].position1).not.toBe(50)
  })
})
