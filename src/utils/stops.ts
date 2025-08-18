export function updateStops(stops) {
  const autoStops = genStopMap(stops)

  let updated = stops.map((stop, i) => {
    let autoVal = autoStops[i]
    
    if (stop.kind == 'stop') {
      if (stops.length === 1) {
        stop.position1 = 0
        stop.position2 = 100 
      }
      else if (!stop._manual && (!stop.position1 || stop.position1 === stop.auto)) {
        stop.position1 = autoVal
        stop.position2 = autoVal
      }
      // Clear the manual flag after one normalization pass so future edits behave normally
      if (stop._manual) delete stop._manual
    }
    // is a hint
    else {
      if (!stop.percentage || stop.percentage === stop.auto)
        stop.percentage = autoVal
    }

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