export function updateStops(stops) {
  const autoStops = genStopMap(stops)

  let updated = stops.map((stop, i) => {
    let autoVal = autoStops[i]
    if (stop.kind == 'stop') {
      stop.position1 = autoVal
      stop.position2 = null
    }
    else {
      stop.auto = autoVal
      stop.percentage = autoVal
      // let oldValAuto = stop.auto == stop.percentage
      // stop.auto = autoVal
      // if (oldValAuto)
      //   stop.percentage = autoVal
    }
    return stop
  })

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
    let stop = colors[i]
    let hint = hints[i]
    genStops.unshift(start + (increment * i))
    hint && genStops.unshift(hintStart + (increment * i))
  }

  return genStops.reverse()
}