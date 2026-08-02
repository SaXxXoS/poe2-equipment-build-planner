import { describe, expect, it } from 'vitest'
import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain/skills'
import { resolveAmbushSupport } from './ambush-support'

const support = (id = 'ambush'): SupportGemDefinition => ({
  id, nameEn: 'Ambush', displayNameDe: 'Hinterhalt', tags: [], dataVersion: 'test', source: 'local-placeholder', status: 'verified',
  requiredTags: [], excludedTags: [], ownTags: [],
})
const setup = (ids: string[]): SkillSetup => ({ id: 'setup', skillId: 'skill', role: 'main', weaponSet: 'set-1', supportGemIds: ids })
const attack = () => {
  const value = reference.skills.find(skill => skill.name === 'Load Galvanic Shards')
  if (!value) throw new Error('Missing pinned crossbow attack fixture')
  return value
}

describe('exact Ambush support model', () => {
  it('doubles critical chance only against a confirmed full-life enemy', () => {
    const selected = support()
    expect(resolveAmbushSupport({ skill: attack(), setup: setup([selected.id]), supports: [selected], enemyProfile: { id: 'full', label: 'Volles Leben', source: 'manual-comparison-profile', lifeState: 'full-life' } }))
      .toMatchObject({ status: 'applied', criticalChanceMultiplier: 2 })
    expect(resolveAmbushSupport({ skill: attack(), setup: setup([selected.id]), supports: [selected], enemyProfile: { id: 'low', label: 'Niedriges Leben', source: 'manual-comparison-profile', lifeState: 'low-life' } }))
      .toMatchObject({ status: 'inactive-enemy-not-full-life', criticalChanceMultiplier: 1 })
  })

  it('blocks unknown state, incompatible skills and duplicate family selections fail-closed', () => {
    const first = support('ambush-one')
    const second = support('ambush-two')
    expect(resolveAmbushSupport({ skill: attack(), setup: setup([first.id]), supports: [first], enemyProfile: { id: 'unknown', label: 'Unbekannt', source: 'manual-comparison-profile', lifeState: 'unknown' } }))
      .toMatchObject({ status: 'blocked-unknown-enemy-life-state', criticalChanceMultiplier: 1, blockedSupportIds: [first.id] })
    expect(resolveAmbushSupport({ skill: { ...attack(), skillTypes: ['Duration'] }, setup: setup([first.id]), supports: [first], enemyProfile: { id: 'full', label: 'Volles Leben', source: 'manual-comparison-profile', lifeState: 'full-life' } }).status)
      .toBe('blocked-incompatible-skill')
    expect(resolveAmbushSupport({ skill: attack(), setup: setup([first.id, second.id]), supports: [first, second], enemyProfile: { id: 'full', label: 'Volles Leben', source: 'manual-comparison-profile', lifeState: 'full-life' } }).status)
      .toBe('blocked-duplicate-family')
  })
})
