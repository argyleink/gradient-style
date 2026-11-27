interface Stop {
  kind: string;
  position1?: number;
  position2?: number;
  percentage?: number;
  _manual?: boolean;
  auto?: number;
}

export function updateStops(stops: Stop[]): Stop[] {
  const autoStops = genStopMap(stops)

  let updated = stops.map((stop: Stop, i: number): Stop => {
    let autoVal = autoStops[i]

    if (stop.kind == 'stop') {
      if (stops.length === 1) {
        // For a single color stop, span the entire line
        stop.position1 = 0
        stop.position2 = 100
      }
      else if (!stop._manual) {
        // Treat null/undefined as unset; 0 is a valid value and must be preserved
        const prevAuto = stop.auto
        const p2Unset = (stop.position2 == null)
        // A span (position2 set and different from position1) is explicit on both ends, even when
        // its start happens to sit on the previous auto slot (#119)
        const isSpan = !p2Unset && String(stop.position2) !== String(stop.position1)
        const p1Unset = (stop.position1 == null) || (!isSpan && prevAuto != null && String(stop.position1) == String(prevAuto))

        // Detect whether position2 was effectively "linked" to position1 or to the prior auto value.
        // The auto linkage only counts while position1 is auto-managed too: an explicit span like
        // `0% 20%` whose end happens to equal the old auto slot (20) is a real value, not a link (#119).
        const hadLinked = (!p2Unset) && (
          String(stop.position2) === String(stop.position1) ||
          (p1Unset && prevAuto != null && String(stop.position2) === String(prevAuto))
        )

        // Only assign auto for position1 when it is unset or previously auto-managed
        if (p1Unset) stop.position1 = autoVal

        // Only assign a second position when it is truly unset. Never override an existing value,
        // even if it equals the auto position, to preserve explicit spans from presets/URL restores.
        if (p2Unset) {
          stop.position2 = p1Unset ? autoVal : stop.position1
        } else if (hadLinked) {
          // Maintain linkage when redistributing: keep position2 equal to position1
          stop.position2 = (stop.position1 != null) ? stop.position1 : autoVal
        }
      }
      // Clear the manual flag after one normalization pass so future edits behave normally
      if (stop._manual) delete stop._manual
    }
    // hints are resolved below, once every color stop has its final position
    else return stop

    // Persist the computed auto value for future comparisons
    stop.auto = autoVal
    return stop
  })

  // A hint's default is the midpoint between its two neighbouring color stops (that's where the
  // browser puts it when the hint is omitted), not an even slot on the 0-100 line. With stops at
  // 0%, 80% and 100% the second transition sits at 90%, not 75% (#34).
  const mids = hintMidpoints(updated)
  updated.forEach((stop: Stop, i: number) => {
    if (stop.kind === 'stop') return
    const autoVal = mids[i] ?? autoStops[i]
    // Only auto-assign hint percentage when it's unset or previously auto-managed
    if (stop.percentage == null || (stop.auto != null && String(stop.percentage) == String(stop.auto)))
      stop.percentage = autoVal
    stop.auto = autoVal
  })

  return updated
}

/**
 * Midpoint for every hint whose neighbouring stops have percentage positions, after CSS's
 * position fixup (a stop placed before an earlier one is clamped up to it). Hints next to
 * length-positioned stops (px, em, calc...) are left out so callers fall back to the even map.
 */
function hintMidpoints(stops: Stop[]): Record<number, number> {
  const out: Record<number, number> = {}
  let floor = -Infinity
  let prevEnd: number | null = null
  let pendingHint: number | null = null
  let unknown = false

  for (let i = 0; i < stops.length; i++) {
    const s = stops[i]
    if (s.kind !== 'stop') {
      pendingHint = i
      // an explicit hint is a position too, and pushes the floor for later stops
      const n = isAuto(s.percentage, s.auto) ? null : numericPct(s.percentage)
      if (n != null) floor = Math.max(floor, n)
      continue
    }
    const p1 = numericPct(s.position1)
    const p2 = s.position2 == null ? p1 : numericPct(s.position2)
    if (p1 == null || p2 == null) {
      unknown = true
      pendingHint = null
      continue
    }
    const start = Math.max(floor, p1)
    const end = Math.max(start, p2)
    if (pendingHint != null && prevEnd != null && !unknown)
      out[pendingHint] = Number(round2((prevEnd + start) / 2))
    floor = end
    prevEnd = end
    pendingHint = null
    unknown = false
  }
  return out
}

export function removeStop(stops: Stop[], pos: number): Stop[] {
  const updated = [...stops]
  updated.splice(pos, 2)

  if (updated.length === pos)
    updated.pop()

  return updated
}

