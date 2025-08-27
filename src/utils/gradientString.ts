import Color from 'colorjs.io'
import { linearAngleToString } from './linear'
import { isCylindricalSpace } from './colorspace'

export type LayerSnapshot = {
  type: string
  space: string
  interpolation: string
  stops: any[]
  linear: { named_angle: string | null; angle: string | number | null }
  radial: { shape: string; size: string; named_position: string; position: { x: number | null; y: number | null } }
  conic: { angle: string | number; named_position: string; position: { x: number | null; y: number | null } }
}

function spaceToString(space: string, interpolation: string) {
  return isCylindricalSpace(space) && interpolation !== 'shorter'
    ? `in ${space} ${interpolation} hue`
    : `in ${space}`
}

function radialPositionToString(radial: LayerSnapshot['radial']) {
  if (radial.position?.x != null) {
    const y = radial.position.y ?? '50'
    return radial.position.x + '% ' + y + '%'
  }
  else {
    return radial.named_position
  }
}

function conicPositionToString(conic: LayerSnapshot['conic']) {
  if (conic.position?.x != null) {
    const y = conic.position.y ?? '50'
    return conic.position.x + '% ' + y + '%'
  }
  else {
    return conic.named_position
  }
}

function maybeConvertColor(color: string, convert_colors?: boolean) {
  if (convert_colors) {
    try {
      return new Color(color).toGamut({ space: 'srgb', method: 'clip' }).to('srgb').toString({ format: 'hex' })
    } catch {}
  }
  return color
}

function stopsToStrings(stops: any[], { convert_colors, new_lines }: { convert_colors?: boolean; new_lines?: boolean } = {}) {
  // Identify first/last stop indices in the full list (including hints)
  const stopIndices = stops
    .map((s, i) => (s?.kind === 'stop' ? i : null))
    .filter(i => i !== null) as number[]
  const firstStopIdx = stopIndices.at(0)
  const lastStopIdx = stopIndices.at(-1)

  function fmtPos(p: any) {
    if (p == null) return null
    const str = String(p)
    if (/[a-z%]/i.test(str)) return str
    return str + '%'
  }

  function isPctZero(p: any) {
    if (p == null) return false
    const m = String(p).match(/^(-?\d+(?:\.\d+)?)%$/)
    return !!(m && Number(m[1]) === 0)
  }

  function isPctHundred(p: any) {
    if (p == null) return false
    const m = String(p).match(/^(-?\d+(?:\.\d+)?)%$/)
    return !!(m && Number(m[1]) === 100)
  }

  return stops
    .map((s, i) => {
      if (s.kind === 'stop') {
        let p1 = s.position1
        let p2 = s.position2

        if (p1 != null && s.auto != null && p1 == s.auto) p1 = null

        if (i === firstStopIdx && isPctZero(p1)) p1 = null
        if (i === lastStopIdx && isPctHundred(p2)) p2 = null

        if (p1 != null && p2 != null) {
          const a = fmtPos(p1)
          const b = fmtPos(p2)
          if (a !== b) return maybeConvertColor(s.color, convert_colors) + ' ' + a + ' ' + b
          return maybeConvertColor(s.color, convert_colors) + ' ' + a
        }

        if (p1 == null && p2 != null) {
          const b = fmtPos(p2)
          return maybeConvertColor(s.color, convert_colors) + ' ' + b
        }

        if (p1 != null && p2 == null) {
          const a = fmtPos(p1)
          return maybeConvertColor(s.color, convert_colors) + ' ' + a
        }

        return maybeConvertColor(s.color, convert_colors)
      }
      else if (s.kind === 'hint') {
        if (s.percentage == null) return null
        return s.percentage + '%'
      }
      return null
    })
    .filter(Boolean)
    .join(new_lines === true ? ',\n      ' : ', ')
}

function modernString(layer: LayerSnapshot) {
  if (layer.type === 'linear') {
    return `linear-gradient(\n    ${linearAngleToString(layer.linear.angle as any, layer.linear.named_angle as any)} ${spaceToString(layer.space, layer.interpolation)},\n    ${stopsToStrings(layer.stops, { new_lines: false })}\n  )`
  }
  else if (layer.type === 'radial') {
    return `radial-gradient(\n    ${layer.radial.size} ${layer.radial.shape} at ${radialPositionToString(layer.radial)} ${spaceToString(layer.space, layer.interpolation)},\n    ${stopsToStrings(layer.stops, { new_lines: false })}\n  )`
  }
  else {
    return `conic-gradient(\n    from ${layer.conic.angle}deg at ${conicPositionToString(layer.conic)} ${spaceToString(layer.space, layer.interpolation)},\n    ${stopsToStrings(layer.stops, { new_lines: false })}\n  )`
  }
}

function classicString(layer: LayerSnapshot) {
  if (layer.type === 'linear') {
    return `linear-gradient(${linearAngleToString(layer.linear.angle as any, layer.linear.named_angle as any)}, ${stopsToStrings(layer.stops, { convert_colors: true, new_lines: false })})`
  }
  else if (layer.type === 'radial') {
    return `radial-gradient(\n    ${layer.radial.size} ${layer.radial.shape} at ${radialPositionToString(layer.radial)},\n    ${stopsToStrings(layer.stops, { convert_colors: true, new_lines: false })}\n  )`
  }
  else {
    return `conic-gradient(\n    from ${layer.conic.angle}deg at ${conicPositionToString(layer.conic)},\n    ${stopsToStrings(layer.stops, { convert_colors: true, new_lines: false })}\n  )`
  }
}

export function buildGradientStrings(layer: LayerSnapshot) {
  const modern = modernString(layer)
  const classic = classicString(layer)
  return { modern, classic }
}
