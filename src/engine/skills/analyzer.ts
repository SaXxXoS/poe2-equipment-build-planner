import type { CharacterConfiguration, GoalProfile, SkillGemDefinition, SkillRole, SyntheticWeaponType } from '../../domain'
import type { AnalyzerContext, BuildProfile, ConstraintViolation, EquipmentAnalysis, ScoreCategory, ScoreReason, SkillAnalysis, SkillRecommendation } from '../common/types'
import { SYNTHETIC_SKILL_CONFIG, type SkillAnalyzerConfig } from './config'
import { SKILL_RULES } from './rules'

export const SKILL_ANALYZER_VERSION = '0.3.0-synthetic'
export interface SkillAnalyzerInput { equipmentAnalysis: EquipmentAnalysis; character: CharacterConfiguration; goalProfile: GoalProfile; availableWeaponTypes?: SyntheticWeaponType[] }
export interface SkillAnalyzer {
  analyze(profile: BuildProfile, candidates: SkillGemDefinition[], context: AnalyzerContext, input?: SkillAnalyzerInput, config?: SkillAnalyzerConfig): SkillRecommendation[]
  analyzeRanked(profile: BuildProfile, candidates: SkillGemDefinition[], context: AnalyzerContext, input?: SkillAnalyzerInput, config?: SkillAnalyzerConfig): SkillAnalysis
}

const clamp = (value: number, config: SkillAnalyzerConfig) => Math.round(Math.max(config.scoreMin, Math.min(config.scoreMax, value)))
const fieldValue = (profile: BuildProfile, field: string): number => { const [section, key] = field.split('.'); return (profile[section as keyof BuildProfile] as unknown as Record<string, number>)[key] ?? 0 }
const reason = (code: string, category: ScoreCategory, impact: number, skill: SkillGemDefinition, fields: string[] = []): ScoreReason => ({ code, category, messageKey: `engine.skill.reason.${code}`, impact, polarity: impact > 0 ? 'positive' : impact < 0 ? 'negative' : 'neutral', sourceType: 'skill', sourceId: skill.id, affectedTags: skill.tags, details: fields.length ? { profileFields: fields.join(',') } : undefined })
const violation = (code: string, skill: SkillGemDefinition, relatedIds: string[] = []): ConstraintViolation => ({ code, severity: 'error', messageKey: `engine.skill.constraint.${code}`, sourceId: skill.id, relatedIds: [skill.id, ...relatedIds], blocking: true })
const warning = (code: string, skill: SkillGemDefinition): ConstraintViolation => ({ code, severity: 'warning', messageKey: `engine.skill.warning.${code}`, sourceId: skill.id, relatedIds: [skill.id], blocking: false })
const stable = <T extends { skillId: string }>(values: T[], score: (value: T) => number) => [...values].sort((a, b) => score(b) - score(a) || a.skillId.localeCompare(b.skillId))
const defaultInput = (profile: BuildProfile, config: SkillAnalyzerConfig): SkillAnalyzerInput => ({ equipmentAnalysis: { combinedProfile: profile, profileSet1: profile, profileSet2: profile, detectedTags: [], recognizedTags: [], recognizedWeaponSets: [], recognizedRequirements: [], dominantWeaponSet: 'balanced', weaponSetDifferences: [], weaponSetSpecializations: { 'set-1': [], 'set-2': [] }, profileClarity: config.scoreMax, conflictLevel: config.scoreMin, unusedModifierIds: [], weaklyUsedModifierIds: [], conflictingModifierIds: [], reasons: [], violations: [], warnings: [], status: 'placeholder', analyzerVersion: 'compatibility', score: { totalScore: 0, reasons: [], violations: [], categoryScores: {}, confidence: 'low', status: 'placeholder' } }, character: { classId: 'fixture-class', ascendancyId: 'fixture-ascendancy-storm', level: 1, goalProfile: 'balanced' }, goalProfile: 'balanced', availableWeaponTypes: ['any'] })

function profileMatchScore(skill: SkillGemDefinition, profile: BuildProfile, config: SkillAnalyzerConfig): { score: number; matched: string[]; weak: string[] } {
  let score = 0; const matched: string[] = []; const weak: string[] = []
  const damageTypes = skill.damageTypes ?? skill.tags.filter(tag => ['physical', 'fire', 'cold', 'lightning', 'chaos'].includes(tag)) as NonNullable<SkillGemDefinition['damageTypes']>
  for (const damage of damageTypes) { const value = profile.damageTypes[damage]; if (value >= config.profileStrong) matched.push(`damageTypes.${damage}`); else if (value > 0) weak.push(`damageTypes.${damage}`); score += value * config.damageWeight }
  for (const tag of skill.tags) if (tag in profile.mechanics) { const value = profile.mechanics[tag as keyof BuildProfile['mechanics']]; if (value >= config.profileStrong) matched.push(`mechanics.${tag}`); else if (value > 0) weak.push(`mechanics.${tag}`); score += value * config.mechanicWeight }
  if (skill.tags.includes('attack')) score += profile.speed.attackSpeedAffinity * config.speedWeight
  if (skill.tags.includes('spell')) score += profile.speed.castSpeedAffinity * config.speedWeight
  if (skill.tags.includes('movement')) score += profile.speed.movementAffinity * config.speedWeight
  return { score: clamp(score, config), matched: [...new Set(matched)].sort(), weak: [...new Set(weak)].sort() }
}

