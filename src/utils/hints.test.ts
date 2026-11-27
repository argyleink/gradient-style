import { describe, it, expect } from 'vitest'
import { updateStops } from './stops'
import { buildGradientStrings } from './gradientString'
import { parseGradient } from '../lib/parseGradient'
import { applyParsedToStores } from '../lib/importGradient'
import { gradient_stops } from '../store/gradient'
import { get } from 'svelte/store'
import { serializeUrl, deserializeUrl } from '../store/url'

// #34: a transition hint's default is the midpoint of its two neighbouring stops,
// which is only an even slot on the 0-100 line when the stops are evenly spread.

const stop = (color: string, p?: any) => ({ kind: 'stop', color, auto: null, position1: p ?? null, position2: p ?? null })
const hint = (pct: any = null) => ({ kind: 'hint', auto: null, percentage: pct })
const hints = (stops: any[]) => stops.filter(s => s.kind === 'hint').map(s => Number(s.percentage))

const layerOf = (stops: any[]) => ({
  type: 'linear',
  space: 'oklab',
  interpolation: 'shorter',
  stops,
  linear: { named_angle: 'to right', angle: null },
  radial: { shape: 'circle', size: 'farthest-corner', named_position: 'center', position: { x: null, y: null } },
  conic: { angle: 0, named_position: 'center', position: { x: null, y: null } },
}) as any

describe('auto hints sit at the midpoint between their stops (#34)', () => {
  it('evenly spread stops keep the even midpoints', () => {
    expect(hints(updateStops([stop('red'), hint(), stop('blue'), hint(), stop('lime')] as any[]))).toEqual([25, 75])
  })

  it('a last stop short of 100% pulls its hint with it', () => {
    expect(hints(updateStops([stop('red', '0'), hint(), stop('blue', '60')] as any[]))).toEqual([30])
  })

  it('a moved middle stop moves both neighbouring hints', () => {
    expect(hints(updateStops([stop('red'), hint(), stop('blue', '80'), hint(), stop('lime')] as any[]))).toEqual([40, 90])
  })

  it('follows a stop as it is dragged (auto hints stay auto)', () => {
    const stops = updateStops([stop('red'), hint(), stop('blue'), hint(), stop('lime')] as any[])
    stops[2].position1 = stops[2].position2 = 20
    stops[2]._manual = true
    expect(hints(updateStops(stops))).toEqual([10, 60])
  })

  it('uses positions after CSS fixup (a stop placed before an earlier one is clamped up)', () => {
    // blue 70% then lime 40% renders lime at 70%, so that transition is a hard edge at 70%
    expect(hints(updateStops([stop('red', '0'), hint(), stop('blue', '70'), hint(), stop('lime', '40')] as any[]))).toEqual([35, 70])
  })

  it('leaves explicit hints alone', () => {
    expect(hints(updateStops([stop('red'), hint('10'), stop('blue', '80'), hint(), stop('lime')] as any[]))).toEqual([10, 90])
  })

  it('falls back to the even slot next to a length-positioned stop', () => {
    const out = updateStops([stop('red', '0'), hint(), stop('blue', '40px'), hint(), stop('lime', '100')] as any[])
    expect(hints(out)).toEqual([25, 75])
  })

  it('links saved before this fix (hint stored at the old even slot) restore to the midpoint', () => {
    const saved = [stop('red', '0'), { kind: 'hint', auto: 25, percentage: 25 }, stop('blue', '80'), { kind: 'hint', auto: 75, percentage: 75 }, stop('lime', '100')]
    const restored = deserializeUrl('#' + serializeUrl({ type: 'linear', stops: saved })) as any
    expect(hints(updateStops(restored.stops))).toEqual([40, 90])
  })

  it('an imported gradient gets true midpoints, so nudging a hint no longer snaps to a hard edge', () => {
    applyParsedToStores(parseGradient('linear-gradient(to right in oklab, red, blue 80%, lime)'))
    const stops = get(gradient_stops) as any[]
    expect(hints(stops)).toEqual([40, 90])

    // one step on the second hint's slider, as the sidebar/overlay arrow keys do
    stops[3].percentage = Number(stops[3].percentage) + 1
    const { modern } = buildGradientStrings(layerOf(stops))
    expect(modern.replace(/\s+/g, ' ')).toContain('blue 80%, 91%, lime')
  })
})

describe('an explicit 50% hint is kept when it is not the midpoint (#34)', () => {
  it('stops at 0% and 80% with a 50% hint', () => {
    const stops = updateStops([stop('red', '0'), hint('50'), stop('blue', '80')] as any[])
    const { modern } = buildGradientStrings(layerOf(stops))
    expect(modern.replace(/\s+/g, ' ')).toContain('red 0%, 50%, blue 80%')
  })

  it('the true midpoint is still omitted', () => {
    const stops = updateStops([stop('red', '0'), hint(), stop('blue', '80')] as any[])
    const { modern } = buildGradientStrings(layerOf(stops))
    expect(modern).not.toMatch(/40%/)
  })
})
