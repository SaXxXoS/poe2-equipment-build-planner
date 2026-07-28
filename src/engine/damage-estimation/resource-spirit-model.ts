import reference from '../../../generated/pob2/damage-reference.json'
import type { EquipmentEntry, SkillGemDefinition, SkillSetup, SupportGemDefinition } from '../../domain'
import type { DamageEstimate } from './types'

export const RESOURCE_SPIRIT_MODEL_VERSION = '2.0.0'

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
  baseCostStatus: 'blocked-missing-exact-base-cost'
  supportMultiplierStatus: 'blocked-missing-exact-support-cost-multipliers'
  poolStatus: 'blocked-missing-complete-character-pool'
  sustainStatus: 'blocked-incomplete-cost-pool-and-recovery-chain'
}

export interface ResourceSpiritModel {
  modelVersion: string
  productive: false
  manaPoolKnown: false
  lifePoolKnown: false
  spiritCapacityKnown: false
  exactSkillCostsKnown: false
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
      return {
        setupId: setup.id,
        skillId: setup.skillId,
        skillName: definition?.displayNameDe ?? definition?.nameEn ?? setup.skillId,
        weaponSet: setup.weaponSet,
        selectedSupportIds: [...setup.supportGemIds].sort(),
        semanticSupportCostHints: setup.supportGemIds
          .flatMap(id => supportHintById.has(id) ? [supportHintById.get(id)!] : [])
          .sort((a, b) => a - b),
        baseCostStatus: 'blocked-missing-exact-base-cost' as const,
        supportMultiplierStatus: 'blocked-missing-exact-support-cost-multipliers' as const,
        poolStatus: 'blocked-missing-complete-character-pool' as const,
        sustainStatus: 'blocked-incomplete-cost-pool-and-recovery-chain' as const,
      }
    })
    .sort((a, b) => a.setupId.localeCompare(b.setupId))
  return {
    modelVersion: RESOURCE_SPIRIT_MODEL_VERSION,
    productive: false,
    manaPoolKnown: false,
    lifePoolKnown: false,
    spiritCapacityKnown: false,
    exactSkillCostsKnown: false,
    sources,
    equipmentContributions,
    skillCostChains,
    semanticSupportCostHints,
    limitations: [
      'Belegte Ausrüstungsbeiträge werden einzeln transportiert, ergeben ohne Charaktergrundwert, Attribute und weitere globale Wirkungen aber keinen vollständigen Lebens-, Mana- oder Geistpool.',
      'Der gepinnte Fertigkeitsbestand enthält Reservierungsmarker, aber keine allgemeine geschlossene Kette aus Reservierungsbetrag und verfügbarer Geistkapazität.',
      'Semantische Support-Ressourcenkosten steuern ausschließlich das bestehende Ranking und werden nicht als Mana-, Lebens- oder Geistkosten ausgegeben.',
      'Ohne exakte Grundkosten, Support-Kostenmultiplikatoren, vollständigen Ressourcenpool und Wiederherstellung verändert dieses Modell weder Wirkfrequenz noch Schaden pro Sekunde.',
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
  })),
  semanticSupportCostHints: model.semanticSupportCostHints.map(value => ({ ...value })),
  limitations: [...model.limitations],
})
