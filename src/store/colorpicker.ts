import { writable } from 'svelte/store';

export const colorspace = writable('oklab');

export const labL = writable(60);
export const labA = writable(-.2);
export const labB = writable(.5);
export const labAlpha = writable(100);

export const hslH = writable(220);
export const hslS = writable(50);
export const hslL = writable(50);
export const hslAlpha = writable(100);

export const rgbR = writable(50);
export const rgbG = writable(50);
export const rgbB = writable(50);
export const rgbAlpha = writable(100);