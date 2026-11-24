import { describe, it, expect } from 'vitest'
import { get } from 'svelte/store'
import { parseGradient, parsePosition } from './parseGradient'
import { applyParsedToStores } from './importGradient'
import { buildGradientStrings } from '../utils/gradientString'
import { gradient_stops } from '../store/gradient'

const stopPositions = (css: string) =>
  parseGradient(css).stops.filter((s: any) => s.kind === 'stop').map((s: any) => [s.position1, s.position2])

describe('conic stops given as angles', () => {
  it('keeps a hard-edged pie chart instead of blending it', () => {
    expect(stopPositions('conic-gradient(red 0 90deg, gold 90deg 180deg, teal 180deg 270deg, navy 270deg)'))
      .toEqual([['0', '25%'], ['25%', '50%'], ['50%', '75%'], ['75%', null]])
  })

  it('converts turn, grad and rad to a fraction of the turn', () => {
    expect(stopPositions('conic-gradient(red .25turn, blue 200grad, green 4.71238898rad)'))
      .toEqual([['25%', null], ['50%', null], ['75%', null]])
  })

  it('converts angle hints too', () => {
    const hint = parseGradient('conic-gradient(red, 120deg, blue)').stops.find((s: any) => s.kind === 'hint') as any
    expect(hint.percentage).toBe('33.3333')
  })

  it('leaves linear stops alone (deg is not a linear position)', () => {
    expect(stopPositions('linear-gradient(red 10%, blue 90%)')).toEqual([['10%', null], ['90%', null]])
  })

  it('imported pie re-exports with the same hard edges', () => {
    applyParsedToStores(parseGradient('conic-gradient(red 0 90deg, gold 90deg 180deg, teal 180deg 270deg, navy 270deg)'))
    const { modern } = buildGradientStrings({
      type: 'conic', space: 'srgb', interpolation: 'shorter', stops: get(gradient_stops),
      linear: { named_angle: 'to bottom', angle: null },
      radial: { shape: 'circle', size: 'farthest-corner', named_position: 'center', position: { x: null, y: null } },
      conic: { angle: 0, named_position: 'center', position: { x: null, y: null } },
    } as any)
    expect(modern.replace(/\s+/g, ' ')).toMatch(/red 25%, gold 25% 50%, teal 50% 75%, navy 75% \)/)
  })
})

describe('parsePosition (CSS <position> after `at`)', () => {
  it.each([
    ['center', 'center'],
    ['top', 'top'],
    ['center top', 'top'],
    ['top center', 'top'],
    ['left top', 'top left'],
    ['top left', 'top left'],
    ['right bottom', 'bottom right'],
    ['left center', 'left'],
  ])('%s -> named %s', (input, named) => {
    expect(parsePosition(input)).toEqual({ namedPosition: named })
  })

  it.each([
    ['30%', '30%', '50%'],
    ['25% 75%', '25%', '75%'],
    ['right 20%', '100%', '20%'],
    ['20% top', '20%', '0%'],
    ['right 10% bottom 20%', '90%', '80%'],
    ['top 15% left 5%', '5%', '15%'],
    ['20px 30%', '50%', '30%'],
    ['left 2em', '0%', '50%'],
    ['3rem top', '50%', '0%'],
  ])('%s -> %s %s', (input, x, y) => {
    expect(parsePosition(input)).toEqual({ position: { x, y } })
  })

  it.each(['5foo 30%', 'left right', 'top 20%', 'center 10% top', 'left 12px top', '20px 30px', 'foo bar', 'left 30', '30', 'left 10% top', 'center bottom 25%', '30deg 20%', 'right 10px bottom 20%'])('%s is rejected', input => {
    expect(parsePosition(input)).toEqual({})
  })

  it('radial and conic preludes use it', () => {
    expect(parseGradient('radial-gradient(circle at center top, red, blue)').radial?.namedPosition).toBe('top')
    expect(parseGradient('conic-gradient(from 90deg at left bottom, red, blue)').conic?.namedPosition).toBe('bottom left')
    expect(parseGradient('radial-gradient(at right 20%, red, blue)').radial?.position).toEqual({ x: '100%', y: '20%' })
  })
})

describe('repeating conic keeps raw angle units', () => {
  it('does not convert repeating-conic stop angles', () => {
    expect(stopPositions('repeating-conic-gradient(red 0deg 10deg, blue 10deg 20deg)')).toEqual([['0deg', '10deg'], ['10deg', '20deg']])
  })
})
