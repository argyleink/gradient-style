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

  function asNumberPercent(p: any): number | null {
    if (p == null) return null
    // Accept numbers, unitless numeric strings, or percent strings
    if (typeof p === 'number' && !Number.isNaN(p)) return p
    const str = String(p).trim()
    if (/^[-+]?\d*\.?\d+%$/.test(str)) return Number(str.replace('%',''))
    if (/^[-+]?\d*\.?\d+$/.test(str)) return Number(str)
    return null
  }

  function isPctZero(p: any) {
    const n = asNumberPercent(p)
    return n != null && Number(n) === 0
  }

  function isPctHundred(p: any) {
    const n = asNumberPercent(p)
    return n != null && Number(n) === 100
  }

  function isPctFifty(p: any) {
    const n = asNumberPercent(p)
    return n != null && Number(n) === 50
  }

  type StopOut = { kind: 'stop'; color: string; posA?: string | null; posB?: string | null } | { kind: 'hint'; text: string }
  const out: StopOut[] = []

  for (let i = 0; i < stops.length; i++) {
    const s = stops[i]
    if (!s) continue
    if (s.kind === 'stop') {
      let p1: any = s.position1
      let p2: any = s.position2

      // Only ever suppress the "auto" value for the primary position.
      // Secondary positions are kept even when they equal the auto value so
      // that explicit spans from presets/URL imports (like the Stripes preset)
      // are preserved.
      if (p1 != null && s.auto != null && String(p1) == String(s.auto)) p1 = null

      // Omit browser default *leading* endpoint only when explicitly authored as 0%.
      if (i === firstStopIdx) {
        if (isPctZero(p1)) p1 = null
      }

      const colorStr = maybeConvertColor(s.color, convert_colors)

      // Normalize: if both positions present and equal, reduce to one
      if (p1 != null && p2 != null) {
        const a = fmtPos(p1)
        const b = fmtPos(p2)
        if (a === b) {
          out.push({ kind: 'stop', color: colorStr, posA: a })
        } else {
          out.push({ kind: 'stop', color: colorStr, posA: a, posB: b })
        }
        continue
      }

      if (p1 == null && p2 != null) {
        out.push({ kind: 'stop', color: colorStr, posA: fmtPos(p2) })
        continue
      }

      if (p1 != null && p2 == null) {
        out.push({ kind: 'stop', color: colorStr, posA: fmtPos(p1) })
        continue
      }

      out.push({ kind: 'stop', color: colorStr })
    }
    else if (s.kind === 'hint') {
      // Omit default/auto hints (like 50%)
      const pct = s.percentage
      if (pct == null) continue
      if (s.auto != null && String(pct) == String(s.auto)) continue
      if (isPctFifty(pct)) continue
      out.push({ kind: 'hint', text: pct + '%' })
    }
  }

  // Decide whether to use multi-line formatting based on color token lengths
  const colorStops = out.filter((x): x is Extract<StopOut, {kind: 'stop'}> => x.kind === 'stop')
  const maxColorLen = colorStops.reduce((m, s) => Math.max(m, s.color.length), 0)
  const hasLongColor = maxColorLen >= 20 || colorStops.some(s => /\(|\s/.test(s.color))
  const useNewLines = new_lines === true || (new_lines !== false && hasLongColor)

  if (!useNewLines) {
    return out.map(s => {
      if (s.kind === 'hint') return s.text
      const parts = [s.color]
      if (s.posA) parts.push(s.posA)
      if (s.posB) parts.push(s.posB)
      return parts.join(' ')
    }).join(', ')
  }

  // Multi-line with aligned positions
  return out.map(s => {
    if (s.kind === 'hint') return s.text
    const pad = s.posA || s.posB ? ' '.repeat(Math.max(1, maxColorLen - s.color.length + 1)) : ''
    const parts = [s.color]
    if (s.posA) parts.push(pad + s.posA)
    if (s.posB) parts.push(' ' + s.posB) // second position separated by single space
    return parts.join('')
  }).join(',\n    ')
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
return `linear-gradient(\n    ${tokens},\n    ${stopsToStrings(layer.stops)}\n  )`
  }
  else if (layer.type === 'radial') {
    const pos = radialPositionToString(layer.radial)
    const posPart = pos && pos !== 'center' ? 'at ' + pos : ''
    const tokens = [layer.radial.size, layer.radial.shape, posPart, spaceToString(layer.space, layer.interpolation)].filter(Boolean).join(' ')
return `radial-gradient(\n    ${tokens},\n    ${stopsToStrings(layer.stops)}\n  )`
  }
  else {
    const pos = conicPositionToString(layer.conic)
    const posPart = pos && pos !== 'center' ? 'at ' + pos : ''
    const fromPart = (Number(layer.conic.angle) || 0) % 360 === 0 ? '' : `from ${layer.conic.angle}deg`
    const tokens = [fromPart, posPart, spaceToString(layer.space, layer.interpolation)].filter(Boolean).join(' ')
return `conic-gradient(\n    ${tokens},\n    ${stopsToStrings(layer.stops)}\n  )`
  }
}

function classicString(layer: LayerSnapshot) {
  if (layer.type === 'linear') {
    const angleToken = linearAngleToken(layer.linear)
    const header = angleToken ? angleToken + ', ' : ''
return `linear-gradient(${header}${stopsToStrings(layer.stops, { convert_colors: true })})`
  }
  else if (layer.type === 'radial') {
    const pos = radialPositionToString(layer.radial)
    const posPart = pos && pos !== 'center' ? ' at ' + pos : ''
return `radial-gradient(${layer.radial.size} ${layer.radial.shape}${posPart}, ${stopsToStrings(layer.stops, { convert_colors: true })})`
  }
  else {
    const pos = conicPositionToString(layer.conic)
    const posPart = pos && pos !== 'center' ? ' at ' + pos : ''
    const fromPart = (Number(layer.conic.angle) || 0) % 360 === 0 ? '' : `from ${layer.conic.angle}deg `
return `conic-gradient(${fromPart.trim()}${posPart}, ${stopsToStrings(layer.stops, { convert_colors: true })})`
  }
}

export function buildGradientStrings(layer: LayerSnapshot) {
  const modern = modernString(layer)
  const classic = classicString(layer)
  return { modern, classic }
}