function genStopMap(stops: Stop[]): number[] {
  const colors = stops.filter((stop: Stop) => stop.kind === 'stop')
  const hints = stops.filter((stop: Stop) => stop.kind === 'hint')

  const start = 0
  const colorIncrements = 100 / (colors.length - 1)
  const hintStart = Math.round(colorIncrements / 2)
  const increment = Math.round(colorIncrements)

  let genStops = []
  for (let i = 0; i <= hints.length; i++) {
    let stopPos = start + (increment * i)
    let hintPos = hintStart + (increment * i)

    if (stopPos === 99)
      stopPos = 100

    genStops.unshift(stopPos)
    hints[i] && genStops.unshift(hintPos)
  }

  return genStops.reverse()
}

function numericPct(p: any): number | null {
  if (p == null) return null
  if (typeof p === 'number') return Number.isFinite(p) ? p : null
  const m = String(p).trim().match(/^([-+]?\d*\.?\d+)%?$/)
  return m ? Number(m[1]) : null
}

const round2 = (n: number) => String(Math.round(n * 100) / 100)

/**
 * A repeating gradient whose stops already span 0–100% looks identical to the
 * non-repeating one, so turning "repeat" on would appear to do nothing. When
 * that's the case, squeeze the stop list into the first `fraction` of the line
 * so the pattern visibly tiles. Stops that already end short of 100%, or that
 * use non-percent lengths (px, em...), are returned untouched.
 */
export function tileStops(stops: Stop[], fraction = 0.25): Stop[] {
  const positions = stops.flatMap(s => s.kind === 'stop'
    ? [numericPct(s.position1), numericPct(s.position2)]
    : [numericPct(s.percentage)])
  if (positions.some(p => p == null)) return stops
  if (Math.max(...(positions as number[])) < 100) return stops

  return stops.map(s => {
    if (s.kind === 'stop') {
      return { ...s, position1: round2(numericPct(s.position1)! * fraction), position2: round2(numericPct(s.position2)! * fraction) } as Stop
    }
    return { ...s, percentage: round2(numericPct(s.percentage)! * fraction) } as Stop
  })
}

function mirrorPos(p: any): any {
  if (p == null) return p
  const n = numericPct(p)
  if (n != null) return round2(100 - n)
  // A length (px, em, calc...) can't be mirrored without the line length; let calc() do it
  const str = String(p).trim()
  const inner = /^calc\(/i.test(str) ? str.slice(4) : str
  return `calc(100% - ${inner})`
}

const isAuto = (value: any, auto: any) => value == null || (auto != null && String(value) === String(auto))

/**
 * Flip the gradient line end to end: the last color becomes the first and every
 * position p moves to 100% - p (a span a..b becomes 100-b..100-a, hints mirror
 * too, since a hint is a position on the line). That's an exact mirror for
 * repeating gradients as well, the tile just shifts phase.
 *
 * Positions are mirrored *after* CSS's fixup (CSS Images 3 §3.5.3: a stop or hint
 * placed before an earlier one is clamped up to it), because authored values like
 * the Stripes preset's `0% 40%` only mean `20% 40%` in context. Auto-placed stops
 * and hints stay auto so the output keeps its short `red, blue` form.
 */
export function reverseStops(stops: Stop[]): Stop[] {
  if (stops.filter(s => s.kind === 'stop').length < 2) return stops
  let floor = -Infinity
  const effective = (p: any) => {
    const n = numericPct(p)
    if (n == null) return p
    floor = Math.max(floor, n)
    return floor
  }

  const resolved = stops.map((s: any) => {
    if (s.kind === 'stop') {
      const autoP1 = isAuto(s.position1, s.auto)
      const linked = s.position2 == null || String(s.position2) === String(s.position1)
      const p1 = effective(autoP1 ? s.auto : s.position1)
      const p2 = effective(s.position2 == null ? p1 : s.position2)
      return { s, auto: autoP1 && linked, p1, p2 }
    }
    // auto hints are never written to the CSS, so they don't take part in fixup
    const auto = isAuto(s.percentage, s.auto)
    return { s, auto, p1: auto ? null : effective(s.percentage) }
  })

  const reversed = resolved.reverse().map(({ s, auto, p1, p2 }: any) => {
    if (s.kind === 'stop') {
      if (auto) return { ...s, position1: null, position2: null, auto: undefined }
      return { ...s, position1: mirrorPos(p2), position2: mirrorPos(p1), auto: undefined, _manual: true }
    }
    if (auto) return { ...s, percentage: null, auto: undefined }
    return { ...s, percentage: mirrorPos(p1), auto: undefined }
  })
  return updateStops(reversed as Stop[])
}
