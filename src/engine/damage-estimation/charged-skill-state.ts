import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillGemDefinition, SkillSetup } from '../../domain'

export const CHARGED_SKILL_STATE_MODEL_VERSION = '1.0.0'

export interface ChargedSkillState {
  skillId: string
  label: string
  appliedSkillLevel: number
  skillLevelStatus: 'exact' | 'default-reference-level'
  maximumStages: number
  additionalStages: number
  fullStageDamageMultiplier?: number
  gainAsFirePerStagePercent?: number
  fullStageGainAsFirePercent?: number
  additionalProjectilesPerAdditionalStage?: number
  fullStageAdditionalProjectiles?: number
  currentStages?: number
  status: 'maximum-scenario-known-current-state-unknown'
  evidence: 'structured-exact'
  sourceReferences: string[]
  detail: string
}

export interface ChargedSkillStateResult {
  relevant: boolean
  productive: false
  skills: ChargedSkillState[]
  modelVersion: string
}

const byName = new Map<string, (typeof reference.skills)[number]>()
for (const record of reference.skills) {
  const key = record.name.toLocaleLowerCase('en')
  const current = byName.get(key)
  if (!current || Object.keys(record.numericStats).length > Object.keys(current.numericStats).length) byName.set(key, record)
}

export function resolveChargedSkillState(input: {
  setups: SkillSetup[]
  skills: SkillGemDefinition[]
}): ChargedSkillStateResult {
  const setups = new Map(input.setups.filter(value => Boolean(value.skillId)).map(value => [value.skillId, value]))
  const skills = input.skills.flatMap<ChargedSkillState>(skill => {
    const setup = setups.get(skill.id)
    if (!setup || !skill.nameEn || !['Detonating Arrow', 'Volcano'].includes(skill.nameEn)) return []
    const record = byName.get(skill.nameEn.toLocaleLowerCase('en'))
    const requestedLevel = setup.level
    const availableLevels = record?.levels.map(value => value.level) ?? []
    const appliedSkillLevel = requestedLevel ?? (availableLevels.includes(20) ? 20 : availableLevels.at(-1))
    const level = appliedSkillLevel == null ? undefined : record?.levels.find(value => value.level === appliedSkillLevel)
    if (!level || (requestedLevel != null && level.level !== requestedLevel)) return []
    const stats = level.numericStats as Record<string, number>
    if (skill.nameEn === 'Detonating Arrow') {
      const maximumStages = stats.detonating_arrow_max_number_of_stages
      const gainAsFirePerStagePercent = stats['detonating_arrow_all_damage_%_to_gain_as_fire_per_stage']
      if (!Number.isFinite(maximumStages) || !Number.isFinite(gainAsFirePerStagePercent)) return []
      const fullStageGainAsFirePercent = maximumStages * gainAsFirePerStagePercent
      return [{
        skillId: skill.id, label: skill.displayNameDe, appliedSkillLevel,
        skillLevelStatus: requestedLevel == null ? 'default-reference-level' : 'exact',
        maximumStages, additionalStages: Math.max(0, maximumStages - 1),
        gainAsFirePerStagePercent, fullStageGainAsFirePercent,
        status: 'maximum-scenario-known-current-state-unknown', evidence: 'structured-exact',
        sourceReferences: ['detonating_arrow_max_number_of_stages', 'detonating_arrow_all_damage_%_to_gain_as_fire_per_stage'],
        detail: `Bei ${maximumStages} belegten Stufen ergeben ${gainAsFirePerStagePercent} % als zusätzlicher Feuerschaden je Stufe im Vollstufenszenario ${fullStageGainAsFirePercent} %. Der aktuelle Stufenstand bleibt unbekannt.`,
      }]
    }
    const maximumStages = stats.volcano_maximum_number_of_stages
    const morePerAdditionalStage = stats['volcano_initial_explosion_damage_+%_final_per_additional_stage']
    const additionalProjectilesPerAdditionalStage = stats.volcano_initial_explosion_number_of_additional_projectiles_per_additional_stage
    if (!Number.isFinite(maximumStages) || !Number.isFinite(morePerAdditionalStage) || !Number.isFinite(additionalProjectilesPerAdditionalStage)) return []
    const additionalStages = Math.max(0, maximumStages - 1)
    const fullStageMoreDamagePercent = additionalStages * morePerAdditionalStage
    return [{
      skillId: skill.id, label: skill.displayNameDe, appliedSkillLevel,
      skillLevelStatus: requestedLevel == null ? 'default-reference-level' : 'exact',
      maximumStages, additionalStages,
      fullStageDamageMultiplier: 1 + fullStageMoreDamagePercent / 100,
      additionalProjectilesPerAdditionalStage,
      fullStageAdditionalProjectiles: additionalStages * additionalProjectilesPerAdditionalStage,
      status: 'maximum-scenario-known-current-state-unknown', evidence: 'structured-exact',
      sourceReferences: ['volcano_maximum_number_of_stages', 'volcano_initial_explosion_damage_+%_final_per_additional_stage', 'volcano_initial_explosion_number_of_additional_projectiles_per_additional_stage'],
      detail: `${maximumStages} Stufen bedeuten ${additionalStages} zusätzliche Stufen, Faktor ${(1 + fullStageMoreDamagePercent / 100).toLocaleString('de-DE')} für die Anfangsexplosion und ${additionalStages * additionalProjectilesPerAdditionalStage} zusätzliche Projektile. Projektile werden ohne Trefferbeleg nicht als Einzelzielmultiplikator verwendet.`,
    }]
  })
  return { relevant: skills.length > 0, productive: false, skills, modelVersion: CHARGED_SKILL_STATE_MODEL_VERSION }
}
