import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain'
import type { DamageComponent } from './types'

export const DAMAGING_AILMENT_MODEL_VERSION = '1.0.0'

type AilmentKind = 'bleeding' | 'poison' | 'ignite'
type NumericStats = Partial<Record<string, number>>

interface NumericRecord {
  sourceRecordId: string
  name: string
  numericStats: NumericStats
}

export interface ResolvedDamagingAilment {
  sourceRecordId: string
  sourceLabel: string
  kind: Exclude<AilmentKind, 'ignite'>
  damageType: 'physical' | 'chaos'
  status: 'sustained-exact-input-chain'
  chancePercent: number
  durationMs: number
  maximumStacks: number
  expectedActiveStacks: number
  damagePerSecond: number
  totalDamagePerApplication: number
  effectMultiplier: number
  sourceReferences: string[]
  evidence: 'structured-exact'
  detail: string
}

export interface BlockedDamagingAilment {
  sourceRecordId: string
  sourceLabel: string
  kind: AilmentKind
  status: 'blocked'
  sourceReferences: string[]
  evidence: 'incomplete-identity-chain'
  detail: string
}

export interface DamagingAilmentResult {
  modelVersion: string
  effects: ResolvedDamagingAilment[]
  blockedEffects: BlockedDamagingAilment[]
  totalSustainedDamagePerSecond?: number
  limitations: string[]
}

const supportByName = new Map(
  reference.supports.map(record => [record.name.toLocaleLowerCase('en'), record as unknown as NumericRecord]),
)

const round = (value: number) => Number(value.toFixed(2))
const isFiniteNumber = (value: number | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value)
const valuesFor = (stats: NumericStats[], stat: string) =>
  stats.flatMap(values => {
    const value = values[stat]
    return isFiniteNumber(value) ? [value] : []
  })
const sum = (stats: NumericStats[], stat: string) =>
  valuesFor(stats, stat).reduce((total, value) => total + value, 0)
const productMore = (values: number[]) =>
  values.reduce((multiplier, percent) => multiplier * (1 + percent / 100), 1)

function selectedSupportRecords(setup: SkillSetup | undefined, supports: SupportGemDefinition[]) {
  const selected = new Set(setup?.supportGemIds ?? [])
  return supports
    .filter(support => selected.has(support.id) && support.nameEn)
    .map(support => supportByName.get(support.nameEn!.toLocaleLowerCase('en')))
    .filter((record): record is NumericRecord => Boolean(record))
}

function componentRange(components: DamageComponent[], types: DamageComponent['type'][]) {
  return components
    .filter(component => types.includes(component.type))
    .reduce(
      (range, component) => ({
        minimum: range.minimum + component.minimum,
        maximum: range.maximum + component.maximum,
      }),
      { minimum: 0, maximum: 0 },
    )
}

function weightedRoll(stacks: number, maximumStacks: number) {
  return stacks / maximumStacks > 1
    ? (stacks - (maximumStacks - 1) / 2) / (stacks + 1)
    : 0.5
}

