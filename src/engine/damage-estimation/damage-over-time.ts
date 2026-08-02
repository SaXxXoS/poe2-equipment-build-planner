import reference from '../../../generated/pob2/damage-reference.json'
import type { EnemyMitigationProfile } from './types'
import { enemyDamageTakenMultiplier } from './enemy-damage-taken'

export const DAMAGE_OVER_TIME_MODEL_VERSION = '3.3.0'

type NumericSkill = (typeof reference.skills)[number]
type DamageType = 'physical' | 'fire' | 'cold' | 'lightning' | 'chaos'

export interface ResolvedDamageOverTimeEffect {
  sourceRecordId: string
  sourceLabel: string
  damageType: DamageType
  kind: 'native-damage-over-time'
  status: 'single-application-window'
  damagePerSecond: number
  damagePerSecondAfterMitigation?: number
  durationMs: number
  totalDamagePerApplication: number
  totalDamagePerApplicationAfterMitigation?: number
  stackCount: 1
  evidence: 'structured-exact'
  sourceReferences: string[]
  detail: string
}

export interface UnresolvedDamageOverTimeEffect {
  sourceRecordId: string
  sourceLabel: string
  kind: 'native-damage-over-time' | 'ignite' | 'poison' | 'bleeding'
  status: 'blocked'
  evidence: 'incomplete-identity-chain'
  sourceReferences: string[]
  detail: string
}

export interface DamageOverTimeResult {
  modelVersion: string
  effects: ResolvedDamageOverTimeEffect[]
  blockedEffects: UnresolvedDamageOverTimeEffect[]
  totalSingleApplicationDamagePerSecond?: number
  totalSingleApplicationDamagePerSecondAfterMitigation?: number
  limitations: string[]
}

const damageStats: Array<{ type: DamageType; stat: string }> = [
  { type: 'physical', stat: 'base_physical_damage_to_deal_per_minute' },
  { type: 'fire', stat: 'base_fire_damage_to_deal_per_minute' },
  { type: 'cold', stat: 'base_cold_damage_to_deal_per_minute' },
  { type: 'lightning', stat: 'base_lightning_damage_to_deal_per_minute' },
  { type: 'chaos', stat: 'base_chaos_damage_to_deal_per_minute' },
]

const round = (value: number) => Number(value.toFixed(2))
const resistanceAfterReduction = (type: DamageType, profile: EnemyMitigationProfile | undefined) => {
  if (!profile || type === 'physical') return 0
  return Math.max(-100, Math.min(
    90,
    (profile.resistances?.[type] ?? 0)
      - Math.max(0, profile.resistanceReduction?.[type] ?? 0),
  ))
}

export function collectDamageOverTime(
  skill: NumericSkill,
  enemyProfile?: EnemyMitigationProfile,
  duration?: { multiplier: number; sourceReferences: string[] },
  damage?: { multiplier: number; sourceReferences: string[] },
): DamageOverTimeResult {
  const stats = skill.numericStats as Record<string, number>
  const baseDurationMs = stats.base_skill_effect_duration
  const durationMultiplier = duration?.multiplier ?? 1
  const durationMs = Number.isFinite(baseDurationMs) ? baseDurationMs * durationMultiplier : baseDurationMs
  const effects: ResolvedDamageOverTimeEffect[] = []
  const blockedEffects: UnresolvedDamageOverTimeEffect[] = []

  for (const definition of damageStats) {
    const perMinute = stats[definition.stat]
    if (!Number.isFinite(perMinute) || perMinute <= 0) continue
    if (!Number.isFinite(durationMs) || durationMs <= 0) {
      blockedEffects.push({
        sourceRecordId: skill.sourceRecordId,
        sourceLabel: skill.name,
        kind: 'native-damage-over-time',
        status: 'blocked',
        evidence: 'incomplete-identity-chain',
        sourceReferences: [definition.stat],
        detail: 'Ein strukturierter Grundwert ist vorhanden, aber keine gemeinsam gepinnte Wirkungsdauer. Der Teilwert wird nicht als DPS oder Gesamtschaden ausgegeben.',
      })
      continue
    }
    const damageMultiplier = damage?.multiplier ?? 1
    const damagePerSecond = perMinute / 60 * damageMultiplier
    const resistance = resistanceAfterReduction(definition.type, enemyProfile)
    const damagePerSecondAfterMitigation = damagePerSecond * (1 - resistance / 100) * enemyDamageTakenMultiplier(definition.type, enemyProfile)
    effects.push({
      sourceRecordId: skill.sourceRecordId,
      sourceLabel: skill.name,
      damageType: definition.type,
      kind: 'native-damage-over-time',
      status: 'single-application-window',
      damagePerSecond: round(damagePerSecond),
      ...(enemyProfile ? { damagePerSecondAfterMitigation: round(damagePerSecondAfterMitigation) } : {}),
      durationMs,
      totalDamagePerApplication: round(damagePerSecond * durationMs / 1000),
      ...(enemyProfile ? {
        totalDamagePerApplicationAfterMitigation: round(damagePerSecondAfterMitigation * durationMs / 1000),
      } : {}),
      stackCount: 1,
      evidence: 'structured-exact',
      sourceReferences: [definition.stat, 'base_skill_effect_duration', ...(duration?.sourceReferences ?? []), ...(damage?.sourceReferences ?? [])],
      detail: `Eigenständiger strukturierter Schaden über Zeit für genau eine Anwendung${damageMultiplier === 1 ? '' : ` mit gemeinsam belegtem finalem Support-Schadensfaktor ${damageMultiplier}`}. Wiederholungsrate, Überlappung und zusätzliche Stapel werden nicht behauptet.`,
    })
  }

  return {
    modelVersion: DAMAGE_OVER_TIME_MODEL_VERSION,
    effects,
    blockedEffects,
    ...(effects.length ? {
      totalSingleApplicationDamagePerSecond: round(effects.reduce((sum, effect) => sum + effect.damagePerSecond, 0)),
    } : {}),
    ...(effects.length && enemyProfile ? {
      totalSingleApplicationDamagePerSecondAfterMitigation: round(
        effects.reduce((sum, effect) => sum + (effect.damagePerSecondAfterMitigation ?? effect.damagePerSecond), 0),
      ),
    } : {}),
    limitations: [
      'Entzünden, Gift und Blutung werden erst angewandt, wenn Basiswert, Auslösung, Dauer und Stapelregel gemeinsam belegt sind.',
      'Der Einzelanwendungswert ist kein aufrechterhaltener Gesamt-DPS und wird nicht zum Trefferschaden pro Sekunde addiert.',
      'Nicht eindeutig zugeordnete Support-, Passive-, Aszendenz- und Gegnerwirkungen verändern diesen DoT-Teilwert nicht.',
    ],
  }
}
