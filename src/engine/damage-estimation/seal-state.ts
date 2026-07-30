import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillGemDefinition, SkillSetup } from '../../domain'

export const SEAL_STATE_MODEL_VERSION = '1.1.0'

export interface SkillSealState {
  skillId: string
  label: string
  maximumSeals: number
  repeatsPerBrokenSeal: number
  sealGainIntervalMs: number
  fullPreparationTimeMs: number
  appliedSkillLevel: number
  skillLevelStatus: 'exact' | 'default-reference-level'
  availableSeals?: number
  status: 'capacity-known-current-state-unknown'
  evidence: 'structured-exact'
  sourceReferences: string[]
  detail: string
}

export interface SealStateResult {
  relevant: boolean
  productive: false
  skills: SkillSealState[]
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

export function resolveSealState(input: {
  setups: SkillSetup[]
  skills: SkillGemDefinition[]
}): SealStateResult {
  const selectedSetups = new Map(input.setups.filter(setup => Boolean(setup.skillId)).map(setup => [setup.skillId, setup]))
  const selectedIds = new Set(selectedSetups.keys())
  const skills = input.skills
    .filter(skill => selectedIds.has(skill.id) && Boolean(skill.nameEn))
    .flatMap<SkillSealState>(skill => {
      const record = byName.get(skill.nameEn!.toLocaleLowerCase('en'))
      const requestedLevel = selectedSetups.get(skill.id)?.level
      const availableLevels = record?.levels.map(value => value.level) ?? []
      const appliedSkillLevel = requestedLevel ?? (availableLevels.includes(20) ? 20 : availableLevels.at(-1))
      const level = appliedSkillLevel == null ? undefined : record?.levels.find(value => value.level === appliedSkillLevel)
      if (!level || (requestedLevel != null && level.level !== requestedLevel)) return []
      const stats = level.numericStats as Record<string, number>
      const maximumSeals = stats.base_maximum_seals_for_skill
      const repeatsPerBrokenSeal = stats.skill_rapid_fire_repeats_per_broken_seal
      const sealGainIntervalMs = stats.base_skill_seal_gain_interval_ms
      if (
        !Number.isFinite(maximumSeals) || maximumSeals! <= 0
        || !Number.isFinite(repeatsPerBrokenSeal) || repeatsPerBrokenSeal! <= 0
        || !Number.isFinite(sealGainIntervalMs) || sealGainIntervalMs! <= 0
      ) return []
      const fullPreparationTimeMs = maximumSeals! * sealGainIntervalMs!
      return [{
        skillId: skill.id,
        label: skill.displayNameDe,
        maximumSeals: maximumSeals!,
        repeatsPerBrokenSeal: repeatsPerBrokenSeal!,
        sealGainIntervalMs: sealGainIntervalMs!,
        fullPreparationTimeMs,
        appliedSkillLevel,
        skillLevelStatus: requestedLevel == null ? 'default-reference-level' : 'exact',
        status: 'capacity-known-current-state-unknown',
        evidence: 'structured-exact',
        sourceReferences: [
          'skillTypes:HasSeals',
          'base_maximum_seals_for_skill',
          'skill_rapid_fire_repeats_per_broken_seal',
          'base_skill_seal_gain_interval_ms',
        ],
        detail: `Auf Gemmenstufe ${appliedSkillLevel} sind maximal ${maximumSeals} Siegel, ${repeatsPerBrokenSeal} Wiederholung je gebrochenem Siegel und ${sealGainIntervalMs! / 1000} Sekunden Aufbauintervall belegt. Der aktuelle Siegelstand und der tatsächliche Auslösezeitpunkt sind nicht Teil des Buildzustands; deshalb entsteht noch kein Schadensmultiplikator.`,
      }]
    })
  return {
    relevant: skills.length > 0,
    productive: false,
    skills,
    modelVersion: SEAL_STATE_MODEL_VERSION,
  }
}
