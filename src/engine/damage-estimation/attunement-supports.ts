import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain/skills'
import type { DamageComponent } from './types'

export const ATTUNEMENT_SUPPORT_MODEL_VERSION = '1.0.0'

type NumericSkill = (typeof reference.skills)[number]
type DamageType = DamageComponent['type']

interface AttunementDefinition {
  sourceRecordId: string
  targetType: DamageType
  gainStat: string
  penaltyStat: string
  penalizedTypes: DamageType[]
}

export interface AttunementSupportModel {
  modelVersion: string
  status: 'not-applicable' | 'applied' | 'blocked-incompatible-skill' | 'blocked-duplicate-family'
  targetType?: DamageType
  gainAsExtraPercent: number
  penalizedTypes: DamageType[]
  penaltyPercent: number
  penaltyMultiplier: number
  appliedSupports: Array<{
    supportId: string
    supportName: string
    family: string
    targetType: DamageType
    gainAsExtraPercent: number
    penalizedTypes: DamageType[]
    penaltyPercent: number
    sourceReferences: string[]
  }>
  blockedSupportIds: string[]
  sourceReferences: string[]
  detail: string
}

const definitions: AttunementDefinition[] = [
  {
    sourceRecordId: 'SupportAddedFireDamagePlayer',
    targetType: 'fire',
    gainStat: 'non_skill_base_all_damage_%_to_gain_as_fire',
    penaltyStat: 'support_cold_and_lightning_damage_+%_final',
    penalizedTypes: ['cold', 'lightning'],
  },
  {
    sourceRecordId: 'SupportAddedColdDamagePlayer',
    targetType: 'cold',
    gainStat: 'non_skill_base_all_damage_%_to_gain_as_cold',
    penaltyStat: 'support_fire_and_lightning_damage_+%_final',
    penalizedTypes: ['fire', 'lightning'],
  },
  {
    sourceRecordId: 'SupportAddedLightningDamagePlayer',
    targetType: 'lightning',
    gainStat: 'non_skill_base_all_damage_%_to_gain_as_lightning',
    penaltyStat: 'support_cold_and_fire_damage_+%_final',
    penalizedTypes: ['cold', 'fire'],
  },
  {
    sourceRecordId: 'SupportAddedChaosDamagePlayer',
    targetType: 'chaos',
    gainStat: 'non_skill_base_all_damage_%_to_gain_as_chaos',
    penaltyStat: 'support_chaos_support_non_chaos_damage_+%_final',
    penalizedTypes: ['physical', 'fire', 'cold', 'lightning'],
  },
]

const definitionByRecordId = new Map(definitions.map(value => [value.sourceRecordId, value]))
const recordsByName = new Map(reference.supports.map(value => [value.name.toLocaleLowerCase('en'), value]))
const round = (value: number) => Number(value.toFixed(8))

