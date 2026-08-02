import { describe, expect, it } from 'vitest'
import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain/skills'
import { applySpellCascadeDamageMultiplier, resolveSpellCascadeSupports } from './spell-cascade-supports'

const support = (id: string): SupportGemDefinition => ({ id, nameEn: 'Spell Cascade', displayNameDe: 'Zauberkaskade', tags: [], requiredTags: [], excludedTags: [], ownTags: [], dataVersion: 'test', source: 'local-placeholder', status: 'verified' })
const setup = (ids: string[]): SkillSetup => ({ id: 'main', skillId: 'skill', role: 'main', weaponSet: 'set-1', supportGemIds: ids })
const cascadableSkill = reference.skills.find(value => value.skillTypes.includes('Cascadable'))!
const incompatibleSkill = reference.skills.find(value => !value.skillTypes.includes('Cascadable'))!

describe('strukturierter Zauberkaskaden-Support', () => {
  it('wendet die drei gepinnten Wirkungen getrennt und ohne erfundene Überlappung an', () => {
    const definition = support('cascade')
    const model = resolveSpellCascadeSupports({ skill: cascadableSkill, setup: setup([definition.id]), supports: [definition] })
    expect(model).toMatchObject({ status: 'applied', damageMultiplier: .7, areaOfEffectMultiplier: .8, cascadesPerSide: 1, totalCascadeAreas: 3, singleTargetOverlapMultiplier: 1 })
    expect(applySpellCascadeDamageMultiplier([{ type: 'fire', minimum: 100, maximum: 200 }], model)).toEqual([{ type: 'fire', minimum: 70, maximum: 140 }])
  })

  it('blockiert eine nicht kaskadierbare Fertigkeit', () => {
    const definition = support('cascade')
    expect(resolveSpellCascadeSupports({ skill: incompatibleSkill, setup: setup([definition.id]), supports: [definition] })).toMatchObject({ status: 'blocked-incompatible-skill', damageMultiplier: 1 })
  })

  it('blockiert doppelte Familien fail-closed', () => {
    const first = support('first'), second = support('second')
    expect(resolveSpellCascadeSupports({ skill: cascadableSkill, setup: setup([first.id, second.id]), supports: [first, second] })).toMatchObject({ status: 'blocked-duplicate-family', blockedSupportIds: ['first', 'second'] })
  })
})
