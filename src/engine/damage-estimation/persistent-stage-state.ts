import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillGemDefinition, SkillSetup } from '../../domain'

export const PERSISTENT_STAGE_STATE_MODEL_VERSION = '1.0.0'

export interface PersistentStageState {
  skillId: string
  label: string
  kind: 'stationary-retaliation' | 'mana-built-spell-buff'
  appliedSkillLevel: number
  skillLevelStatus: 'exact' | 'default-reference-level'
  maximumStages: number
  stageGainIntervalMs?: number
  fullPreparationTimeMs?: number
  minimumAddedColdDamagePerStage?: number
  maximumAddedColdDamagePerStage?: number
  fullStageMinimumAddedColdDamage?: number
  fullStageMaximumAddedColdDamage?: number
  finalSpellDamagePerStagePercent?: number
  fullStageMoreSpellDamagePercent?: number
  fullStageSpellDamageMultiplier?: number
  manaPercentSpendPerUpgrade?: number
  effectDurationMs?: number
  status: 'maximum-scenario-known-current-state-unknown'
  evidence: 'structured-exact'
  sourceReferences: string[]
  detail: string
}

export interface PersistentStageStateResult {
  relevant: boolean
  productive: false
  skills: PersistentStageState[]
  modelVersion: string
}

const byName = new Map<string, (typeof reference.skills)[number]>()
for (const record of reference.skills) {
  const key = record.name.toLocaleLowerCase('en')
  const current = byName.get(key)
  if (!current || Object.keys(record.numericStats).length > Object.keys(current.numericStats).length) byName.set(key, record)
}