function determineRoles(skill: SkillGemDefinition, damageScore: number): { recommended: SkillRole; possible: SkillRole[] } {
  const possible = new Set<SkillRole>(skill.possibleRoles ?? [])
  if (skill.tags.includes('movement')) possible.add('movement')
  if (skill.tags.includes('buff') || skill.tags.includes('debuff')) possible.add('utility')
  if (skill.tags.includes('defensive')) possible.add('defensive')
  if (skill.tags.some(tag => ['attack', 'spell', 'minion', 'damage-over-time'].includes(tag))) { possible.add('main'); possible.add('secondary') }
  if (!possible.size) possible.add('utility')
  const recommended: SkillRole = skill.tags.includes('movement') ? 'movement' : skill.tags.includes('buff') || skill.tags.includes('debuff') ? 'utility' : skill.tags.includes('defensive') ? 'defensive' : damageScore > 0 ? 'main' : [...possible].sort()[0]
  return { recommended, possible: [...possible].sort() }
}

function hardChecks(skill: SkillGemDefinition, profile: BuildProfile, input: SkillAnalyzerInput, config: SkillAnalyzerConfig): ConstraintViolation[] {
  const result: ConstraintViolation[] = []
  if (skill.enabled === false) result.push(violation('skill-disabled', skill))
  if (!skill.id || !skill.tags.length) result.push(violation('skill-invalid-reference', skill))
  if (skill.tags.includes('attack') && profile.mechanics.spell >= config.exclusiveProfileHigh && profile.mechanics.attack <= config.exclusiveProfileLow) result.push(violation('skill-attack-in-spell-only-profile', skill))
  if (skill.tags.includes('spell') && profile.mechanics.attack >= config.exclusiveProfileHigh && profile.mechanics.spell <= config.exclusiveProfileLow) result.push(violation('skill-spell-in-attack-only-profile', skill))
  const weapons = input.availableWeaponTypes ?? ['any']; if (skill.requiredWeaponTypes?.length && !weapons.includes('any') && !skill.requiredWeaponTypes.some(item => weapons.includes(item))) result.push(violation('skill-wrong-weapon', skill, skill.requiredWeaponTypes))
  if (!weapons.includes('any') && skill.excludedWeaponTypes?.some(item => weapons.includes(item))) result.push(violation('skill-excluded-weapon', skill, skill.excludedWeaponTypes))
  if (skill.requiredClassId && skill.requiredClassId !== input.character.classId) result.push(violation('skill-required-class', skill, [skill.requiredClassId]))
  if (skill.excludedClassIds?.includes(input.character.classId)) result.push(violation('skill-excluded-class', skill, [input.character.classId]))
  if (skill.allowedAscendancyIds?.length && !skill.allowedAscendancyIds.includes(input.character.ascendancyId)) result.push(violation('skill-ascendancy-not-allowed', skill, skill.allowedAscendancyIds))
  if (skill.excludedAscendancyIds?.includes(input.character.ascendancyId)) result.push(violation('skill-excluded-ascendancy', skill, [input.character.ascendancyId]))
  for (const tag of skill.requiredMechanics ?? []) if (!skill.tags.includes(tag)) result.push(violation('skill-required-tag-missing', skill, [tag]))
  for (const tag of skill.excludedMechanics ?? []) if (skill.tags.includes(tag)) result.push(violation('skill-excluded-tag-present', skill, [tag]))
  for (const [attribute, requirement] of Object.entries(skill.attributeRequirements ?? {})) if ((requirement ?? 0) > 0 && profile.requirements[`${attribute}Need` as keyof BuildProfile['requirements']] > config.attributeDeficitThreshold) result.push(violation('skill-attribute-deficit', skill, [attribute]))
  return result
}

