import reference from '../../../generated/pob2/damage-reference.json'
import type { EquipmentEntry, SkillGemDefinition, SkillSetup, SupportGemDefinition } from '../../domain'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'
import type { DamageEstimate } from './types'

export const RESOURCE_SPIRIT_MODEL_VERSION = '6.0.0'

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
  reservationAmount?: number
  numericEffects: Array<{ statId: string; value: number }>
  status: 'structured-exact-reservation' | 'blocked-missing-reservation-amount-and-capacity' | 'blocked-missing-cost-and-pool'
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
  baseCosts: Array<{ resource:'mana'|'mana-percent'|'rage';cadence:'per-use'|'per-second';baseAmount:number;supportAdjustedAmount:number;resourceAdjustedAmount:number;sourceResource:string }>
  supportCostMultipliers: Array<{ supportId:string;supportName:string;multiplierPercent:number;sourceReference:string }>
  passiveResourceEffects: PassiveResourceEffect[]
  combinedSupportMultiplier: number | null
  combinedResourceCostMultiplier: number
  effectiveManaPool: number | null
  effectiveManaRegenerationPerSecond: number | null
  confirmedFlatSpiritContribution: number
  baseCostStatus: 'structured-exact-level-20' | 'structured-exact-zero-cost' | 'blocked-missing-exact-base-cost'
  supportMultiplierStatus: 'structured-exact-all-selected-supports' | 'structured-exact-no-supports' | 'blocked-missing-exact-support-cost-multipliers'
  poolStatus: 'confirmed-minimum-pool' | 'confirmed-pool-with-passive-effects' | 'blocked-missing-character-level'
  sustainStatus: 'sustainable-on-confirmed-minimum' | 'burst-affordable-on-confirmed-minimum' | 'unusable-confirmed-zero-mana' | 'blocked-missing-action-frequency' | 'blocked-missing-character-level' | 'blocked-missing-exact-cost-chain'
  actionFrequencyPerSecond: number | null
  manaDemandPerSecond: number | null
}

export interface ResourceSpiritModel {
  modelVersion: string
  productive: boolean
  manaPoolKnown: false
  lifePoolKnown: false
  spiritCapacityKnown: false
  exactSkillCostsKnown: boolean
  confirmedMinimumPools?: {
    characterLevel: number
    baseLife: number
    baseMana: number
    life: number
    mana: number
    manaRegenerationPerSecond: number
    status: 'confirmed-minimum-only'
  }
  sources: ResolvedResourceSpiritSource[]
  equipmentContributions: EquipmentResourceContribution[]
  skillCostChains: SkillResourceCostChain[]
  spiritReservations: NonNullable<DamageEstimate['resourceSpiritModel']>['spiritReservations']
  spiritCapacityByWeaponSet: NonNullable<DamageEstimate['resourceSpiritModel']>['spiritCapacityByWeaponSet']
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
type PassiveResourceEffect = NonNullable<DamageEstimate['resourceSpiritModel']>['skillCostChains'][number]['passiveResourceEffects'][number]
const stripMarkup = (value: string) => value.replace(/\[[^|\]]+\|([^\]]+)\]/g, '$1').replace(/\[([^\]]+)\]/g, '$1').replace(/\s+/g, ' ').trim()
const unique = <T>(values: T[]) => [...new Set(values)]

const allocatedNodeIds = (planning: RealPassivePlanningIntegrationResult | undefined, weaponSet: SkillSetup['weaponSet']) => {
  const normal = weaponSet === 'set-1'
    ? planning?.weaponSetPlanning?.set1 ?? planning?.pipelineResult
    : weaponSet === 'set-2'
      ? planning?.weaponSetPlanning?.set2 ?? planning?.pipelineResult
      : planning?.pipelineResult
  return unique([...(normal?.allocatedNodeIds ?? []), ...(planning?.ascendancyPlanning?.allocatedNodeIds ?? [])])
}

