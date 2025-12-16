export function namedPosToPercent(named_position: string): { x: number; y: number } {
  let x: number, y: number
  
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