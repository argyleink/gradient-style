import { describe, it, expect } from 'vitest'
import { removeStopAt } from './stops'

const stop = (color: string) => ({ kind: 'stop', color })
const hint = () => ({ kind: 'hint' })
const kinds = (list: any[]) => list.map(s => s.kind === 'stop' ? s.color : 'h').join(' ')

describe('removeStopAt (#81)', () => {
  const three = () => [stop('a'), hint(), stop('b'), hint(), stop('c')]

  it('removes a first or middle stop with its following hint', () => {
    expect(kinds(removeStopAt(three(), 0))).toBe('b h c')
    expect(kinds(removeStopAt(three(), 2))).toBe('a h c')
  })

  it('removes the last stop with the hint before it, leaving no dangling hint', () => {
    expect(kinds(removeStopAt(three(), 4))).toBe('a h b')
  })

  it('never removes the only color stop', () => {
    const one = [stop('a')]
    expect(removeStopAt(one, 0)).toBe(one)
  })

  it('ignores hints and out of range indexes', () => {
    const list = three()
    expect(removeStopAt(list, 1)).toBe(list)
    expect(removeStopAt(list, 9)).toBe(list)
  })

  it('does not mutate the input', () => {
    const list = three()
    removeStopAt(list, 2)
    expect(kinds(list)).toBe('a h b h c')
  })
})
