import { describe, expect, it } from 'vitest'
import type { SkillGemDefinition, SkillSetup } from '../../domain'
import { resolveSealState } from './seal-state'

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
  id: `setup-${skillId}`,
  skillId,
  role: 'main',
  weaponSet: 'set-1',
  supportGemIds: [],
  ...(level == null ? {} : { level }),
})

describe('seal state', () => {
  it('transportiert die belegte Freezing-Salvo-Kapazität ohne erfundenen aktuellen Siegelstand', () => {
    const salvo = skill('freezing-salvo', 'Freezing Salvo')
    const result = resolveSealState({ setups: [setup(salvo.id)], skills: [salvo] })
    expect(result).toMatchObject({
      relevant: true,
      productive: false,
      skills: [{
        maximumSeals: 10,
        repeatsPerBrokenSeal: 1,
        sealGainIntervalMs: 750,
        fullPreparationTimeMs: 7500,
        status: 'capacity-known-current-state-unknown',
      }],
    })
    expect(result.skills[0]).not.toHaveProperty('availableSeals')
  })

  it('bindet die Siegelparameter an die angeforderte Gemmenstufe', () => {
    const salvo = skill('freezing-salvo', 'Freezing Salvo')
    const result = resolveSealState({ setups: [setup(salvo.id, 1)], skills: [salvo] })
    expect(result.skills[0]).toMatchObject({
      maximumSeals: 10,
      appliedSkillLevel: 1,
      skillLevelStatus: 'exact',
    })
  })

  it('blockiert eine nicht vorhandene angeforderte Gemmenstufe', () => {
    const salvo = skill('freezing-salvo', 'Freezing Salvo')
    expect(resolveSealState({ setups: [setup(salvo.id, 99)], skills: [salvo] }).skills).toEqual([])
  })

  it('bleibt für Fertigkeiten ohne Siegel irrelevant', () => {
    const spark = skill('spark', 'Spark')
    expect(resolveSealState({ setups: [setup(spark.id)], skills: [spark] })).toEqual({
      relevant: false,
      productive: false,
      skills: [],
      modelVersion: '1.1.0',
    })
  })
})
