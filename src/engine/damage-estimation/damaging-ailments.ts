import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain'
import type { DamageComponent, EnemyMitigationProfile } from './types'
import { enemyDamageTakenMultiplier } from './enemy-damage-taken'
import type { BleedingPassiveEffect } from './bleeding-passive-effects'
import type { DamagingAilmentRateEffects } from './ailment-rate-effects'

export const DAMAGING_AILMENT_MODEL_VERSION = '2.8.0'

type AilmentKind = 'bleeding' | 'poison' | 'ignite'
type NumericStats = Partial<Record<string, number>>

interface NumericRecord {
  sourceRecordId: string
  name: string
  kind?: string
  numericStats: NumericStats
}

export interface ResolvedDamagingAilment {
  sourceRecordId: string
  sourceLabel: string
  kind: AilmentKind
  damageType: 'physical' | 'chaos' | 'fire'
  status: 'sustained-exact-input-chain'
  chancePercent: number
  durationMs: number
  maximumStacks: number
  expectedActiveStacks: number
  damagePerSecond: number
  damagePerSecondAfterMitigation?: number
  totalDamagePerApplication: number
  effectMultiplier: number
  rateMultiplier: number
  aggravated?: boolean
  chanceOnHitPercent?: number
  chanceOnCriticalHitPercent?: number
  ailmentCriticalChancePercent?: number
  weightedSourceDamage?: number
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
  totalSustainedDamagePerSecondAfterMitigation?: number
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
const durationMultiplier = (
  stats: NumericStats[],
  increasedStats: string[],
  finalStats: string[],
) => Math.max(0, 1 + increasedStats.reduce((total, stat) => total + sum(stats, stat), 0) / 100)
  * productMore(finalStats.flatMap(stat => valuesFor(stats, stat)))

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
  enemyLevel?: number
  enemyProfile?: EnemyMitigationProfile
  bleedingPassiveEffect?: BleedingPassiveEffect
  criticalChancePercent?: number
  criticalHitDamageMultiplier?: number
  bleedingChanceOnCriticalHitPercent?: number
  poisonChanceOnCriticalHitPercent?: number
  conditionalAilmentSourceReferences?: string[]
  aggravateBleedingOnCriticalAttack?: boolean
  rateEffects?: DamagingAilmentRateEffects
}): DamagingAilmentResult {
  const supportRecords = selectedSupportRecords(input.setup, input.supports)
  const allStats = [input.skill.numericStats, ...supportRecords.map(record => record.numericStats)]
  const effects: ResolvedDamagingAilment[] = []
  const blockedEffects: BlockedDamagingAilment[] = []
  const criticalChance = Math.max(0, Math.min(100, input.criticalChancePercent ?? 0)) / 100
  const criticalHitDamageMultiplier = Math.max(1, input.criticalHitDamageMultiplier ?? 1)

  const definitions = [
    {
      kind: 'bleeding' as const,
      damageType: 'physical' as const,
      sourceTypes: ['physical'] as DamageComponent['type'][],
      chanceStat: 'base_chance_to_inflict_bleeding_%',
      basePercentPerSecond: reference.ailmentConstants.bleedingHitDamagePercentPerMinute / 60 / 100,
      durationMs: reference.ailmentConstants.baseBleedingDurationSeconds * 1000,
      effectStats: ['active_skill_bleeding_effect_+%_final', 'support_deep_cuts_bleeding_effect_+%_final'],
      durationIncreasedStats: [] as string[],
      durationFinalStats: ['support_swift_affliction_skill_effect_and_damaging_ailment_duration_+%_final'],
      chanceOnCriticalHitPercent: input.bleedingChanceOnCriticalHitPercent,
    },
    {
      kind: 'poison' as const,
      damageType: 'chaos' as const,
      sourceTypes: ['physical', 'chaos'] as DamageComponent['type'][],
      chanceStat: 'base_chance_to_poison_on_hit_%',
      basePercentPerSecond: reference.ailmentConstants.poisonHitDamagePercentPerMinute / 60 / 100,
      durationMs: reference.ailmentConstants.basePoisonDurationSeconds * 1000,
      effectStats: ['support_deadly_poison_poison_effect_+%_final'],
      durationIncreasedStats: [] as string[],
      durationFinalStats: [
        'support_multi_poison_poison_duration_+%_final',
        'support_swift_affliction_skill_effect_and_damaging_ailment_duration_+%_final',
      ],
      chanceOnCriticalHitPercent: input.poisonChanceOnCriticalHitPercent,
    },
  ]

  for (const definition of definitions) {
    const chanceOnHitPercent = Math.min(100, Math.max(0, sum(allStats, definition.chanceStat)))
    const chanceOnCriticalHitPercent = Math.min(
      100,
      Math.max(0, definition.chanceOnCriticalHitPercent ?? chanceOnHitPercent),
    )
    const chancePercent = chanceOnHitPercent * (1 - criticalChance)
      + chanceOnCriticalHitPercent * criticalChance
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
    const resolvedDurationMultiplier = durationMultiplier(
      allStats,
      definition.durationIncreasedStats,
      definition.durationFinalStats,
    )
    const bleedingPassiveEffect = definition.kind === 'bleeding' ? input.bleedingPassiveEffect : undefined
    const fasterPercent = input.rateEffects?.fasterPercent[definition.kind] ?? 0
    const slowerPercent = input.rateEffects?.slowerPercent[definition.kind] ?? 0
    const rateMultiplier = Math.max(0.01, (1 + fasterPercent / 100) / Math.max(0.01, 1 + slowerPercent / 100))
    const durationMs = (bleedingPassiveEffect?.durationMs ?? definition.durationMs) * resolvedDurationMultiplier / rateMultiplier
    const maximumStacks = definition.kind === 'poison'
      ? 1 + Math.max(0, sum(allStats, 'number_of_additional_poison_stacks'))
      : 1
    const applicationStacks = input.actionsPerSecond
      * durationMs / 1000
      * chancePercent / 100
      * input.hitChancePercent / 100
    const expectedActiveStacks = Math.min(applicationStacks, maximumStacks)
    const roll = weightedRoll(applicationStacks, maximumStacks)
    const nonCriticalSourceDamage = range.minimum + (range.maximum - range.minimum) * roll
    const criticalSourceDamage = nonCriticalSourceDamage * criticalHitDamageMultiplier
    const chanceFromHit = chanceOnHitPercent * (1 - criticalChance)
    const chanceFromCriticalHit = chanceOnCriticalHitPercent * criticalChance
    const conditionalCriticalAggravation = definition.kind === 'bleeding'
      && input.skill.kind === 'attack'
      && input.aggravateBleedingOnCriticalAttack === true
      && !bleedingPassiveEffect
    const criticalAilmentDamageMultiplier = conditionalCriticalAggravation
      ? reference.ailmentConstants.bloodstainedMultiplierWhenMovingOrBleedingAggravated
      : 1
    const sourceDamage = chanceFromHit + chanceFromCriticalHit > 0
      ? (nonCriticalSourceDamage * chanceFromHit + criticalSourceDamage * criticalAilmentDamageMultiplier * chanceFromCriticalHit)
        / (chanceFromHit + chanceFromCriticalHit)
      : nonCriticalSourceDamage
    const ailmentCriticalChance = 1 - Math.pow(1 - criticalChance, Math.max(applicationStacks, 1))
    const genericEffect = valuesFor(allStats, 'active_skill_damaging_ailment_effect_+%_final')
    const specificEffect = definition.effectStats.flatMap(stat =>
      valuesFor(allStats, stat),
    )
    const effectMultiplier = productMore([...genericEffect, ...specificEffect])
      * (bleedingPassiveEffect?.magnitudeMultiplier ?? 1)
      * (bleedingPassiveEffect?.aggravatedMultiplier ?? 1)
    const singleStackDps = sourceDamage * definition.basePercentPerSecond * effectMultiplier
    const damagePerSecond = singleStackDps * rateMultiplier * expectedActiveStacks
    const sourceReferences = [
      definition.chanceStat,
      definition.kind === 'bleeding' ? 'BleedingHitDamagePercentPerMinute' : 'PoisonHitDamagePercentPerMinute',
      definition.kind === 'bleeding' ? 'BaseBleedingDuration' : 'BasePoisonDuration',
      ...definition.effectStats.filter(stat => allStats.some(stats => Number.isFinite(stats[stat]))),
      ...definition.durationIncreasedStats.filter(stat => allStats.some(stats => Number.isFinite(stats[stat]))),
      ...definition.durationFinalStats.filter(stat => allStats.some(stats => Number.isFinite(stats[stat]))),
      ...(definition.kind === 'poison' && maximumStacks > 1 ? ['number_of_additional_poison_stacks'] : []),
      ...(bleedingPassiveEffect?.sourceReferences ?? []),
      ...(criticalChance > 0 ? ['CalcOffence.calcAilmentDamage', 'CalcOffence.ailmentCritChance'] : []),
      ...(definition.chanceOnCriticalHitPercent != null ? input.conditionalAilmentSourceReferences ?? [] : []),
      ...(conditionalCriticalAggravation ? input.conditionalAilmentSourceReferences ?? [] : []),
    ]
    const resistance = definition.damageType === 'physical'
      ? 0
      : Math.max(-100, Math.min(90,
          (input.enemyProfile?.resistances?.[definition.damageType] ?? 0)
          - Math.max(0, input.enemyProfile?.resistanceReduction?.[definition.damageType] ?? 0),
        ))
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
      ...(input.enemyProfile
        ? { damagePerSecondAfterMitigation: round(Math.min(damagePerSecond * (1 - resistance / 100) * enemyDamageTakenMultiplier(definition.damageType, input.enemyProfile), 35_791_394)) }
        : {}),
      totalDamagePerApplication: round(singleStackDps * rateMultiplier * durationMs / 1000),
      effectMultiplier: round(effectMultiplier),
      rateMultiplier: round(rateMultiplier),
      ...(bleedingPassiveEffect || conditionalCriticalAggravation ? { aggravated: true } : {}),
      chanceOnHitPercent: round(chanceOnHitPercent),
      chanceOnCriticalHitPercent: round(chanceOnCriticalHitPercent),
      ailmentCriticalChancePercent: round(ailmentCriticalChance * 100),
      weightedSourceDamage: round(sourceDamage),
      sourceReferences: [...sourceReferences, ...(input.rateEffects?.sourceReferences[definition.kind] ?? [])],
      evidence: 'structured-exact',
      detail: 'PoB2-Grundwert, Auslösechance, relevante ungeminderte Schadensarten, Wirkfrequenz, Dauer, Effekt und Stapelgrenze sind strukturiert verbunden.',
    })
  }

  const fireRange = componentRange(input.components, ['fire'])
  const enemyLevel = isFiniteNumber(input.enemyLevel)
    ? Math.max(1, Math.min(reference.monsterAilmentThresholdTable.length, Math.trunc(input.enemyLevel)))
    : undefined
  if (fireRange.maximum > 0 && enemyLevel != null && input.actionsPerSecond > 0 && isFiniteNumber(input.hitChancePercent)) {
    const threshold = reference.monsterAilmentThresholdTable[enemyLevel - 1]
    const flatChance = sum(allStats, 'base_chance_to_ignite_%')
    const chanceIncrease = sum(allStats, 'active_skill_ignite_chance_+%_final')
      + sum(allStats, 'support_ignition_chance_to_ignite_+%_final')
    const averageFireHit = (fireRange.minimum + fireRange.maximum) / 2
    const averageCriticalFireHit = averageFireHit * criticalHitDamageMultiplier
    const chanceOnHitPercent = Math.min(
      100,
      Math.max(0, (averageFireHit / threshold * reference.ailmentConstants.igniteChanceMultiplier + flatChance) * (1 + chanceIncrease / 100)),
    )
    const chanceOnCriticalHitPercent = Math.min(
      100,
      Math.max(0, (averageCriticalFireHit / threshold * reference.ailmentConstants.igniteChanceMultiplier + flatChance) * (1 + chanceIncrease / 100)),
    )
    const chancePercent = chanceOnHitPercent * (1 - criticalChance) + chanceOnCriticalHitPercent * criticalChance
    if (chancePercent > 0) {
      const igniteDurationIncreasedStats = ['ignite_duration_+%']
      const igniteDurationFinalStats = [
        'active_skill_ignite_duration_+%_final',
        'support_swift_affliction_skill_effect_and_damaging_ailment_duration_+%_final',
      ]
      const igniteRateFaster = input.rateEffects?.fasterPercent.ignite ?? 0
      const igniteRateSlower = input.rateEffects?.slowerPercent.ignite ?? 0
      const rateMultiplier = Math.max(0.01, (1 + igniteRateFaster / 100) / Math.max(0.01, 1 + igniteRateSlower / 100))
      const durationMs = reference.ailmentConstants.baseIgniteDurationSeconds * 1000 * durationMultiplier(
        allStats,
        igniteDurationIncreasedStats,
        igniteDurationFinalStats,
      ) / rateMultiplier
      const basePercentPerSecond = reference.ailmentConstants.igniteHitDamagePercentPerMinute / 60 / 100
      const stackPotential = input.actionsPerSecond * durationMs / 1000 * chancePercent / 100 * input.hitChancePercent / 100
      const expectedActiveStacks = Math.min(stackPotential, 1)
      const ailmentCriticalChance = 1 - Math.pow(1 - criticalChance, Math.max(stackPotential, 1))
      const chanceFromHit = chanceOnHitPercent * (1 - criticalChance)
      const chanceFromCriticalHit = chanceOnCriticalHitPercent * criticalChance
      const weightedFireHit = chanceFromHit + chanceFromCriticalHit > 0
        ? (averageFireHit * chanceFromHit + averageCriticalFireHit * chanceFromCriticalHit)
          / (chanceFromHit + chanceFromCriticalHit)
        : averageFireHit
      const igniteEffectStats = [
        'active_skill_damaging_ailment_effect_+%_final',
        'active_skill_ignite_effect_+%_final',
        'support_stronger_ignites_ignite_effect_+%_final',
      ]
      const effectMultiplier = productMore(igniteEffectStats.flatMap(stat => valuesFor(allStats, stat)))
      const singleStackDps = weightedFireHit * basePercentPerSecond * effectMultiplier
      const resistance = Math.max(-100, Math.min(90,
        (input.enemyProfile?.resistances?.fire ?? 0)
        - Math.max(0, input.enemyProfile?.resistanceReduction?.fire ?? 0),
      ))
      effects.push({
        sourceRecordId: input.skill.sourceRecordId,
        sourceLabel: input.skill.name,
        kind: 'ignite',
        damageType: 'fire',
        status: 'sustained-exact-input-chain',
        chancePercent: round(chancePercent),
        durationMs,
        maximumStacks: 1,
        expectedActiveStacks: round(expectedActiveStacks),
        damagePerSecond: round(Math.min(singleStackDps * rateMultiplier * expectedActiveStacks, 35_791_394)),
        ...(input.enemyProfile
          ? { damagePerSecondAfterMitigation: round(Math.min(singleStackDps * rateMultiplier * expectedActiveStacks * (1 - resistance / 100), 35_791_394)) }
          : {}),
        totalDamagePerApplication: round(singleStackDps * rateMultiplier * durationMs / 1000),
        effectMultiplier: round(effectMultiplier),
        rateMultiplier: round(rateMultiplier),
        chanceOnHitPercent: round(chanceOnHitPercent),
        chanceOnCriticalHitPercent: round(chanceOnCriticalHitPercent),
        ailmentCriticalChancePercent: round(ailmentCriticalChance * 100),
        weightedSourceDamage: round(weightedFireHit),
        sourceReferences: [
          `monsterAilmentThresholdTable[${enemyLevel}]`,
          'IgniteChanceMultiplier',
          'IgniteHitDamagePercentPerMinute',
          'BaseIgniteDuration',
          ...igniteDurationIncreasedStats.filter(stat => allStats.some(stats => Number.isFinite(stats[stat]))),
          ...igniteDurationFinalStats.filter(stat => allStats.some(stats => Number.isFinite(stats[stat]))),
          ...igniteEffectStats.filter(stat => allStats.some(stats => Number.isFinite(stats[stat]))),
          ...(input.rateEffects?.sourceReferences.ignite ?? []),
          ...(criticalChance > 0 ? ['CalcOffence.calcAilmentDamage', 'CalcOffence.ailmentCritChance'] : []),
        ],
        evidence: 'structured-exact',
        detail: 'Feuerschaden, gepinnte PoB2-Gegnerschwelle, Chance, Dauer, Wirkfrequenz und Grundschaden sind strukturiert verbunden.',
      })
    }
  } else if (fireRange.maximum > 0 || allStats.some(stats =>
    Number.isFinite(stats['active_skill_ignite_chance_+%_final'])
    || Number.isFinite(stats['support_ignition_chance_to_ignite_+%_final']),
  )) {
    blockedEffects.push({
      sourceRecordId: input.skill.sourceRecordId,
      sourceLabel: input.skill.name,
      kind: 'ignite',
      status: 'blocked',
      sourceReferences: ['IgniteChanceMultiplier', 'monsterAilmentThresholdTable'],
      evidence: 'incomplete-identity-chain',
      detail: 'Feuerschaden oder Entzündungsmodifikatoren sind vorhanden; Gegnerlevel, Trefferchance oder Wirkfrequenz fehlen jedoch. Es wird kein Entzündungs-DPS erfunden.',
    })
  }

  return {
    modelVersion: DAMAGING_AILMENT_MODEL_VERSION,
    effects,
    blockedEffects,
    ...(effects.length
      ? { totalSustainedDamagePerSecond: round(effects.reduce((total, effect) => total + effect.damagePerSecond, 0)) }
      : {}),
    ...(effects.length && input.enemyProfile
      ? { totalSustainedDamagePerSecondAfterMitigation: round(effects.reduce((total, effect) => total + (effect.damagePerSecondAfterMitigation ?? effect.damagePerSecond), 0)) }
      : {}),
    limitations: [
      'Zaubertreffer werden derzeit mit 100 % Trefferchance modelliert; Angriffe bleiben bis zur vollständigen Accuracy-Gegnerkette gesperrt.',
      'Kritische Ailment-Sonderfälle, Aggravation, gegnerische DoT-Widerstände und bedingte Effekte bleiben ausgeschlossen.',
      'Entzünden wird nur mit gepinnter gegnerabhängiger Ailment-Schwelle, Feuerschaden, Wirkfrequenz und Trefferchance berechnet.',
    ],
  }
}
