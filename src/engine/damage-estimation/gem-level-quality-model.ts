import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillGemDefinition, SkillSetup, SupportGemDefinition } from '../../domain'
import type { DamageEstimate } from './types'

export const GEM_LEVEL_QUALITY_MODEL_VERSION = '1.0.0'
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
  appliedSkillLevel?: number
  skillLevelStatus: 'exact' | 'default-reference-level' | 'blocked-level-mismatch' | 'blocked-missing-reference'
  skillQualityStatus: 'blocked-not-transported-and-no-reference'
  supportLevelStatus: 'blocked-not-transported'
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
  const availableSkillLevel = record?.gemLevel
  const exact = requestedSkillLevel != null && availableSkillLevel === requestedSkillLevel
  const defaultReference = requestedSkillLevel == null && availableSkillLevel != null
  const skillLevelStatus: GemLevelQualityModel['skillLevelStatus'] = !record
    ? 'blocked-missing-reference'
    : exact ? 'exact' : defaultReference ? 'default-reference-level' : 'blocked-level-mismatch'
  const productive = skillLevelStatus === 'exact' || skillLevelStatus === 'default-reference-level'
  return {
    modelVersion: GEM_LEVEL_QUALITY_MODEL_VERSION,
    ...(requestedSkillLevel == null ? {} : { requestedSkillLevel }),
    ...(availableSkillLevel == null ? {} : { availableSkillLevel }),
    ...(productive && availableSkillLevel != null ? { appliedSkillLevel: availableSkillLevel } : {}),
    skillLevelStatus,
    skillQualityStatus: 'blocked-not-transported-and-no-reference',
    supportLevelStatus: 'blocked-not-transported',
    supportQualityStatus: 'blocked-not-transported-and-no-reference',
    productive,
    sourceReferences: record ? [`damage-reference:${record.name}:gemLevel:${record.gemLevel}`] : [],
    limitations: [
      'Der gepinnte numerische Bestand enthält ausschließlich Fertigkeitswerte auf Gemmenstufe 20.',
      'Eine abweichende angeforderte Gemmenstufe wird nicht aus Stufe 20 skaliert oder interpoliert.',
      'Fertigkeitsqualität wird weder im SkillSetup transportiert noch mit numerischen Qualitätswirkungen referenziert.',
      'Supportstufen und Supportqualität sind nicht als geschlossene numerische Wirkungskette vorhanden.',
    ],
  }
}

export const gemLevelQualityOutput = (
  model: GemLevelQualityModel,
): NonNullable<DamageEstimate['gemLevelQualityModel']> => ({
  ...model,
  sourceReferences: [...model.sourceReferences],
  limitations: [...model.limitations],
})
