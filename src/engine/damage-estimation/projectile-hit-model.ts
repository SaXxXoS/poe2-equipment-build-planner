import type { DamageEstimate } from './types'

export const PROJECTILE_HIT_MODEL_VERSION = '1.3.0'

type NumericSkill = {
  name: string
  skillTypes?: readonly string[]
  numericStats?: Readonly<Record<string, number | undefined>>
}

export type ProjectileMechanicKind =
  | 'projectiles-per-action'
  | 'chain-count'
  | 'pierce-count'
  | 'pierce-chance'
  | 'maximum-hit-cap'

export interface ResolvedProjectileMechanic {
  kind: ProjectileMechanicKind
  value: number
  sourceReference: string
  evidence: 'structured-exact'
  damageUse: 'coverage-only' | 'blocked-as-damage-multiplier'
  detail: string
}

export interface ProjectileHitModel {
  modelVersion: string
  isProjectileSkill: boolean
  projectilesPerAction: number
  singleTargetHitMultiplier: 1
  mappingPotentialTargetContacts: number
  supportPierceChancePercent: number
  postPierceDamageMultiplier: number
  mechanics: ResolvedProjectileMechanic[]
  bossScenario: { hitMultiplier: 1; status: 'single-hit-only'; detail: string }
  mappingScenario: { potentialTargetContacts: number; status: 'coverage-estimate'; detail: string }
  limitations: string[]
}

const positiveInteger = (value: unknown): number | undefined =>
  Number.isInteger(value) && Number(value) > 0 ? Number(value) : undefined

