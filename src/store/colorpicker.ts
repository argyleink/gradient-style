import { writable } from 'svelte/store';

export const colorspace = writable('oklab');

export const labL = writable(100);
export const labA = writable(-.2);
export const labB = writable(.5);
export const labAlpha = writable(100);

export const hslH = writable(220);
export const hslS = writable(100);
export const hslL = writable(50);
export const hslAlpha = writable(100);

export const hwbH = writable(220);
export const hwbW = writable(100);
export const hwbB = writable(50);
export const hwbAlpha = writable(100);

export const rgbR = writable(0);
export const rgbG = writable(255);
export const rgbB = writable(255);
export const rgbAlpha = writable(100);

export const colorR = writable(0);
export const colorG = writable(100);
export const colorB = writable(100);
export const colorAlpha = writable(100);