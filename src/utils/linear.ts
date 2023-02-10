export function linearAngleToString(angle:string, namedAngle:string):String {
  if (angle !== null)
    return angle + 'deg'
  return namedAngle
}

export const linear_keywords = {
  "to top": () => 0,
  "to top right": ({clientWidth:w, clientHeight:h}) =>
    Math.acos((w / 2) / (Math.sqrt(Math.pow(w, 2) + Math.pow(h, 2)) / 2)),
  "to right": () => 
    Math.PI / 2,
  "to bottom right": bounds => 
    Math.PI - linear_keywords["to top right"](bounds),
  "to bottom": () => Math.PI,
  "to bottom left": bounds => 
    Math.PI + linear_keywords["to top right"](bounds),
  "to left": () => 
    3 * Math.PI / 2,
  "to top left": bounds => 
    (2 * Math.PI) - linear_keywords["to top right"](bounds),
}