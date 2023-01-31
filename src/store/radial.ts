import { writable } from 'svelte/store';

export const radial_shape = writable('circle');
export const radial_named_position = writable('center');
export const radial_position = writable({x: null, y: null});
export const radial_size = writable('farthest-corner');