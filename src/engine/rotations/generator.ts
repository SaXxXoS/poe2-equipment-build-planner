import type { SkillGemDefinition } from '../../domain'
import type { AnalyzerContext, BossRotation, Confidence, ConstraintViolation, MappingRotation, RotationAnalysis, RotationCondition, RotationGeneratorInput, RotationPlan, RotationSkillRole, RotationStepAnalysis, RotationWeaponSet, SkillRecommendation } from '../common/types'
import { ROTATION_CONFIG, ROTATION_GENERATOR_VERSION } from './config'
import { ROTATION_RULES } from './rules'

type Candidate = { definition: SkillGemDefinition; recommendation: SkillRecommendation; role: RotationSkillRole; weaponSet: RotationWeaponSet }
const ALL_ROLES: RotationSkillRole[] = ['setup', 'debuff', 'buff', 'main-damage', 'secondary-damage', 'movement', 'defensive']
const violation = (code: string, blocking: boolean, sourceId?: string, relatedIds: string[] = []): ConstraintViolation => ({ code, severity: blocking ? 'error' : 'warning', messageKey: `rotation.${code}`, sourceId, relatedIds, blocking })
const toRole = (definition: SkillGemDefinition, recommendation: SkillRecommendation): RotationSkillRole => {
  if (definition.rotationRoles?.length) return [...definition.rotationRoles].sort()[0]
  if (definition.tags.includes('debuff')) return 'debuff'
  if (definition.tags.includes('buff')) return 'buff'
  if (definition.tags.includes('movement')) return 'movement'
  if (definition.tags.includes('defensive')) return 'defensive'
  if (recommendation.recommendedRole === 'main') return 'main-damage'
  if (recommendation.recommendedRole === 'secondary') return 'secondary-damage'
  return 'setup'
}
const actionFor = (role: RotationSkillRole) => role === 'movement' ? 'move' : role === 'defensive' ? 'defensive-response' : 'use-skill'
const confidence = (score: number): Confidence => score >= ROTATION_CONFIG.confidence.highMinimum ? 'high' : score >= ROTATION_CONFIG.confidence.mediumMinimum ? 'medium' : 'low'
const conditionFor = (role: RotationSkillRole): RotationCondition => role === 'debuff' ? 'on-debuff-expired' : role === 'buff' ? 'on-buff-expired' : role === 'defensive' ? 'on-danger' : 'continuous'

function candidates(input: RotationGeneratorInput): Candidate[] {
  return input.selectedSkills.flatMap(recommendation => {
    const definition = input.skillDefinitions.find(item => item.id === recommendation.skillId)
    if (!definition) return []
    return [{ definition, recommendation, role: toRole(definition, recommendation), weaponSet: recommendation.preferredWeaponSet }]
  }).sort((a, b) => a.definition.id.localeCompare(b.definition.id))
}

function ordered(type: 'mapping' | 'boss', values: Candidate[]): Candidate[] {
  const rank: Record<RotationSkillRole, number> = type === 'mapping'
    ? { movement: 10, setup: 20, debuff: 30, buff: 40, 'main-damage': 50, 'secondary-damage': 60, defensive: 70 }
    : { setup: 10, debuff: 20, buff: 30, movement: 40, 'main-damage': 50, 'secondary-damage': 60, defensive: 70 }
  const eligible = type === 'mapping' ? values.filter(item => !['buff', 'defensive', 'secondary-damage'].includes(item.role)) : values
  const limited = type === 'mapping' ? eligible.filter((item, index, all) => item.role !== 'setup' || all.slice(0, index).filter(previous => previous.role === 'setup').length < ROTATION_CONFIG.mappingMaximumSetupSteps) : eligible
  const effectiveRank = (item: Candidate) => item.definition.affectsNextSkill ? rank['main-damage'] - 1 : rank[item.role]
  return limited.sort((a, b) => effectiveRank(a) - effectiveRank(b) || a.definition.id.localeCompare(b.definition.id))
}

