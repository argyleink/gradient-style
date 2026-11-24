import Color from 'colorjs.io'

export type ParsedGradient = {
  type: 'linear' | 'radial' | 'conic'
  repeating?: boolean
  space?: string
  interpolation?: 'shorter' | 'longer' | 'increasing' | 'decreasing'
  linear?: {
    angleKeyword?: string | null
    angleDeg?: string | null
  }
  radial?: {
    shape?: 'circle' | 'ellipse' | null
    size?: string | null
    namedPosition?: string | null
    position?: { x: string | null; y: string | null }
  }
  conic?: {
    fromDeg?: string | null
    namedPosition?: string | null
    position?: { x: string | null; y: string | null }
  }
  stops: Array<
    | { kind: 'stop'; color: string; auto: string | null; position1: string | null; position2: string | null }
    | { kind: 'hint'; auto: string | null; percentage: string }
  >
}

export class ParseError extends Error {
  index?: number
  constructor(message: string, index?: number) {
    super(message)
    this.name = 'ParseError'
    this.index = index
  }
}

function splitTopLevel(input: string, sep: string): string[] {
  const parts: string[] = []
  let depth = 0
  let buf = ''
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    if (ch === '(') depth++
    else if (ch === ')') depth = Math.max(0, depth - 1)
    if (ch === sep && depth === 0) {
      parts.push(buf.trim())
      buf = ''
    } else {
      buf += ch
    }
  }
  if (buf.trim().length) parts.push(buf.trim())
  return parts
}

function isColorToken(token: string): boolean {
  const t = token.trim()
  if (!t) return false
  try {
    // colorjs.io understands named colors, hex, rgb/hsl/hwb, lab/lch, oklab/oklch, and color() spaces
    // If this succeeds, it's a valid color token for our purposes
    // Note: This parse is tolerant and safe for validation only
    // eslint-disable-next-line no-new
    new Color(t)
    return true
  } catch {
    return false
  }
}

// <length-percentage> or <angle-percentage>: `10%`, `0`, `12px`, `2em`, `-5%`, `30deg`, `.25turn`
const POSITION_RE = /^[-+]?\d*\.?\d+(?:%|[a-z]+)?$/i
const PCT_RE = /^[-+]?\d*\.?\d+%?$/
// an `at` offset: the position controls hold percentages only (`0` is mapped to `0%` first)
const POS_PCT_RE = /^[-+]?\d*\.?\d+%$/
const LENGTH_RE = /^[-+]?\d*\.?\d+(?:px|r?em|r?ex|r?ch|r?lh|[sld]?v(?:w|h|i|b|min|max)|cq(?:w|h|i|b|min|max)|cm|mm|q|in|pt|pc)$/i

// A conic stop position given as an angle (`90deg`, `.25turn`, `100grad`, `1.5708rad`)
const ANGLE_RE = /^([-+]?\d*\.?\d+)(deg|turn|grad|rad)$/i
const TURN_UNITS: Record<string, number> = { deg: 360, turn: 1, grad: 400, rad: 2 * Math.PI }

// In a conic gradient a percentage is a fraction of the full turn, so `90deg` is exactly `25%`.
// The stop store is percentage-based: converting keeps the stop where it was instead of
// dropping it and letting the stop auto-distribute (which turns a hard-edged pie into a blend).
function angleToTurnPct(token: string): string | null {
  const m = ANGLE_RE.exec(token.trim())
  if (!m) return null
  const pct = (parseFloat(m[1]) / TURN_UNITS[m[2].toLowerCase()]) * 100
  return parseFloat(pct.toFixed(4)) + '%'
}

const H_KW: Record<string, number> = { left: 0, center: 50, right: 100 }
const V_KW: Record<string, number> = { top: 0, center: 50, bottom: 100 }

