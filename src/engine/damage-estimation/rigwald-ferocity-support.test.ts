import { describe, expect, it } from 'vitest'
import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain/skills'
import { applyRigwaldDamageMultiplier, resolveRigwaldFerocitySupport } from './rigwald-ferocity-support'

const support = (id: string): SupportGemDefinition => ({ id, nameEn: "Rigwald's Ferocity", displayNameDe: 'Rigwalds Wildheit', tags: [], requiredTags: [], excludedTags: [], ownTags: [], dataVersion: 'test', source: 'local-placeholder', status: 'verified' })
const setup = (ids: string[]): SkillSetup => ({ id: 'main', skillId: 'skill', role: 'main', weaponSet: 'set-1', supportGemIds: ids })
const attack = reference.skills.find(value => value.skillTypes.includes('Attack') && !value.skillTypes.includes('Instant') && !value.skillTypes.includes('NoAttackOrCastTime'))!
const spell = reference.skills.find(value => value.skillTypes.includes('Spell') && !value.skillTypes.includes('Attack'))!

describe('Rigwalds waffensetspezifische Supportwirkung', () => {
  it('wendet in Set 1 30% Angriffsgeschwindigkeit und 15% weniger Schaden an', () => {
    const gem = support('rigwald')
    const model = resolveRigwaldFerocitySupport({ skill: attack, setup: setup([gem.id]), supports: [gem], weaponSet: 'set-1' })
    expect(model).toMatchObject({ status: 'applied', weaponSet: 'set-1', finalDamagePercent: -15, attackSpeedPercent: 30, damageMultiplier: .85, attackSpeedMultiplier: 1.3 })
    expect(applyRigwaldDamageMultiplier([{ type: 'physical', minimum: 100, maximum: 200 }], model)).toEqual([{ type: 'physical', minimum: 85, maximum: 170 }])
  })

  it('wendet in Set 2 30% mehr Schaden und 10% weniger Angriffsgeschwindigkeit an', () => {
    const gem = support('rigwald')
    expect(resolveRigwaldFerocitySupport({ skill: attack, setup: setup([gem.id]), supports: [gem], weaponSet: 'set-2' }))
      .toMatchObject({ status: 'applied', weaponSet: 'set-2', finalDamagePercent: 30, attackSpeedPercent: -10, damageMultiplier: 1.3, attackSpeedMultiplier: .9 })
  })

  it('blockiert Nicht-Angriffe und doppelte Familien fail-closed', () => {
    const first = support('first'), second = support('second')
    expect(resolveRigwaldFerocitySupport({ skill: spell, setup: setup([first.id]), supports: [first], weaponSet: 'set-1' }))
      .toMatchObject({ status: 'blocked-incompatible-skill', damageMultiplier: 1, attackSpeedMultiplier: 1 })
    expect(resolveRigwaldFerocitySupport({ skill: attack, setup: setup([first.id, second.id]), supports: [first, second], weaponSet: 'set-1' }))
      .toMatchObject({ status: 'blocked-duplicate-family', blockedSupportIds: ['first', 'second'], damageMultiplier: 1, attackSpeedMultiplier: 1 })
  })
})
