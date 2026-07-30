import { describe, expect, it } from 'vitest'
import type { SkillGemDefinition, SkillSetup } from '../../domain'
import { resolveProjectileAccumulationState } from './projectile-accumulation-state'

const skill = (id: string, nameEn: string): SkillGemDefinition => ({
  id,
  nameEn,
  displayNameDe: nameEn,
  tags: [],
  dataVersion: 'test',
  source: 'local-placeholder',
  status: 'verified',
})
const setup = (skillId: string, level?: number): SkillSetup => ({
  id: `setup:${skillId}`,
  skillId,
  role: 'main',
  weaponSet: 'set-1',
  supportGemIds: [],
  ...(level == null ? {} : { level }),
})

describe('projectile accumulation state', () => {
  it('transportiert Ember Fusillade ohne erfundene aktuelle Ember- oder Trefferzahl', () => {
    const ember = skill('ember-fusillade', 'Ember Fusillade')
    const result = resolveProjectileAccumulationState({ setups: [setup(ember.id)], skills: [ember] })
    expect(result).toMatchObject({
      relevant: true,
      productive: false,
      skills: [{
        maximumProjectiles: 10,
        releaseIntervalMs: 100,
        effectDurationMs: 1300,
        finalDamagePerReleasedProjectilePercent: 5,
        maximumReleaseWindowMs: 900,
        status: 'capacity-known-current-state-unknown',
      }],
    })
    expect(result.skills[0]).not.toHaveProperty('currentProjectiles')
  })

  it('verwendet die exakte stufenabhängige Projektilgrenze', () => {
    const ember = skill('ember-fusillade', 'Ember Fusillade')
    const result = resolveProjectileAccumulationState({ setups: [setup(ember.id, 1)], skills: [ember] })
    expect(result.skills[0]).toMatchObject({
      maximumProjectiles: 6,
      maximumReleaseWindowMs: 500,
      appliedSkillLevel: 1,
      skillLevelStatus: 'exact',
    })
  })

  it('blockiert eine nicht vorhandene angeforderte Gemmenstufe', () => {
    const ember = skill('ember-fusillade', 'Ember Fusillade')
    expect(resolveProjectileAccumulationState({ setups: [setup(ember.id, 99)], skills: [ember] }).skills).toEqual([])
  })

  it('bleibt für andere Projektilfertigkeiten ohne geschlossene Aufbaukette irrelevant', () => {
    const spark = skill('spark', 'Spark')
    expect(resolveProjectileAccumulationState({ setups: [setup(spark.id)], skills: [spark] })).toEqual({
      relevant: false,
      productive: false,
      skills: [],
      modelVersion: '1.1.0',
    })
  })
})
