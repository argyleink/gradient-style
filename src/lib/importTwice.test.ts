import { describe, it, expect, beforeEach } from 'vitest'
import { get } from 'svelte/store'
import { parseGradient } from './parseGradient'
import { applyParsedToStores } from './importGradient'
import { buildGradientStrings } from '../utils/gradientString'
import { gradient_stops } from '../store/gradient'
import { radial_named_position, radial_position } from '../store/radial'
import { conic_named_position, conic_position } from '../store/conic'

// The import dialog writes into long-lived stores, so the 2nd import of a session starts from
// whatever the 1st left behind. A gradient with no usable position must land at center, not at
// a leftover '--' or null x/y (the sliders coerce null to 0, which reads back as `top left`),
// and a keyword `at` must land on that keyword's x/y for the same reason.
const load = (css: string) => applyParsedToStores(parseGradient(css))

const output = (type: 'radial' | 'conic') =>
  buildGradientStrings({
    type, space: 'srgb', interpolation: 'shorter', stops: get(gradient_stops),
    linear: { named_angle: 'to bottom', angle: null },
    radial: { shape: 'circle', size: 'farthest-corner', named_position: get(radial_named_position), position: get(radial_position) },
    conic: { angle: 0, named_position: get(conic_named_position), position: get(conic_position) },
  } as any).modern.replace(/\s+/g, ' ')

const radial = () => ({ named: get(radial_named_position), pos: get(radial_position) })
const conic = () => ({ named: get(conic_named_position), pos: get(conic_position) })
const CENTER = { named: 'center', pos: { x: 50, y: 50 } }

beforeEach(() => {
  radial_named_position.set('center'); radial_position.set({ x: null, y: null })
  conic_named_position.set('center'); conic_position.set({ x: null, y: null })
})

describe('importing twice keeps a missing/unusable position at center', () => {
  it('conic with no `at`, twice', () => {
    load('conic-gradient(red 0 90deg, gold 90deg 180deg, teal 180deg 270deg, navy 270deg)')
    expect(conic()).toEqual(CENTER)
    load('conic-gradient(from 45deg, red, blue)')
    expect(conic()).toEqual(CENTER)
    expect(output('conic')).not.toMatch(/at (0%|top left)/)
  })

  it('conic with no `at` after a custom position', () => {
    load('conic-gradient(at 30% 40%, red, blue)')
    expect(conic()).toEqual({ named: '--', pos: { x: '30', y: '40' } })
    load('conic-gradient(red, blue)')
    expect(conic()).toEqual(CENTER)
  })

  it('radial with no `at` after a custom position', () => {
    load('radial-gradient(circle at 30% 40%, red, blue)')
    load('radial-gradient(circle, red, blue)')
    expect(radial()).toEqual(CENTER)
    expect(output('radial')).not.toMatch(/at 0% 0%|top left/)
  })

  it('radial with a px `at` after a custom position', () => {
    load('radial-gradient(circle at 30% 40%, red, blue)')
    load('radial-gradient(circle at 20px 20px, red, blue)')
    expect(radial()).toEqual(CENTER)
    // one length axis: only that axis centers, the percentage is kept
    load('radial-gradient(circle at 20px 30%, red, blue)')
    expect(radial()).toEqual({ named: '--', pos: { x: '50', y: '30' } })
    expect(output('radial')).toMatch(/at 50% 30%/)
  })

  it('keyword `at` after a custom position', () => {
    load('conic-gradient(at 30% 40%, red, blue)')
    load('conic-gradient(from 90deg at left bottom, red, blue)')
    expect(conic()).toEqual({ named: 'bottom left', pos: { x: 0, y: 100 } })
    load('radial-gradient(circle at 10% 90%, red, blue)')
    load('radial-gradient(circle at center top, red, blue)')
    expect(radial()).toEqual({ named: 'top', pos: { x: 50, y: 0 } })
    expect(output('radial')).toMatch(/at top/)
  })
})
