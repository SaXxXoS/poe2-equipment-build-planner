import { readFileSync } from 'node:fs'
import { URL } from 'node:url'
import { describe, expect, it } from 'vitest'

describe('Coverage des gepinnten Attributmodells', () => {
  it('pinnt die attributbezogenen 0.5.2-Baumzeilen', () => {
    const source = JSON.parse(readFileSync(new URL('../../../data-sources/poe2-tree/raw/0.5.2/data.json', import.meta.url), 'utf8'))
    const clean = value => value.replace(/\[[^|\]]+\|([^\]]+)\]/g, '$1').replace(/\[([^\]]+)\]/g, '$1').trim()
    const lines = Object.values(source.nodes).flatMap(node => node.stats ?? []).map(clean).filter(value => /attributes?|strength|dexterity|intelligence/i.test(value))
    const categories = { single: 0, all: 0, pair: 0, percent: 0, blocked: 0 }
    for (const text of lines) {
      if (/^\+?(-?\d+) to (Strength|Dexterity|Intelligence)$/i.test(text)) categories.single++
      else if (/^\+?(-?\d+) to all Attributes$/i.test(text)) categories.all++
      else if (/^\+?(-?\d+) to (Strength|Dexterity|Intelligence) and (Strength|Dexterity|Intelligence)$/i.test(text)) categories.pair++
      else if (/^(\d+)% (increased|reduced|more|less) (Strength|Dexterity|Intelligence|Attributes)$/i.test(text)) categories.percent++
      else categories.blocked++
    }
    expect(lines).toHaveLength(463)
    expect(categories).toEqual({ single: 106, all: 15, pair: 7, percent: 12, blocked: 323 })
  })
})
