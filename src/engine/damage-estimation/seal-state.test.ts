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
const setup = (skillId: string): SkillSetup => ({
  id: `setup-${skillId}`,
  skillId,
  role: 'main',
  weaponSet: 'set-1',
  supportGemIds: [],
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

  it('bleibt für Fertigkeiten ohne Siegel irrelevant', () => {
    const spark = skill('spark', 'Spark')
    expect(resolveSealState({ setups: [setup(spark.id)], skills: [spark] })).toEqual({
      relevant: false,
      productive: false,
      skills: [],
      modelVersion: '1.0.0',
    })
  })
})
