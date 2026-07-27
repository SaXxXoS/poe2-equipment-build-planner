import { describe, expect, it } from 'vitest'
import type { SupportGemDefinition } from '../../domain'
import { applyQuantitativeSupports } from './quantitative-supports'

const support = (id: string, kind: 'more-damage'|'action-speed'|'more-critical-chance'|'critical-damage-bonus', percent: number): SupportGemDefinition => ({
  id, displayNameDe: id, tags: [], dataVersion: 'test', source: 'local-placeholder', status: 'verified',
  requiredTags: [], excludedTags: [], ownTags: [],
  quantitativeEffects: [{ kind, percent, evidence: 'structured-exact', sourceReference: `fixture:${id}` }],
})

describe('quantitative Supportwirkungen', () => {
  it('multipliziert mehrere More-Effekte nacheinander', () => {
    const result = applyQuantitativeSupports({
      components: [{ type: 'fire', minimum: 100, maximum: 100 }],
      setup: { id: 'setup', skillId: 'skill', role: 'main', weaponSet: 'set-1', supportGemIds: ['a', 'b'] },
      supports: [support('a', 'more-damage', 20), support('b', 'more-damage', 30)],
    })
    expect(result.components[0]).toMatchObject({ minimum: 156, maximum: 156 })
  })

  it('wendet einen typgebundenen Effekt nur auf die passende Komponente an', () => {
    const typed = support('fire', 'more-damage', 50)
    typed.quantitativeEffects![0].damageTypes = ['fire']
    const result = applyQuantitativeSupports({
      components: [{ type: 'fire', minimum: 10, maximum: 10 }, { type: 'cold', minimum: 10, maximum: 10 }],
      setup: { id: 'setup', skillId: 'skill', role: 'main', weaponSet: 'set-1', supportGemIds: ['fire'] },
      supports: [typed],
    })
    expect(result.components).toEqual([{ type: 'fire', minimum: 15, maximum: 15 }, { type: 'cold', minimum: 10, maximum: 10 }])
  })

  it('verändert ein Support ohne technischen Effekt nichts', () => {
    const unresolved: SupportGemDefinition = { id: 'unknown', displayNameDe: 'Unbekannt', tags: [], dataVersion: 'test', source: 'local-placeholder', status: 'verified', requiredTags: [], excludedTags: [], ownTags: [] }
    const result = applyQuantitativeSupports({
      components: [{ type: 'physical', minimum: 10, maximum: 20 }],
      setup: { id: 'setup', skillId: 'skill', role: 'main', weaponSet: 'set-1', supportGemIds: ['unknown'] },
      supports: [unresolved],
    })
    expect(result.components).toEqual([{ type: 'physical', minimum: 10, maximum: 20 }])
    expect(result.unresolvedSupportIds).toEqual(['unknown'])
  })
})