function passiveResourceEffects(
  tree: RealPassiveTree | undefined,
  planning: RealPassivePlanningIntegrationResult | undefined,
  weaponSet: SkillSetup['weaponSet'],
): PassiveResourceEffect[] {
  if (!tree || !planning) return []
  const nodes = new Map(tree.nodes.map(node => [node.id, node]))
  const effects: PassiveResourceEffect[] = []
  const add = (nodeId: string, sourceText: string, kind: PassiveResourceEffect['kind'], value: number) => {
    const node = nodes.get(nodeId)
    effects.push({ source: node?.ascendancyId ? 'ascendancy' : 'passive', sourceNodeId: nodeId, sourceText, kind, value, evidence: 'text-pattern-exact' })
  }
  for (const nodeId of allocatedNodeIds(planning, weaponSet)) {
    const node = nodes.get(nodeId)
    if (!node) continue
    for (const stat of node.stats) {
      if (!stat.sourceText) continue
      const text = stripMarkup(stat.sourceText)
      if (/\b(?:while|when|if|per|for every|during|on kill|recently|stationary|moving|full life|low mana)\b/i.test(text)) continue
      let match = text.match(/^\+(\d+(?:\.\d+)?) to maximum Mana$/i)
      if (match) { add(nodeId, text, 'flat-mana', Number(match[1])); continue }
      match = text.match(/^(\d+(?:\.\d+)?)% increased maximum Mana$/i)
      if (match) { add(nodeId, text, 'maximum-mana-increased', Number(match[1])); continue }
      match = text.match(/^(\d+(?:\.\d+)?)% reduced maximum Mana$/i)
      if (match) { add(nodeId, text, 'maximum-mana-reduced', Number(match[1])); continue }
      match = text.match(/^(\d+(?:\.\d+)?)% less maximum Mana$/i)
      if (match) { add(nodeId, text, 'maximum-mana-less', Number(match[1])); continue }
      match = text.match(/^(\d+(?:\.\d+)?)% increased Mana Regeneration Rate$/i)
      if (match) { add(nodeId, text, 'mana-regeneration-increased', Number(match[1])); continue }
      match = text.match(/^(\d+(?:\.\d+)?)% increased Mana Cost of Skills$/i)
      if (match) { add(nodeId, text, 'mana-cost-increased', Number(match[1])); continue }
      match = text.match(/^(\d+(?:\.\d+)?)% more Mana Cost of Skills$/i)
      if (match) { add(nodeId, text, 'mana-cost-more', Number(match[1])); continue }
      if (/^Mana Costs are Doubled$/i.test(text)) { add(nodeId, text, 'mana-cost-doubled', 100); continue }
      match = text.match(/^\+(\d+(?:\.\d+)?) to (?:maximum )?Spirit$/i)
      if (match) { add(nodeId, text, 'flat-spirit', Number(match[1])); continue }
      match = text.match(/^(\d+(?:\.\d+)?)% (increased|reduced|less) Spirit$/i)
      if (match) {
        add(nodeId, text, match[2].toLowerCase() === 'increased' ? 'spirit-increased' : match[2].toLowerCase() === 'reduced' ? 'spirit-reduced' : 'spirit-less', Number(match[1]))
        continue
      }
      if (/^No inherent Mana Regeneration$/i.test(text)) { add(nodeId, text, 'no-inherent-mana-regeneration', 1); continue }
      if (/^You have no Mana$/i.test(text)) add(nodeId, text, 'no-mana', 1)
      if (/^You have no Spirit$/i.test(text)) add(nodeId, text, 'no-spirit', 1)
    }
  }
  return effects.sort((a, b) => a.sourceNodeId.localeCompare(b.sourceNodeId) || a.sourceText.localeCompare(b.sourceText))
}