export function collectDamagingAilments(input: {
  skill: NumericRecord
  components: DamageComponent[]
  actionsPerSecond: number
  hitChancePercent?: number
  setup?: SkillSetup
  supports: SupportGemDefinition[]
}): DamagingAilmentResult {
  const supportRecords = selectedSupportRecords(input.setup, input.supports)
  const allStats = [input.skill.numericStats, ...supportRecords.map(record => record.numericStats)]
  const effects: ResolvedDamagingAilment[] = []
  const blockedEffects: BlockedDamagingAilment[] = []

  const definitions = [
    {
      kind: 'bleeding' as const,
      damageType: 'physical' as const,
      sourceTypes: ['physical'] as DamageComponent['type'][],
      chanceStat: 'base_chance_to_inflict_bleeding_%',
      basePercentPerSecond: 0.15,
      durationMs: 5000,
      effectStats: ['active_skill_bleeding_effect_+%_final', 'support_deep_cuts_bleeding_effect_+%_final'],
      durationStats: [] as string[],
    },
    {
      kind: 'poison' as const,
      damageType: 'chaos' as const,
      sourceTypes: ['physical', 'chaos'] as DamageComponent['type'][],
      chanceStat: 'base_chance_to_poison_on_hit_%',
      basePercentPerSecond: 0.2,
      durationMs: 2000,
      effectStats: ['support_deadly_poison_poison_effect_+%_final'],
      durationStats: ['support_multi_poison_poison_duration_+%_final'],
    },
  ]

  for (const definition of definitions) {
    const chancePercent = Math.min(100, Math.max(0, sum(allStats, definition.chanceStat)))
    if (chancePercent <= 0) continue
    const range = componentRange(input.components, definition.sourceTypes)
    if (
      range.maximum <= 0
      || !Number.isFinite(input.actionsPerSecond)
      || input.actionsPerSecond <= 0
      || !isFiniteNumber(input.hitChancePercent)
    ) {
      blockedEffects.push({
        sourceRecordId: input.skill.sourceRecordId,
        sourceLabel: input.skill.name,
        kind: definition.kind,
        status: 'blocked',
        sourceReferences: [definition.chanceStat],
        evidence: 'incomplete-identity-chain',
        detail: 'Die Auslösechance ist belegt, aber relevanter ungeminderter Trefferschaden, Wirkfrequenz oder Trefferchance fehlt.',
      })
      continue
    }
    const durationMultiplier = productMore(
      definition.durationStats.flatMap(stat =>
        valuesFor(allStats, stat),
      ),
    )
    const durationMs = definition.durationMs * durationMultiplier
    const maximumStacks = definition.kind === 'poison'
      ? 1 + Math.max(0, sum(allStats, 'number_of_additional_poison_stacks'))
      : 1
    const applicationStacks = input.actionsPerSecond
      * durationMs / 1000
      * chancePercent / 100
      * input.hitChancePercent / 100
    const expectedActiveStacks = Math.min(applicationStacks, maximumStacks)
    const roll = weightedRoll(applicationStacks, maximumStacks)
    const sourceDamage = range.minimum + (range.maximum - range.minimum) * roll
    const genericEffect = valuesFor(allStats, 'active_skill_damaging_ailment_effect_+%_final')
    const specificEffect = definition.effectStats.flatMap(stat =>
      valuesFor(allStats, stat),
    )
    const effectMultiplier = productMore([...genericEffect, ...specificEffect])
    const singleStackDps = sourceDamage * definition.basePercentPerSecond * effectMultiplier
    const damagePerSecond = singleStackDps * expectedActiveStacks
    const sourceReferences = [
      definition.chanceStat,
      ...definition.effectStats.filter(stat => allStats.some(stats => Number.isFinite(stats[stat]))),
      ...definition.durationStats.filter(stat => allStats.some(stats => Number.isFinite(stats[stat]))),
      ...(definition.kind === 'poison' && maximumStacks > 1 ? ['number_of_additional_poison_stacks'] : []),
    ]
    effects.push({
      sourceRecordId: input.skill.sourceRecordId,
      sourceLabel: input.skill.name,
      kind: definition.kind,
      damageType: definition.damageType,
      status: 'sustained-exact-input-chain',
      chancePercent,
      durationMs: round(durationMs),
      maximumStacks,
      expectedActiveStacks: round(expectedActiveStacks),
      damagePerSecond: round(Math.min(damagePerSecond, 35_791_394)),
      totalDamagePerApplication: round(singleStackDps * durationMs / 1000),
      effectMultiplier: round(effectMultiplier),
      sourceReferences,
      evidence: 'structured-exact',
      detail: 'PoB2-Grundwert, Auslösechance, relevante ungeminderte Schadensarten, Wirkfrequenz, Dauer, Effekt und Stapelgrenze sind strukturiert verbunden.',
    })
  }

  const igniteReferences = [
    'active_skill_ignite_chance_+%_final',
    'support_ignition_chance_to_ignite_+%_final',
  ].filter(stat => allStats.some(stats => Number.isFinite(stats[stat])))
  if (igniteReferences.length) {
    blockedEffects.push({
      sourceRecordId: input.skill.sourceRecordId,
      sourceLabel: input.skill.name,
      kind: 'ignite',
      status: 'blocked',
      sourceReferences: igniteReferences,
      evidence: 'incomplete-identity-chain',
      detail: 'Der Modifikator der Entzündungswahrscheinlichkeit ist vorhanden; die gegnerabhängige Ailment-Schwelle und vollständige Buildup-Kette fehlen jedoch. Es wird kein Entzündungs-DPS erfunden.',
    })
  }

  return {
    modelVersion: DAMAGING_AILMENT_MODEL_VERSION,
    effects,
    blockedEffects,
    ...(effects.length
      ? { totalSustainedDamagePerSecond: round(effects.reduce((total, effect) => total + effect.damagePerSecond, 0)) }
      : {}),
    limitations: [
      'Zaubertreffer werden derzeit mit 100 % Trefferchance modelliert; Angriffe bleiben bis zur vollständigen Accuracy-Gegnerkette gesperrt.',
      'Kritische Ailment-Sonderfälle, Aggravation, gegnerische DoT-Widerstände und bedingte Effekte bleiben ausgeschlossen.',
      'Entzünden bleibt ohne gegnerabhängige Ailment-Schwelle und vollständige Buildup-Kette fail-closed.',
    ],
  }
}
