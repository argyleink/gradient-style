export function linearAngleToString(angle:string, namedAngle:string):String {
  if (namedAngle !== '--')
    return namedAngle
  else if (angle !== null)
    return angle + 'deg'  
}

export const linear_keywords = {
  "to top": () => 0,
  "to top right": (w,h) =>
    Math.acos((w / 2) / (Math.sqrt(Math.pow(w, 2) + Math.pow(h, 2)) / 2)),
  "to right": () => 
    Math.PI / 2,
  "to bottom right": (w,h) => 
    Math.PI - linear_keywords["to top right"](w,h),
  "to bottom": () => Math.PI,
  "to bottom left": (w,h) => 
    Math.PI + linear_keywords["to top right"](w,h),
  "to left": () => 
    3 * Math.PI / 2,
  "to top left": (w,h) => 
    (2 * Math.PI) - linear_keywords["to top right"](w,h),
}