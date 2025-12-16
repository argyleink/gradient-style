export function linearAngleToString(angle: string, namedAngle: string): string {
  if (namedAngle !== '--')
    return namedAngle
  else if (angle !== null)
    return angle + 'deg'
  return ''
}

export const linear_keywords: { [key: string]: (w?: number, h?: number) => number } = {
  "to top": () => 0,
  "to top right": (w?: number, h?: number) =>
    Math.acos(((w || 0) / 2) / (Math.sqrt(Math.pow(w || 0, 2) + Math.pow(h || 0, 2)) / 2)),
  "to right": () => 
    Math.PI / 2,
  "to bottom right": (w?: number, h?: number) => 
    Math.PI - linear_keywords["to top right"](w, h),
  "to bottom": () => Math.PI,
  "to bottom left": (w?: number, h?: number) => 
    Math.PI + linear_keywords["to top right"](w, h),
  "to left": () => 
    3 * Math.PI / 2,
  "to top left": (w?: number, h?: number) => 
    (2 * Math.PI) - linear_keywords["to top right"](w, h),
}