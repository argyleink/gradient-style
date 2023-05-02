export function degToRad(degrees) {
  return degrees * (Math.PI / 180)
}

export function radToDeg(radians) {
  return Math.round(radians * (180 / Math.PI))
}

export function namedPosToPercent(named_position) {
  let x, y
  
  switch (named_position) {
    case 'top':
      x = 50
      y = 0
      break
    case 'right':
      x = 100
      y = 50
      break
    case 'bottom':
      x = 50
      y = 100
      break
    case 'left':
      x = 0
      y = 50
      break
    case 'top right':
      x = 100
      y = 0
      break
    case 'bottom right':
      x = 100
      y = 100
      break
    case 'bottom left':
      x = 0
      y = 100
      break
    case 'top left':
      x = 0
      y = 0
      break
    default:
      x = 50
      y = 50
      break
  }

  return {x,y}
}