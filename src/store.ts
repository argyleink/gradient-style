import { writable } from 'svelte/store';

export const gradient_type = writable('linear');
export const gradient_angle = writable('to right');
export const gradient_space = writable('oklab');
export const gradient_stops = writable([
  {kind: 'stop', color: '#ffff00', size: null}, 
  {kind: 'hint', percentage: '50'},
  {kind: 'stop', color: '#ff00ff', size: null},
  {kind: 'hint', percentage: '50'},
  {kind: 'stop', color: '#00ffff', size: '100%'},
]);
// export const radial_shapes = writable();
// export const radial_positions = writable();