export function resolveProjectileHitModel(skill: NumericSkill, supportBonuses: { additionalChains?: number; chainSourceReference?: string; additionalProjectiles?: number; projectileSourceReference?: string; pierceChancePercent?: number; pierceSourceReference?: string; postPierceDamageMultiplier?: number } = {}): ProjectileHitModel {
  const stats = skill.numericStats ?? {}
  const skillTypes = new Set(skill.skillTypes ?? [])
  const isProjectileSkill =
    skillTypes.has('Projectile') ||
    skillTypes.has('ProjectileNumber') ||
    skillTypes.has('ProjectilesFromUser')
  const projectileCount = positiveInteger(stats.base_number_of_projectiles)
  const baseChainCount = positiveInteger(stats.number_of_chains) ?? 0
  const supportChainCount = positiveInteger(supportBonuses.additionalChains) ?? 0
  const supportProjectileCount = positiveInteger(supportBonuses.additionalProjectiles) ?? 0
  const chainCount = baseChainCount + supportChainCount
  const pierceCount = positiveInteger(stats.projectile_base_number_of_targets_to_pierce)
  const maximumHitCap = positiveInteger(stats.tornado_shot_number_of_hits_allowed)
  const supportPierceChancePercent = Math.max(0, Math.min(100, Number(supportBonuses.pierceChancePercent ?? 0)))
  const postPierceDamageMultiplier = Number(supportBonuses.postPierceDamageMultiplier ?? 1)
  const projectilesPerAction = isProjectileSkill ? (projectileCount ?? 1) + supportProjectileCount : 1
  const mechanics: ResolvedProjectileMechanic[] = []

  if (projectileCount) mechanics.push({
    kind: 'projectiles-per-action',
    value: projectileCount,
    sourceReference: 'numericStats.base_number_of_projectiles',
    evidence: 'structured-exact',
    damageUse: 'coverage-only',
    detail: `${projectileCount} Projektile pro Aktion sind strukturiert belegt. Eine Mehrfachtrefferregel für dasselbe Ziel ist damit nicht belegt.`,
  })
  if (supportProjectileCount) mechanics.push({
    kind: 'projectiles-per-action',
    value: supportProjectileCount,
    sourceReference: supportBonuses.projectileSourceReference ?? 'support:number_of_additional_projectiles',
    evidence: 'structured-exact',
    damageUse: 'coverage-only',
    detail: `${supportProjectileCount} zusätzliche Projektile aus Unterstützungen erhöhen die mögliche Zielabdeckung. Eine Mehrfachtrefferregel für dasselbe Ziel ist damit nicht belegt.`,
  })
  if (baseChainCount) mechanics.push({
    kind: 'chain-count',
    value: baseChainCount,
    sourceReference: 'numericStats.number_of_chains',
    evidence: 'structured-exact',
    damageUse: 'coverage-only',
    detail: `${baseChainCount} intrinsische Verkettungen erweitern die mögliche Zielabdeckung, aber nicht automatisch den Schaden gegen dasselbe Ziel.`,
  })
  if (supportChainCount) mechanics.push({
    kind: 'chain-count',
    value: supportChainCount,
    sourceReference: supportBonuses.chainSourceReference ?? 'support:number_of_chains',
    evidence: 'structured-exact',
    damageUse: 'coverage-only',
    detail: `${supportChainCount} zusätzliche Verkettungen aus Unterstützungen erweitern die mögliche Zielabdeckung, aber nicht automatisch den Schaden gegen dasselbe Ziel.`,
  })
  if (pierceCount) mechanics.push({
    kind: 'pierce-count',
    value: pierceCount,
    sourceReference: 'numericStats.projectile_base_number_of_targets_to_pierce',
    evidence: 'structured-exact',
    damageUse: 'coverage-only',
    detail: `${pierceCount} Durchbohrungen erweitern die mögliche Zielabdeckung, aber nicht automatisch den Schaden gegen dasselbe Ziel.`,
  })
  if (supportPierceChancePercent > 0) mechanics.push({
    kind: 'pierce-chance',
    value: supportPierceChancePercent,
    sourceReference: supportBonuses.pierceSourceReference ?? 'support:base_chance_to_pierce_%',
    evidence: 'structured-exact',
    damageUse: 'coverage-only',
    detail: `${supportPierceChancePercent}% Durchbohrungswahrscheinlichkeit sind strukturiert belegt. Ohne Zielanzahl und Gegnerdichte wird daraus keine feste Zahl zusätzlicher Kontakte abgeleitet.`,
  })
  if (maximumHitCap) mechanics.push({
    kind: 'maximum-hit-cap',
    value: maximumHitCap,
    sourceReference: 'numericStats.tornado_shot_number_of_hits_allowed',
    evidence: 'structured-exact',
    damageUse: 'blocked-as-damage-multiplier',
    detail: `Die strukturierte Obergrenze von ${maximumHitCap} Treffern belegt keine tatsächlich erreichte Trefferzahl und wird deshalb nicht multipliziert.`,
  })

  const mappingPotentialTargetContacts = isProjectileSkill
    ? projectilesPerAction * (1 + (chainCount ?? 0) + (pierceCount ?? 0))
    : 1

  return {
    modelVersion: PROJECTILE_HIT_MODEL_VERSION,
    isProjectileSkill,
    projectilesPerAction,
    singleTargetHitMultiplier: 1,
    mappingPotentialTargetContacts,
    supportPierceChancePercent,
    postPierceDamageMultiplier,
    mechanics,
    bossScenario: {
      hitMultiplier: 1,
      status: 'single-hit-only',
      detail: 'Ohne belegte Überlappungs-, Rückkehr- oder Wiederholungsregel wird gegen ein einzelnes Ziel genau ein Treffer pro Aktion angesetzt.',
    },
    mappingScenario: {
      potentialTargetContacts: mappingPotentialTargetContacts,
      status: 'coverage-estimate',
      detail: 'Der Wert beschreibt nur die theoretische Zielabdeckung aus Projektilen, Chains und Pierce. Er ist kein DPS-Multiplikator.',
    },
    limitations: [
      'Mehrere Projektile werden nicht pauschal als Mehrfachtreffer desselben Ziels gerechnet.',
      'Chain und Pierce erhöhen nur die mögliche Zielabdeckung.',
      'Fork und Rückkehr bleiben ohne strukturierte Zahl und eindeutige Wiederkontaktregel unberücksichtigt.',
      'Eine Trefferobergrenze ist keine garantierte Trefferzahl.',
    ],
  }
}

export const projectileHitOutput = (
  model: ProjectileHitModel,
): NonNullable<DamageEstimate['projectileHitModel']> => ({
  modelVersion: model.modelVersion,
  isProjectileSkill: model.isProjectileSkill,
  projectilesPerAction: model.projectilesPerAction,
  singleTargetHitMultiplier: model.singleTargetHitMultiplier,
  mappingPotentialTargetContacts: model.mappingPotentialTargetContacts,
  supportPierceChancePercent: model.supportPierceChancePercent,
  postPierceDamageMultiplier: model.postPierceDamageMultiplier,
  mechanics: model.mechanics.map(value => ({ ...value })),
  bossScenario: { ...model.bossScenario },
  mappingScenario: { ...model.mappingScenario },
  limitations: [...model.limitations],
})
