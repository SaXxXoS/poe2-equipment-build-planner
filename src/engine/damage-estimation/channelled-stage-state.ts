import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillGemDefinition, SkillSetup } from '../../domain'

export const CHANNELLED_STAGE_MODEL_VERSION = '1.0.0'

type StageConfig = {
  maximumStagesStat: string
  finalDamagePerStageStat: string
}

const configs: Record<string, StageConfig> = {
  'Supercharged Slam': {
    maximumStagesStat: 'channelled_slam_max_stages',
    finalDamagePerStageStat: 'channelled_slam_damage_+%_final_per_stage',
  },
  Flameblast: {
    maximumStagesStat: 'flameblast_maximum_stages',
    finalDamagePerStageStat: 'charged_blast_spell_damage_+%_final_per_stack',
  },
}

export interface ChannelledStageState {
  skillId: string
  label: string
  appliedSkillLevel: number
  skillLevelStatus: 'exact' | 'default-reference-level'
  maximumStages: number
  finalDamagePerStagePercent: number
  fullStageMoreDamagePercent: number
  fullStageDamageMultiplier: number
  minimumChannelTimeMs?: number
  currentStages?: number
  status: 'maximum-scenario-known-current-state-unknown'
  evidence: 'structured-exact'
  sourceReferences: string[]
  detail: string
}

export interface ChannelledStageResult {
  relevant: boolean
  productive: false
  skills: ChannelledStageState[]
  modelVersion: string
}

const byName = new Map<string, (typeof reference.skills)[number]>()
for (const skill of reference.skills) {
  const key = skill.name.toLocaleLowerCase('en')
  const current = byName.get(key)
  if (!current || Object.keys(skill.numericStats).length > Object.keys(current.numericStats).length) {
    byName.set(key, skill)
  }
}

export function resolveChannelledStageState(input: {
  setups: SkillSetup[]
  skills: SkillGemDefinition[]
}): ChannelledStageResult {
  const selectedSetups = new Map(input.setups.filter(setup => Boolean(setup.skillId)).map(setup => [setup.skillId, setup]))
  const selectedIds = new Set(selectedSetups.keys())
  const skills = input.skills
    .filter(skill => selectedIds.has(skill.id) && Boolean(skill.nameEn) && Boolean(configs[skill.nameEn!]))
    .flatMap<ChannelledStageState>(skill => {
      const config = configs[skill.nameEn!]
      const record = byName.get(skill.nameEn!.toLocaleLowerCase('en'))
      const requestedLevel = selectedSetups.get(skill.id)?.level
      const availableLevels = record?.levels.map(value => value.level) ?? []
      const appliedSkillLevel = requestedLevel ?? (availableLevels.includes(20) ? 20 : availableLevels.at(-1))
      const level = appliedSkillLevel == null ? undefined : record?.levels.find(value => value.level === appliedSkillLevel)
      if (!level || (requestedLevel != null && level.level !== requestedLevel)) return []
      const stats = level.numericStats as Record<string, number>
      const maximumStages = stats[config.maximumStagesStat]
      const finalDamagePerStagePercent = stats[config.finalDamagePerStageStat]
      const minimumChannelTimeMs = stats.base_minimum_channel_time_ms
      if (
        !Number.isFinite(maximumStages) || maximumStages <= 0
        || !Number.isFinite(finalDamagePerStagePercent) || finalDamagePerStagePercent <= 0
      ) return []
      const fullStageMoreDamagePercent = maximumStages * finalDamagePerStagePercent
      return [{
        skillId: skill.id,
        label: skill.displayNameDe,
        appliedSkillLevel,
        skillLevelStatus: requestedLevel == null ? 'default-reference-level' : 'exact',
        maximumStages,
        finalDamagePerStagePercent,
        fullStageMoreDamagePercent,
        fullStageDamageMultiplier: 1 + fullStageMoreDamagePercent / 100,
        ...(Number.isFinite(minimumChannelTimeMs) && minimumChannelTimeMs > 0 ? { minimumChannelTimeMs } : {}),
        status: 'maximum-scenario-known-current-state-unknown',
        evidence: 'structured-exact',
        sourceReferences: [
          config.maximumStagesStat,
          config.finalDamagePerStageStat,
          ...(Number.isFinite(minimumChannelTimeMs) ? ['base_minimum_channel_time_ms'] : []),
        ],
        detail: `Auf Gemmenstufe ${appliedSkillLevel} sind maximal ${maximumStages} Stufen und ${finalDamagePerStagePercent} % finaler Schaden je Stufe belegt. Das Vollstufenszenario entspricht ${fullStageMoreDamagePercent} % mehr Schaden beziehungsweise Faktor ${(1 + fullStageMoreDamagePercent / 100).toLocaleString('de-DE')}. Der aktuelle Kanalzustand ist nicht belegt und verändert den Dauerschaden deshalb nicht.`,
      }]
    })
  return {
    relevant: skills.length > 0,
    productive: false,
    skills,
    modelVersion: CHANNELLED_STAGE_MODEL_VERSION,
  }
}