function plan(type: 'mapping' | 'boss', input: RotationGeneratorInput): RotationPlan {
  const values = candidates(input)
  const available = new Set(input.availableWeaponSets ?? ['set-1', 'set-2'])
  const violations: ConstraintViolation[] = []
  const warnings: ConstraintViolation[] = []
  for (const recommendation of input.selectedSkills) {
    const definition = input.skillDefinitions.find(item => item.id === recommendation.skillId)
    if (!definition) violations.push(violation('unknown-skill-reference', true, recommendation.skillId))
    else if (!recommendation.valid || recommendation.eligibility === 'blocked' || definition.blockedForRotation || definition.enabled === false) violations.push(violation('blocked-skill', true, definition.id))
    if (recommendation.preferredWeaponSet !== 'both' && recommendation.preferredWeaponSet !== 'none' && !available.has(recommendation.preferredWeaponSet)) violations.push(violation('weapon-set-unavailable', true, recommendation.skillId))
  }
  const main = values.filter(item => item.role === 'main-damage' && item.recommendation.valid)
  if (!main.length) violations.push(violation('main-damage-missing', true))
  const present = new Set(values.map(item => item.role))
  const missingRoles = ALL_ROLES.filter(role => !present.has(role))
  if (type === 'mapping') {
    if (!present.has('movement')) warnings.push(violation('mapping-movement-missing', false))
    if (!values.some(item => item.role === 'main-damage' && (item.definition.tags.includes('area') || item.definition.tags.includes('projectile')))) warnings.push(violation('mapping-area-skill-missing', false))
  } else {
    if (!present.has('debuff')) warnings.push(violation('boss-debuff-missing', false))
    if (!present.has('buff')) warnings.push(violation('boss-buff-missing', false))
  }
  const sequence = ordered(type, values.filter(item => item.recommendation.valid && item.recommendation.eligibility !== 'blocked'))
  const steps: RotationStepAnalysis[] = []
  let currentSet: RotationWeaponSet | undefined
  let counter = 0
  for (const item of sequence) {
    const targetSet = item.weaponSet
    if (currentSet && currentSet !== 'both' && currentSet !== 'none' && targetSet !== 'both' && targetSet !== 'none' && currentSet !== targetSet) {
      steps.push({ stepId: `${type}-step-${String(++counter).padStart(2, '0')}-switch`, order: counter, rotationType: type, actionType: 'switch-weapon-set', weaponSet: targetSet, previousWeaponSet: currentSet, nextWeaponSet: targetSet, reasonCodes: ['rotation-switch-weapon-set'], sourceRecommendationIds: [steps.at(-1)?.skillId ?? '', item.recommendation.skillId].filter(Boolean), warnings: [], status: 'experimental', confidence: 'high' })
    }
    const stepWarnings: ConstraintViolation[] = []
    if (item.definition.expiresOnWeaponSwap && item.role === 'setup' && targetSet !== 'both' && main.some(value => value.weaponSet !== targetSet && value.weaponSet !== 'both')) stepWarnings.push(violation('effect-expires-on-weapon-swap', false, item.definition.id))
    steps.push({ stepId: `${type}-step-${String(++counter).padStart(2, '0')}-${item.definition.id}`, order: counter, rotationType: type, actionType: actionFor(item.role), skillId: item.definition.id, skillRole: item.role, weaponSet: targetSet, reasonCodes: [ROTATION_RULES.find(rule => rule.applicableRotationTypes.includes(type) && rule.requiredSkillRoles?.includes(item.role))?.reasonCode ?? `rotation-${item.role}`], sourceRecommendationIds: [item.recommendation.skillId], durationCondition: item.definition.durationCategory, activationCondition: item.role === 'defensive' ? 'on-danger' : 'once', warnings: stepWarnings, status: 'experimental', confidence: item.recommendation.confidence })
    if (targetSet !== 'both' && targetSet !== 'none') currentSet = targetSet
    warnings.push(...stepWarnings)
  }
  const repeatCondition: RotationCondition = type === 'mapping' ? 'on-enemy-group' : 'on-boss-phase'
  steps.push({ stepId: `${type}-step-${String(++counter).padStart(2, '0')}-repeat`, order: counter, rotationType: type, actionType: 'repeat', weaponSet: currentSet ?? 'none', reasonCodes: ['rotation-repeat-sequence'], sourceRecommendationIds: main.map(item => item.recommendation.skillId), repeatCondition, warnings: [], status: 'experimental', confidence: main.length ? 'high' : 'low' })
  const maintenanceSequence = sequence.filter(item => item.definition.canBeMaintained || item.definition.refreshRequired).map((item, index): RotationStepAnalysis => ({ stepId: `${type}-maintenance-${String(index + 1).padStart(2, '0')}-${item.definition.id}`, order: index + 1, rotationType: type, actionType: item.role === 'debuff' ? 'refresh-debuff' : 'maintain-buff', skillId: item.definition.id, skillRole: item.role, weaponSet: item.weaponSet, reasonCodes: [item.role === 'debuff' ? 'rotation-refresh-debuff' : 'rotation-maintain-buff'], sourceRecommendationIds: [item.recommendation.skillId], repeatCondition: conditionFor(item.role), durationCondition: item.definition.durationCategory, warnings: [], status: 'experimental', confidence: item.recommendation.confidence }))
  const swapCount = steps.filter(item => item.actionType === 'switch-weapon-set').length
  if (swapCount >= (type === 'mapping' ? ROTATION_CONFIG.mappingFrequentSwapCount : ROTATION_CONFIG.bossFrequentSwapCount)) warnings.push(violation('frequent-weapon-swaps', false))
  const setupCount = steps.filter(item => item.skillRole === 'setup').length
  if (type === 'mapping' && setupCount > ROTATION_CONFIG.mappingMaximumSetupSteps) warnings.push(violation('mapping-too-many-setup-steps', false))
  const distinctSkills = new Set(steps.flatMap(item => item.skillId ? [item.skillId] : [])).size
  const high = steps.length >= ROTATION_CONFIG.complexity.highStepCount || swapCount >= ROTATION_CONFIG.complexity.highSwapCount || maintenanceSequence.length >= ROTATION_CONFIG.complexity.highMaintenanceCount || setupCount >= ROTATION_CONFIG.complexity.highSetupCount || distinctSkills >= ROTATION_CONFIG.complexity.highDistinctSkillCount
  const estimatedComplexity = high ? 'high' : steps.length >= ROTATION_CONFIG.complexity.mediumStepCount || swapCount > 0 || maintenanceSequence.length > 0 ? 'medium' : 'low'
  if (estimatedComplexity === 'high') warnings.push(violation('rotation-complexity-high', false))
  let confidenceScore = Math.min(input.profileClarity ?? 100, ROTATION_CONFIG.confidence.base)
  for (const item of sequence) confidenceScore -= item.recommendation.confidence === 'low' ? ROTATION_CONFIG.confidence.lowSkillPenalty : item.recommendation.confidence === 'medium' ? ROTATION_CONFIG.confidence.mediumSkillPenalty : 0
  confidenceScore -= warnings.length * ROTATION_CONFIG.confidence.warningPenalty
  if (input.uniqueAnalysis?.eligibleCandidates.some(item => item.buildEnabler && item.requiresReoptimization)) { confidenceScore -= ROTATION_CONFIG.confidence.buildEnablerReoptimizationPenalty; warnings.push(violation('build-enabler-reoptimization-required', false)) }
  const duplicateIds = steps.filter((step, index) => steps.findIndex(item => item.stepId === step.stepId) !== index)
  if (duplicateIds.length) violations.push(violation('duplicate-step-id', true, duplicateIds[0].stepId))
  const orders = steps.map(item => item.order)
  if (new Set(orders).size !== orders.length) violations.push(violation('non-unique-order', true))
  const mainIndex = steps.findIndex(item => item.skillRole === 'main-damage')
  if (steps.some((item, index) => item.skillRole === 'setup' && index > mainIndex && mainIndex >= 0)) violations.push(violation('setup-after-main-damage', true))
  if (steps.some(item => item.actionType === 'repeat' && !item.repeatCondition)) violations.push(violation('cyclic-dependency-without-condition', true))
  const blocked = violations.some(item => item.blocking)
  const openingSequence = steps.filter(item => item.actionType !== 'repeat' && item.skillRole !== 'defensive')
  const repeatSequence = steps.filter(item => item.actionType === 'repeat')
  const emergencySteps = steps.filter(item => item.skillRole === 'defensive')
  return { rotationId: `synthetic-${type}-rotation`, rotationType: type, type, steps, openingSequence, maintenanceSequence, repeatSequence, emergencySteps, requiredSkills: [...new Set(steps.flatMap(item => item.skillId ? [item.skillId] : []))].sort(), requiredWeaponSets: [...new Set(steps.map(item => item.weaponSet).filter((set): set is 'set-1' | 'set-2' | 'both' => set !== 'none'))].sort(), weaponSwapCount: swapCount, estimatedComplexity, missingRoles, warnings, violations, reasonCodes: [...new Set(steps.flatMap(item => item.reasonCodes))], confidence: confidence(confidenceScore), status: blocked ? 'placeholder' : 'experimental', generatorVersion: ROTATION_GENERATOR_VERSION }
}

