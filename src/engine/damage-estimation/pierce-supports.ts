import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain'

export const PIERCE_SUPPORT_MODEL_VERSION = '1.0.0'

type NumericSkill = (typeof reference.skills)[number]

export interface PierceSupportModel {
  modelVersion: string
  status: 'not-applicable' | 'applied' | 'blocked-incompatible-skill' | 'blocked-duplicate-family'
  chanceToPiercePercent: number
  postPierceDamageMultiplier: number
  singleTargetHitMultiplier: 1
  appliedSupports: Array<{
    supportId: string
    supportName: string
    family: string
    chanceToPiercePercent: number
    finalDamageAfterPiercingPercent: number
    sourceReferences: string[]
  }>
  blockedSupportIds: string[]
  sourceReferences: string[]
  limitations: string[]
  detail: string
}

const recordsByName = new Map(reference.supports.map(value => [value.name.toLocaleLowerCase('en'), value]))
const chanceStat = 'base_chance_to_pierce_%'
const postPierceDamageStat = 'support_pierce_projectile_damage_+%_final_if_pierced_enemy'
const round = (value: number) => Number(value.toFixed(8))

const empty = (
  status: PierceSupportModel['status'],
  detail: string,
  blockedSupportIds: string[] = [],
  sourceReferences: string[] = [],
): PierceSupportModel => ({
  modelVersion: PIERCE_SUPPORT_MODEL_VERSION,
  status,
  chanceToPiercePercent: 0,
  postPierceDamageMultiplier: 1,
  singleTargetHitMultiplier: 1,
  appliedSupports: [],
  blockedSupportIds,
  sourceReferences,
  limitations: [],
  detail,
})

export function resolvePierceSupports(input: {
  skill: NumericSkill
  setup?: SkillSetup
  supports: SupportGemDefinition[]
}): PierceSupportModel {
  const selected = new Set(input.setup?.supportGemIds ?? [])
  const candidates = input.supports.filter(value => selected.has(value.id)).flatMap(definition => {
    const numeric = recordsByName.get((definition.nameEn ?? '').toLocaleLowerCase('en'))
    const stats = numeric?.numericStats as Record<string, number> | undefined
    const chance = Number(stats?.[chanceStat])
    const finalDamageAfterPiercingPercent = Number(stats?.[postPierceDamageStat] ?? 0)
    return numeric && Number.isFinite(chance) && chance > 0 && Number.isFinite(finalDamageAfterPiercingPercent)
      ? [{ definition, numeric, chance, finalDamageAfterPiercingPercent }]
      : []
  })
  if (!candidates.length) return empty('not-applicable', 'Keine ausgewählte Unterstützung besitzt eine strukturierte Durchbohrungswahrscheinlichkeit.')

  const sourceReferences = candidates.flatMap(value => [
    `support:${value.numeric.sourceRecordId}:${chanceStat}`,
    ...(Object.hasOwn(value.numeric.numericStats, postPierceDamageStat)
      ? [`support:${value.numeric.sourceRecordId}:${postPierceDamageStat}`]
      : []),
  ])
  const skillTypes = new Set(input.skill.skillTypes)
  const compatible = skillTypes.has('Projectile') && !skillTypes.has('ProjectileNoCollision')
  if (!compatible) return empty(
    'blocked-incompatible-skill',
    'Durchbohren benötigt den strukturierten Fertigkeitstyp Projectile und ist bei ProjectileNoCollision ausgeschlossen.',
    candidates.map(value => value.definition.id),
    sourceReferences,
  )

  const familyCounts = new Map<string, number>()
  for (const candidate of candidates) {
    const family = candidate.numeric.gemFamily[0] ?? candidate.definition.id
    familyCounts.set(family, (familyCounts.get(family) ?? 0) + 1)
  }
  const duplicateFamilies = new Set([...familyCounts].filter(([, count]) => count > 1).map(([family]) => family))
  if (duplicateFamilies.size) return empty(
    'blocked-duplicate-family',
    'Mehrere Stufen derselben Durchbohrungsfamilie sind ausgewählt. Die Wirkung wird fail-closed blockiert.',
    candidates.filter(value => duplicateFamilies.has(value.numeric.gemFamily[0] ?? value.definition.id)).map(value => value.definition.id),
    sourceReferences,
  )

  const appliedSupports = candidates.map(({ definition, numeric, chance, finalDamageAfterPiercingPercent }) => ({
    supportId: definition.id,
    supportName: definition.displayNameDe ?? definition.nameEn ?? numeric.name,
    family: numeric.gemFamily[0] ?? definition.id,
    chanceToPiercePercent: chance,
    finalDamageAfterPiercingPercent,
    sourceReferences: [
      `support:${numeric.sourceRecordId}:${chanceStat}`,
      ...(Object.hasOwn(numeric.numericStats, postPierceDamageStat)
        ? [`support:${numeric.sourceRecordId}:${postPierceDamageStat}`]
        : []),
    ],
  }))
  const chanceToPiercePercent = Math.min(100, appliedSupports.reduce((sum, value) => sum + value.chanceToPiercePercent, 0))
  const postPierceDamageMultiplier = round(appliedSupports.reduce(
    (multiplier, value) => multiplier * (1 + value.finalDamageAfterPiercingPercent / 100),
    1,
  ))
  return {
    modelVersion: PIERCE_SUPPORT_MODEL_VERSION,
    status: 'applied',
    chanceToPiercePercent,
    postPierceDamageMultiplier,
    singleTargetHitMultiplier: 1,
    appliedSupports,
    blockedSupportIds: [],
    sourceReferences,
    limitations: [
      'Eine Durchbohrungswahrscheinlichkeit belegt ohne Zielanzahl und Gegnerdichte keine feste Zahl zusätzlicher Treffer.',
      'Der Schadensfaktor nach dem Durchbohren gilt nur für nachfolgende Ziele und verändert den ersten Einzelzieltreffer nicht.',
    ],
    detail: `${chanceToPiercePercent}% Durchbohrungswahrscheinlichkeit sind strukturiert belegt. Der Faktor ${postPierceDamageMultiplier} gilt ausschließlich nach einem erfolgreichen Durchbohren; Boss-Schaden und Trefferzahl bleiben unverändert.`,
  }
}
