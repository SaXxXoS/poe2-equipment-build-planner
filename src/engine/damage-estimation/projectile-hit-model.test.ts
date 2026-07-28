import { describe, expect, it } from 'vitest'
import { resolveProjectileHitModel } from './projectile-hit-model'

describe('projectile hit model', () => {
  it('treats Spark projectiles as coverage without multiplying boss damage', () => {
    const result = resolveProjectileHitModel({
      name: 'Spark',
      skillTypes: ['Spell', 'Projectile', 'ProjectilesFromUser'],
      numericStats: { base_number_of_projectiles: 9 },
    })
    expect(result.projectilesPerAction).toBe(9)
    expect(result.mappingPotentialTargetContacts).toBe(9)
    expect(result.singleTargetHitMultiplier).toBe(1)
  })

  it('counts Arc chains only as possible mapping contacts', () => {
    const result = resolveProjectileHitModel({
      name: 'Arc',
      skillTypes: ['Spell', 'Projectile', 'Chains'],
      numericStats: { number_of_chains: 9 },
    })
    expect(result.mappingPotentialTargetContacts).toBe(10)
    expect(result.mechanics).toContainEqual(expect.objectContaining({
      kind: 'chain-count',
      value: 9,
      damageUse: 'coverage-only',
    }))
    expect(result.singleTargetHitMultiplier).toBe(1)
  })

  it('counts pierce as target coverage and not repeated damage', () => {
    const result = resolveProjectileHitModel({
      name: 'Fragmentation Rounds',
      skillTypes: ['Attack', 'Projectile'],
      numericStats: { projectile_base_number_of_targets_to_pierce: 4 },
    })
    expect(result.mappingPotentialTargetContacts).toBe(5)
    expect(result.singleTargetHitMultiplier).toBe(1)
  })

  it('blocks a maximum-hit cap from becoming an assumed hit count', () => {
    const result = resolveProjectileHitModel({
      name: 'Tornado Shot',
      skillTypes: ['Attack', 'Projectile'],
      numericStats: { tornado_shot_number_of_hits_allowed: 8 },
    })
    expect(result.mechanics).toContainEqual(expect.objectContaining({
      kind: 'maximum-hit-cap',
      value: 8,
      damageUse: 'blocked-as-damage-multiplier',
    }))
    expect(result.singleTargetHitMultiplier).toBe(1)
  })

  it('keeps non-projectile skills at one contact', () => {
    const result = resolveProjectileHitModel({
      name: 'Flame Wall',
      skillTypes: ['Spell', 'Area'],
      numericStats: {},
    })
    expect(result.isProjectileSkill).toBe(false)
    expect(result.mappingPotentialTargetContacts).toBe(1)
    expect(result.mechanics).toEqual([])
  })
})
