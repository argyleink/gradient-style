import Color from 'colorjs.io'

export function isCylindricalSpace(space:string):Boolean {
  return ['hsl','hwb','lch','oklch'].includes(space)
}

export function whatsTheGamutDamnit(color) {
  let gamut = 'srgb'

  if (color.startsWith('#')) return gamut

  try {
    const srgb = new Color('srgb', new Color(color).to('srgb').coords)
    const p3 = new Color('p3', new Color(color).to('p3').coords)
    const rec2020 = new Color('rec2020', new Color(color).to('rec2020').coords)

    if (rec2020.inGamut()) gamut = 'rec2020'
    if (p3.inGamut()) gamut = 'p3'
    if (srgb.inGamut()) gamut = 'srgb'
  } catch (e) {
    return gamut
  }

  return gamut
}