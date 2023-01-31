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

// static
export const gradient_positions = [
  'center',
  'top',
  'top right',
  'right',
  'bottom right',
  'bottom',
  'bottom left',
  'left',
  'top left'
]