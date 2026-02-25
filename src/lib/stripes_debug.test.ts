import { describe, it, expect } from 'vitest'
import { updateStops } from '../utils/stops.ts'

// Simulate the stopsToStrings function from Gradient.svelte
function stopsToStrings(gradient_stops: any[], {convert_colors = false, new_lines = true} = {}) {
  const stopIndices = gradient_stops
    .map((s, i) => (s?.kind === 'stop' ? i : null))
    .filter(i => i !== null)
  const firstStopIdx = stopIndices.at(0)
  const lastStopIdx = stopIndices.at(-1)

  function fmtPos(p: any) {
    if (p == null) return null
    const str = String(p)
    if (/[a-z%]/i.test(str)) return str
    return str + '%'
  }

  function isPctZero(p: any) {
    if (p == null) return false
    const m = String(p).match(/^(-?\d+(?:\.\d+)?)%$/)
    return !!(m && Number(m[1]) === 0)
  }

  function isPctHundred(p: any) {
    if (p == null) return false
    const m = String(p).match(/^(-?\d+(?:\.\d+)?)%$/)
    return !!(m && Number(m[1]) === 100)
  }

  return gradient_stops
    .map((s: any, i: number) => {
      if (s.kind === 'stop') {
        let p1 = s.position1
        let p2 = s.position2

        if (p1 != null && s.auto != null && p1 == s.auto) p1 = null

        if (i === firstStopIdx && isPctZero(p1)) p1 = null
        if (i === lastStopIdx && isPctHundred(p2)) p2 = null

        if (p1 != null && p2 != null) {
          const a = fmtPos(p1)
          const b = fmtPos(p2)
          if (a !== b) return s.color + ' ' + a + ' ' + b
          return s.color + ' ' + a
        }

        if (p1 == null && p2 != null) {
          const b = fmtPos(p2)
          return s.color + ' ' + b
        }

        if (p1 != null && p2 == null) {
          const a = fmtPos(p1)
          return s.color + ' ' + a
        }

        return s.color
      }
      else if (s.kind === 'hint') {
        if (s.percentage == null) return null
        return s.percentage + '%'
      }
      return null
    })
    .filter(Boolean)
    .join(', ')
}

describe('Stripes gradient stopsToStrings', () => {
  it('should render Stripes preset correctly', () => {
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

    const convertedStops = presetStops.map((stop: any) => {
      if (stop.kind !== 'hint') {
        return {
          kind: 'stop',
          color: stop.color,
          auto: null,
          position1: (stop.position1 ?? null),
          position2: (stop.position2 ?? null),
        }
      }
      else return stop
    })

    const stops = updateStops(convertedStops as any)
    const output = stopsToStrings(stops)
    
    console.log('After updateStops stops:', JSON.stringify(stops, null, 2))
    console.log('stopsToStrings output:', output)
  })
})
