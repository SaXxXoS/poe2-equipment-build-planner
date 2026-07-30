import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillGemDefinition, SkillSetup } from '../../domain'

export const PROJECTILE_ACCUMULATION_MODEL_VERSION = '1.1.0'

export interface ProjectileAccumulationState {
  skillId: string
  label: string
  maximumProjectiles: number
  releaseIntervalMs: number
  effectDurationMs: number
  finalDamagePerReleasedProjectilePercent: number
  maximumReleaseWindowMs: number
  appliedSkillLevel: number
  skillLevelStatus: 'exact' | 'default-reference-level'
  currentProjectiles?: number
  status: 'capacity-known-current-state-unknown'
  evidence: 'structured-exact'
  sourceReferences: string[]
  detail: string
}

export interface ProjectileAccumulationResult {
  relevant: boolean
  productive: false
  skills: ProjectileAccumulationState[]
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

export function resolveProjectileAccumulationState(input: {
  setups: SkillSetup[]
  skills: SkillGemDefinition[]
}): ProjectileAccumulationResult {
  const selectedSetups = new Map(input.setups.filter(setup => Boolean(setup.skillId)).map(setup => [setup.skillId, setup]))
  const selectedIds = new Set(selectedSetups.keys())
  const skills = input.skills
    .filter(skill => selectedIds.has(skill.id) && Boolean(skill.nameEn))
    .flatMap<ProjectileAccumulationState>(skill => {
      const record = byName.get(skill.nameEn!.toLocaleLowerCase('en'))
      const requestedLevel = selectedSetups.get(skill.id)?.level
      const availableLevels = record?.levels.map(value => value.level) ?? []
      const appliedSkillLevel = requestedLevel ?? (availableLevels.includes(20) ? 20 : availableLevels.at(-1))
      const level = appliedSkillLevel == null ? undefined : record?.levels.find(value => value.level === appliedSkillLevel)
      if (!level || (requestedLevel != null && level.level !== requestedLevel)) return []
      const stats = level.numericStats as Record<string, number>
      const maximumProjectiles = stats.blazing_cluster_maximum_number_of_projectiles_allowed
      const releaseIntervalMs = stats.blazing_cluster_delay_between_projectiles_ms
      const effectDurationMs = stats.base_skill_effect_duration
      const finalDamagePerReleasedProjectilePercent = stats['ember_fusillade_damage_+%_final_per_ember_fired']
      if (
        !Number.isFinite(maximumProjectiles) || maximumProjectiles! <= 0
        || !Number.isFinite(releaseIntervalMs) || releaseIntervalMs! <= 0
        || !Number.isFinite(effectDurationMs) || effectDurationMs! <= 0
        || !Number.isFinite(finalDamagePerReleasedProjectilePercent)
      ) return []
      return [{
        skillId: skill.id,
        label: skill.displayNameDe,
        maximumProjectiles: maximumProjectiles!,
        releaseIntervalMs: releaseIntervalMs!,
        effectDurationMs: effectDurationMs!,
        finalDamagePerReleasedProjectilePercent: finalDamagePerReleasedProjectilePercent!,
        maximumReleaseWindowMs: Math.max(0, (maximumProjectiles! - 1) * releaseIntervalMs!),
        appliedSkillLevel,
        skillLevelStatus: requestedLevel == null ? 'default-reference-level' : 'exact',
        status: 'capacity-known-current-state-unknown',
        evidence: 'structured-exact',
        sourceReferences: [
          'blazing_cluster_maximum_number_of_projectiles_allowed',
          'blazing_cluster_delay_between_projectiles_ms',
          'base_skill_effect_duration',
          'ember_fusillade_damage_+%_final_per_ember_fired',
        ],
        detail: `Auf Gemmenstufe ${appliedSkillLevel} sind maximal ${maximumProjectiles} Projektile, ${releaseIntervalMs} ms Abstand, ${effectDurationMs! / 1000} Sekunden Wirkzeit und ${finalDamagePerReleasedProjectilePercent} % finaler Schaden je abgefeuertem Ember belegt. Aktuelle Emberzahl, tatsächliche Trefferzahl und Zielüberlappung sind nicht aufgelöst; deshalb wird kein Gesamt- oder DPS-Multiplikator erfunden.`,
      }]
    })
  return {
    relevant: skills.length > 0,
    productive: false,
    skills,
    modelVersion: PROJECTILE_ACCUMULATION_MODEL_VERSION,
  }
}
