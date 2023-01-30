import { writable } from 'svelte/store';

export const gradient_type = writable('linear');
export const gradient_space = writable('oklab');
export const gradient_interpolation = writable('shorter');
export const gradient_stops = writable([
  {kind: 'stop', color: '#ffff00', position1: null, position2: null}, 
  {kind: 'hint', percentage: '15'},
  {kind: 'stop', color: '#ff00ff', position1: '31', position2: '59'},
  {kind: 'hint', percentage: '80'},
  {kind: 'stop', color: '#00ffff', position1: null, position2: null},
]);

// linear specific
export const linear_named_angle = writable('to right');
export const linear_angle = writable(null);

// radial specific
export const radial_shape = writable('circle');
export const radial_named_position = writable('center');
export const radial_position = writable({x: null, y: null});
export const radial_size = writable('farthest-corner');

// conic specific
export const conic_angle = writable('0');
export const conic_named_position = writable('center');
export const conic_position = writable({x: null, y: null});