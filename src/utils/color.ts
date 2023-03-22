import Color from 'colorjs.io'

export function parse_coords(coords) {
  return Math.max(0, Math.min(100, coords))
}

export function contrast_color(c) {
  try {
  const color = new Color(c)
  
  const whContrast = color.contrastLstar('white')
  const blContrast = color.contrastLstar('black')

  return whContrast > blContrast ? 'white' : 'black'
  } catch {}
}

export function contrast_color_with_alpha(c) {
  try {
  const color = new Color(contrast_color(c))
  color.alpha = .6
  return color.to('oklch')
  } catch {}
}

export function contrast_color_prefer_white(c) {
  try {
  const color = new Color(c)
  
  const whContrast = color.contrastLstar('white')

  return whContrast >= 8 || color.c.valueOf() > .1 ? 'white' : 'black'
  } catch {}
}