export function degToRad(degrees) {
  return degrees * (Math.PI / 180)
}

export function radToDeg(radians) {
  return Math.round(radians * (180 / Math.PI))
}