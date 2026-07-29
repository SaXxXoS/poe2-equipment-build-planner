import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillGemDefinition, SkillSetup, SupportGemDefinition } from '../../domain'
import type { DamageEstimate } from './types'

export const GEM_LEVEL_QUALITY_MODEL_VERSION = '2.0.0'
type NumericSkill = (typeof reference.skills)[number]
const byName = new Map<string, NumericSkill>()
for (const skill of reference.skills) {
  const key = skill.name.toLocaleLowerCase('en')
  const current = byName.get(key)
  if (!current || Object.keys(skill.numericStats).length > Object.keys(current.numericStats).length) byName.set(key, skill)
}

export interface GemLevelQualityModel {
  modelVersion: string
  requestedSkillLevel?: number
  availableSkillLevel?: number
  availableSkillLevels: number[]
  appliedSkillLevel?: number
  requestedSkillQuality?: number
  appliedSkillQuality?: number
  appliedQualityStats: Array<{ statId: string; perQuality: number; value: number }>
  skillLevelStatus: 'exact' | 'default-reference-level' | 'blocked-level-mismatch' | 'blocked-missing-reference'
  skillQualityStatus: 'exact' | 'default-zero' | 'blocked-invalid-range' | 'blocked-missing-reference'
  supportLevelStatus: 'exact-level-one-reference'
  supportQualityStatus: 'blocked-not-transported-and-no-reference'
  productive: boolean
  sourceReferences: string[]
  limitations: string[]
}

export function resolveGemLevelQualityModel(input: {
  setup?: SkillSetup
  skill?: SkillGemDefinition
  supports: SupportGemDefinition[]
}): GemLevelQualityModel {
  const record = input.skill?.nameEn ? byName.get(input.skill.nameEn.toLocaleLowerCase('en')) : undefined
  const requestedSkillLevel = input.setup?.level
  const requestedSkillQuality = input.setup?.quality
  const availableSkillLevels = record?.levels.map(value => value.level) ?? []
  const defaultLevel = availableSkillLevels.includes(20) ? 20 : availableSkillLevels.at(-1)
  const availableSkillLevel = requestedSkillLevel != null && availableSkillLevels.includes(requestedSkillLevel) ? requestedSkillLevel : defaultLevel
  const exact = requestedSkillLevel != null && availableSkillLevels.includes(requestedSkillLevel)
  const defaultReference = requestedSkillLevel == null && availableSkillLevel != null
  const skillLevelStatus: GemLevelQualityModel['skillLevelStatus'] = !record
    ? 'blocked-missing-reference'
    : exact ? 'exact' : defaultReference ? 'default-reference-level' : 'blocked-level-mismatch'
  const qualityValid = requestedSkillQuality == null || (Number.isInteger(requestedSkillQuality) && requestedSkillQuality >= 0 && requestedSkillQuality <= 23)
  const skillQualityStatus: GemLevelQualityModel['skillQualityStatus'] = !record
    ? 'blocked-missing-reference'
    : !qualityValid ? 'blocked-invalid-range' : requestedSkillQuality == null ? 'default-zero' : 'exact'
  const appliedSkillQuality = qualityValid && record ? requestedSkillQuality ?? 0 : undefined
  const appliedQualityStats = appliedSkillQuality == null ? [] : record!.qualityStats
    .filter(row => row.statSetIndexes.length === 0 || (row.statSetIndexes as number[]).includes(1))
    .map(row => ({ statId: row.statId, perQuality: row.perQuality, value: Math.trunc(row.perQuality * appliedSkillQuality) }))
    .filter(row => row.value !== 0)
  const productive = (skillLevelStatus === 'exact' || skillLevelStatus === 'default-reference-level')
    && (skillQualityStatus === 'exact' || skillQualityStatus === 'default-zero')
  return {
    modelVersion: GEM_LEVEL_QUALITY_MODEL_VERSION,
    ...(requestedSkillLevel == null ? {} : { requestedSkillLevel }),
    ...(availableSkillLevel == null ? {} : { availableSkillLevel }),
    availableSkillLevels,
    ...(productive && availableSkillLevel != null ? { appliedSkillLevel: availableSkillLevel } : {}),
    ...(requestedSkillQuality == null ? {} : { requestedSkillQuality }),
    ...(appliedSkillQuality == null ? {} : { appliedSkillQuality }),
    appliedQualityStats,
    skillLevelStatus,
    skillQualityStatus,
    supportLevelStatus: 'exact-level-one-reference',
    supportQualityStatus: 'blocked-not-transported-and-no-reference',
    productive,
    sourceReferences: record && availableSkillLevel != null ? [`damage-reference:${record.name}:gemLevel:${availableSkillLevel}`] : [],
    limitations: [
      'Es werden ausschließlich exakt vorhandene Stufenzeilen des gepinnten PoB2-Bestands verwendet.',
      'Fehlende Gemmenstufen werden weder skaliert noch interpoliert.',
      'Normale Fertigkeitsqualität wird mit den gepinnten PoB2-qualityStats und Abrundung gegen null angewendet.',
      'Alternative Qualitätsarten und Supportqualität sind noch nicht als geschlossene numerische Wirkungskette freigegeben.',
      'Supportvarianten dieses Quellenpins besitzen jeweils genau eine strukturierte Stufenzeile.',
    ],
  }
}

export function applySkillQualityStats(numericStats: Record<string, number>, model: GemLevelQualityModel): Record<string, number> {
  const result = { ...numericStats }
  for (const row of model.appliedQualityStats) result[row.statId] = (result[row.statId] ?? 0) + row.value
  return result
}

export const gemLevelQualityOutput = (model: GemLevelQualityModel): NonNullable<DamageEstimate['gemLevelQualityModel']> => ({
  ...model,
  appliedQualityStats: model.appliedQualityStats.map(row => ({ ...row })),
  sourceReferences: [...model.sourceReferences],
  limitations: [...model.limitations],
})
