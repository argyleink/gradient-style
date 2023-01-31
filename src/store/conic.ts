import { writable } from 'svelte/store';

export const conic_angle = writable('0');
export const conic_named_position = writable('center');
export const conic_position = writable({x: null, y: null});