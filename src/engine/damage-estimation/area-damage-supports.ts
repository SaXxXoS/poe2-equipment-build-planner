import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain/skills'
import type { DamageComponent } from './types'

export const AREA_DAMAGE_SUPPORT_MODEL_VERSION = '1.0.0'

type NumericSkill = (typeof reference.skills)[number]

export interface AreaDamageSupportModel {
  modelVersion: string
  status: 'not-applicable' | 'applied' | 'blocked-incompatible-skill' | 'blocked-duplicate-family'
  damageMultiplier: number
  areaOfEffectMultiplier: number
  appliedSupports: Array<{
    supportId: string
    supportName: string
    family: string
    finalAreaDamagePercent: number
    finalAreaOfEffectPercent: number
    sourceReferences: string[]
  }>
  blockedSupportIds: string[]
  sourceReferences: string[]
  detail: string
}

const recordsByName = new Map(reference.supports.map(value => [value.name.toLocaleLowerCase('en'), value]))
const damageStat = 'support_area_concentrate_area_damage_+%_final'
const areaStat = 'support_concentrated_effect_skill_area_of_effect_+%_final'
const round = (value: number) => Number(value.toFixed(8))

export function resolveAreaDamageSupports(input: {
  skill: NumericSkill
  setup?: SkillSetup
  supports: SupportGemDefinition[]
}): AreaDamageSupportModel {
  const selected = new Set(input.setup?.supportGemIds ?? [])
  const candidates = input.supports.filter(value => selected.has(value.id)).flatMap(definition => {
    const numeric = recordsByName.get((definition.nameEn ?? '').toLocaleLowerCase('en'))
    const stats = numeric?.numericStats as Record<string, number> | undefined
    const damagePercent = Number(stats?.[damageStat])
    const areaPercent = Number(stats?.[areaStat])
    return numeric && Number.isFinite(damagePercent) && Number.isFinite(areaPercent)
      ? [{ definition, numeric, damagePercent, areaPercent }]
      : []
  })
  if (!candidates.length) return {
    modelVersion: AREA_DAMAGE_SUPPORT_MODEL_VERSION,
    status: 'not-applicable', damageMultiplier: 1, areaOfEffectMultiplier: 1,
    appliedSupports: [], blockedSupportIds: [], sourceReferences: [],
    detail: 'Keine ausgewählte Unterstützung besitzt eine vollständig strukturierte Kombination aus finalem Flächenschaden und finaler Wirkungsfläche.',
  }
  const sourceReferences = candidates.flatMap(value => [
    `support:${value.numeric.sourceRecordId}:${damageStat}`,
    `support:${value.numeric.sourceRecordId}:${areaStat}`,
  ])
  if (!input.skill.skillTypes.includes('Area')) return {
    modelVersion: AREA_DAMAGE_SUPPORT_MODEL_VERSION,
    status: 'blocked-incompatible-skill', damageMultiplier: 1, areaOfEffectMultiplier: 1,
    appliedSupports: [], blockedSupportIds: candidates.map(value => value.definition.id), sourceReferences,
    detail: 'Konzentrierte Wirkung ist nur für Fertigkeiten mit strukturiert belegtem Area-Typ freigegeben. Auf diese Fertigkeit wird kein Effekt angewandt.',
  }
  const familyCounts = new Map<string, number>()
  for (const candidate of candidates) {
    const family = candidate.numeric.gemFamily[0] ?? candidate.definition.id
    familyCounts.set(family, (familyCounts.get(family) ?? 0) + 1)
  }
  const duplicateFamilies = new Set([...familyCounts].filter(([, count]) => count > 1).map(([family]) => family))
  if (duplicateFamilies.size) return {
    modelVersion: AREA_DAMAGE_SUPPORT_MODEL_VERSION,
    status: 'blocked-duplicate-family', damageMultiplier: 1, areaOfEffectMultiplier: 1,
    appliedSupports: [],
    blockedSupportIds: candidates.filter(value => duplicateFamilies.has(value.numeric.gemFamily[0] ?? value.definition.id)).map(value => value.definition.id),
    sourceReferences,
    detail: 'Mehrere Stufen derselben Flächensupportfamilie sind ausgewählt. Die gesamte Wirkung wird fail-closed blockiert.',
  }
  const appliedSupports = candidates.map(({ definition, numeric, damagePercent, areaPercent }) => ({
    supportId: definition.id,
    supportName: definition.displayNameDe ?? definition.nameEn ?? numeric.name,
    family: numeric.gemFamily[0] ?? definition.id,
    finalAreaDamagePercent: damagePercent,
    finalAreaOfEffectPercent: areaPercent,
    sourceReferences: [`support:${numeric.sourceRecordId}:${damageStat}`, `support:${numeric.sourceRecordId}:${areaStat}`],
  }))
  return {
    modelVersion: AREA_DAMAGE_SUPPORT_MODEL_VERSION,
    status: 'applied',
    damageMultiplier: round(appliedSupports.reduce((value, support) => value * (1 + support.finalAreaDamagePercent / 100), 1)),
    areaOfEffectMultiplier: round(appliedSupports.reduce((value, support) => value * (1 + support.finalAreaOfEffectPercent / 100), 1)),
    appliedSupports, blockedSupportIds: [], sourceReferences,
    detail: 'Finaler Flächenschaden verstärkt Treffer und eigenständigen Flächenschaden über Zeit. Der getrennte finale Wirkungsflächenfaktor wird sichtbar ausgewiesen und nicht als Schadensbonus missverstanden.',
  }
}

export const applyAreaDamageMultiplier = (components: DamageComponent[], model: AreaDamageSupportModel) =>
  model.status === 'applied'
    ? components.map(value => ({ ...value, minimum: round(value.minimum * model.damageMultiplier), maximum: round(value.maximum * model.damageMultiplier) }))
    : components.map(value => ({ ...value }))
