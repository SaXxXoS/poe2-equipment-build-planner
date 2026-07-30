import { describe, expect, it } from 'vitest'
import type { SkillGemDefinition, SkillSetup } from '../../domain'
import { resolveChannelledStageState } from './channelled-stage-state'

const skill = (id: string, nameEn: string): SkillGemDefinition => ({
  id, nameEn, displayNameDe: nameEn, tags: [], dataVersion: 'test', source: 'local-placeholder', status: 'verified',
})
const setup = (skillId: string, level?: number): SkillSetup => ({
  id: `setup:${skillId}`, skillId, role: 'main', weaponSet: 'set-1', supportGemIds: [],
  ...(level == null ? {} : { level }),
})

describe('channelled stage state', () => {
  it('berechnet das belegte Vollstufenszenario von Flameblast', () => {
    const flameblast = skill('flameblast', 'Flameblast')
    expect(resolveChannelledStageState({ setups: [setup(flameblast.id, 20)], skills: [flameblast] }).skills[0]).toMatchObject({
      maximumStages: 10,
      finalDamagePerStagePercent: 75,
      fullStageMoreDamagePercent: 750,
      fullStageDamageMultiplier: 8.5,
      minimumChannelTimeMs: 490,
      appliedSkillLevel: 20,
      skillLevelStatus: 'exact',
    })
  })

  it('berechnet Supercharged Slam getrennt', () => {
    const slam = skill('supercharged-slam', 'Supercharged Slam')
    expect(resolveChannelledStageState({ setups: [setup(slam.id)], skills: [slam] }).skills[0]).toMatchObject({
      maximumStages: 3,
      finalDamagePerStagePercent: 40,
      fullStageMoreDamagePercent: 120,
      fullStageDamageMultiplier: 2.2,
    })
  })

  it('erfindet weder aktuelle Stufen noch Werte für unbekannte Fertigkeiten', () => {
    const flameblast = skill('flameblast', 'Flameblast')
    const state = resolveChannelledStageState({ setups: [setup(flameblast.id)], skills: [flameblast] }).skills[0]
    expect(state).not.toHaveProperty('currentStages')
    const spark = skill('spark', 'Spark')
    expect(resolveChannelledStageState({ setups: [setup(spark.id)], skills: [spark] }).skills).toEqual([])
  })

  it('blockiert eine nicht vorhandene Gemmenstufe', () => {
    const flameblast = skill('flameblast', 'Flameblast')
    expect(resolveChannelledStageState({ setups: [setup(flameblast.id, 99)], skills: [flameblast] }).skills).toEqual([])
  })
})
