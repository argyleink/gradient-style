import { writable } from 'svelte/store';

export const picker_value = writable<string>('oklch(75% .3 180deg)')
export const colorspace = writable<string>('oklch');

export const oklabL = writable<number | string>(100);
export const oklabA = writable<number | string>(-.2);
export const oklabB = writable<number | string>(.5);
export const oklabAlpha = writable<number>(100);

export const oklchL = writable<number | string>(50);
export const oklchC = writable<number | string>(.5);
export const oklchH = writable<number | string>(220);
export const oklchAlpha = writable<number>(100);

export const labL = writable<number | string>(100);
export const labA = writable<number | string>(-20);
export const labB = writable<number | string>(160);
export const labAlpha = writable<number>(100);

export const lchL = writable<number | string>(50);
export const lchC = writable<number | string>(100);
export const lchH = writable<number | string>(220);
export const lchAlpha = writable<number>(100);

export const hslH = writable<number | string>(220);
export const hslS = writable<number | string>(100);
export const hslL = writable<number | string>(50);
export const hslAlpha = writable<number>(100);

export const hwbH = writable<number | string>(323);
export const hwbW = writable<number | string>(0);
export const hwbB = writable<number | string>(0);
export const hwbAlpha = writable<number>(100);

export const rgbR = writable<number | string>(0);
export const rgbG = writable<number | string>(100);
export const rgbB = writable<number | string>(100);
export const rgbAlpha = writable<number | string>(100);

export const colorR = writable<number | string>(0);
export const colorG = writable<number | string>(100);
export const colorB = writable<number | string>(100);
export const colorAlpha = writable<number | string>(100);