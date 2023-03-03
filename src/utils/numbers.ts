export function randomNumber(min, max) {
  return Math.trunc(Math.random() * (max - min) + min)
}