import Color from 'colorjs.io'
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
  const named = (radial as any).named_position
  if (named && named !== '--') {
    if (named === 'center') return ''
    return named
  }
  if (radial.position?.x != null) {
    const x = radial.position.x
    const y = radial.position.y ?? '50'
    if (String(x) === '50' && String(y) === '50') return ''
    return x + '% ' + y + '%'
  }
  return ''
}

function conicPositionToString(conic: LayerSnapshot['conic']) {
  const named = (conic as any).named_position
  if (named && named !== '--') {
    if (named === 'center') return ''
    return named
  }
  if (conic.position?.x != null) {
    const x = conic.position.x
    const y = conic.position.y ?? '50'
    if (String(x) === '50' && String(y) === '50') return ''
    return x + '% ' + y + '%'
  }
  return ''
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

  function isPctFifty(p: any) {
    if (p == null) return false
    const m = String(p).match(/^(-?\d+(?:\.\d+)?)%$/)
    return !!(m && Number(m[1]) === 50)
  }

  return stops
    .map((s, i) => {
      if (s.kind === 'stop') {
        let p1 = s.position1
        let p2 = s.position2

        // If first position equals computed auto position, omit it (keep explicit second positions)
        if (p1 != null && s.auto != null && String(p1) == String(s.auto)) p1 = null

        // Omit default endpoints
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
        // Omit default/auto hints (like 50%)
        const pct = s.percentage
        if (pct == null) return null
        if (s.auto != null && String(pct) == String(s.auto)) return null
        if (isPctFifty(pct)) return null
        return pct + '%'
      }
      return null
    })
    .filter(Boolean)
    .join(new_lines === true ? ',\n      ' : ', ')
}

function linearAngleToken(linear: LayerSnapshot['linear']) {
  // Omit default 'to bottom' or 180deg
  const named = linear.named_angle
  const ang = linear.angle
  if (named && named !== '--') {
    if (named === 'to bottom') return ''
    return named
  }
  if (ang != null) {
    const n = Number(ang)
    if (!Number.isNaN(n) && (n % 360 === 180)) return ''
    return String(ang) + 'deg'
  }
  return ''
}

function modernString(layer: LayerSnapshot) {
  if (layer.type === 'linear') {
    const tokens = [linearAngleToken(layer.linear), spaceToString(layer.space, layer.interpolation)].filter(Boolean).join(' ')
    return `linear-gradient(\n    ${tokens},\n    ${stopsToStrings(layer.stops, { new_lines: false })}\n  )`
  }
  else if (layer.type === 'radial') {
    const pos = radialPositionToString(layer.radial)
    const posPart = pos && pos !== 'center' ? 'at ' + pos : ''
    const tokens = [layer.radial.size, layer.radial.shape, posPart, spaceToString(layer.space, layer.interpolation)].filter(Boolean).join(' ')
    return `radial-gradient(\n    ${tokens},\n    ${stopsToStrings(layer.stops, { new_lines: false })}\n  )`
  }
  else {
    const pos = conicPositionToString(layer.conic)
    const posPart = pos && pos !== 'center' ? 'at ' + pos : ''
    const fromPart = (Number(layer.conic.angle) || 0) % 360 === 0 ? '' : `from ${layer.conic.angle}deg`
    const tokens = [fromPart, posPart, spaceToString(layer.space, layer.interpolation)].filter(Boolean).join(' ')
    return `conic-gradient(\n    ${tokens},\n    ${stopsToStrings(layer.stops, { new_lines: false })}\n  )`
  }
}

function classicString(layer: LayerSnapshot) {
  if (layer.type === 'linear') {
    const angleToken = linearAngleToken(layer.linear)
    const header = angleToken ? angleToken + ', ' : ''
    return `linear-gradient(${header}${stopsToStrings(layer.stops, { convert_colors: true, new_lines: false })})`
  }
  else if (layer.type === 'radial') {
    const pos = radialPositionToString(layer.radial)
    const posPart = pos && pos !== 'center' ? ' at ' + pos : ''
    return `radial-gradient(${layer.radial.size} ${layer.radial.shape}${posPart}, ${stopsToStrings(layer.stops, { convert_colors: true, new_lines: false })})`
  }
  else {
    const pos = conicPositionToString(layer.conic)
    const posPart = pos && pos !== 'center' ? ' at ' + pos : ''
    const fromPart = (Number(layer.conic.angle) || 0) % 360 === 0 ? '' : `from ${layer.conic.angle}deg `
    return `conic-gradient(${fromPart.trim()}${posPart}, ${stopsToStrings(layer.stops, { convert_colors: true, new_lines: false })})`
  }
}

export function buildGradientStrings(layer: LayerSnapshot) {
  const modern = modernString(layer)
  const classic = classicString(layer)
  return { modern, classic }
}