export interface RotationGenerator { generate(input: RotationGeneratorInput, context: AnalyzerContext): RotationAnalysis; validatePlan(plan: RotationPlan): ConstraintViolation[] }
export const rotationGenerator: RotationGenerator = {
  generate(input, context) { context.trace?.push('rotations'); const mappingRotation = plan('mapping', input) as MappingRotation; const bossRotation = plan('boss', input) as BossRotation; const allPlans = [mappingRotation, bossRotation]; const violations = allPlans.flatMap(item => item.violations); const warnings = allPlans.flatMap(item => item.warnings); const validPlans = allPlans.filter(item => !item.violations.some(value => value.blocking)); const blockedPlans = allPlans.filter(item => item.violations.some(value => value.blocking)); return { mappingRotation, bossRotation, allPlans, validPlans, blockedPlans, preferredMappingPlan: validPlans.includes(mappingRotation) ? mappingRotation : undefined, preferredBossPlan: validPlans.includes(bossRotation) ? bossRotation : undefined, warnings, violations, status: blockedPlans.length ? 'placeholder' : 'experimental', generatorVersion: ROTATION_GENERATOR_VERSION } },
  validatePlan(value) { const result: ConstraintViolation[] = []; if (new Set(value.steps.map(item => item.stepId)).size !== value.steps.length) result.push(violation('duplicate-step-id', true)); if (new Set(value.steps.map(item => item.order)).size !== value.steps.length) result.push(violation('non-unique-order', true)); if (!value.steps.some(item => item.skillRole === 'main-damage')) result.push(violation('main-damage-missing', true)); const mainIndex = value.steps.findIndex(item => item.skillRole === 'main-damage'); if (value.steps.some((item, index) => item.skillRole === 'setup' && index > mainIndex && mainIndex >= 0)) result.push(violation('setup-after-main-damage', true)); if (value.steps.some(item => item.actionType === 'repeat' && !item.repeatCondition)) result.push(violation('cyclic-dependency-without-condition', true)); return result },
}
