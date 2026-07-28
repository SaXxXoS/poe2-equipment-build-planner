import reference from '../../../generated/pob2/damage-reference.json'
import type { EquipmentEntry, SkillGemDefinition, SkillSetup, SupportGemDefinition } from '../../domain'
import type { DamageEstimate } from './types'

export const RESOURCE_SPIRIT_MODEL_VERSION = '3.0.0'

type NumericSkill = (typeof reference.skills)[number]
const byName = new Map<string, NumericSkill>()
for (const skill of reference.skills) {
  const key = skill.name.toLocaleLowerCase('en')
  const current = byName.get(key)
  if (!current || Object.keys(skill.numericStats).length > Object.keys(current.numericStats).length) byName.set(key, skill)
}

const recordFor = (definition: SkillGemDefinition | undefined): NumericSkill | undefined =>
  definition?.nameEn ? byName.get(definition.nameEn.toLocaleLowerCase('en')) : undefined

export interface ResolvedResourceSpiritSource {
  sourceSkillId: string
  sourceSkillName: string
  weaponSet: SkillSetup['weaponSet']
  kind: 'spirit-reservation' | 'multiple-spirit-reservations' | 'mana-interaction'
  reservationCount?: number
  numericEffects: Array<{ statId: string; value: number }>
  status: 'blocked-missing-reservation-amount-and-capacity' | 'blocked-missing-cost-and-pool'
  evidence: 'structured-exact'
  sourceReferences: string[]
  detail: string
}

interface EquipmentResourceContribution {
  resource: 'life' | 'mana' | 'spirit' | 'mana-regeneration'
  value: number
  sourceItemId: string
  sourceModifierId: string
  sourceStatId: string
  status: 'partial-contribution-only'
}

interface SkillResourceCostChain {
  setupId: string
  skillId: string
  skillName: string
  weaponSet: SkillSetup['weaponSet']
  selectedSupportIds: string[]
  semanticSupportCostHints: number[]
  baseCosts: Array<{ resource:'mana'|'mana-percent'|'rage';cadence:'per-use'|'per-second';baseAmount:number;supportAdjustedAmount:number;sourceResource:string }>
  supportCostMultipliers: Array<{ supportId:string;supportName:string;multiplierPercent:number;sourceReference:string }>
  combinedSupportMultiplier: number | null
  baseCostStatus: 'structured-exact-level-20' | 'structured-exact-zero-cost' | 'blocked-missing-exact-base-cost'
  supportMultiplierStatus: 'structured-exact-all-selected-supports' | 'structured-exact-no-supports' | 'blocked-missing-exact-support-cost-multipliers'
  poolStatus: 'blocked-missing-complete-character-pool'
  sustainStatus: 'blocked-missing-pool-and-recovery' | 'blocked-missing-exact-cost-chain'
}

export interface ResourceSpiritModel {
  modelVersion: string
  productive: false
  manaPoolKnown: false
  lifePoolKnown: false
  spiritCapacityKnown: false
  exactSkillCostsKnown: boolean
  sources: ResolvedResourceSpiritSource[]
  equipmentContributions: EquipmentResourceContribution[]
  skillCostChains: SkillResourceCostChain[]
  semanticSupportCostHints: Array<{ supportId: string; value: number }>
  limitations: string[]
}

const resourceForStat = (statId: string): EquipmentResourceContribution['resource'] | undefined => {
  if (/^(?:base_)?maximum_life$/.test(statId)) return 'life'
  if (/^(?:base_)?maximum_mana$/.test(statId)) return 'mana'
  if (/^(?:base_)?maximum_spirit$|^spirit_?\+?$/.test(statId)) return 'spirit'
  if (/^mana_regeneration_rate_\+%$/.test(statId)) return 'mana-regeneration'
  return undefined
}

const costDescriptor = (sourceResource: string) => {
  if (sourceResource === 'Mana') return { resource: 'mana' as const, cadence: 'per-use' as const, divisor: reference.costDivisors.Mana }
  if (sourceResource === 'ManaPerMinute') return { resource: 'mana' as const, cadence: 'per-second' as const, divisor: reference.costDivisors.ManaPerMinute }
  if (sourceResource === 'ManaPercentPerMinute') return { resource: 'mana-percent' as const, cadence: 'per-second' as const, divisor: reference.costDivisors.ManaPercentPerMinute }
  if (sourceResource === 'RagePerMinute') return { resource: 'rage' as const, cadence: 'per-second' as const, divisor: reference.costDivisors.RagePerMinute }
  return undefined
}

const floorFour = (value: number) => Math.floor(value * 10_000) / 10_000

