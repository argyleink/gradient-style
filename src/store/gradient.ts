import { writable } from 'svelte/store';

export const gradient_type = writable('linear');
export const gradient_space = writable('oklab');
export const gradient_interpolation = writable('shorter');
export const gradient_stops = writable([
  {kind: 'stop', color: 'rgb(100% 0% 100%)', position1: null, position2: null}, 
  {kind: 'hint', auto: '25', percentage: '25'},
  {kind: 'stop', color: 'rgb(100% 100% 0%)', position1: null, position2: null},
  {kind: 'hint', auto: '75', percentage: '80'},
  {kind: 'stop', color: 'rgb(0% 100% 100%)', position1: null, position2: null},
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