import { describe, it, expect } from 'vitest'
import { get } from 'svelte/store'
import { linear_angle, linear_named_angle } from './linear'
import { applyParsedToStores } from '../lib/importGradient'
import { parseGradient } from '../lib/parseGradient'

const state = () => [get(linear_named_angle), String(get(linear_angle))]

describe('linear angle <-> keyword sync', () => {
  it('snaps exact side angles to their keyword', () => {
    linear_angle.set('10')
    expect(state()).toEqual(['--', '10'])
    linear_angle.set('90')
    expect(state()).toEqual(['to right', '90'])
    linear_angle.set('270')
    expect(state()).toEqual(['to left', '270'])
  })

  it('keeps 45/135/225/315deg as angles: corner keywords depend on the box aspect', () => {
    for (const deg of ['45', '135', '225', '315']) {
      linear_named_angle.set('to right')
      linear_angle.set(deg)
      expect(state()).toEqual(['--', deg])
    }
  })

  it('keeps a corner keyword restored alongside its nominal angle', () => {
    linear_named_angle.set('to top right')
    expect(state()).toEqual(['to top right', '45'])
    // layer/URL restore writes the keyword, then the angle
    linear_angle.set('45')
    expect(state()).toEqual(['to top right', '45'])
    linear_angle.set('46')
    expect(state()).toEqual(['--', '46'])
  })

  it('imports `45deg` as 45deg, not `to top right`', () => {
    linear_named_angle.set('to right')
    applyParsedToStores(parseGradient('linear-gradient(45deg, red, blue)'))
    expect(state()).toEqual(['--', '45'])
    applyParsedToStores(parseGradient('linear-gradient(to top right, red, blue)'))
    expect(get(linear_named_angle)).toBe('to top right')
  })
})
