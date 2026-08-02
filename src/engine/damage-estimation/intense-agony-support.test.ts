import { describe, expect, it } from 'vitest'
import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain/skills'
import { resolveIntenseAgonySupport } from './intense-agony-support'

const support = (id = 'intense-agony'): SupportGemDefinition => ({
  id, nameEn: 'Intense Agony', displayNameDe: 'Intensiver Todeskampf', tags: [], dataVersion: 'test', source: 'local-placeholder', status: 'verified',
  requiredTags: [], excludedTags: [], ownTags: [],
})
const setup = (ids: string[]): SkillSetup => ({ id: 'setup', skillId: 'skill', role: 'main', weaponSet: 'set-1', supportGemIds: ids })
const damageOverTimeSpell = () => {
  const value = reference.skills.find(skill => skill.skillTypes.includes('Spell') && skill.skillTypes.includes('DamageOverTime'))
  if (!value) throw new Error('Missing pinned spell damage-over-time fixture')
  return value
}

describe('exact Intense Agony support model', () => {
  it('applies full-life damage and duration while retaining only duration outside full life', () => {
    const selected = support()
    const full = resolveIntenseAgonySupport({ skill: damageOverTimeSpell(), setup: setup([selected.id]), supports: [selected], enemyProfile: { id: 'full', label: 'Volles Leben', source: 'manual-comparison-profile', lifeState: 'full-life' } })
    const low = resolveIntenseAgonySupport({ skill: damageOverTimeSpell(), setup: setup([selected.id]), supports: [selected], enemyProfile: { id: 'low', label: 'Niedriges Leben', source: 'manual-comparison-profile', lifeState: 'low-life' } })
    expect(full).toMatchObject({ status: 'applied-full-life', damageOverTimeMultiplier: 1.5, durationMultiplier: 0.75 })
    expect(low).toMatchObject({ status: 'applied-duration-only-enemy-not-full-life', damageOverTimeMultiplier: 1, durationMultiplier: 0.75 })
  })

  it('blocks unknown conditional damage but keeps exact duration and rejects invalid selections', () => {
    const first = support('agony-one')
    const second = support('agony-two')
    expect(resolveIntenseAgonySupport({ skill: damageOverTimeSpell(), setup: setup([first.id]), supports: [first], enemyProfile: { id: 'unknown', label: 'Unbekannt', source: 'manual-comparison-profile', lifeState: 'unknown' } }))
      .toMatchObject({ status: 'applied-duration-only-unknown-enemy-life-state', damageOverTimeMultiplier: 1, durationMultiplier: 0.75 })
    expect(resolveIntenseAgonySupport({ skill: { ...damageOverTimeSpell(), skillTypes: ['Spell'] }, setup: setup([first.id]), supports: [first] }).status)
      .toBe('blocked-incompatible-skill')
    expect(resolveIntenseAgonySupport({ skill: damageOverTimeSpell(), setup: setup([first.id, second.id]), supports: [first, second] }).status)
      .toBe('blocked-duplicate-family')
  })
})