// CSS <position> after `at` (radial/conic): 1-4 values, keywords in either order
// (`center top`, `left top`), keyword + offset pairs (`right 10% bottom 20%`).
// Two keywords become a named position the UI offers (`top`, `top left`); anything with an
// offset becomes x/y percentages. A 1-2 value length offset (`20px 30%`) centers only that axis.
// Returns {} for anything else the percentage-based controls can't hold (invalid CSS, px offsets
// in a 3-4 value position), which leaves the position at center.
export function parsePosition(input: string): { namedPosition?: string; position?: { x: string; y: string } } {
  const toks = input.trim().toLowerCase().split(/\s+/).filter(Boolean).map(t => (t === '0' ? '0%' : t))
  const isKw = (t: string) => t in H_KW || t in V_KW
  // the position stores are percentages (the output appends `%`), so only % or 0 offsets fit;
  // a unitless number (`left 30`) is invalid CSS, not 30%
  const isVal = (t: string) => POS_PCT_RE.test(t)
  // a length offset (`20px`) is valid CSS the controls can't hold
  const isLen = (t: string) => LENGTH_RE.test(t)
  // gradient <position> has no 3-value form (`left 10% top` is a background-position only)
  if (!toks.length || toks.length === 3 || toks.length > 4) return {}
  if (!toks.every(t => isKw(t) || isVal(t) || (toks.length <= 2 && isLen(t)))) return {}
  const pct = (n: number) => parseFloat(n.toFixed(4)) + '%'
  // 1-2 values: a length axis falls back to center, the other axis is kept (`20px 30%` = 50% 30%)
  if (toks.length <= 2 && toks.some(isLen)) {
    if (toks.every(t => isLen(t) || t === 'center')) return {}
    const [a, b = 'center'] = toks
    if (a in V_KW && !(a in H_KW)) return {}
    if (b in H_KW && !(b in V_KW)) return {}
    const axis = (t: string, kw: Record<string, number>) => (isLen(t) ? '50%' : t in kw ? pct(kw[t]) : t)
    return { position: { x: axis(a, H_KW), y: axis(b, V_KW) } }
  }

  if (toks.every(isKw)) {
    if (toks.length > 2) return {}
    let h = 'center', v = 'center'
    for (const t of toks) {
      if (t === 'left' || t === 'right') { if (h !== 'center') return {}; h = t }
      else if (t === 'top' || t === 'bottom') { if (v !== 'center') return {}; v = t }
    }
    const name = [v, h].filter(k => k !== 'center').join(' ')
    return { namedPosition: name || 'center' }
  }

  if (toks.length <= 2) {
    // 1-2 values with an offset: first is x, second is y (`30%`, `left 20%`, `25% top`)
    const [a, b = 'center'] = toks
    if (a in V_KW && !(a in H_KW)) return {}
    if (b in H_KW && !(b in V_KW)) return {}
    return {
      position: {
        x: a in H_KW ? pct(H_KW[a]) : a,
        y: b in V_KW ? pct(V_KW[b]) : b,
      },
    }
  }

  // 3-4 values: keyword [offset] keyword [offset], axes given by the keywords
  const pairs: Array<{ kw: string; off: string | null }> = []
  for (let i = 0; i < toks.length; i++) {
    const kw = toks[i]
    if (!isKw(kw)) return {}
    const off = isVal(toks[i + 1] ?? '') ? toks[++i] : null
    if (off && kw === 'center') return {}
    pairs.push({ kw, off })
  }
  if (pairs.length !== 2) return {}
  let x: string | null = null, y: string | null = null
  // `right 10%` is 10% in from the right edge
  const resolve = (off: string | null, far: boolean) =>
    off == null ? pct(far ? 100 : 0) : pct(far ? 100 - parseFloat(off) : parseFloat(off))
  const assign = (axis: 'x'|'y', v: string) => {
    if (axis === 'x') { if (x != null) return false; x = v } else { if (y != null) return false; y = v }
    return true
  }
  let centers = 0
  for (const p of pairs) {
    if (p.kw === 'center') { centers++; continue }
    const axis = p.kw === 'left' || p.kw === 'right' ? 'x' : 'y'
    if (!assign(axis, resolve(p.off, p.kw === 'right' || p.kw === 'bottom'))) return {}
  }
  for (; centers > 0; centers--) if (!assign(x == null ? 'x' : 'y', pct(50))) return {}
  return x != null && y != null ? { position: { x, y } } : {}
}

