import Color from 'colorjs.io'

export type ParsedGradient = {
  type: 'linear' | 'radial' | 'conic'
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

function classifyFunction(input: string): 'linear'|'radial'|'conic' {
  if (!/\)$/.test(input)) throw new ParseError('Missing closing )')
  const m = input.match(/^([a-z-]+)\s*\(/i)
  if (!m) throw new ParseError('Missing ( after function name')
  const name = m[1].toLowerCase()
  if (name === 'linear-gradient') return 'linear'
  if (name === 'radial-gradient') return 'radial'
  if (name === 'conic-gradient') return 'conic'
  throw new ParseError(`Unknown gradient function: ${name}`)
}

function innerContent(input: string): string {
  const start = input.indexOf('(')
  const end = input.lastIndexOf(')')
  if (start < 0 || end < 0 || end < start) throw new ParseError('Malformed parentheses')
  return input.slice(start + 1, end).trim()
}

export function parseGradient(input: string): ParsedGradient {
  // Strip trailing semicolons that may be present when copying from CSS rules
  const cleanedInput = input.trim().replace(/;+$/, '')
  const type = classifyFunction(cleanedInput)
  const body = innerContent(cleanedInput)

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
      if (isColorToken(firstToken) || /\)/.test(firstToken) && isColorToken(firstToken)) {
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
    if (!posMatch) return {}
    const rhs = posMatch[1].trim()
    // try named positions
    const named = ['center','top left','top','top right','right','bottom right','bottom','bottom left','left','top center','bottom center','left center','right center']
    for (const n of named) {
      if (rhs.toLowerCase().startsWith(n)) return { namedPosition: n }
    }
    // split into two tokens for x/y
    const parts = rhs.split(/\s+/)
    if (parts.length >= 2) {
      return { position: { x: parts[0], y: parts[1] } }
    }
    return {}
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
    // size keywords or length pairs
    const sizeKw = /(closest-side|closest-corner|farthest-side|farthest-corner)/i.exec(prelude)?.[1]
    let size: string | undefined = sizeKw?.toLowerCase()
    if (!size) {
      const pair = prelude.match(/\b(\d+(?:\.\d+)?(?:%|px|em|rem|vw|vh))\s+(\d+(?:\.\d+)?(?:%|px|em|rem|vw|vh))\b/)
      if (pair) size = `${pair[1]} ${pair[2]}`
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
  const stops: ParsedGradient['stops'] = []
  for (let i = firstColorIndex; i < segments.length; i++) {
    const seg = segments[i].trim()
    if (!seg) continue

    // hint: a bare percentage value
    if (/^[-+]?\d*\.?\d+%$/.test(seg)) {
      const pct = seg.trim().replace(/%$/,'')
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
        // Accept only percentages or unitless numbers to match UI expectations
        if (/^[-+]?\d*\.?\d+%$/.test(t) || /^[-+]?\d*\.?\d+$/.test(t)) {
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
    space,
    interpolation,
    linear,
    radial,
    conic,
    stops,
  }
}

