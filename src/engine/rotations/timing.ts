import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillGemDefinition } from '../../domain'
export type RotationTimingStatus = 'permanent' | 'maintainable' | 'windowed' | 'cooldown-limited' | 'trigger-limited' | 'unresolved'
export interface RotationStepTiming { activationTimeMs?: number; effectDurationMs?: number; cooldownMs?: number; triggerIntervalMs?: number; refreshIntervalMs?: number; timingStatus: RotationTimingStatus; evidence: 'structured-exact' | 'unresolved'; sourceReferences: string[]; detail: string }
declare module '../common/types' {
  interface RotationStepAnalysis {
    timing?: RotationStepTiming
  }
}

export const ROTATION_TIMING_MODEL_VERSION = '1.0.0'
const byName = new Map(reference.skills.map(skill => [skill.name.toLocaleLowerCase('en'), skill]))
const positive = (value: unknown) => Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : undefined

export function resolveRotationTiming(definition: SkillGemDefinition): RotationStepTiming {
  const record = definition.nameEn ? byName.get(definition.nameEn.toLocaleLowerCase('en')) : undefined
  if (!record) return {
    timingStatus: definition.durationCategory === 'persistent' ? 'permanent' : 'unresolved',
    evidence: definition.durationCategory === 'persistent' ? 'structured-exact' : 'unresolved',
    sourceReferences: [],
    detail: definition.durationCategory === 'persistent'
      ? 'Der bestehende Fertigkeitsdatensatz kennzeichnet den Effekt als dauerhaft.'
      : 'Keine eindeutige numerische Zeitreferenz am gepinnten PoB2-Datensatz gefunden.',
  }
  const stats = record.numericStats as Record<string, number>
  const activationTimeMs = positive(record.castTime) ? Number((record.castTime * 1000).toFixed(2)) : undefined
  const effectDurationMs = positive(stats.base_skill_effect_duration)
    ?? positive(stats.base_secondary_skill_effect_duration)
    ?? positive(stats.active_skill_withered_base_duration_ms)
  const cooldownMs = positive(stats.base_cooldown_modifiable_repeat_interval_ms)
    ?? positive(stats.skill_combat_frenzy_x_ms_cooldown)
  const triggerIntervalMs = positive(stats.base_active_skill_buff_stack_gain_frequency_ms)
  const sourceReferences = [
    ...(activationTimeMs ? ['castTime'] : []),
    ...(positive(stats.base_skill_effect_duration) ? ['base_skill_effect_duration'] : []),
    ...(positive(stats.base_secondary_skill_effect_duration) ? ['base_secondary_skill_effect_duration'] : []),
    ...(positive(stats.active_skill_withered_base_duration_ms) ? ['active_skill_withered_base_duration_ms'] : []),
    ...(positive(stats.base_cooldown_modifiable_repeat_interval_ms) ? ['base_cooldown_modifiable_repeat_interval_ms'] : []),
    ...(positive(stats.skill_combat_frenzy_x_ms_cooldown) ? ['skill_combat_frenzy_x_ms_cooldown'] : []),
    ...(triggerIntervalMs ? ['base_active_skill_buff_stack_gain_frequency_ms'] : []),
  ]
  const timingStatus = definition.durationCategory === 'persistent' ? 'permanent'
    : triggerIntervalMs ? 'trigger-limited'
      : cooldownMs ? 'cooldown-limited'
        : effectDurationMs && (definition.canBeMaintained || definition.refreshRequired) ? 'maintainable'
          : effectDurationMs ? 'windowed' : 'unresolved'
  const detail = timingStatus === 'permanent' ? 'Der bestehende Fertigkeitsdatensatz kennzeichnet den Effekt als dauerhaft.'
    : timingStatus === 'maintainable' ? `Die belegte Wirkzeit beträgt ${effectDurationMs! / 1000} Sekunden; die Rotation plant eine erneute Anwendung nach Ablauf.`
      : timingStatus === 'windowed' ? `Die belegte Wirkzeit beträgt ${effectDurationMs! / 1000} Sekunden. Eine lückenlose Aufrechterhaltung ist nicht belegt.`
        : timingStatus === 'cooldown-limited' ? `Die belegte Abklingzeit beträgt ${cooldownMs! / 1000} Sekunden. Eine tatsächliche Nutzung direkt nach Ablauf wird nicht vorausgesetzt.`
          : timingStatus === 'trigger-limited' ? `Das belegte Trigger- beziehungsweise Stapelintervall beträgt ${triggerIntervalMs! / 1000} Sekunden.`
            : 'Aktivierungszeit ist belegt; Wirkzeit, Triggerintervall oder Abklingzeit sind nicht vollständig bekannt.'
  return {
    ...(activationTimeMs ? { activationTimeMs } : {}),
    ...(effectDurationMs ? { effectDurationMs } : {}),
    ...(cooldownMs ? { cooldownMs } : {}),
    ...(triggerIntervalMs ? { triggerIntervalMs } : {}),
    ...(effectDurationMs && (definition.canBeMaintained || definition.refreshRequired) ? { refreshIntervalMs: effectDurationMs } : {}),
    timingStatus,
    evidence: sourceReferences.length || definition.durationCategory === 'persistent' ? 'structured-exact' : 'unresolved',
    sourceReferences,
    detail,
  }
}
