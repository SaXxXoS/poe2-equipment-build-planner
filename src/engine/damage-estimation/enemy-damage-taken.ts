import type { DamageComponent, EnemyMitigationProfile } from './types'

export const ENEMY_DAMAGE_TAKEN_MODEL_VERSION = '1.0.0'

export function enemyDamageTakenMultiplier(
  type: DamageComponent['type'],
  profile: EnemyMitigationProfile | undefined,
): number {
  const increased = profile?.damageTakenIncreased?.[type] ?? 0
  return Math.max(0, 1 + increased / 100)
}
