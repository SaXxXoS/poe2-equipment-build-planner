import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain/skills'
import type { DamageComponent } from './types'

export const SPELL_CASCADE_SUPPORT_MODEL_VERSION = '1.0.0'

type NumericSkill = (typeof reference.skills)[number]

export interface SpellCascadeSupportModel {
  modelVersion: string
  status: 'not-applicable' | 'applied' | 'blocked-incompatible-skill' | 'blocked-duplicate-family'
  damageMultiplier: number
  areaOfEffectMultiplier: number
  cascadesPerSide: number
  totalCascadeAreas: number
  singleTargetOverlapMultiplier: 1
  appliedSupports: Array<{
    supportId: string
    supportName: string
    family: string
    finalDamagePercent: number
    finalAreaOfEffectPercent: number
    cascadesPerSide: number
    sourceReferences: string[]
  }>
  blockedSupportIds: string[]
  sourceReferences: string[]
  detail: string
}

const recordsByName = new Map(reference.supports.map(value => [value.name.toLocaleLowerCase('en'), value]))
const damageStat = 'support_spell_cascade_damage_+%_final'
const areaStat = 'support_spell_cascade_area_of_effect_+%_final'
const cascadeStat = 'support_spell_cascade_number_of_cascades_per_side'
const round = (value: number) => Number(value.toFixed(8))

const empty = (status: SpellCascadeSupportModel['status'], detail: string, blockedSupportIds: string[] = [], sourceReferences: string[] = []): SpellCascadeSupportModel => ({
  modelVersion: SPELL_CASCADE_SUPPORT_MODEL_VERSION,
  status,
  damageMultiplier: 1,
  areaOfEffectMultiplier: 1,
  cascadesPerSide: 0,
  totalCascadeAreas: 1,
  singleTargetOverlapMultiplier: 1,
  appliedSupports: [],
  blockedSupportIds,
  sourceReferences,
  detail,
})

export function resolveSpellCascadeSupports(input: { skill: NumericSkill; setup?: SkillSetup; supports: SupportGemDefinition[] }): SpellCascadeSupportModel {
  const selected = new Set(input.setup?.supportGemIds ?? [])
  const candidates = input.supports.filter(value => selected.has(value.id)).flatMap(definition => {
    const numeric = recordsByName.get((definition.nameEn ?? '').toLocaleLowerCase('en'))
    const stats = numeric?.numericStats as Record<string, number> | undefined
    const damagePercent = Number(stats?.[damageStat])
    const areaPercent = Number(stats?.[areaStat])
    const cascadesPerSide = Number(stats?.[cascadeStat])
    return numeric && Number.isFinite(damagePercent) && Number.isFinite(areaPercent) && Number.isInteger(cascadesPerSide) && cascadesPerSide >= 0
      ? [{ definition, numeric, damagePercent, areaPercent, cascadesPerSide }]
      : []
  })
  if (!candidates.length) return empty('not-applicable', 'Keine ausgewählte Unterstützung besitzt die vollständige strukturierte Zauberkaskaden-Wirkung.')
  const sourceReferences = candidates.flatMap(value => [
    `support:${value.numeric.sourceRecordId}:${damageStat}`,
    `support:${value.numeric.sourceRecordId}:${areaStat}`,
    `support:${value.numeric.sourceRecordId}:${cascadeStat}`,
  ])
  if (!input.skill.skillTypes.includes('Cascadable')) return empty(
    'blocked-incompatible-skill',
    'Zauberkaskade ist nur für Fertigkeiten mit strukturiert belegtem Cascadable-Typ freigegeben.',
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
    'Mehrere Stufen derselben Zauberkaskadenfamilie sind ausgewählt. Die Wirkung wird fail-closed blockiert.',
    candidates.filter(value => duplicateFamilies.has(value.numeric.gemFamily[0] ?? value.definition.id)).map(value => value.definition.id),
    sourceReferences,
  )
  const appliedSupports = candidates.map(({ definition, numeric, damagePercent, areaPercent, cascadesPerSide }) => ({
    supportId: definition.id,
    supportName: definition.displayNameDe ?? definition.nameEn ?? numeric.name,
    family: numeric.gemFamily[0] ?? definition.id,
    finalDamagePercent: damagePercent,
    finalAreaOfEffectPercent: areaPercent,
    cascadesPerSide,
    sourceReferences: [
      `support:${numeric.sourceRecordId}:${damageStat}`,
      `support:${numeric.sourceRecordId}:${areaStat}`,
      `support:${numeric.sourceRecordId}:${cascadeStat}`,
    ],
  }))
  const cascadesPerSide = appliedSupports.reduce((sum, value) => sum + value.cascadesPerSide, 0)
  return {
    modelVersion: SPELL_CASCADE_SUPPORT_MODEL_VERSION,
    status: 'applied',
    damageMultiplier: round(appliedSupports.reduce((value, support) => value * (1 + support.finalDamagePercent / 100), 1)),
    areaOfEffectMultiplier: round(appliedSupports.reduce((value, support) => value * (1 + support.finalAreaOfEffectPercent / 100), 1)),
    cascadesPerSide,
    totalCascadeAreas: 1 + cascadesPerSide * 2,
    singleTargetOverlapMultiplier: 1,
    appliedSupports,
    blockedSupportIds: [],
    sourceReferences,
    detail: 'Die Kaskade erzeugt eine zusätzliche Fläche je Seite. Der strukturierte Schadens- und Flächenfaktor wird angewandt; mögliche Überlappung wird ohne Trefferbeleg nicht als Einzelzielmultiplikator verwendet.',
  }
}

export const applySpellCascadeDamageMultiplier = (components: DamageComponent[], model: SpellCascadeSupportModel) =>
  model.status === 'applied'
    ? components.map(value => ({ ...value, minimum: round(value.minimum * model.damageMultiplier), maximum: round(value.maximum * model.damageMultiplier) }))
    : components.map(value => ({ ...value }))