function recommend(skill: SkillGemDefinition, profile: BuildProfile, input: SkillAnalyzerInput, config: SkillAnalyzerConfig): SkillRecommendation {
  const reasons: ScoreReason[] = []; const violations = hardChecks(skill, profile, input, config); const warnings: ConstraintViolation[] = []
  const combined = profileMatchScore(skill, profile, config); const set1 = profileMatchScore(skill, input.equipmentAnalysis.profileSet1, config); const set2 = profileMatchScore(skill, input.equipmentAnalysis.profileSet2, config)
  let damageScore = 0; let utilityScore = 0; let equipmentSynergyScore = combined.score; let ascendancySynergyScore = 0
  for (const damage of skill.damageTypes ?? []) { const value = profile.damageTypes[damage]; const impact = Math.min(config.categoryLimit, value * config.damageWeight); if (impact > 0) reasons.push(reason(`damage-${damage}`, 'damage', impact, skill, [`damageTypes.${damage}`])); damageScore += impact }
  for (const rule of SKILL_RULES.filter(item => item.enabled && item.requiredSkillTags?.every(tag => skill.tags.includes(tag)))) { const fields = rule.requiredProfileFields ?? []; const raw = fields.reduce((sum, field) => sum + fieldValue(profile, field), 0); const impact = Math.min(rule.maximumContribution ?? config.categoryLimit, raw * rule.weight); if (impact > 0) reasons.push(reason(rule.reasonCode, rule.affectedScoreCategory, impact, skill, fields)); if (rule.affectedScoreCategory === 'utility') utilityScore += impact }
  if (skill.preferredClassIds?.includes(input.character.classId)) { reasons.push(reason('preferred-class', 'equipment-synergy', config.classPreferenceBonus, skill)); equipmentSynergyScore += config.classPreferenceBonus }
  if (skill.preferredAscendancyIds?.includes(input.character.ascendancyId)) { reasons.push(reason('preferred-ascendancy', 'ascendancy-synergy', config.ascendancyPreferenceBonus, skill)); ascendancySynergyScore += config.ascendancyPreferenceBonus }
  if (skill.tags.includes('defensive')) { const impact = profile.defence.generalDefenceNeed * config.defenceWeight; reasons.push(reason('defensive-fit', 'defence', impact, skill, ['defence.generalDefenceNeed'])) }
  if ((skill.resourceAffinity ?? 0) > 0) { const impact = (config.scoreMax - profile.requirements.resourceNeed) * (skill.resourceAffinity ?? 0) / config.scoreMax * config.resourceWeight; reasons.push(reason('resource-fit', 'resource', impact, skill, ['requirements.resourceNeed'])) }
  const mappingBase = skill.mappingBase ?? config.defaultBaseScore; const bossBase = skill.bossBase ?? config.defaultBaseScore
  const mappingBonus = skill.tags.filter(tag => ['area', 'projectile', 'movement'].includes(tag)).length * config.mappingTagBonus
  const bossBonus = skill.tags.includes('debuff') ? config.bossTagBonus : 0
  const mappingScore = clamp((mappingBase + mappingBonus + combined.score / 2) * config.mappingGoalWeights[input.goalProfile], config)
  const bossScore = clamp((bossBase + bossBonus + combined.score / 2) * config.bossGoalWeights[input.goalProfile], config)
  reasons.push(reason('mapping-fit', 'mapping', mappingScore, skill)); reasons.push(reason('boss-fit', 'boss', bossScore, skill))
  const dominantFields = [...Object.entries(profile.damageTypes).filter(([, value]) => value >= config.profileStrong).map(([key]) => `damageTypes.${key}`), ...Object.entries(profile.mechanics).filter(([, value]) => value >= config.profileStrong).map(([key]) => `mechanics.${key}`)]
  const unusedDominantProfileFields = dominantFields.filter(field => !combined.matched.includes(field) && !combined.weak.includes(field)).sort()
  const conflictingProfileFields: string[] = []
  if (skill.tags.includes('attack') && profile.mechanics.spell >= config.profileStrong && profile.mechanics.attack < config.profileStrong) conflictingProfileFields.push('mechanics.spell')
  if (skill.tags.includes('spell') && profile.mechanics.attack >= config.profileStrong && profile.mechanics.spell < config.profileStrong) conflictingProfileFields.push('mechanics.attack')
  if (skill.tags.includes('melee') && profile.mechanics.projectile >= config.profileStrong) conflictingProfileFields.push('mechanics.projectile')
  if (skill.tags.includes('projectile') && profile.mechanics.melee >= config.profileStrong) conflictingProfileFields.push('mechanics.melee')
  if (unusedDominantProfileFields.length) reasons.push(reason('unused-dominant-profile', 'equipment-synergy', -unusedDominantProfileFields.length * config.unusedDominantPenalty, skill, unusedDominantProfileFields))
  if (conflictingProfileFields.length) reasons.push(reason('conflicting-profile', 'equipment-synergy', -conflictingProfileFields.length * config.conflictingDamagePenalty, skill, conflictingProfileFields))
  if (input.equipmentAnalysis.conflictLevel >= config.conflictWarning) warnings.push(warning('equipment-conflict', skill))
  if (input.equipmentAnalysis.profileClarity < config.mediumClarity) warnings.push(warning('low-profile-clarity', skill))
  if ((skill.tags.includes('attack') && skill.tags.includes('spell')) || (skill.damageTypes?.length ?? 0) > 1) warnings.push(warning('mixed-skill-profile', skill))
  const roles = determineRoles(skill, damageScore)
  const setDifference = set1.score - set2.score
  let preferredWeaponSet: SkillRecommendation['preferredWeaponSet'] = Math.abs(setDifference) <= config.setTieTolerance || roles.recommended === 'utility' || roles.recommended === 'movement' ? 'both' : setDifference > 0 ? 'set-1' : 'set-2'
  if (skill.preferredWeaponSet && skill.preferredWeaponSet !== 'both' && Math.abs(setDifference) <= config.preferredSetBonus) preferredWeaponSet = skill.preferredWeaponSet
  reasons.push(reason('weapon-set-fit', 'equipment-synergy', Math.max(set1.score, set2.score), skill, [preferredWeaponSet]))
  reasons.push(reason('recommended-role', roles.recommended === 'main' ? 'damage' : 'utility', config.utilityTagBonus, skill, [roles.recommended]))
  const categoryScores = Object.fromEntries(reasons.map(item => [item.category, clamp(reasons.filter(other => other.category === item.category).reduce((sum, other) => sum + other.impact, 0), config)]))
  const technicalScore = clamp((damageScore + utilityScore + equipmentSynergyScore + ascendancySynergyScore + mappingScore + bossScore) / config.totalScoreDivisor + reasons.filter(item => item.impact < 0).reduce((sum, item) => sum + item.impact, 0), config)
  const confidence = input.equipmentAnalysis.profileClarity >= config.highClarity && combined.matched.length ? 'high' : input.equipmentAnalysis.profileClarity >= config.mediumClarity ? 'medium' : 'low'
  const valid = !violations.some(item => item.blocking)
  return { targetId: skill.id, skillId: skill.id, totalScore: technicalScore, eligibility: valid ? 'eligible' : 'blocked', recommendedRole: roles.recommended, possibleRoles: roles.possible, suitability: roles.recommended, mappingScore, bossScore, damageScore: clamp(damageScore, config), utilityScore: clamp(utilityScore, config), equipmentSynergyScore: clamp(equipmentSynergyScore, config), ascendancySynergyScore: clamp(ascendancySynergyScore, config), scoreSet1: set1.score, scoreSet2: set2.score, preferredWeaponSet, setDifference, matchedProfileFields: combined.matched, weaklyMatchedProfileFields: combined.weak, unusedDominantProfileFields, conflictingProfileFields: [...new Set(conflictingProfileFields)].sort(), reasons, violations, warnings, categoryScores, confidence, status: 'experimental', valid, analyzerVersion: SKILL_ANALYZER_VERSION }
}

