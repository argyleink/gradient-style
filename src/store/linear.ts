import { writable, get } from 'svelte/store';

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

// Only the side keywords are fixed angles (`to right` is exactly 90deg). The corner keywords
// (`to top right`...) aim at the box's corner, so they only equal 45/135/225/315deg on a square:
// a typed or imported 45deg must stay 45deg, or the output silently renders a different angle.
const sideToDeg: Record<string, number> = {
  'to top': 0,
  'to right': 90,
  'to bottom': 180,
  'to left': 270,
}

// When the numeric angle matches a side keyword, reflect it in the UI.
linear_angle.subscribe(v => {
  if (syncing) return
  if (v == null) return
  const n = Number(v)
  if (Number.isNaN(n)) return
  // Normalize to [0,360)
  const a = ((n % 360) + 360) % 360
  // a corner keyword set alongside its nominal angle (layer/URL restore) stays as is
  const current = get(linear_named_angle)
  if (current && nameToDeg[current] === a) return
  const side = Object.keys(sideToDeg).find(name => sideToDeg[name] === a)
  syncing = true
  try { linear_named_angle.set(side ?? '--') }
  finally { syncing = false }
})
