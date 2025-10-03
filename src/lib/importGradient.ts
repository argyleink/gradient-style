import { gradient_type, gradient_space, gradient_interpolation, gradient_stops } from '../store/gradient'
import { linear_angle, linear_named_angle } from '../store/linear'
import { radial_shape, radial_position, radial_named_position, radial_size } from '../store/radial'
import { conic_angle, conic_position, conic_named_position } from '../store/conic'
import type { ParsedGradient } from './parseGradient'
import { updateStops } from '../utils/stops'

function toDegreesString(valueWithUnit: string): string {
  if (!valueWithUnit) return '0'
  const v = valueWithUnit.trim().toLowerCase()
  let deg: number
  if (v.endsWith('deg')) {
    deg = parseFloat(v.replace('deg',''))
  } else if (v.endsWith('turn')) {
    deg = parseFloat(v.replace('turn','')) * 360
  } else if (v.endsWith('rad')) {
    deg = parseFloat(v.replace('rad','')) * (180 / Math.PI)
  } else if (v.endsWith('grad')) {
    deg = parseFloat(v.replace('grad','')) * 0.9
  } else {
    // assume degrees if unitless numeric
    deg = parseFloat(v)
  }
  if (isNaN(deg)) return '0'
  // format: trim insignificant decimals
  const fixed = deg.toFixed(4)
  return String(parseFloat(fixed))
}

function normalizeNamedPosition(name: string): string {
  const map: Record<string,string> = {
    'top center': 'top',
    'bottom center': 'bottom',
    'left center': 'left',
    'right center': 'right',
  }
  return map[name] || name
}

export function applyParsedToStores(parsed: ParsedGradient) {
  gradient_type.set(parsed.type)
  if (parsed.space) gradient_space.set(parsed.space)
  if (parsed.interpolation) gradient_interpolation.set(parsed.interpolation)

  if (parsed.type === 'linear') {
    if (parsed.linear?.angleKeyword) {
      // Just set the named angle - the store's subscriber will automatically
      // sync the numeric angle based on the nameToDeg mapping
      linear_named_angle.set(parsed.linear.angleKeyword)
    } else if (parsed.linear?.angleDeg) {
      // For numeric angles, set the angle value
      // The store will determine if it matches a named direction
      linear_angle.set(toDegreesString(parsed.linear.angleDeg))
    } else {
      // No angle specified, use default "to bottom" (180deg)
      linear_named_angle.set('to bottom')
    }
  } else if (parsed.type === 'radial') {
    radial_shape.set(parsed.radial?.shape ?? 'circle')
    radial_size.set(parsed.radial?.size ?? 'farthest-corner')
    if (parsed.radial?.namedPosition) {
      radial_named_position.set(normalizeNamedPosition(parsed.radial.namedPosition))
      radial_position.set({ x: null, y: null })
    } else if (parsed.radial?.position) {
      radial_named_position.set('center')
      radial_position.set({ x: parsed.radial.position.x, y: parsed.radial.position.y })
    }
  } else if (parsed.type === 'conic') {
    const from = parsed.conic?.fromDeg ? toDegreesString(parsed.conic.fromDeg) : '0'
    conic_angle.set(from)
    if (parsed.conic?.namedPosition) {
      conic_named_position.set(normalizeNamedPosition(parsed.conic.namedPosition))
      conic_position.set({ x: null, y: null })
    } else if (parsed.conic?.position) {
      conic_named_position.set('center')
      conic_position.set({ x: parsed.conic.position.x, y: parsed.conic.position.y })
    }
  }

  // Normalize position values: strip % suffix to get numeric strings
  const normalizedStops = (parsed.stops as any[]).map(s => {
    if (s.kind === 'stop') {
      return {
        ...s,
        position1: s.position1 ? String(s.position1).replace(/%$/, '') : null,
        position2: s.position2 ? String(s.position2).replace(/%$/, '') : null,
      }
    } else if (s.kind === 'hint') {
      return {
        ...s,
        percentage: s.percentage ? String(s.percentage).replace(/%$/, '') : null,
      }
    }
    return s
  })

  // Ensure a hint exists between each adjacent pair of color stops when none were provided
  const hasAnyHints = normalizedStops.some(s => s.kind === 'hint')
  let stopsWithHints = normalizedStops
  if (!hasAnyHints) {
    const colors = normalizedStops.filter(s => s.kind === 'stop')
    const rebuilt: any[] = []
    colors.forEach((st, idx) => {
      rebuilt.push({ ...st })
      if (idx < colors.length - 1) rebuilt.push({ kind: 'hint', percentage: null })
    })
    stopsWithHints = rebuilt
  }

  // normalize stops and compute autos/hints consistency
  gradient_stops.set(updateStops(stopsWithHints))
}