export function resolveResourceSpiritModel(input: {
  equipment?: EquipmentEntry[]
  setups: SkillSetup[]
  skills: SkillGemDefinition[]
  supports: SupportGemDefinition[]
  characterLevel?: number
  passiveTree?: RealPassiveTree
  realPassivePlanning?: RealPassivePlanningIntegrationResult
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
    const reservationAmount = Number.isFinite(definition.spiritReservation) ? Number(definition.spiritReservation) : undefined
    sources.push({
      sourceSkillId: definition.id,
      sourceSkillName: definition.displayNameDe,
      weaponSet: setup.weaponSet,
      kind: hasMultipleReservation ? 'multiple-spirit-reservations' : hasReservation ? 'spirit-reservation' : 'mana-interaction',
      ...(reservationCount == null ? {} : { reservationCount }),
      ...(reservationAmount == null ? {} : { reservationAmount }),
      numericEffects,
      status: hasReservation || hasMultipleReservation
        ? reservationAmount == null ? 'blocked-missing-reservation-amount-and-capacity' : 'structured-exact-reservation'
        : 'blocked-missing-cost-and-pool',
      evidence: 'structured-exact',
      sourceReferences: [
        ...(hasReservation || hasMultipleReservation ? [`damage-reference:${record.name}:skillTypes`] : []),
        ...numericEffects.map(effect => `damage-reference:${record.name}:numericStats.${effect.statId}`),
      ],
      detail: hasReservation || hasMultipleReservation
        ? reservationAmount == null
          ? `${reservationCount === 2 ? 'Mehrere Reservierungen sind' : 'Eine Reservierung ist'} strukturell belegt. Der genaue Betrag fehlt; Aktivität und Aufrechterhaltbarkeit werden nicht behauptet.`
          : `${reservationAmount} Geist Reservierung sind über die gepinnte Gem-zu-Fertigkeit-Kette exakt belegt.`
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
  const spiritReservations = input.setups
    .filter(setup => Boolean(setup.skillId))
    .map(setup => {
      const definition = input.skills.find(value => value.id === setup.skillId)
      const reservationAmount = definition && Number.isFinite(definition.spiritReservation)
        ? Number(definition.spiritReservation)
        : null
      return {
        setupId: setup.id,
        skillId: setup.skillId,
        skillName: definition?.displayNameDe ?? definition?.nameEn ?? setup.skillId,
        weaponSet: setup.weaponSet,
        reservationAmount,
        status: reservationAmount == null ? 'blocked-missing-exact-reservation' as const : 'structured-exact' as const,
        ...(definition?.sourceReference ? { sourceReference: definition.sourceReference } : {}),
      }
    })
    .filter(value => value.reservationAmount != null || sources.some(source => source.sourceSkillId === value.skillId && source.kind !== 'mana-interaction'))
    .sort((a, b) => a.setupId.localeCompare(b.setupId))
  const level = Number.isInteger(input.characterLevel) && Number(input.characterLevel) >= 1
    ? Math.min(100, Number(input.characterLevel))
    : undefined
  const flatLife = equipmentContributions.filter(value => value.resource === 'life').reduce((sum, value) => sum + value.value, 0)
  const flatMana = equipmentContributions.filter(value => value.resource === 'mana').reduce((sum, value) => sum + value.value, 0)
  const manaRegenIncrease = equipmentContributions
    .filter(value => value.resource === 'mana-regeneration' && /^mana_regeneration_rate_\+%$/.test(value.sourceStatId))
    .reduce((sum, value) => sum + value.value, 0)
  const confirmedMinimumPools = level == null ? undefined : (() => {
    const baseLife = reference.resourceConstants.lifePerLevel * (level + reference.resourceConstants.lifeLevelOffset)
    const baseMana = reference.resourceConstants.manaPerLevel * (level + reference.resourceConstants.manaLevelOffset)
    const life = Math.max(1, baseLife + flatLife)
    const mana = Math.max(0, baseMana + flatMana)
    const inherentPercentPerSecond = reference.resourceConstants.inherentManaRegenerationPercentPerMinute / 60 / 100
    const manaRegenerationPerSecond = Number((mana * inherentPercentPerSecond * (1 + manaRegenIncrease / 100)).toFixed(2))
    return { characterLevel: level, baseLife, baseMana, life, mana, manaRegenerationPerSecond, status: 'confirmed-minimum-only' as const }
  })()
  const flatEquipmentSpirit = equipmentContributions
    .filter(value => value.resource === 'spirit')
    .reduce((sum, value) => sum + value.value, 0)
  const spiritCapacityByWeaponSet = (['set-1', 'set-2'] as const).map(weaponSet => {
    const effects = passiveResourceEffects(input.passiveTree, input.realPassivePlanning, weaponSet)
    const noSpirit = effects.some(effect => effect.kind === 'no-spirit')
    const flatSpirit = effects.filter(effect => effect.kind === 'flat-spirit').reduce((sum, effect) => sum + effect.value, 0)
    const increasedSpirit = effects.filter(effect => effect.kind === 'spirit-increased').reduce((sum, effect) => sum + effect.value, 0)
      - effects.filter(effect => effect.kind === 'spirit-reduced').reduce((sum, effect) => sum + effect.value, 0)
    const lessSpirit = effects.filter(effect => effect.kind === 'spirit-less').reduce((value, effect) => value * (1 - effect.value / 100), 1)
    const confirmedMinimumCapacity = noSpirit
      ? 0
      : Math.max(0, Math.floor((flatEquipmentSpirit + flatSpirit) * (1 + increasedSpirit / 100) * lessSpirit))
    const activeReservations = spiritReservations.filter(value => value.weaponSet === 'both' || value.weaponSet === weaponSet)
    const complete = activeReservations.every(value => value.reservationAmount != null)
    const reservedSpirit = complete
      ? activeReservations.reduce((sum, value) => sum + (value.reservationAmount ?? 0), 0)
      : null
    return {
      weaponSet,
      confirmedMinimumCapacity,
      reservedSpirit,
      remainingSpirit: reservedSpirit == null ? null : confirmedMinimumCapacity - reservedSpirit,
      status: activeReservations.length === 0
        ? 'no-reservations' as const
        : !complete
          ? 'blocked-incomplete-reservation-chain' as const
          : (reservedSpirit ?? Number.POSITIVE_INFINITY) <= confirmedMinimumCapacity
            ? 'fits-confirmed-minimum' as const
            : 'exceeds-confirmed-minimum' as const,
      passiveResourceEffects: effects.filter(effect => [
        'flat-spirit', 'spirit-increased', 'spirit-reduced', 'spirit-less', 'no-spirit',
      ].includes(effect.kind)),
    }
  })
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
            resourceAdjustedAmount: Math.floor(baseAmount * combinedSupportMultiplier),
            sourceResource,
          }]
        }).sort((a, b) => a.sourceResource.localeCompare(b.sourceResource))
        : []
      const exactCostChain = baseCostStatus !== 'blocked-missing-exact-base-cost'
        && supportMultiplierStatus !== 'blocked-missing-exact-support-cost-multipliers'
      const appliedPassiveEffects = passiveResourceEffects(input.passiveTree, input.realPassivePlanning, setup.weaponSet)
      const flatPassiveMana = appliedPassiveEffects.filter(effect => effect.kind === 'flat-mana').reduce((sum, effect) => sum + effect.value, 0)
      const maximumManaIncrease = appliedPassiveEffects.filter(effect => effect.kind === 'maximum-mana-increased').reduce((sum, effect) => sum + effect.value, 0)
        - appliedPassiveEffects.filter(effect => effect.kind === 'maximum-mana-reduced').reduce((sum, effect) => sum + effect.value, 0)
      const maximumManaLessMultiplier = appliedPassiveEffects.filter(effect => effect.kind === 'maximum-mana-less').reduce((value, effect) => value * (1 - effect.value / 100), 1)
      const passiveManaRegenIncrease = appliedPassiveEffects.filter(effect => effect.kind === 'mana-regeneration-increased').reduce((sum, effect) => sum + effect.value, 0)
      const noMana = appliedPassiveEffects.some(effect => effect.kind === 'no-mana')
      const noInherentManaRegeneration = appliedPassiveEffects.some(effect => effect.kind === 'no-inherent-mana-regeneration')
      const confirmedFlatSpiritContribution = appliedPassiveEffects.filter(effect => effect.kind === 'flat-spirit').reduce((sum, effect) => sum + effect.value, 0)
      const combinedResourceCostMultiplier = floorFour(
        (1 + appliedPassiveEffects.filter(effect => effect.kind === 'mana-cost-increased').reduce((sum, effect) => sum + effect.value, 0) / 100)
        * appliedPassiveEffects.filter(effect => effect.kind === 'mana-cost-more').reduce((value, effect) => value * (1 + effect.value / 100), 1)
        * appliedPassiveEffects.filter(effect => effect.kind === 'mana-cost-doubled').reduce(value => value * 2, 1),
      )
      const effectiveManaPool = confirmedMinimumPools
        ? noMana ? 0 : Math.max(0, Math.floor((confirmedMinimumPools.mana + flatPassiveMana) * (1 + maximumManaIncrease / 100) * maximumManaLessMultiplier))
        : null
      const effectiveManaRegenerationPerSecond = effectiveManaPool == null
        ? null
        : noInherentManaRegeneration || noMana
          ? 0
          : Number((effectiveManaPool * (reference.resourceConstants.inherentManaRegenerationPercentPerMinute / 60 / 100) * (1 + (manaRegenIncrease + passiveManaRegenIncrease) / 100)).toFixed(2))
      for (const cost of baseCosts) cost.resourceAdjustedAmount = cost.resource === 'mana' || cost.resource === 'mana-percent'
        ? Math.floor(cost.supportAdjustedAmount * combinedResourceCostMultiplier)
        : cost.supportAdjustedAmount
      const actionFrequencyPerSecond = record?.kind === 'spell' && record.castTime > 0
        ? Number((1 / record.castTime).toFixed(4))
        : record?.kind === 'other' ? 1 : null
      const manaDemandPerSecond = exactCostChain && effectiveManaPool != null
        ? baseCosts.reduce<number | null>((sum, cost) => {
          if (sum == null || cost.resource === 'rage') return sum
          if (cost.resource === 'mana-percent') return sum + effectiveManaPool * cost.resourceAdjustedAmount / 100
          if (cost.cadence === 'per-second') return sum + cost.resourceAdjustedAmount
          return actionFrequencyPerSecond == null ? null : sum + cost.resourceAdjustedAmount * actionFrequencyPerSecond
        }, 0)
        : null
      const largestManaCost = Math.max(0, ...baseCosts.filter(cost => cost.resource === 'mana').map(cost => cost.resourceAdjustedAmount))
      const sustainStatus = !exactCostChain
        ? 'blocked-missing-exact-cost-chain' as const
        : !confirmedMinimumPools
          ? 'blocked-missing-character-level' as const
          : noMana && baseCosts.some(cost => cost.resource === 'mana' || cost.resource === 'mana-percent')
            ? 'unusable-confirmed-zero-mana' as const
          : manaDemandPerSecond == null
            ? 'blocked-missing-action-frequency' as const
            : manaDemandPerSecond <= (effectiveManaRegenerationPerSecond ?? 0)
              ? 'sustainable-on-confirmed-minimum' as const
              : largestManaCost <= (effectiveManaPool ?? 0)
                ? 'burst-affordable-on-confirmed-minimum' as const
                : 'blocked-missing-action-frequency' as const
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
        passiveResourceEffects: appliedPassiveEffects,
        combinedSupportMultiplier,
        combinedResourceCostMultiplier,
        effectiveManaPool,
        effectiveManaRegenerationPerSecond,
        confirmedFlatSpiritContribution,
        baseCostStatus,
        supportMultiplierStatus,
        poolStatus: confirmedMinimumPools
          ? appliedPassiveEffects.length ? 'confirmed-pool-with-passive-effects' as const : 'confirmed-minimum-pool' as const
          : 'blocked-missing-character-level' as const,
        sustainStatus,
        actionFrequencyPerSecond,
        manaDemandPerSecond: manaDemandPerSecond == null ? null : Number(manaDemandPerSecond.toFixed(2)),
      }
    })
    .sort((a, b) => a.setupId.localeCompare(b.setupId))
  return {
    modelVersion: RESOURCE_SPIRIT_MODEL_VERSION,
    productive: Boolean(
      (confirmedMinimumPools && skillCostChains.some(chain => chain.sustainStatus === 'sustainable-on-confirmed-minimum'))
      || spiritCapacityByWeaponSet.some(value => value.status === 'fits-confirmed-minimum'),
    ),
    manaPoolKnown: false,
    lifePoolKnown: false,
    spiritCapacityKnown: false,
    exactSkillCostsKnown: skillCostChains.length > 0 && skillCostChains.every(chain =>
      chain.baseCostStatus !== 'blocked-missing-exact-base-cost'
      && chain.supportMultiplierStatus !== 'blocked-missing-exact-support-cost-multipliers'),
    ...(confirmedMinimumPools ? { confirmedMinimumPools } : {}),
    sources,
    equipmentContributions,
    skillCostChains,
    spiritReservations,
    spiritCapacityByWeaponSet,
    semanticSupportCostHints,
    limitations: [
      'Der bestätigte Mindestpool verwendet Charakterlevel, gepinnte Grundwerte und eindeutig erkannte flache Ausrüstungsbeiträge. Nicht vollständig transportierte Passive-, Aszendenz- und bedingte Wirkungen werden nicht erfunden.',
      'Exakte Geistreservierungen werden über die gepinnte Gem-zu-Fertigkeit-Kette verbunden. Die bestätigte Mindestkapazität enthält nur eindeutig erfasste Ausrüstungs-, Passive- und Aszendenzbeiträge; nicht transportierter Quest-Geist wird nicht erfunden.',
      'Fertigkeits-Grundkosten auf Stufe 20 und Support-Kostenmultiplikatoren werden nur über die gepinnten strukturierten Quellen verbunden; fehlende Kostenketten bleiben blockiert.',
      'Unbedingte, exakt lesbare Mana-, Regenerations-, Kosten- und Geistwirkungen vergebener Passive- und Aszendenzknoten werden waffensetspezifisch angewandt. Bedingte Texte und Kosten-Effizienz bleiben fail-closed.',
      'Dauerhafte Nutzbarkeit wird nur positiv bestätigt, wenn bereits die konservative Mindest-Manaregeneration den belegten Verbrauch deckt. Ein negatives Urteil wird aus dem Mindestpool nicht abgeleitet.',
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
    passiveResourceEffects: value.passiveResourceEffects.map(effect => ({ ...effect })),
  })),
  spiritReservations: model.spiritReservations.map(value => ({ ...value })),
  spiritCapacityByWeaponSet: model.spiritCapacityByWeaponSet.map(value => ({
    ...value,
    passiveResourceEffects: value.passiveResourceEffects.map(effect => ({ ...effect })),
  })),
  semanticSupportCostHints: model.semanticSupportCostHints.map(value => ({ ...value })),
  limitations: [...model.limitations],
})
