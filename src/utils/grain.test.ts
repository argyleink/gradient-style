import { describe, it, expect } from 'vitest'
import { grainLayer, normalizeGrain, withGrain } from './grain'

describe('grain', () => {
  it('is off at 0 and for junk input', () => {
    expect(grainLayer(0)).toBe('')
    expect(grainLayer(undefined)).toBe('')
    expect(grainLayer('nope')).toBe('')
    expect(grainLayer(-5)).toBe('')
    expect(withGrain('linear-gradient(red, blue)', 0)).toBe('linear-gradient(red, blue)')
  })

  it('clamps and rounds amounts', () => {
    expect(normalizeGrain('20')).toBe(20)
    expect(normalizeGrain(12.6)).toBe(13)
    expect(normalizeGrain(500)).toBe(100)
  })

  it('builds a CSS-safe SVG noise layer with the amount as opacity', () => {
    const g = grainLayer(25)
    expect(g.startsWith('url("data:image/svg+xml,')).toBe(true)
    expect(g).toContain("opacity='0.125'")
    expect(grainLayer(100)).toContain("opacity='0.5'")
    expect(g).toContain('feTurbulence')
    // raw # < > or a double quote inside would break the url() in some engines
    const body = g.slice('url("'.length, -2)
    expect(body).not.toMatch(/[#<>"]/)
  })

  it('stacks grain above every gradient layer', () => {
    const bg = 'linear-gradient(red, blue), radial-gradient(lime, navy)'
    const out = withGrain(bg, 30)
    expect(out.startsWith(grainLayer(30) + ', ')).toBe(true)
    expect(out.endsWith(bg)).toBe(true)
  })
})
