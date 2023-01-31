export function linearAngleToString(angle:string, namedAngle:string):String {
  if (angle !== null)
    return angle + 'deg'
  return namedAngle
}