import Color from 'colorjs.io'

export function parse_coords(coords: number): number {
  return Math.max(0, Math.min(100, coords))
}

export function contrast_color(c: string): string {
  try {
    const color = new Color(c)

    // Prefer WCAG 2.1 contrast if available for best readability
    let whContrast: number
    let blContrast: number
    try {
      // Contrast ratios per WCAG 2.1
      // ColorJS: contrast(reference, method?)
      // Fall back to L* if the method isn't supported in the current environment
      // @ts-ignore - method overloads
      whContrast = color.contrast('white', 'WCAG21') ?? color.contrastLstar('white')
      // @ts-ignore - method overloads
      blContrast = color.contrast('black', 'WCAG21') ?? color.contrastLstar('black')
    } catch {
      whContrast = color.contrastLstar('white')
      blContrast = color.contrastLstar('black')
    }

    return whContrast > blContrast ? 'white' : 'black'
  } catch {
    return 'black'
  }
}

export function contrast_color_with_alpha(c: string) {
  try {
  const color = new Color(contrast_color(c))
  color.alpha = .6
  return color.to('oklch')
  } catch {
    return null
  }
}

export function contrast_color_prefer_white(c: string): string {
  try {
  const color = new Color(c)
  
  const whContrast = color.contrastLstar('white')

  return whContrast >= 8 || color.c.valueOf() > .1 ? 'white' : 'black'
  } catch {
    return 'black'
  }
}
/**
 * True when two CSS color strings describe the same color, even if they're
 * formatted differently ("0.5" vs "0.50"). Used to keep the color picker from
 * rewriting a stop just because it re-serialized the color on open.
 */
export function isSameColor(a: string, b: string): boolean {
  if (a === b) return true
  try {
    const ca = new Color(a)
    const cb = new Color(b)
    return Math.abs(ca.alpha - cb.alpha) < 0.001 && ca.deltaE(cb, 'OK') < 0.0005
  }
  catch {
    return false
  }
}
