export const SUSTAINED_HIT_FREQUENCY_MODEL_VERSION = '1.0.0'

type NumericSkill = {
  name: string
  skillTypes?: readonly string[]
  numericStats?: Readonly<Record<string, number | undefined>>
}

export interface SustainedHitFrequencyModel {
  modelVersion: string
  skillName: string
  status: 'applied-periodic-single-target'
  activationRatePerSecond: number
  baseDurationMs: number
  effectiveDurationMs: number
  pulseIntervalMs: number
  pulseRatePerSecond: number
  uptime: number
  hitsPerInstance: number
  effectiveHitRatePerSecond: number
  maximumHitsPerInstance?: number
  singleTargetHitPreventionMs?: number
  sourceReferences: string[]
  detail: string
}

const stable = (value: number): number => Math.round(value * 1_000_000) / 1_000_000

const periodicDefinition = (skill: NumericSkill): {
  intervalStat: string
  maximumHitsStat?: string
  singleTargetHitPreventionStat?: string
} | undefined => {
  if (skill.name === 'Orb of Storms') return {
    intervalStat: 'orb_of_storms_base_bolt_frequency_ms',
    maximumHitsStat: 'orb_of_storms_maximum_number_of_hits',
  }
  if (skill.name === 'Solar Orb') return {
    intervalStat: 'solar_orb_base_pulse_frequency_ms',
  }
  if (skill.name === 'Thunderstorm') return {
    intervalStat: 'lightning_storm_hit_frequency_ms',
    singleTargetHitPreventionStat: 'lightning_storm_hit_prevention_duration_ms',
  }
  return undefined
}

export function resolveSustainedHitFrequency(input: {
  skill: NumericSkill
  activationRatePerSecond: number
  durationMultiplier?: number
}): SustainedHitFrequencyModel | undefined {
  const definition = periodicDefinition(input.skill)
  const stats = input.skill.numericStats ?? {}
  if (!definition || !input.skill.skillTypes?.includes('Sustained')) return undefined

  const baseDurationMs = Number(stats.base_skill_effect_duration)
  const rawIntervalMs = Number(stats[definition.intervalStat])
  if (!Number.isFinite(baseDurationMs) || baseDurationMs <= 0 || !Number.isFinite(rawIntervalMs) || rawIntervalMs <= 0) return undefined

  const singleTargetHitPreventionMs = definition.singleTargetHitPreventionStat
    ? Number(stats[definition.singleTargetHitPreventionStat])
    : undefined
  const pulseIntervalMs = Number.isFinite(singleTargetHitPreventionMs) && singleTargetHitPreventionMs! > rawIntervalMs
    ? singleTargetHitPreventionMs!
    : rawIntervalMs
  const effectiveDurationMs = baseDurationMs * Math.max(0, input.durationMultiplier ?? 1)
  const pulseRatePerSecond = 1_000 / pulseIntervalMs
  const maximumHits = definition.maximumHitsStat ? Number(stats[definition.maximumHitsStat]) : undefined
  const naturalHitsPerInstance = effectiveDurationMs / pulseIntervalMs
  const hitsPerInstance = Number.isFinite(maximumHits) && maximumHits! > 0
    ? Math.min(naturalHitsPerInstance, maximumHits!)
    : naturalHitsPerInstance
  const uptime = Math.min(1, Math.max(0, input.activationRatePerSecond) * effectiveDurationMs / 1_000)
  const instanceLimitedRate = effectiveDurationMs > 0 ? hitsPerInstance / (effectiveDurationMs / 1_000) : 0
  const effectiveHitRatePerSecond = Math.min(pulseRatePerSecond, instanceLimitedRate) * uptime
  const sourceReferences = [
    `damage-reference:${input.skill.name}:base_skill_effect_duration`,
    `damage-reference:${input.skill.name}:${definition.intervalStat}`,
    ...(definition.maximumHitsStat ? [`damage-reference:${input.skill.name}:${definition.maximumHitsStat}`] : []),
    ...(definition.singleTargetHitPreventionStat ? [`damage-reference:${input.skill.name}:${definition.singleTargetHitPreventionStat}`] : []),
  ]

  return {
    modelVersion: SUSTAINED_HIT_FREQUENCY_MODEL_VERSION,
    skillName: input.skill.name,
    status: 'applied-periodic-single-target',
    activationRatePerSecond: stable(input.activationRatePerSecond),
    baseDurationMs,
    effectiveDurationMs: stable(effectiveDurationMs),
    pulseIntervalMs,
    pulseRatePerSecond: stable(pulseRatePerSecond),
    uptime: stable(uptime),
    hitsPerInstance: stable(hitsPerInstance),
    effectiveHitRatePerSecond: stable(effectiveHitRatePerSecond),
    ...(Number.isFinite(maximumHits) && maximumHits! > 0 ? { maximumHitsPerInstance: maximumHits } : {}),
    ...(Number.isFinite(singleTargetHitPreventionMs) && singleTargetHitPreventionMs! > 0 ? { singleTargetHitPreventionMs } : {}),
    sourceReferences,
    detail: `${input.skill.name} verwendet im nachhaltigen Einzelzielwert ${stable(effectiveHitRatePerSecond)} belegte Treffer pro Sekunde aus Dauer, Pulsintervall${Number.isFinite(singleTargetHitPreventionMs) ? ' und Einzelziel-Treffersperre' : ''}. Die Aktivierungsrate steuert nur die belegte Uptime; sie wird nicht als zusätzlicher Treffer-Multiplikator verwendet.`,
  }
}
