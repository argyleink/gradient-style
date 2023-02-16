export function updateStops(stops) {
  const autoStops = genStopMap(stops)

  let updated = stops.map((stop, i) => {
    let autoVal = autoStops[i]
    stop.auto = autoVal
    
    if (stop.kind == 'stop') {
      if (stops.length === 1) {
        stop.position1 = 0
        stop.position2 = 0 
      }
      else {
        stop.position1 = autoVal
        stop.position2 = null  
      }
    }
    else {
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
    let stopPos = start + (increment * i)
    let hintPos = hintStart + (increment * i)

    if (stopPos === 99)
      stopPos = 100

    genStops.unshift(stopPos)
    hints[i] && genStops.unshift(hintPos)
  }

  return genStops.reverse()
}