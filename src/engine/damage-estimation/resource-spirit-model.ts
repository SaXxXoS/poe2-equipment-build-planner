import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillGemDefinition, SkillSetup, SupportGemDefinition } from '../../domain'
import type { DamageEstimate } from './types'

export const RESOURCE_SPIRIT_MODEL_VERSION = '1.0.0'

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

export interface ResourceSpiritModel {
  modelVersion: string
  productive: false
  manaPoolKnown: false
  lifePoolKnown: false
  spiritCapacityKnown: false
  exactSkillCostsKnown: false
  sources: ResolvedResourceSpiritSource[]
  semanticSupportCostHints: Array<{ supportId: string; value: number }>
  limitations: string[]
}

export function resolveResourceSpiritModel(input: {
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
  return {
    modelVersion: RESOURCE_SPIRIT_MODEL_VERSION,
    productive: false,
    manaPoolKnown: false,
    lifePoolKnown: false,
    spiritCapacityKnown: false,
    exactSkillCostsKnown: false,
    sources,
    semanticSupportCostHints,
    limitations: [
      'Der BuildProfile-Transport enthält keine vollständigen aktuellen Mana-, Lebens- oder Geistkapazitäten und keine Regenerationsraten.',
      'Der gepinnte Fertigkeitsbestand enthält Reservierungsmarker, aber keine allgemeine geschlossene Kette aus Reservierungsbetrag und verfügbarer Geistkapazität.',
      'Semantische Support-Ressourcenkosten steuern ausschließlich das bestehende Ranking und werden nicht als Mana- oder Lebenskosten ausgegeben.',
      'Ohne exakte Kosten, Ressourcenpool und Wiederherstellung verändert dieses Modell weder Wirkfrequenz noch Schaden pro Sekunde.',
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
  semanticSupportCostHints: model.semanticSupportCostHints.map(value => ({ ...value })),
  limitations: [...model.limitations],
})
