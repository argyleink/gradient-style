export function updateStops(stops) {
  const autoStops = genStopMap(stops)

  let updated = stops.map((stop, i) => {
    let autoVal = autoStops[i]

    if (stop.kind == 'stop') {
      if (stops.length === 1) {
        // For a single color stop, span the entire line
        stop.position1 = 0
        stop.position2 = 100
      }
      else if (!stop._manual) {
        // Treat null/undefined as unset; 0 is a valid value and must be preserved
        const p1Unset = (stop.position1 == null) || (stop.auto != null && String(stop.position1) == String(stop.auto))
        const p2Unset = (stop.position2 == null)

        // Only assign auto for position1 when it is unset or previously auto-managed
        if (p1Unset) stop.position1 = autoVal

        // Only assign a second position when it is truly unset. Never override an existing value,
        // even if it equals the auto position, to preserve explicit spans from presets/URL restores.
        if (p2Unset) stop.position2 = p1Unset ? autoVal : stop.position1
      }
      // Clear the manual flag after one normalization pass so future edits behave normally
      if (stop._manual) delete stop._manual
    }
    // is a hint
    else {
      // Only auto-assign hint percentage when it's unset or previously auto-managed
      if (stop.percentage == null || (stop.auto != null && String(stop.percentage) == String(stop.auto)))
        stop.percentage = autoVal
    }

    // Persist the computed auto value for future comparisons
    stop.auto = autoVal
    return stop
  })

  return updated
}

export function removeStop(stops, pos) {
  const updated = [...stops]
  updated.splice(pos, 2)

  if (updated.length === pos)
    updated.pop()

  return updated
}

function genStopMap(stops) {
  const colors = stops.filter(stop => stop.kind === 'stop')
  const hints = stops.filter(stop => stop.kind === 'hint')

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