import { writable } from 'svelte/store';

export const linear_named_angle = writable('to right');
export const linear_angle = writable(null);

// Keep numeric angle in sync when a named direction is chosen.
// This ensures UI indicators (like the angle icon) reflect the selection.
const nameToDeg: Record<string, number> = {
  'to top': 0,
  'to top right': 45,
  'to right': 90,
  'to bottom right': 135,
  'to bottom': 180,
  'to bottom left': 225,
  'to left': 270,
  'to top left': 315,
}

let syncing = false
linear_named_angle.subscribe(v => {
  if (syncing) return
  if (!v || v === '--') return
  const deg = nameToDeg[v]
  if (typeof deg === 'number') {
    syncing = true
    try { linear_angle.set(String(deg)) }
    finally { syncing = false }
  }
})

// When the numeric angle matches a named direction, reflect it in the UI.
linear_angle.subscribe(v => {
  if (syncing) return
  if (v == null) return
  const n = Number(v)
  if (Number.isNaN(n)) return
  // Normalize to [0,360)
  let a = ((n % 360) + 360) % 360
  const entries = Object.entries(nameToDeg)
  const tol = 0.5
  for (const [name, deg] of entries) {
    const d = Math.abs((((a - deg) % 360) + 540) % 360 - 180)
    if (d <= tol) {
      if (name !== 'to bottom' || deg !== 180) {
        syncing = true
        try { linear_named_angle.set(name) }
        finally { syncing = false }
      } else {
        // default direction; show it explicitly too
        syncing = true
        try { linear_named_angle.set('to bottom') }
        finally { syncing = false }
      }
      return
    }
  }
  // Not a named angle; show custom
  syncing = true
  try { linear_named_angle.set('--') }
  finally { syncing = false }
})
