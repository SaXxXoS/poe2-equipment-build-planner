import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillGemDefinition, SkillSetup } from '../../domain'

export const SEAL_STATE_MODEL_VERSION = '1.0.0'

export interface SkillSealState {
  skillId: string
  label: string
  maximumSeals: number
  repeatsPerBrokenSeal: number
  sealGainIntervalMs: number
  fullPreparationTimeMs: number
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
  const selectedIds = new Set(input.setups.filter(setup => Boolean(setup.skillId)).map(setup => setup.skillId))
  const skills = input.skills
    .filter(skill => selectedIds.has(skill.id) && Boolean(skill.nameEn))
    .flatMap<SkillSealState>(skill => {
      const record = byName.get(skill.nameEn!.toLocaleLowerCase('en'))
      const maximumSeals = record?.numericStats.base_maximum_seals_for_skill
      const repeatsPerBrokenSeal = record?.numericStats.skill_rapid_fire_repeats_per_broken_seal
      const sealGainIntervalMs = record?.numericStats.base_skill_seal_gain_interval_ms
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
        status: 'capacity-known-current-state-unknown',
        evidence: 'structured-exact',
        sourceReferences: [
          'skillTypes:HasSeals',
          'base_maximum_seals_for_skill',
          'skill_rapid_fire_repeats_per_broken_seal',
          'base_skill_seal_gain_interval_ms',
        ],
        detail: `Maximal ${maximumSeals} Siegel, ${repeatsPerBrokenSeal} Wiederholung je gebrochenem Siegel und ${sealGainIntervalMs! / 1000} Sekunden Aufbauintervall sind belegt. Der aktuelle Siegelstand und der tatsächliche Auslösezeitpunkt sind nicht Teil des Buildzustands; deshalb entsteht noch kein Schadensmultiplikator.`,
      }]
    })
  return {
    relevant: skills.length > 0,
    productive: false,
    skills,
    modelVersion: SEAL_STATE_MODEL_VERSION,
  }
}
