import { describe, expect, it } from 'vitest'
import { classifyPob2Unique, type Pob2SemanticRecord } from './pob2-semantics'

const record = (line: string): Pob2SemanticRecord => ({
  slot: 'ring',
  itemCategory: 'ring',
  requiredLevel: 1,
  variants: [],
  visibleModifiers: [{ sourceLineId: 'line-1', normalizedPlannerLine: line }],
})

describe('PoB2-Unique-Semantik', () => {
  it('behandelt Blitzwiderstand ausschließlich defensiv', () => {
    const result = classifyPob2Unique(record('+{value1}% to Lightning Resistance'))
    expect(result.tags).toContain('resistance')
    expect(result.tags).toContain('defensive')
    expect(result.tags).not.toContain('lightning')
  })

  it('behält echten Blitzschaden als offensive Blitzwirkung', () => {
    const result = classifyPob2Unique(record('Adds {value1} to {value2} Lightning Damage'))
    expect(result.tags).toContain('lightning')
  })

  it('wertet defensiv umgeleiteten erlittenen Schaden nicht als offensive Elementarskalierung', () => {
    const result = classifyPob2Unique(record('10% of Lightning Damage taken as Cold Damage'))
    expect(result.tags).toContain('defensive')
    expect(result.tags).not.toContain('lightning')
    expect(result.tags).not.toContain('cold')
  })

  it('markiert erhöhte Attributanforderungen als Nachteil', () => {
    const result = classifyPob2Unique(record('+150 to Strength Requirement'))
    expect(result.tradeOffs).toEqual(['source-line:line-1'])
  })
})
