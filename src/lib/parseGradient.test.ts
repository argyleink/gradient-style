import { describe, it, expect } from 'vitest'
import { parseGradient, ParseError } from './parseGradient'

const valid = [
  'conic-gradient(at top right, deeppink, rebeccapurple)',
  'conic-gradient(from 90deg at bottom right, cyan, rebeccapurple)',
  'conic-gradient(deeppink, cyan, rebeccapurple)',
  'conic-gradient(deeppink, cyan, rebeccapurple)',
  'conic-gradient(from 90deg at 50% 0%, #111, 50%, #222, #111)',
  'conic-gradient(#1f005c, #003298, #005ac6, #007fdc, #00a2d3, #00c4ae, #00e474, #00ff00, #1f005c, #003298, #005ac6, #007fdc, #00a2d3, #00c4ae, #00e474, #00ff00)',
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
]

const invalid = [
  'linear-gradient(blue red)',
  'linear-gradient(50px circle, blue, red)',
  'linear-gradient(45deg, blue, red',
  'lineart-gradient(45deg, blue, red)',
  'linear-gradient 45deg, blue, red)',
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
})

