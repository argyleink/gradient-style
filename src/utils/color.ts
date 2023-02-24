import Color from 'colorjs.io'

export function contrast_color(c) {
  const color = new Color(c)
  
  const whContrast = color.contrastLstar('white')
  const blContrast = color.contrastLstar('black')

  return whContrast > blContrast ? 'white' : 'black'
}

export function contrast_color_with_alpha(c) {
  const color = new Color(contrast_color(c))
  color.alpha = .6
  return color.to('oklch')
}

export function contrast_color_prefer_white(c) {
  const color = new Color(c)
  
  const whContrast = color.contrastLstar('white')

  return whContrast >= 8 || color.c.valueOf() > .1 ? 'white' : 'black'
}