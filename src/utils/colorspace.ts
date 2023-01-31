export function isCylindricalSpace(space:string):Boolean {
  return ['hsl','hwb','lch','oklch'].includes(space)
}