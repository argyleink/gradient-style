/**
 * Film grain: an SVG feTurbulence noise tile painted as the top background
 * layer, over every gradient layer. Plain source-over compositing (no
 * background-blend-mode) so wide-gamut gradients underneath aren't forced
 * through an sRGB blend, and the output stays a single `background` value.
 */

export const GRAIN_MAX = 100

/** Clamp anything (store value, URL param) to a whole 0–100 amount. */
export function normalizeGrain(value: unknown): number {
  const n = Math.round(Number(value))
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.min(GRAIN_MAX, n)
}

/** `url("data:image/svg+xml,...")` for the given 0–100 amount, or '' when off. */
export function grainLayer(amount: unknown): string {
  const a = normalizeGrain(amount)
  if (!a) return ''
  // 100% maps to half-opacity noise: any heavier is a grey haze, not grain
  const opacity = String(a / 200)
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'>` +
      `<filter id='g'>` +
        `<feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/>` +
        `<feColorMatrix type='saturate' values='0'/>` +
      `</filter>` +
      `<rect width='100%' height='100%' filter='url(#g)' opacity='${opacity}'/>` +
    `</svg>`
  const encoded = svg.replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E')
  return `url("data:image/svg+xml,${encoded}")`
}

/** Put the grain tile on top of a background list (no-op when grain is off). */
export function withGrain(background: string, amount: unknown): string {
  const grain = grainLayer(amount)
  if (!grain) return background
  return background ? `${grain}, ${background}` : grain
}