function analyzeRanked(profile: BuildProfile, candidates: SkillGemDefinition[], context: AnalyzerContext, input: SkillAnalyzerInput | undefined, config: SkillAnalyzerConfig = SYNTHETIC_SKILL_CONFIG): SkillAnalysis {
  context.trace?.push('skills')
  const resolvedInput = input ?? defaultInput(profile, config)
  const allCandidates = [...candidates].sort((a, b) => a.id.localeCompare(b.id)).map(skill => recommend(skill, profile, resolvedInput, config))
  const ranked = [...allCandidates].sort((a, b) => Number(b.valid) - Number(a.valid) || b.totalScore - a.totalScore || a.skillId.localeCompare(b.skillId))
  const eligibleCandidates = ranked.filter(item => item.valid); const blockedCandidates = ranked.filter(item => !item.valid)
  return { allCandidates: ranked, eligibleCandidates, blockedCandidates, topMainCandidates: eligibleCandidates.filter(item => item.possibleRoles.includes('main')).slice(0, config.topCandidateCount), topUtilityCandidates: eligibleCandidates.filter(item => item.possibleRoles.includes('utility')), topMovementCandidates: eligibleCandidates.filter(item => item.possibleRoles.includes('movement')), mappingRanking: stable(eligibleCandidates, item => item.mappingScore), bossRanking: stable(eligibleCandidates, item => item.bossScore), status: 'experimental', analyzerVersion: SKILL_ANALYZER_VERSION }
}

export const skillAnalyzer: SkillAnalyzer = { analyze(profile, candidates, context, input, config) { return analyzeRanked(profile, candidates, context, input, config).allCandidates }, analyzeRanked }