export function resolveAttunementSupport(input: {
  skill: NumericSkill
  setup?: SkillSetup
  supports: SupportGemDefinition[]
}): AttunementSupportModel {
  const selected = new Set(input.setup?.supportGemIds ?? [])
  const candidates = input.supports.filter(value => selected.has(value.id)).flatMap(support => {
    const numeric = recordsByName.get((support.nameEn ?? '').toLocaleLowerCase('en'))
    const definition = numeric ? definitionByRecordId.get(numeric.sourceRecordId) : undefined
    const stats = numeric?.numericStats as Record<string, number> | undefined
    const gainAsExtraPercent = definition ? Number(stats?.[definition.gainStat]) : Number.NaN
    const penaltyPercent = definition ? Number(stats?.[definition.penaltyStat]) : Number.NaN
    return numeric && definition && Number.isFinite(gainAsExtraPercent) && Number.isFinite(penaltyPercent)
      ? [{ support, numeric, definition, gainAsExtraPercent, penaltyPercent }]
      : []
  })
  const empty = (
    status: AttunementSupportModel['status'],
    detail: string,
    blockedSupportIds: string[] = [],
    sourceReferences: string[] = [],
  ): AttunementSupportModel => ({
    modelVersion: ATTUNEMENT_SUPPORT_MODEL_VERSION,
    status,
    gainAsExtraPercent: 0,
    penalizedTypes: [],
    penaltyPercent: 0,
    penaltyMultiplier: 1,
    appliedSupports: [],
    blockedSupportIds,
    sourceReferences,
    detail,
  })
  if (!candidates.length) return empty('not-applicable', 'Kein exakt modellierter Attunement-Support ist ausgewählt.')
  const sourceReferences = candidates.flatMap(value => [
    `support:${value.numeric.sourceRecordId}:${value.definition.gainStat}`,
    `support:${value.numeric.sourceRecordId}:${value.definition.penaltyStat}`,
  ])
  const required = new Set(candidates.flatMap(value => value.numeric.requireSkillTypes))
  if (!input.skill.skillTypes.some(value => required.has(value))) {
    return empty(
      'blocked-incompatible-skill',
      'Attunement unterstützt laut Pin nur passende Angriffs-, Schadens- oder Armbrustmunitions-Fertigkeiten.',
      candidates.map(value => value.support.id),
      sourceReferences,
    )
  }
  const families = candidates.map(value => value.numeric.gemFamily[0] ?? value.support.id)
  if (new Set(families).size !== families.length) {
    return empty(
      'blocked-duplicate-family',
      'Mehrere Gemmen derselben Attunement-Familie sind ausgewählt; die Wirkung wird fail-closed blockiert.',
      candidates.map(value => value.support.id),
      sourceReferences,
    )
  }
  const appliedSupports = candidates.map(({ support, numeric, definition, gainAsExtraPercent, penaltyPercent }) => ({
    supportId: support.id,
    supportName: support.displayNameDe ?? support.nameEn ?? numeric.name,
    family: numeric.gemFamily[0] ?? support.id,
    targetType: definition.targetType,
    gainAsExtraPercent,
    penalizedTypes: [...definition.penalizedTypes],
    penaltyPercent,
    sourceReferences: [
      `support:${numeric.sourceRecordId}:${definition.gainStat}`,
      `support:${numeric.sourceRecordId}:${definition.penaltyStat}`,
    ],
  }))
  const primary = appliedSupports[0]
  return {
    modelVersion: ATTUNEMENT_SUPPORT_MODEL_VERSION,
    status: 'applied',
    targetType: primary.targetType,
    gainAsExtraPercent: primary.gainAsExtraPercent,
    penalizedTypes: [...primary.penalizedTypes],
    penaltyPercent: primary.penaltyPercent,
    penaltyMultiplier: round(1 + primary.penaltyPercent / 100),
    appliedSupports,
    blockedSupportIds: [],
    sourceReferences,
    detail: `${primary.gainAsExtraPercent}% des Ausgangsschadens werden als zusätzlicher ${primary.targetType}-Schaden gewonnen; ${primary.penaltyPercent}% finaler Schaden gilt für ${primary.penalizedTypes.join(', ')}.`,
  }
}

export function applyAttunementToHit(
  components: DamageComponent[],
  gainBasis: DamageComponent[],
  model: AttunementSupportModel,
): DamageComponent[] {
  if (model.status !== 'applied' || !model.targetType) return components.map(value => ({ ...value }))
  const result = new Map<DamageType, { minimum: number; maximum: number }>()
  const add = (type: DamageType, minimum: number, maximum: number) => {
    const current = result.get(type) ?? { minimum: 0, maximum: 0 }
    current.minimum += minimum
    current.maximum += maximum
    result.set(type, current)
  }
  for (const component of components) {
    const multiplier = model.appliedSupports.reduce(
      (product, support) => product * (support.penalizedTypes.includes(component.type) ? 1 + support.penaltyPercent / 100 : 1),
      1,
    )
    add(component.type, component.minimum * multiplier, component.maximum * multiplier)
  }
  for (const support of model.appliedSupports) {
    for (const component of gainBasis) {
      add(
        support.targetType,
        component.minimum * support.gainAsExtraPercent / 100,
        component.maximum * support.gainAsExtraPercent / 100,
      )
    }
  }
  const order: DamageType[] = ['physical', 'fire', 'cold', 'lightning', 'chaos']
  return order.flatMap(type => {
    const value = result.get(type)
    return value && (value.minimum || value.maximum)
      ? [{ type, minimum: round(value.minimum), maximum: round(value.maximum) }]
      : []
  })
}

export function attunementNativeDotTypeMultipliers(model: AttunementSupportModel): Partial<Record<DamageType, number>> | undefined {
  if (model.status !== 'applied') return undefined
  const result: Partial<Record<DamageType, number>> = {}
  for (const support of model.appliedSupports) {
    for (const type of support.penalizedTypes) result[type] = (result[type] ?? 1) * (1 + support.penaltyPercent / 100)
  }
  return result
}

export const applyAttunementPenalty = (
  components: DamageComponent[],
  model: AttunementSupportModel,
) => applyAttunementToHit(components, [], model)
