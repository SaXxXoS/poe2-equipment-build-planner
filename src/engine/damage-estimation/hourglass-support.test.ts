import { describe, expect, it } from 'vitest'
import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain/skills'
import { applyHourglassDamageMultiplier, resolveHourglassSupport } from './hourglass-support'

const support = (id = 'hourglass'): SupportGemDefinition => ({
  id,
  displayNameDe: 'Sanduhr',
  nameEn: 'Hourglass',
  tags: [],
  dataVersion: 'test',
  source: 'local-placeholder',
  status: 'verified',
  requiredTags: [],
  excludedTags: [],
  ownTags: [],
})
const setup = (ids: string[]): SkillSetup => ({
  id: 'setup',
  skillId: 'skill',
  role: 'main',
  weaponSet: 'set-1',
  supportGemIds: ids,
})
const sourceSkill = (name: string) => {
  const result = reference.skills.find(value => value.name === name)
  if (!result) throw new Error(`Missing pinned skill fixture: ${name}`)
  return result
}

describe('exact Hourglass support model', () => {
  it('applies the inseparable 30% damage and ten-second cooldown model', () => {
    const selected = support()
    const result = resolveHourglassSupport({ skill: sourceSkill('Spark'), setup: setup([selected.id]), supports: [selected] })
    expect(result).toMatchObject({ status: 'applied', damagePercent: 30, damageMultiplier: 1.3, cooldownOverrideSeconds: 10 })
    expect(applyHourglassDamageMultiplier([{ type: 'lightning', minimum: 10, maximum: 20 }], result)).toEqual([
      expect.objectContaining({ minimum: 13, maximum: 26 }),
    ])
  })

  it('blocks skills with an existing cooldown or another pinned exclusion', () => {
    const selected = support()
    const spark = sourceSkill('Spark')
    const incompatible = { ...spark, skillTypes: [...spark.skillTypes, 'Cooldown'] }
    expect(resolveHourglassSupport({ skill: incompatible, setup: setup([selected.id]), supports: [selected] })).toMatchObject({
      status: 'blocked-incompatible-skill',
      damageMultiplier: 1,
    })
  })

  it('blocks duplicate support families fail-closed', () => {
    const first = support('hourglass-one')
    const second = support('hourglass-two')
    expect(resolveHourglassSupport({ skill: sourceSkill('Spark'), setup: setup([first.id, second.id]), supports: [first, second] })).toMatchObject({
      status: 'blocked-duplicate-family',
      damageMultiplier: 1,
      blockedSupportIds: [first.id, second.id],
    })
  })
})
