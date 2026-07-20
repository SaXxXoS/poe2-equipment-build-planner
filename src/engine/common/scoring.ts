import type { MechanicTag } from '../../domain'
import type { BuildProfile, Score, ScoreReason } from './types'

export const clamp = (value: number) => Math.max(0, Math.min(100, value))
export const blankProfile = (): BuildProfile => ({
  damageTypes: { physical: 0, fire: 0, cold: 0, lightning: 0, chaos: 0 },
  mechanics: { attack: 0, spell: 0, projectile: 0, melee: 0, area: 0, critical: 0, 'damage-over-time': 0, minion: 0, movement: 0, buff: 0, debuff: 0 },
  speed: { attackSpeedAffinity: 0, castSpeedAffinity: 0, movementAffinity: 0 }, defence: { lifeAffinity: 0, armourAffinity: 0, evasionAffinity: 0, energyShieldAffinity: 0, resistanceNeed: 50, generalDefenceNeed: 50 },
  requirements: { strengthNeed: 0, dexterityNeed: 0, intelligenceNeed: 0, resourceNeed: 0 }, goals: { mappingWeight: 50, bossWeight: 50, defenceWeight: 50, damageWeight: 50 },
})
export const profileAffinity = (profile: BuildProfile, tag: MechanicTag): number => tag in profile.damageTypes ? profile.damageTypes[tag as keyof BuildProfile['damageTypes']] : tag in profile.mechanics ? profile.mechanics[tag as keyof BuildProfile['mechanics']] : tag === 'defensive' ? profile.defence.generalDefenceNeed : 0
export const reason = (code: string, impact: number, sourceType: ScoreReason['sourceType'], sourceId: string, tags: MechanicTag[] = []): ScoreReason => ({ code, category: tags.includes('defensive') ? 'defence' : 'damage', messageKey: `engine.reason.${code}`, impact, polarity: impact > 0 ? 'positive' : impact < 0 ? 'negative' : 'neutral', sourceType, sourceId, affectedTags: tags })
export const scored = (reasons: ScoreReason[], violations: Score['violations'] = []): Score => ({ totalScore: reasons.reduce((sum, item) => sum + item.impact, 0), reasons, violations, categoryScores: Object.fromEntries(reasons.map(item => [item.category, (reasons.filter(other => other.category === item.category).reduce((sum, other) => sum + other.impact, 0))])), confidence: 'low', status: 'placeholder' })
export const stableSort = <T extends { totalScore: number; targetId: string }>(values: T[]) => [...values].sort((a, b) => b.totalScore - a.totalScore || a.targetId.localeCompare(b.targetId))
