import { writable } from 'svelte/store';

export const gradient_type = writable('linear');
export const gradient_angle = writable('to right');
export const gradient_space = writable('oklab');
export const gradient_colors = writable(['#00ff00', '#ff00ff']);
// export const radial_shapes = writable();
// export const radial_positions = writable();