export function resolveResourceSpiritModel(input: {
  equipment?: EquipmentEntry[]
  setups: SkillSetup[]
  skills: SkillGemDefinition[]
  supports: SupportGemDefinition[]
}): ResourceSpiritModel {
  const sources: ResolvedResourceSpiritSource[] = []
  for (const setup of input.setups) {
    if (!setup.skillId) continue
    const definition = input.skills.find(value => value.id === setup.skillId)
    const record = recordFor(definition)
    if (!definition || !record) continue
    const hasReservation = record.skillTypes.includes('HasReservation')
    const hasMultipleReservation = record.skillTypes.includes('MultipleReservation')
    const numericEffects = Object.entries(record.numericStats)
      .filter(([statId, value]) => /mana|spirit|resource|reservation/i.test(statId) && Number.isFinite(Number(value)))
      .map(([statId, value]) => ({ statId, value: Number(value) }))
      .sort((a, b) => a.statId.localeCompare(b.statId))
    if (!hasReservation && !hasMultipleReservation && !numericEffects.length) continue
    const reservationCount = hasMultipleReservation ? 2 : hasReservation ? 1 : undefined
    sources.push({
      sourceSkillId: definition.id,
      sourceSkillName: definition.displayNameDe,
      weaponSet: setup.weaponSet,
      kind: hasMultipleReservation ? 'multiple-spirit-reservations' : hasReservation ? 'spirit-reservation' : 'mana-interaction',
      ...(reservationCount == null ? {} : { reservationCount }),
      numericEffects,
      status: hasReservation || hasMultipleReservation
        ? 'blocked-missing-reservation-amount-and-capacity'
        : 'blocked-missing-cost-and-pool',
      evidence: 'structured-exact',
      sourceReferences: [
        ...(hasReservation || hasMultipleReservation ? [`damage-reference:${record.name}:skillTypes`] : []),
        ...numericEffects.map(effect => `damage-reference:${record.name}:numericStats.${effect.statId}`),
      ],
      detail: hasReservation || hasMultipleReservation
        ? `${reservationCount === 2 ? 'Mehrere Reservierungen sind' : 'Eine Reservierung ist'} strukturell belegt. Reservierungsbetrag und verfügbare Geistkapazität fehlen; Aktivität und Aufrechterhaltbarkeit werden nicht behauptet.`
        : 'Eine Manawechselwirkung ist strukturell belegt. Grundkosten, aktueller Ressourcenpool und Regeneration fehlen; die Aufrechterhaltbarkeit wird nicht berechnet.',
    })
  }
  const selectedSupportIds = new Set(input.setups.flatMap(setup => setup.supportGemIds))
  const semanticSupportCostHints = input.supports
    .filter(support => selectedSupportIds.has(support.id) && Number.isFinite(support.resourceCost))
    .map(support => ({ supportId: support.id, value: Number(support.resourceCost) }))
    .sort((a, b) => a.supportId.localeCompare(b.supportId))
  const equipmentContributions = (input.equipment ?? []).flatMap(item =>
    item.modifierValues.flatMap(modifier =>
      (modifier.statValues ?? []).flatMap(stat => {
        const resource = resourceForStat(stat.statId)
        return resource && Number.isFinite(stat.value) ? [{
          resource,
          value: stat.value,
          sourceItemId: item.id,
          sourceModifierId: modifier.modifierId,
          sourceStatId: stat.statId,
          status: 'partial-contribution-only' as const,
        }] : []
      }),
    ),
  ).sort((a, b) =>
    a.sourceItemId.localeCompare(b.sourceItemId)
    || a.sourceModifierId.localeCompare(b.sourceModifierId)
    || a.sourceStatId.localeCompare(b.sourceStatId),
  )
  const supportHintById = new Map(semanticSupportCostHints.map(value => [value.supportId, value.value]))
  const skillCostChains = input.setups
    .filter(setup => Boolean(setup.skillId))
    .map(setup => {
      const definition = input.skills.find(value => value.id === setup.skillId)
      const record = recordFor(definition)
      const supportCostMultipliers = setup.supportGemIds
        .map(id => input.supports.find(value => value.id === id))
        .flatMap(support => support && Number.isFinite(support.costMultiplierPercent) ? [{
          supportId: support.id,
          supportName: support.displayNameDe,
          multiplierPercent: Number(support.costMultiplierPercent),
          sourceReference: support.sourceReference ?? `${support.provenance?.sourceId ?? 'unknown'}:${support.provenance?.sourceRecordId ?? support.id}`,
        }] : [])
        .sort((a, b) => a.supportId.localeCompare(b.supportId))
      const allSupportMultipliersKnown = supportCostMultipliers.length === setup.supportGemIds.length
      const combinedSupportMultiplier = allSupportMultipliersKnown
        ? floorFour(supportCostMultipliers.reduce((value, support) => value * support.multiplierPercent / 100, 1))
        : null
      const hasStructuredCostTable = Boolean(record && Object.keys(record.costs).length)
      const hasOnlyZeroCosts = hasStructuredCostTable && Object.values(record!.costs).every(value => Number(value) === 0)
      const baseCostStatus = !hasStructuredCostTable
        ? 'blocked-missing-exact-base-cost' as const
        : hasOnlyZeroCosts
          ? 'structured-exact-zero-cost' as const
          : 'structured-exact-level-20' as const
      const supportMultiplierStatus = setup.supportGemIds.length === 0
        ? 'structured-exact-no-supports' as const
        : allSupportMultipliersKnown
          ? 'structured-exact-all-selected-supports' as const
          : 'blocked-missing-exact-support-cost-multipliers' as const
      const baseCosts = record && combinedSupportMultiplier != null
        ? Object.entries(record.costs).flatMap(([sourceResource, rawAmount]) => {
          const descriptor = costDescriptor(sourceResource)
          if (!descriptor || !Number.isFinite(Number(rawAmount))) return []
          const baseAmount = Number((Number(rawAmount) / descriptor.divisor).toFixed(2))
          return [{
            resource: descriptor.resource,
            cadence: descriptor.cadence,
            baseAmount,
            supportAdjustedAmount: Math.floor(baseAmount * combinedSupportMultiplier),
            sourceResource,
          }]
        }).sort((a, b) => a.sourceResource.localeCompare(b.sourceResource))
        : []
      const exactCostChain = baseCostStatus !== 'blocked-missing-exact-base-cost'
        && supportMultiplierStatus !== 'blocked-missing-exact-support-cost-multipliers'
      return {
        setupId: setup.id,
        skillId: setup.skillId,
        skillName: definition?.displayNameDe ?? definition?.nameEn ?? setup.skillId,
        weaponSet: setup.weaponSet,
        selectedSupportIds: [...setup.supportGemIds].sort(),
        semanticSupportCostHints: setup.supportGemIds
          .flatMap(id => supportHintById.has(id) ? [supportHintById.get(id)!] : [])
          .sort((a, b) => a - b),
        baseCosts,
        supportCostMultipliers,
        combinedSupportMultiplier,
        baseCostStatus,
        supportMultiplierStatus,
        poolStatus: 'blocked-missing-complete-character-pool' as const,
        sustainStatus: exactCostChain ? 'blocked-missing-pool-and-recovery' as const : 'blocked-missing-exact-cost-chain' as const,
      }
    })
    .sort((a, b) => a.setupId.localeCompare(b.setupId))
  return {
    modelVersion: RESOURCE_SPIRIT_MODEL_VERSION,
    productive: false,
    manaPoolKnown: false,
    lifePoolKnown: false,
    spiritCapacityKnown: false,
    exactSkillCostsKnown: skillCostChains.length > 0 && skillCostChains.every(chain =>
      chain.baseCostStatus !== 'blocked-missing-exact-base-cost'
      && chain.supportMultiplierStatus !== 'blocked-missing-exact-support-cost-multipliers'),
    sources,
    equipmentContributions,
    skillCostChains,
    semanticSupportCostHints,
    limitations: [
      'Belegte Ausrüstungsbeiträge werden einzeln transportiert, ergeben ohne Charaktergrundwert, Attribute und weitere globale Wirkungen aber keinen vollständigen Lebens-, Mana- oder Geistpool.',
      'Der gepinnte Fertigkeitsbestand enthält Reservierungsmarker, aber keine allgemeine geschlossene Kette aus Reservierungsbetrag und verfügbarer Geistkapazität.',
      'Fertigkeits-Grundkosten auf Stufe 20 und Support-Kostenmultiplikatoren werden nur über die gepinnten strukturierten Quellen verbunden; fehlende Kostenketten bleiben blockiert.',
      'Die supportangepassten Werte enthalten noch keine passiven, Aszendenz-, Ausrüstungs- oder situativen Kostenänderungen.',
      'Ohne vollständigen Ressourcenpool und Wiederherstellung verändert dieses Modell weder Wirkfrequenz noch Schaden pro Sekunde und behauptet keine dauerhafte Nutzbarkeit.',
    ],
  }
}

export const resourceSpiritOutput = (
  model: ResourceSpiritModel,
): NonNullable<DamageEstimate['resourceSpiritModel']> => ({
  ...model,
  sources: model.sources.map(source => ({
    ...source,
    numericEffects: source.numericEffects.map(effect => ({ ...effect })),
    sourceReferences: [...source.sourceReferences],
  })),
  equipmentContributions: model.equipmentContributions.map(value => ({ ...value })),
  skillCostChains: model.skillCostChains.map(value => ({
    ...value,
    selectedSupportIds: [...value.selectedSupportIds],
    semanticSupportCostHints: [...value.semanticSupportCostHints],
    baseCosts: value.baseCosts.map(cost => ({ ...cost })),
    supportCostMultipliers: value.supportCostMultipliers.map(multiplier => ({ ...multiplier })),
  })),
  semanticSupportCostHints: model.semanticSupportCostHints.map(value => ({ ...value })),
  limitations: [...model.limitations],
})
