import { writable } from 'svelte/store';

export const gradient_type = writable<string>('linear');
export const gradient_space = writable<string>('oklab');
export const gradient_interpolation = writable<string>('shorter');
export const gradient_stops = writable<Stop[]>([
  {kind: 'stop', color: 'oklch(70% 0.5 340)', auto: '0', position1: '0', position2: '0'}, 
  {kind: 'hint', auto: '50', percentage: '50'},
  {kind: 'stop', color: 'oklch(90% 0.5 200)', auto: '100', position1: '100', position2: '100'},
]);

export const active_stop_index = writable<number | null>(null)

export const gradient_positions = [
  'center',
  'top left', 'top', 'top right',
  'right',
  'bottom right', 'bottom', 'bottom left',
  'left',
]

export const gradient_angles = [
  'to top left',
  'to top',
  'to top right',
  'to right',
  'to bottom right',
  'to bottom',
  'to bottom left',
  'to left',
]