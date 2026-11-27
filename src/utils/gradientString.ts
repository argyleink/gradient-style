import Color from 'colorjs.io'
import { isCylindricalSpace } from './colorspace'
import { emulateStops, fallbackStopsToString } from './fallbackStops'
import { parseGradient } from '../lib/parseGradient'

export type LayerSnapshot = {
  type: string
  space: string
  interpolation: string
  repeating?: boolean
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

function stopsToStrings(stops: any[], { convert_colors, new_lines, repeating }: { convert_colors?: boolean; new_lines?: boolean; repeating?: boolean } = {}) {
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
      // A span (p2 set and different) needs both ends, even when its start sits on the
      // auto slot: `blue 50% 70%` written as `blue 70%` drops the solid 50-70% band.
      const isSpan = p2 != null && String(p2) !== String(p1)
      if (p1 != null && s.auto != null && String(p1) == String(s.auto) && !isSpan) p1 = null

      // Omit browser default *leading* endpoint only when explicitly authored as 0%.
      if (i === firstStopIdx) {
        if (isPctZero(p1)) p1 = null
        // A repeating gradient's period runs from the first stop's position to the last's,
        // so `red 0% 5%` and `red 5%` tile differently: keep the leading edge of a span.
        if (repeating && p1 == null && p2 != null && !isPctZero(p2)) p1 = s.position1 ?? 0
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
      // 50% is only the default when nothing says where the midpoint really is: with stops at
      // 0% and 80% an explicit 50% hint is a real choice (the midpoint is 40%), so keep it (#34)
      if (s.auto == null && isPctFifty(pct)) continue
      out.push({ kind: 'hint', text: fmtPos(pct) as string })
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

// repeating-*-gradient() tiles the stop list (CSS Images 3 §3.4); same args otherwise
function fn(layer: LayerSnapshot, kind: string) {
  return `${layer.repeating ? 'repeating-' : ''}${kind}-gradient`
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
return `${fn(layer, 'linear')}(\n    ${tokens},\n    ${stopsToStrings(layer.stops, { repeating: layer.repeating })}\n  )`
  }
  else if (layer.type === 'radial') {
    const pos = radialPositionToString(layer.radial)
    const posPart = pos && pos !== 'center' ? 'at ' + pos : ''
    const tokens = [layer.radial.size, layer.radial.shape, posPart, spaceToString(layer.space, layer.interpolation)].filter(Boolean).join(' ')
return `${fn(layer, 'radial')}(\n    ${tokens},\n    ${stopsToStrings(layer.stops, { repeating: layer.repeating })}\n  )`
  }
  else {
    const pos = conicPositionToString(layer.conic)
    const posPart = pos && pos !== 'center' ? 'at ' + pos : ''
    const fromPart = (Number(layer.conic.angle) || 0) % 360 === 0 ? '' : `from ${layer.conic.angle}deg`
    const tokens = [fromPart, posPart, spaceToString(layer.space, layer.interpolation)].filter(Boolean).join(' ')
return `${fn(layer, 'conic')}(\n    ${tokens},\n    ${stopsToStrings(layer.stops, { repeating: layer.repeating })}\n  )`
  }
}

// sRGB stops that look like the modern gradient (see fallbackStops.ts), else a 1:1 hex copy
function classicStops(layer: LayerSnapshot) {
  let emulated = null
  // lengths (`10px`) can't be placed on the percentage line without the box size
  const hasLength = (layer.stops || []).some((st: any) =>
    [st?.position1, st?.position2, st?.percentage].some(v => v != null && /[a-z]/i.test(String(v))))
  if (!hasLength) try {
    // read the stops back out of the modern string: that is exactly what the browser renders
    emulated = emulateStops(parseGradient(modernString(layer).replace(/\s+/g, ' ')).stops, layer.space, layer.interpolation)
  } catch {}
  return emulated
    ? fallbackStopsToString(emulated, { repeating: layer.repeating })
    : stopsToStrings(layer.stops, { convert_colors: true, repeating: layer.repeating })
}

function classicString(layer: LayerSnapshot) {
  if (layer.type === 'linear') {
    const angleToken = linearAngleToken(layer.linear)
    const header = angleToken ? angleToken + ', ' : ''
return `${fn(layer, 'linear')}(${header}${classicStops(layer)})`
  }
  else if (layer.type === 'radial') {
    const pos = radialPositionToString(layer.radial)
    const posPart = pos && pos !== 'center' ? ' at ' + pos : ''
return `${fn(layer, 'radial')}(${layer.radial.size} ${layer.radial.shape}${posPart}, ${classicStops(layer)})`
  }
  else {
    const pos = conicPositionToString(layer.conic)
    const posPart = pos && pos !== 'center' ? ' at ' + pos : ''
    const fromPart = (Number(layer.conic.angle) || 0) % 360 === 0 ? '' : `from ${layer.conic.angle}deg`
    // centered + 0deg has no prelude at all; don't leave a dangling comma
    const header = (fromPart + posPart).trim()
return `${fn(layer, 'conic')}(${header ? header + ', ' : ''}${classicStops(layer)})`
  }
}

export function buildGradientStrings(layer: LayerSnapshot) {
  const modern = modernString(layer)
  const classic = classicString(layer)
  return { modern, classic }
}
