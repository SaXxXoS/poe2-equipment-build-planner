import { describe, expect, it } from 'vitest'
import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain/skills'
import { applyAttunementToHit, attunementNativeDotTypeMultipliers, resolveAttunementSupport } from './attunement-supports'

const support = (nameEn: string, id = nameEn): SupportGemDefinition => ({
  id, displayNameDe: nameEn, nameEn, tags: [], dataVersion: 'test', source: 'local-placeholder', status: 'verified', requiredTags: [], excludedTags: [], ownTags: [],
})
const setup = (ids: string[]): SkillSetup => ({ id: 'setup', skillId: 'skill', role: 'main', weaponSet: 'set-1', supportGemIds: ids })
const sourceSkill = (name: string) => {
  const result = reference.skills.find(value => value.name === name)
  if (!result) throw new Error(`Missing pinned skill fixture: ${name}`)
  return result
}

describe('exact Attunement support model', () => {
  it.each([
    ['Fire Attunement', 'fire', ['cold', 'lightning']],
    ['Cold Attunement', 'cold', ['fire', 'lightning']],
    ['Lightning Attunement', 'lightning', ['cold', 'fire']],
    ['Chaos Attunement', 'chaos', ['physical', 'fire', 'cold', 'lightning']],
  ] as const)('resolves %s from the pinned record', (name, targetType, penalizedTypes) => {
    const selected = support(name)
    expect(resolveAttunementSupport({ skill: sourceSkill('Armour Breaker'), setup: setup([selected.id]), supports: [selected] })).toMatchObject({
      status: 'applied', targetType, gainAsExtraPercent: 25, penalizedTypes, penaltyPercent: -50, penaltyMultiplier: 0.5,
    })
  })

  it('applies fire gain from the unpenalized basis and then the exact elemental penalties', () => {
    const selected = support('Fire Attunement')
    const model = resolveAttunementSupport({ skill: sourceSkill('Armour Breaker'), setup: setup([selected.id]), supports: [selected] })
    expect(applyAttunementToHit([
      { type: 'physical', minimum: 100, maximum: 100 },
      { type: 'cold', minimum: 40, maximum: 40 },
      { type: 'lightning', minimum: 60, maximum: 60 },
    ], [
      { type: 'physical', minimum: 100, maximum: 100 },
      { type: 'cold', minimum: 40, maximum: 40 },
      { type: 'lightning', minimum: 60, maximum: 60 },
    ], model)).toEqual([
      { type: 'physical', minimum: 100, maximum: 100 },
      { type: 'fire', minimum: 50, maximum: 50 },
      { type: 'cold', minimum: 20, maximum: 20 },
      { type: 'lightning', minimum: 30, maximum: 30 },
    ])
  })

  it('applies the penalty but no gain-as-extra to native damage over time', () => {
    const selected = support('Chaos Attunement')
    const model = resolveAttunementSupport({ skill: sourceSkill('Armour Breaker'), setup: setup([selected.id]), supports: [selected] })
    expect(attunementNativeDotTypeMultipliers(model)).toEqual({ physical: 0.5, fire: 0.5, cold: 0.5, lightning: 0.5 })
  })

  it('combines distinct Attunement families without dropping either exact effect', () => {
    const fire = support('Fire Attunement', 'fire')
    const cold = support('Cold Attunement', 'cold')
    const model = resolveAttunementSupport({ skill: sourceSkill('Armour Breaker'), setup: setup(['fire', 'cold']), supports: [fire, cold] })
    expect(applyAttunementToHit([
      { type: 'physical', minimum: 100, maximum: 100 },
      { type: 'fire', minimum: 20, maximum: 20 },
      { type: 'cold', minimum: 40, maximum: 40 },
      { type: 'lightning', minimum: 80, maximum: 80 },
    ], [{ type: 'physical', minimum: 100, maximum: 100 }], model)).toEqual([
      { type: 'physical', minimum: 100, maximum: 100 },
      { type: 'fire', minimum: 35, maximum: 35 },
      { type: 'cold', minimum: 45, maximum: 45 },
      { type: 'lightning', minimum: 20, maximum: 20 },
    ])
    expect(attunementNativeDotTypeMultipliers(model)).toEqual({ cold: 0.5, lightning: 0.25, fire: 0.5 })
  })

  it('blocks incompatible skills and duplicate family ranks fail-closed', () => {
    const selected = support('Fire Attunement')
    const incompatible = { ...sourceSkill('Spark'), skillTypes: ['Spell'] }
    expect(resolveAttunementSupport({ skill: incompatible, setup: setup([selected.id]), supports: [selected] })).toMatchObject({ status: 'blocked-incompatible-skill' })
    const duplicateA = support('Fire Attunement', 'a')
    const duplicateB = support('Fire Attunement', 'b')
    expect(resolveAttunementSupport({ skill: sourceSkill('Armour Breaker'), setup: setup(['a', 'b']), supports: [duplicateA, duplicateB] })).toMatchObject({ status: 'blocked-duplicate-family' })
  })
})
