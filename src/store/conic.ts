import { writable } from 'svelte/store';

export const conic_angle = writable<string>('0');
export const conic_named_position = writable<string>('center');
export const conic_position = writable<{x: number | null, y: number | null}>({x: null, y: null});

// Reflect numeric position into named position when it matches a canonical value
function posToName(x: number, y: number): string | null {
  const tol = 0
  const eq = (a: number, b: number) => Math.abs(a - b) <= tol
  if (eq(x,50) && eq(y,50)) return 'center'
  if (eq(x,50) && eq(y,0)) return 'top'
  if (eq(x,100) && eq(y,50)) return 'right'
  if (eq(x,50) && eq(y,100)) return 'bottom'
  if (eq(x,0) && eq(y,50)) return 'left'
  if (eq(x,100) && eq(y,0)) return 'top right'
  if (eq(x,100) && eq(y,100)) return 'bottom right'
  if (eq(x,0) && eq(y,100)) return 'bottom left'
  if (eq(x,0) && eq(y,0)) return 'top left'
  return null
}

let syncing = false
conic_position.subscribe(v => {
  if (syncing) return
  const x = (v as any)?.x
  const y = (v as any)?.y
  if (typeof x !== 'number' || typeof y !== 'number') return
  const name = posToName(x, y)
  syncing = true
  try { conic_named_position.set(name ?? '--') }
  finally { syncing = false }
})
