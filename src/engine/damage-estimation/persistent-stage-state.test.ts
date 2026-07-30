import { describe, expect, it } from 'vitest'
import type { SkillGemDefinition, SkillSetup } from '../../domain'
import { resolvePersistentStageState } from './persistent-stage-state'

const skill = (id: string, nameEn: string): SkillGemDefinition => ({
  id, nameEn, displayNameDe: nameEn, tags: [], dataVersion: 'test', source: 'local-placeholder', status: 'verified',
})
const setup = (skillId: string, level?: number): SkillSetup => ({
  id: `${skillId}-setup`, skillId, role: 'utility', weaponSet: 'both', supportGemIds: [],
  ...(level == null ? {} : { level }),
})

describe('persistente Stufenzustände', () => {
  it('bildet Arktische Rüstung als vorbereitetes Vergeltungsszenario ab', () => {
    const value = skill('arctic-armour', 'Arctic Armour')
    expect(resolvePersistentStageState({ setups: [setup(value.id, 20)], skills: [value] })).toMatchObject({
      relevant: true, productive: false,
      skills: [{
        kind: 'stationary-retaliation', appliedSkillLevel: 20, skillLevelStatus: 'exact',
        maximumStages: 5, stageGainIntervalMs: 725, fullPreparationTimeMs: 3625,
        minimumAddedColdDamagePerStage: 101, maximumAddedColdDamagePerStage: 152,
        fullStageMinimumAddedColdDamage: 505, fullStageMaximumAddedColdDamage: 760,
      }],
    })
  })

  it('bildet Siegel der Macht als nicht automatisch aktive Vollstufenwirkung ab', () => {
    const value = skill('sigil', 'Sigil of Power')
    expect(resolvePersistentStageState({ setups: [setup(value.id, 20)], skills: [value] }).skills[0]).toMatchObject({
      kind: 'mana-built-spell-buff', maximumStages: 4, finalSpellDamagePerStagePercent: 14,
      fullStageMoreSpellDamagePercent: 56, fullStageSpellDamageMultiplier: 1.56,
      manaPercentSpendPerUpgrade: 50, effectDurationMs: 11900,
    })
  })

  it('verwendet ohne explizite Gemmenstufe deterministisch die Referenzstufe 20', () => {
    const value = skill('sigil', 'Sigil of Power')
    expect(resolvePersistentStageState({ setups: [setup(value.id)], skills: [value] }).skills[0])
      .toMatchObject({ appliedSkillLevel: 20, skillLevelStatus: 'default-reference-level' })
  })

  it('blockiert eine nicht vorhandene exakte Gemmenstufe fail-closed', () => {
    const value = skill('sigil', 'Sigil of Power')
    expect(resolvePersistentStageState({ setups: [setup(value.id, 99)], skills: [value] }))
      .toMatchObject({ relevant: false, productive: false, skills: [] })
  })

  it('liefert bei identischer Eingabe identische Ergebnisse', () => {
    const value = skill('arctic-armour', 'Arctic Armour')
    const input = { setups: [setup(value.id, 20)], skills: [value] }
    expect(resolvePersistentStageState(input)).toEqual(resolvePersistentStageState(input))
  })
})