// The color at the start of a stop segment (`red 10px`, `oklch(70% .2 40) 5%`), or null.
// Prelude segments (`to right`, `circle at 25% 25%`, `from 45deg in oklch`) never start with one.
function leadingColorToken(seg: string): string | null {
  const s = seg.trim()
  if (s.startsWith('#')) {
    const m = s.match(/^(#[0-9a-fA-F]{3,8})(?:\s|$)/)
    return m && isColorToken(m[1]) ? m[1] : null
  }
  const fn = s.match(/^[a-zA-Z][a-zA-Z0-9-]*\(/)
  if (fn) {
    let depth = 0, idx = 0
    for (; idx < s.length; idx++) {
      if (s[idx] === '(') depth++
      else if (s[idx] === ')') { depth--; if (depth === 0) { idx++; break } }
    }
    const color = s.slice(0, idx)
    return isColorToken(color) ? color : null
  }
  const m = s.match(/^([a-zA-Z]+)(?:\s|$)/)
  return m && isColorToken(m[1]) ? m[1] : null
}

function classifyFunction(input: string): { type: 'linear'|'radial'|'conic'; repeating: boolean } {
  if (!/\)$/.test(input)) throw new ParseError('Missing closing )')
  const m = input.match(/^([a-z-]+)\s*\(/i)
  if (!m) throw new ParseError('Missing ( after function name')
  const name = m[1].toLowerCase()
  const f = name.match(/^(repeating-)?(linear|radial|conic)-gradient$/)
  if (f) return { type: f[2] as 'linear'|'radial'|'conic', repeating: !!f[1] }
  throw new ParseError(`Unknown gradient function: ${name}`)
}

function innerContent(input: string): string {
  const start = input.indexOf('(')
  const end = input.lastIndexOf(')')
  if (start < 0 || end < 0 || end < start) throw new ParseError('Malformed parentheses')
  return input.slice(start + 1, end).trim()
}

// Helper to extract individual gradient functions from comma-separated list
function extractGradients(input: string): string[] {
  const results: string[] = []
  let depth = 0
  let current = ''
  let i = 0
  
  while (i < input.length) {
    const ch = input[i]
    
    if (ch === '(') depth++
    else if (ch === ')') depth--
    
    if (ch === ',' && depth === 0) {
      const trimmed = current.trim()
      if (trimmed && /^(repeating-)?(linear|radial|conic)-gradient\s*\(/i.test(trimmed)) {
        results.push(trimmed)
      }
      current = ''
    } else {
      current += ch
    }
    i++
  }
  
  // Don't forget the last one
  const trimmed = current.trim()
  if (trimmed && /^(repeating-)?(linear|radial|conic)-gradient\s*\(/i.test(trimmed)) {
    results.push(trimmed)
  }
  
  return results.length > 0 ? results : [input.trim()]
}

export function parseGradient(input: string): ParsedGradient {
  // Strip trailing semicolons that may be present when copying from CSS rules
  const cleanedInput = input.trim().replace(/;+$/, '')
  
  // Extract first gradient from potentially multiple gradients
  const gradients = extractGradients(cleanedInput)
  const firstGradient = gradients[0]
  
  const { type, repeating } = classifyFunction(firstGradient)
  const body = innerContent(firstGradient)

  // split by top-level commas
  const segments = splitTopLevel(body, ',')
  if (segments.length < 2) throw new ParseError('Gradient requires at least two stops')

  // Determine prelude (anything before first color-like token)
  let prelude = ''
  let firstColorIndex = 0
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i].trim()
    // If this segment is a plain percentage (hint), but appears before any color, it's still not a color
    const isHintOnly = /^[-+]?\d*\.?\d+%$/.test(s)
    if (isHintOnly) {
      // treat as not a color; continue
    } else {
      // check first token of the segment for color
      const firstToken = s
      if (leadingColorToken(firstToken)) {
        firstColorIndex = i
        break
      } else {
        prelude += (prelude ? ', ' : '') + s
      }
    }
  }

  // Extract color space and hue interpolation (CSS Color 5): "in <space> [<hue> hue]"
  let space: string | undefined
  let interpolation: ParsedGradient['interpolation']
  {
    const m = prelude.match(/\bin\s+([a-z0-9-]+)/i)
    if (m) {
      space = m[1].toLowerCase()
      const h = prelude.match(/\b(shorter|longer|increasing|decreasing)\s+hue\b/i)
      if (h) interpolation = h[1].toLowerCase() as any
      // remove space clause from prelude for subsequent parsing
      prelude = prelude.replace(/\bin\s+[a-z0-9-]+/i, '').replace(/\b(shorter|longer|increasing|decreasing)\s+hue\b/i,'').trim()
    }
  }

  // Parse type-specific fields from remaining prelude
  const lowerPrelude = prelude.toLowerCase()
  let linear: ParsedGradient['linear']
  let radial: ParsedGradient['radial']
  let conic: ParsedGradient['conic']

  function extractPosition(src: string): { namedPosition?: string|null; position?: {x:string|null;y:string|null} } {
    const posMatch = src.match(/\bat\s+(.+)$/i)
    return posMatch ? parsePosition(posMatch[1]) : {}
  }

  if (type === 'linear') {
    if (/(circle|ellipse|closest-|farthest-| at )/.test(lowerPrelude)) {
      throw new ParseError('Invalid radial/conic tokens in linear-gradient prelude')
    }
    // angle keyword - match "to <direction>" patterns
    const kw = prelude.match(/\bto\s+(top|bottom|left|right)(?:\s+(left|right|top|bottom))?/i)
    const ang = prelude.match(/(?:^|\s)([-+]?\d*\.?\d+(?:deg|turn|grad|rad))(?:\s|$)/i)
    linear = { angleKeyword: null, angleDeg: null }
    if (kw) {
      linear.angleKeyword = kw[0].toLowerCase()
    } else if (ang) {
      linear.angleDeg = ang[1]
    }
  } else if (type === 'radial') {
    const shape = /(circle|ellipse)/i.exec(prelude)?.[1]?.toLowerCase() as 'circle'|'ellipse'|undefined
    // size keywords or length/percentage values
    const sizeKw = /(closest-side|closest-corner|farthest-side|farthest-corner)/i.exec(prelude)?.[1]
    let size: string | undefined = sizeKw?.toLowerCase()
    // `circle at 25% 25%`: the lengths after `at` are the position, not the size
    const sizePart = prelude.split(/\bat\b/i)[0]
    if (!size) {
      // Try to match explicit size: single length (for circle) or pair of lengths (for ellipse)
      const singleSize = sizePart.match(/\b(\d+(?:\.\d+)?(?:px|em|rem|vw|vh|%))(?!\s+\d)/i)
      const pair = sizePart.match(/\b(\d+(?:\.\d+)?(?:%|px|em|rem|vw|vh))\s+(\d+(?:\.\d+)?(?:%|px|em|rem|vw|vh))\b/)
      if (pair) {
        size = `${pair[1]} ${pair[2]}`
      } else if (singleSize) {
        size = singleSize[1]
      }
    }
    const { namedPosition, position } = extractPosition(prelude)
    radial = {
      shape: (shape??null) as any,
      size: size??null,
      namedPosition: namedPosition??null,
      position: position??{x:null,y:null}
    }
  } else if (type === 'conic') {
    const from = /\bfrom\s+([-+]?\d*\.?\d+(?:deg|turn|grad|rad))\b/i.exec(prelude)?.[1]
    const { namedPosition, position } = extractPosition(prelude)
    conic = {
      fromDeg: from??null,
      namedPosition: namedPosition??null,
      position: position??{x:null,y:null}
    }
  }

  // Build stops/hints from remaining segments
  // (a repeating gradient keeps its raw units: its tile *is* the stop positions)
  const turnStops = type === 'conic' && !repeating
  const stops: ParsedGradient['stops'] = []
  for (let i = firstColorIndex; i < segments.length; i++) {
    const seg = segments[i].trim()
    if (!seg) continue

    // hint: a bare percentage value
    const segTurnPct = turnStops ? angleToTurnPct(seg) : null
    if (segTurnPct || PCT_RE.test(seg) || (repeating && POSITION_RE.test(seg))) {
      // percentages are stored unitless, lengths keep their unit (`10px`)
      const pct = (segTurnPct ?? seg.trim()).replace(/%$/,'')
      stops.push({ kind: 'hint', auto: null, percentage: pct })
      continue
    }

    // color stop: begins with color token possibly followed by positions
    // Extract leading color token (could be a function with nested parentheses)
    let color = ''
    let rest = ''
    if (seg.startsWith('#')) {
      const m = seg.match(/^(#[0-9a-fA-F]{3,8})\s*(.*)$/)
      if (!m || !isColorToken(m[1])) { continue }
      color = m[1]
      rest = m[2].trim()
    } else if (/^[a-zA-Z]/.test(seg)) {
      // function or named color
      const fn = seg.match(/^([a-zA-Z][a-zA-Z0-9-]*)\(/)
      if (fn) {
        // find matching closing paren
        let depth = 0
        let idx = 0
        for (; idx < seg.length; idx++) {
          const ch = seg[idx]
          if (ch === '(') depth++
          else if (ch === ')') { depth--; if (depth === 0) { idx++; break } }
        }
        color = seg.slice(0, idx)
        if (!isColorToken(color)) { continue }
        rest = seg.slice(idx).trim()
      } else {
        // named color
        const m2 = seg.match(/^([a-zA-Z]+)\s*(.*)$/)
        if (!m2 || !isColorToken(m2[1])) { continue }
        color = m2[1]
        rest = m2[2].trim()
      }
    } else {
      // ignore leftover prelude-like content
      continue
    }

    // parse up to two positions from rest (percentages or lengths)
    let pos1: string | null = null, pos2: string | null = null
    if (rest) {
      const tokens = rest.split(/\s+/).filter(Boolean)
      const posTokens: string[] = []
      for (const t of tokens) {
        // Percentages and unitless numbers. Lengths/angles (px, em, deg...) are left unset for
        // normal gradients so the UI can auto-distribute them, but a repeating gradient's tile
        // *is* its stop positions (`#000 0 10px, #fff 10px 20px`): drop them and it stops repeating.
        const turnPct = turnStops ? angleToTurnPct(t) : null
        if (turnPct) {
          posTokens.push(turnPct)
        } else if (PCT_RE.test(t) || (repeating && POSITION_RE.test(t))) {
          posTokens.push(t)
        }
      }
      if (posTokens[0]) pos1 = posTokens[0]
      if (posTokens[1]) pos2 = posTokens[1]
    }

    stops.push({ kind: 'stop', color, auto: null, position1: pos1, position2: pos2 })
  }

  if (stops.length < 2) throw new ParseError('Not enough stops')

  return {
    type,
    repeating,
    space,
    interpolation,
    linear,
    radial,
    conic,
    stops,
  }
}

// Parse multiple gradients from a comma-separated string
export function parseMultipleGradients(input: string): ParsedGradient[] {
  const cleanedInput = input.trim().replace(/;+$/, '')
  const gradients = extractGradients(cleanedInput)
  
  return gradients.map(g => {
    try {
      return parseGradient(g)
    } catch (e) {
      // Skip invalid gradients
      return null
    }
  }).filter(Boolean) as ParsedGradient[]
}

