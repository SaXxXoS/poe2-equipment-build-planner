import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain/skills'
import type { EnemyMitigationProfile } from './types'

export const AMBUSH_SUPPORT_MODEL_VERSION = '1.0.0'

type NumericSkill = (typeof reference.skills)[number]

export interface AmbushSupportModel {
  modelVersion: string
  status: 'not-applicable' | 'applied' | 'inactive-enemy-not-full-life' | 'blocked-unknown-enemy-life-state' | 'blocked-incompatible-skill' | 'blocked-duplicate-family'
  criticalChanceMultiplier: number
  appliedSupports: Array<{
    supportId: string
    supportName: string
    family: string
    enemyFullLifeMoreCriticalChancePercent: number
    sourceReference: string
  }>
  blockedSupportIds: string[]
  sourceReferences: string[]
  detail: string
}

const recordsByName = new Map(reference.supports.map(value => [value.name.toLocaleLowerCase('en'), value]))
const criticalChanceStat = 'support_ambush_critical_strike_chance_vs_enemies_on_full_life_+%_final'
const ignoredOperators = new Set(['AND', 'NOT'])

export function resolveAmbushSupport(input: {
  skill: NumericSkill
  setup?: SkillSetup
  supports: SupportGemDefinition[]
  enemyProfile?: EnemyMitigationProfile
}): AmbushSupportModel {
  const selected = new Set(input.setup?.supportGemIds ?? [])
  const candidates = input.supports.filter(value => selected.has(value.id)).flatMap(definition => {
    const numeric = recordsByName.get((definition.nameEn ?? '').toLocaleLowerCase('en'))
    const percent = Number((numeric?.numericStats as Record<string, number> | undefined)?.[criticalChanceStat])
    return numeric?.sourceRecordId === 'SupportAmbushPlayer' && Number.isFinite(percent)
      ? [{ definition, numeric, percent }]
      : []
  })
  const empty = (
    status: AmbushSupportModel['status'], detail: string, blockedSupportIds: string[] = [], sourceReferences: string[] = [],
  ): AmbushSupportModel => ({
    modelVersion: AMBUSH_SUPPORT_MODEL_VERSION,
    status,
    criticalChanceMultiplier: 1,
    appliedSupports: [],
    blockedSupportIds,
    sourceReferences,
    detail,
  })
  if (!candidates.length) return empty('not-applicable', 'Hinterhalt ist nicht ausgewählt.')
  const sourceReferences = candidates.map(value => `support:${value.numeric.sourceRecordId}:${criticalChanceStat}`)
  const ids = candidates.map(value => value.definition.id)
  if (candidates.length !== 1) return empty(
    'blocked-duplicate-family',
    'Mehrere Hinterhalt-Supports derselben Familie sind ausgewählt; die Wirkung wird fail-closed blockiert.',
    ids,
    sourceReferences,
  )
  const candidate = candidates[0]
  const skillTypes = new Set(input.skill.skillTypes)
  const required = candidate.numeric.requireSkillTypes.filter(value => !ignoredOperators.has(value))
  const excluded = candidate.numeric.excludeSkillTypes.filter(value => !ignoredOperators.has(value))
  if (!required.some(value => skillTypes.has(value)) || excluded.some(value => skillTypes.has(value))) return empty(
    'blocked-incompatible-skill',
    'Hinterhalt ist laut gepinnter Definition mit dieser Fertigkeit nicht kompatibel.',
    ids,
    sourceReferences,
  )
  if (input.enemyProfile?.lifeState === 'low-life' || input.enemyProfile?.lifeState === 'not-low-life') return empty(
    'inactive-enemy-not-full-life',
    'Das Ziel befindet sich bestätigt nicht auf vollem Leben; der Hinterhalt-Bonus ist inaktiv.',
    [],
    sourceReferences,
  )
  if (input.enemyProfile?.lifeState !== 'full-life') return empty(
    'blocked-unknown-enemy-life-state',
    'Ob das Ziel auf vollem Leben ist, ist unbekannt; der bedingte Hinterhalt-Bonus wird nicht angenommen.',
    ids,
    sourceReferences,
  )
  return {
    modelVersion: AMBUSH_SUPPORT_MODEL_VERSION,
    status: 'applied',
    criticalChanceMultiplier: 1 + candidate.percent / 100,
    appliedSupports: [{
      supportId: candidate.definition.id,
      supportName: candidate.definition.displayNameDe ?? candidate.definition.nameEn ?? candidate.numeric.name,
      family: candidate.numeric.gemFamily[0] ?? 'Ambush',
      enemyFullLifeMoreCriticalChancePercent: candidate.percent,
      sourceReference: sourceReferences[0],
    }],
    blockedSupportIds: [],
    sourceReferences,
    detail: `${candidate.percent}% mehr kritische Trefferchance gegen das bestätigt auf vollem Leben befindliche Ziel werden angewandt.`,
  }
}
