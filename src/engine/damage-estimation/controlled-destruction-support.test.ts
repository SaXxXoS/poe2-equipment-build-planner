import { describe, expect, it } from 'vitest'
import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain/skills'
import { applyControlledDestructionHitMultiplier, resolveControlledDestructionSupport } from './controlled-destruction-support'

const support = (id: string): SupportGemDefinition => ({ id, nameEn: 'Controlled Destruction', displayNameDe: 'Kontrollierte Zerstörung', tags: [], requiredTags: [], excludedTags: [], ownTags: [], dataVersion: 'test', source: 'local-placeholder', status: 'verified' })
const setup = (ids: string[]): SkillSetup => ({ id: 'main', skillId: 'skill', role: 'main', weaponSet: 'set-1', supportGemIds: ids })
const spell = reference.skills.find(value => value.skillTypes.includes('Damage') && value.skillTypes.includes('Spell'))!
const attack = reference.skills.find(value => value.skillTypes.includes('Attack') && !value.skillTypes.includes('Spell'))!

describe('Kontrollierte Zerstörung', () => {
  it('wendet 25% mehr Trefferschaden an und verhindert kritische Treffer', () => {
    const gem = support('controlled')
    const model = resolveControlledDestructionSupport({ skill: spell, setup: setup([gem.id]), supports: [gem] })
    expect(model).toMatchObject({ status: 'applied', hitDamagePercent: 25, hitDamageMultiplier: 1.25, preventsCriticalHits: true })
    expect(applyControlledDestructionHitMultiplier([{ type: 'fire', minimum: 100, maximum: 200 }], model))
      .toEqual([{ type: 'fire', minimum: 125, maximum: 250 }])
  })

  it('blockiert Angriffe und doppelte Familien fail-closed', () => {
    const first = support('first'), second = support('second')
    expect(resolveControlledDestructionSupport({ skill: attack, setup: setup([first.id]), supports: [first] }))
      .toMatchObject({ status: 'blocked-incompatible-skill', hitDamageMultiplier: 1, preventsCriticalHits: false })
    expect(resolveControlledDestructionSupport({ skill: spell, setup: setup([first.id, second.id]), supports: [first, second] }))
      .toMatchObject({ status: 'blocked-duplicate-family', blockedSupportIds: ['first', 'second'], hitDamageMultiplier: 1 })
  })
})
