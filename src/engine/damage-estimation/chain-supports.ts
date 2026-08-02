import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain/skills'
import type { DamageComponent } from './types'

export const CHAIN_SUPPORT_MODEL_VERSION = '1.0.0'

type NumericSkill = (typeof reference.skills)[number]

export interface ChainSupportModel {
  modelVersion: string
  status: 'not-applicable' | 'applied' | 'blocked-incompatible-skill' | 'blocked-duplicate-family'
  hitDamageMultiplier: number
  additionalChains: number
  singleTargetHitMultiplier: 1
  appliedSupports: Array<{ supportId: string; supportName: string; family: string; finalHitDamagePercent: number; additionalChains: number; sourceReferences: string[] }>
  blockedSupportIds: string[]
  sourceReferences: string[]
  detail: string
}

const recordsByName = new Map(reference.supports.map(value => [value.name.toLocaleLowerCase('en'), value]))
const damageStat = 'support_chain_hit_damage_+%_final'
const chainStat = 'number_of_chains'
const round = (value: number) => Number(value.toFixed(8))

const empty = (status: ChainSupportModel['status'], detail: string, blockedSupportIds: string[] = [], sourceReferences: string[] = []): ChainSupportModel => ({
  modelVersion: CHAIN_SUPPORT_MODEL_VERSION, status, hitDamageMultiplier: 1, additionalChains: 0, singleTargetHitMultiplier: 1,
  appliedSupports: [], blockedSupportIds, sourceReferences, detail,
})

export function resolveChainSupports(input: { skill: NumericSkill; setup?: SkillSetup; supports: SupportGemDefinition[] }): ChainSupportModel {
  const selected = new Set(input.setup?.supportGemIds ?? [])
  const candidates = input.supports.filter(value => selected.has(value.id)).flatMap(definition => {
    const numeric = recordsByName.get((definition.nameEn ?? '').toLocaleLowerCase('en'))
    const stats = numeric?.numericStats as Record<string, number> | undefined
    const damagePercent = Number(stats?.[damageStat])
    const additionalChains = Number(stats?.[chainStat])
    return numeric && Number.isFinite(damagePercent) && Number.isInteger(additionalChains) && additionalChains > 0
      ? [{ definition, numeric, damagePercent, additionalChains }]
      : []
  })
  if (!candidates.length) return empty('not-applicable', 'Keine ausgewählte Unterstützung besitzt eine vollständige strukturierte Verkettungswirkung.')
  const sourceReferences = candidates.flatMap(value => [`support:${value.numeric.sourceRecordId}:${damageStat}`, `support:${value.numeric.sourceRecordId}:${chainStat}`])
  const skillTypes = new Set(input.skill.skillTypes)
  const compatible = skillTypes.has('Chains') && skillTypes.has('Projectile') && !skillTypes.has('CannotChain') && !skillTypes.has('ProjectileNoCollision')
  if (!compatible) return empty('blocked-incompatible-skill', 'Verkettung benötigt die strukturierten Typen Chains und Projectile und ist bei CannotChain oder ProjectileNoCollision ausgeschlossen.', candidates.map(value => value.definition.id), sourceReferences)
  const familyCounts = new Map<string, number>()
  for (const candidate of candidates) {
    const family = candidate.numeric.gemFamily[0] ?? candidate.definition.id
    familyCounts.set(family, (familyCounts.get(family) ?? 0) + 1)
  }
  const duplicateFamilies = new Set([...familyCounts].filter(([, count]) => count > 1).map(([family]) => family))
  if (duplicateFamilies.size) return empty('blocked-duplicate-family', 'Mehrere Stufen derselben Verkettungsfamilie sind ausgewählt. Die Wirkung wird fail-closed blockiert.', candidates.filter(value => duplicateFamilies.has(value.numeric.gemFamily[0] ?? value.definition.id)).map(value => value.definition.id), sourceReferences)
  const appliedSupports = candidates.map(({ definition, numeric, damagePercent, additionalChains }) => ({
    supportId: definition.id,
    supportName: definition.displayNameDe ?? definition.nameEn ?? numeric.name,
    family: numeric.gemFamily[0] ?? definition.id,
    finalHitDamagePercent: damagePercent,
    additionalChains,
    sourceReferences: [`support:${numeric.sourceRecordId}:${damageStat}`, `support:${numeric.sourceRecordId}:${chainStat}`],
  }))
  return {
    modelVersion: CHAIN_SUPPORT_MODEL_VERSION,
    status: 'applied',
    hitDamageMultiplier: round(appliedSupports.reduce((value, support) => value * (1 + support.finalHitDamagePercent / 100), 1)),
    additionalChains: appliedSupports.reduce((sum, support) => sum + support.additionalChains, 0),
    singleTargetHitMultiplier: 1,
    appliedSupports,
    blockedSupportIds: [],
    sourceReferences,
    detail: 'Der strukturierte Trefferschadensfaktor und die zusätzlichen Verkettungen werden angewandt. Verkettungen erhöhen nur die mögliche Zielabdeckung, nicht automatisch die Trefferzahl gegen dasselbe Ziel.',
  }
}

export const applyChainHitDamageMultiplier = (components: DamageComponent[], model: ChainSupportModel) =>
  model.status === 'applied'
    ? components.map(value => ({ ...value, minimum: round(value.minimum * model.hitDamageMultiplier), maximum: round(value.maximum * model.hitDamageMultiplier) }))
    : components.map(value => ({ ...value }))

