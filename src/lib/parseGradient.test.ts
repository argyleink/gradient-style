import { describe, it, expect } from 'vitest'
import { parseGradient, ParseError } from './parseGradient'

const valid = [
  'conic-gradient(at top right, deeppink, rebeccapurple)',
  'conic-gradient(from 90deg at bottom right, cyan, rebeccapurple)',
  'conic-gradient(deeppink, cyan, rebeccapurple)',
  'conic-gradient(from 90deg at 50% 0%, #111, 50%, #222, #111)',
  'linear-gradient(#e66465, #9198e5)',
  'linear-gradient(25deg, #e66465, #9198e5)',
  'linear-gradient(to right, #e66465, #9198e5)',
  'linear-gradient(in oklab, blue, red)',
  'linear-gradient(in hsl longer hue, blue, red)',
  'linear-gradient(0deg, blue, green 40%, red)',
  'linear-gradient(.25turn, red, 10%, blue)',
  'linear-gradient(45deg, red 0 50%, blue 50% 100%)',
  'radial-gradient(farthest-corner circle at 50% 50% in oklab,oklch(70% 0.5 340), oklch(90% 0.5 200))',
  'radial-gradient(farthest-corner circle at 50% 115% in oklch,oklch(80% .3 34), oklch(90% .3 200))',
  'conic-gradient(from 0deg at 0% 100% in oklab,#fff, 2%, #f00 0%, 8%, #fff 0%, 13%, #f00 0%, 18%, #fff 0%, 21%, #f00 0%, 24%, #fff 0%)',
  'linear-gradient(to right in oklab,#0ff 12%, #111 0% 24%, #ff0 0% 36%, #111 0% 48%, #f0f 0% 60%, #111 0% 72%, #0ff 0%, #111 0% 100%)',
  'radial-gradient(farthest-corner circle at 0% 0% in oklch,oklch(95% .25 160), 26%, oklch(75% .5 180) 0%, 46%, oklch(75% .5 210) 0%, 60%, oklch(75% .5 230) 0%, 82%, oklch(75% .5 260) 0%)',
  // Multi-line gradient with semicolon and directional keyword
  `linear-gradient(
    to right in oklab,
    oklch(70% 0.5 340),
    oklch(80% 0.3 89)  64%,
    oklch(90% 0.5 200)
  );`,
  // Multiple gradients (parser should take the first one)
  `linear-gradient(
    to top right in oklab,
    oklch(79% 0.21 182 / 0.5),
    oklch(66% 0.32 259 / 0.5)
  ), linear-gradient(
    276deg in oklab,
    color(display-p3 77% 0% 52%),
    hsl(347 100% 81%) 39%,
    oklab(95% -0.03 0.40)
  )`,
  // Radial gradient with length-based size
  `radial-gradient(
    100px circle in oklab,
    color(display-p3 77% 0% 52%),
    hsl(347 100% 81%) 39%,
    oklab(95% -0.03 0.40)
  )`,
  // Color with alpha channel
  'linear-gradient(to right, oklch(79% 0.21 182 / 0.5), oklch(66% 0.32 259 / 0.5))',
]

const invalid = [
  'linear-gradient(blue red)',
  'linear-gradient(50px circle, blue, red)',
  'linear-gradient(45deg, blue, red',
  'lineart-gradient(45deg, blue, red)',
  'linear-gradient(invalidcolor, invalidcolor)',
  'linear-gradient(45deg, blue, oklhk(none none none))',
  'linear-gradient(45deg, #08, red)'
]

describe('parseGradient', () => {
  it('parses valid gradients into a normalized structure', () => {
    for (const g of valid) {
      const parsed = parseGradient(g)
      expect(parsed).toBeTruthy()
      expect(['linear', 'radial', 'conic']).toContain(parsed.type)
      expect(Array.isArray(parsed.stops)).toBe(true)
      expect(parsed.stops.length).toBeGreaterThan(1)
    }
  })

  it('throws ParseError on invalid gradients', () => {
    for (const g of invalid) {
      expect(() => parseGradient(g)).toThrow(ParseError)
    }
  })

  it('preserves percent units in stop positions and ignores length units', () => {
    const a = parseGradient('linear-gradient(45deg, red 0 50%, blue 50% 100%)')
    const stopsA = a.stops.filter(s => s.kind === 'stop') as any[]
    expect(stopsA[0].position1).toBe('0')      // unitless stays unitless
    expect(stopsA[0].position2).toBe('50%')    // percent preserved
    expect(stopsA[1].position1).toBe('50%')
    expect(stopsA[1].position2).toBe('100%')

    const b = parseGradient('linear-gradient(red 10px 20px, blue 30em 40rem)')
    const stopsB = b.stops.filter(s => s.kind === 'stop') as any[]
    // length units are not supported for stops; treat as unset to allow auto distribution later
    expect(stopsB[0].position1).toBeNull()
    expect(stopsB[0].position2).toBeNull()
    expect(stopsB[1].position1).toBeNull()
    expect(stopsB[1].position2).toBeNull()
  })

  it('strips trailing semicolons and correctly parses directional keywords', () => {
    const withSemi = parseGradient('linear-gradient(to right, red, blue);')
    expect(withSemi.type).toBe('linear')
    expect(withSemi.linear?.angleKeyword).toBe('to right')
    expect(withSemi.stops.length).toBeGreaterThanOrEqual(2)

    const multiline = parseGradient(`linear-gradient(
      to right in oklab,
      oklch(70% 0.5 340),
      oklch(80% 0.3 89) 64%,
      oklch(90% 0.5 200)
    );`)
    expect(multiline.type).toBe('linear')
    expect(multiline.linear?.angleKeyword).toBe('to right')
    expect(multiline.space).toBe('oklab')
    expect(multiline.stops.length).toBe(3)
  })

  it('correctly parses all directional keywords', () => {
    const keywords = [
      'to top', 'to top right', 'to right', 'to bottom right',
      'to bottom', 'to bottom left', 'to left', 'to top left'
    ]
    keywords.forEach(kw => {
      const parsed = parseGradient(`linear-gradient(${kw}, red, blue)`)
      expect(parsed.linear?.angleKeyword).toBe(kw)
    })
  })

  it('parses multiple gradients and takes the first one', () => {
    const multiGradient = `linear-gradient(to top right in oklab, oklch(79% 0.21 182 / 0.5), oklch(66% 0.32 259 / 0.5)), linear-gradient(276deg, red, blue)`
    const parsed = parseGradient(multiGradient)
    expect(parsed.type).toBe('linear')
    expect(parsed.linear?.angleKeyword).toBe('to top right')
    expect(parsed.space).toBe('oklab')
    expect(parsed.stops.length).toBe(2)
  })

  it('parses radial gradients with length-based sizes', () => {
    const withLength = parseGradient('radial-gradient(100px circle, red, blue)')
    expect(withLength.type).toBe('radial')
    expect(withLength.radial?.size).toBe('100px')
    expect(withLength.radial?.shape).toBe('circle')

    const withPair = parseGradient('radial-gradient(50px 100px, red, blue)')
    expect(withPair.radial?.size).toBe('50px 100px')
  })
})

