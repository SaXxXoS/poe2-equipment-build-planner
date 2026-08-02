import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain/skills'
import type { EnemyMitigationProfile } from './types'

export const INTENSE_AGONY_SUPPORT_MODEL_VERSION = '1.0.0'

type NumericSkill = (typeof reference.skills)[number]

export interface IntenseAgonySupportModel {
  modelVersion: string
  status: 'not-applicable' | 'applied-full-life' | 'applied-duration-only-enemy-not-full-life' | 'applied-duration-only-unknown-enemy-life-state' | 'blocked-incompatible-skill' | 'blocked-duplicate-family'
  damageOverTimeMultiplier: number
  durationMultiplier: number
  appliedSupports: Array<{
    supportId: string
    supportName: string
    family: string
    enemyFullLifeMoreDamageOverTimePercent: number
    finalSkillEffectDurationPercent: number
    damageSourceReference: string
    durationSourceReference: string
  }>
  blockedSupportIds: string[]
  sourceReferences: string[]
  detail: string
}

const recordsByName = new Map(reference.supports.map(value => [value.name.toLocaleLowerCase('en'), value]))
const damageStat = 'support_chaotic_assassination_damage_over_time_+%_final_against_full_life_enemies'
const durationStat = 'support_chaotic_assassination_skill_effect_duration_+%_final'
const ignoredOperators = new Set(['AND', 'NOT'])

export function resolveIntenseAgonySupport(input: {
  skill: NumericSkill
  setup?: SkillSetup
  supports: SupportGemDefinition[]
  enemyProfile?: EnemyMitigationProfile
}): IntenseAgonySupportModel {
  const selected = new Set(input.setup?.supportGemIds ?? [])
  const candidates = input.supports.filter(value => selected.has(value.id)).flatMap(definition => {
    const numeric = recordsByName.get((definition.nameEn ?? '').toLocaleLowerCase('en'))
    const stats = numeric?.numericStats as Record<string, number> | undefined
    const damagePercent = Number(stats?.[damageStat])
    const durationPercent = Number(stats?.[durationStat])
    return numeric?.sourceRecordId === 'SupportIntenseAgonyPlayer' && Number.isFinite(damagePercent) && Number.isFinite(durationPercent)
      ? [{ definition, numeric, damagePercent, durationPercent }]
      : []
  })
  const empty = (
    status: IntenseAgonySupportModel['status'], detail: string, blockedSupportIds: string[] = [], sourceReferences: string[] = [],
  ): IntenseAgonySupportModel => ({
    modelVersion: INTENSE_AGONY_SUPPORT_MODEL_VERSION,
    status,
    damageOverTimeMultiplier: 1,
    durationMultiplier: 1,
    appliedSupports: [],
    blockedSupportIds,
    sourceReferences,
    detail,
  })
  if (!candidates.length) return empty('not-applicable', 'Intense Agony ist nicht ausgewählt.')
  const sourceReferences = candidates.flatMap(value => [
    `support:${value.numeric.sourceRecordId}:${damageStat}`,
    `support:${value.numeric.sourceRecordId}:${durationStat}`,
  ])
  const ids = candidates.map(value => value.definition.id)
  if (candidates.length !== 1) return empty(
    'blocked-duplicate-family',
    'Mehrere Intense-Agony-Supports derselben Familie sind ausgewählt; die Wirkung wird fail-closed blockiert.',
    ids,
    sourceReferences,
  )
  const candidate = candidates[0]
  const skillTypes = new Set(input.skill.skillTypes)
  const required = candidate.numeric.requireSkillTypes.filter(value => !ignoredOperators.has(value))
  const excluded = candidate.numeric.excludeSkillTypes.filter(value => !ignoredOperators.has(value))
  if (!required.every(value => skillTypes.has(value)) || excluded.some(value => skillTypes.has(value))) return empty(
    'blocked-incompatible-skill',
    'Intense Agony ist laut gepinnter Definition nur mit Zaubern mit Schaden über Zeit kompatibel.',
    ids,
    sourceReferences,
  )
  const appliedSupport = {
    supportId: candidate.definition.id,
    supportName: candidate.definition.displayNameDe ?? candidate.definition.nameEn ?? candidate.numeric.name,
    family: candidate.numeric.gemFamily[0] ?? 'IntenseAgony',
    enemyFullLifeMoreDamageOverTimePercent: candidate.damagePercent,
    finalSkillEffectDurationPercent: candidate.durationPercent,
    damageSourceReference: sourceReferences[0],
    durationSourceReference: sourceReferences[1],
  }
  const durationMultiplier = 1 + candidate.durationPercent / 100
  if (input.enemyProfile?.lifeState === 'full-life') return {
    modelVersion: INTENSE_AGONY_SUPPORT_MODEL_VERSION,
    status: 'applied-full-life',
    damageOverTimeMultiplier: 1 + candidate.damagePercent / 100,
    durationMultiplier,
    appliedSupports: [appliedSupport],
    blockedSupportIds: [],
    sourceReferences,
    detail: `${candidate.damagePercent}% mehr Schaden über Zeit gegen das bestätigt auf vollem Leben befindliche Ziel und ${Math.abs(candidate.durationPercent)}% weniger Wirkungsdauer werden angewandt.`,
  }
  const enemyNotFullLife = input.enemyProfile?.lifeState === 'low-life' || input.enemyProfile?.lifeState === 'not-low-life'
  return {
    modelVersion: INTENSE_AGONY_SUPPORT_MODEL_VERSION,
    status: enemyNotFullLife ? 'applied-duration-only-enemy-not-full-life' : 'applied-duration-only-unknown-enemy-life-state',
    damageOverTimeMultiplier: 1,
    durationMultiplier,
    appliedSupports: [appliedSupport],
    blockedSupportIds: [],
    sourceReferences,
    detail: enemyNotFullLife
      ? `Das Ziel befindet sich bestätigt nicht auf vollem Leben; nur ${Math.abs(candidate.durationPercent)}% weniger Wirkungsdauer werden angewandt.`
      : `Der Lebenszustand des Ziels ist unbekannt; der bedingte Schadensbonus wird nicht angenommen, ${Math.abs(candidate.durationPercent)}% weniger Wirkungsdauer gelten weiterhin.`,
  }
}