export function resolvePersistentStageState(input: {
  setups: SkillSetup[]
  skills: SkillGemDefinition[]
}): PersistentStageStateResult {
  const setups = new Map(input.setups.filter(value => Boolean(value.skillId)).map(value => [value.skillId, value]))
  const skills = input.skills.flatMap<PersistentStageState>(skill => {
    const setup = setups.get(skill.id)
    if (!setup || !skill.nameEn || !['Arctic Armour', 'Sigil of Power'].includes(skill.nameEn)) return []
    const record = byName.get(skill.nameEn.toLocaleLowerCase('en'))
    const requestedLevel = setup.level
    const availableLevels = record?.levels.map(value => value.level) ?? []
    const appliedSkillLevel = requestedLevel ?? (availableLevels.includes(20) ? 20 : availableLevels.at(-1))
    const level = appliedSkillLevel == null ? undefined : record?.levels.find(value => value.level === appliedSkillLevel)
    if (!level || (requestedLevel != null && level.level !== requestedLevel)) return []
    const stats = level.numericStats as Record<string, number>

    if (skill.nameEn === 'Arctic Armour') {
      const maximumStages = stats.maximum_number_of_arctic_armour_stationary_stacks
      const minimumAddedColdDamagePerStage = stats.arctic_armour_minimum_added_cold_damage_per_stack
      const maximumAddedColdDamagePerStage = stats.arctic_armour_maximum_added_cold_damage_per_stack
      const stageGainIntervalMs = stats.base_active_skill_buff_stack_gain_frequency_ms
      if (!Number.isFinite(maximumStages) || maximumStages <= 0
        || !Number.isFinite(minimumAddedColdDamagePerStage)
        || !Number.isFinite(maximumAddedColdDamagePerStage)
        || !Number.isFinite(stageGainIntervalMs) || stageGainIntervalMs <= 0) return []
      const fullPreparationTimeMs = maximumStages * stageGainIntervalMs
      return [{
        skillId: skill.id,
        label: skill.displayNameDe,
        kind: 'stationary-retaliation',
        appliedSkillLevel,
        skillLevelStatus: requestedLevel == null ? 'default-reference-level' : 'exact',
        maximumStages,
        stageGainIntervalMs,
        fullPreparationTimeMs,
        minimumAddedColdDamagePerStage,
        maximumAddedColdDamagePerStage,
        fullStageMinimumAddedColdDamage: maximumStages * minimumAddedColdDamagePerStage,
        fullStageMaximumAddedColdDamage: maximumStages * maximumAddedColdDamagePerStage,
        status: 'maximum-scenario-known-current-state-unknown',
        evidence: 'structured-exact',
        sourceReferences: [
          'maximum_number_of_arctic_armour_stationary_stacks',
          'arctic_armour_minimum_added_cold_damage_per_stack',
          'arctic_armour_maximum_added_cold_damage_per_stack',
          'base_active_skill_buff_stack_gain_frequency_ms',
        ],
        detail: `Auf Gemmenstufe ${appliedSkillLevel} sind ${minimumAddedColdDamagePerStage}–${maximumAddedColdDamagePerStage} zusätzlicher Kälteschaden je stationärem Stapel, maximal ${maximumStages} Stapel und ${stageGainIntervalMs} ms Aufbau je Stapel belegt. Das vollständig vorbereitete Vergeltungsszenario enthält nach ${(fullPreparationTimeMs / 1000).toLocaleString('de-DE')} s ${maximumStages * minimumAddedColdDamagePerStage}–${maximumStages * maximumAddedColdDamagePerStage} zusätzlichen Kälteschaden. Stationäre Dauer und auslösender gegnerischer Treffer sind nicht belegt; deshalb entsteht kein Dauerschaden.`,
      }]
    }

    const maximumStages = stats.circle_of_power_max_stages
    const finalSpellDamagePerStagePercent = stats['circle_of_power_spell_damage_+%_final_per_stage']
    const manaPercentSpendPerUpgrade = stats['base_circle_of_power_mana_%_spend_per_upgrade']
    const effectDurationMs = stats.base_skill_effect_duration
    if (!Number.isFinite(maximumStages) || maximumStages <= 0
      || !Number.isFinite(finalSpellDamagePerStagePercent) || finalSpellDamagePerStagePercent <= 0
      || !Number.isFinite(manaPercentSpendPerUpgrade) || manaPercentSpendPerUpgrade <= 0) return []
    const fullStageMoreSpellDamagePercent = maximumStages * finalSpellDamagePerStagePercent
    return [{
      skillId: skill.id,
      label: skill.displayNameDe,
      kind: 'mana-built-spell-buff',
      appliedSkillLevel,
      skillLevelStatus: requestedLevel == null ? 'default-reference-level' : 'exact',
      maximumStages,
      finalSpellDamagePerStagePercent,
      fullStageMoreSpellDamagePercent,
      fullStageSpellDamageMultiplier: 1 + fullStageMoreSpellDamagePercent / 100,
      manaPercentSpendPerUpgrade,
      ...(Number.isFinite(effectDurationMs) && effectDurationMs > 0 ? { effectDurationMs } : {}),
      status: 'maximum-scenario-known-current-state-unknown',
      evidence: 'structured-exact',
      sourceReferences: [
        'circle_of_power_max_stages',
        'circle_of_power_spell_damage_+%_final_per_stage',
        'base_circle_of_power_mana_%_spend_per_upgrade',
        ...(Number.isFinite(effectDurationMs) ? ['base_skill_effect_duration'] : []),
      ],
      detail: `Auf Gemmenstufe ${appliedSkillLevel} sind maximal ${maximumStages} Stufen und ${finalSpellDamagePerStagePercent} % finaler Zauberschaden je Stufe belegt. Das Vollstufenszenario entspricht ${fullStageMoreSpellDamagePercent} % mehr Zauberschaden beziehungsweise Faktor ${(1 + fullStageMoreSpellDamagePercent / 100).toLocaleString('de-DE')}; jede Aufwertung verlangt den belegten Manaschwellenwert von ${manaPercentSpendPerUpgrade} %. Tatsächlich erreichte Stufen und Aufenthaltsdauer im Siegel sind nicht belegt und verändern den Dauerschaden deshalb nicht.`,
    }]
  })
  return { relevant: skills.length > 0, productive: false, skills, modelVersion: PERSISTENT_STAGE_STATE_MODEL_VERSION }
}
