import type { AnalyzerContext, Confidence, ConstraintViolation, ExplainabilityTrace, ExplanationEntry, ExplanationGeneratorInput, ExplanationResult, ExplanationSection, ExplanationTone, RotationPlan, ScoreReason } from '../common/types'
import { ACTION_TEXT, CONFIDENCE_TEXT, EXPLANATION_GENERATOR_VERSION, EXPLANATION_LABELS, EXPLANATION_PRIORITIES, LIMITATION_CODE, SECTION_PRIORITY, WEAPON_SET_TEXT } from './config'
import { EXPLANATION_TEMPLATES, type ExplanationTemplate } from './templates'

type Observation = { matchCode: string; sourceCode: string; sourceIds: string[]; recommendationIds: string[]; impact?: number; confidence: Confidence; tone: ExplanationTone; warningLevel: 'none' | 'warning' | 'error'; placeholders: Record<string, string>; omitted?: string[] }
const matches = (pattern: string, code: string) => pattern.endsWith('*') ? code.startsWith(pattern.slice(0, -1)) : pattern === code
const templateFor = (code: string) => EXPLANATION_TEMPLATES.filter(item => item.enabled).find(item => item.supportedReasonCodes.some(pattern => matches(pattern, code)))
const render = (template: string, values: Record<string, string>) => template.replace(/\{([a-zA-Z]+)\}/g, (_, key: string) => values[key] ?? `{${key}}`)
const unique = (values: string[]) => [...new Set(values.filter(Boolean))].sort()
const reasonLabel = (code: string) => code.replaceAll('-', ' ')
const KNOWN_REASON_PREFIXES = ['equipment-', 'damage-', 'skill-', 'support-', 'passive-', 'jewel-', 'unique-', 'tradeoff-']
const KNOWN_REASON_CODES = new Set(['mapping-fit', 'boss-fit', 'recommended-role', 'unused-dominant-profile', 'conflicting-profile', 'unused-modifier', 'weakly-used-modifier', 'conflicting-modifier', 'profile-clarity', 'conflict-level', 'weapon-set-fit', 'path-efficiency', 'node-type', 'useful-path-node', 'keystone-trade-off', 'defence-need', 'requirement-need', 'ascendancy-synergy', 'build-enabler', 'preferred-class', 'preferred-ascendancy', 'defensive-fit', 'resource-fit'])
const isKnownReason = (code: string) => KNOWN_REASON_CODES.has(code) || KNOWN_REASON_PREFIXES.some(prefix => code.startsWith(prefix))
const weaponLabel = (value?: string) => WEAPON_SET_TEXT[value ?? 'none'] ?? WEAPON_SET_TEXT.none
const actionLabel = (value: string) => ACTION_TEXT[value] ?? value

function nameResolver(input: ExplanationGeneratorInput, missing: Set<string>) {
  return (id?: string) => { if (!id) return EXPLANATION_LABELS.structuredAction; const displayName = input.displayNames[id]?.trim(); if (displayName) return displayName; missing.add(id); return id }
}

function recommendationData(input: ExplanationGeneratorInput, sourceId?: string) {
  const skill = input.skillAnalysis.allCandidates.find(item => item.skillId === sourceId)
  const support = input.supportAnalysis.allCandidates.find(item => item.supportId === sourceId)
  const passive = input.passiveAnalysis.allCandidates.find(item => item.recommendationId === sourceId || item.nodeId === sourceId || item.clusterId === sourceId)
  const jewel = input.jewelAnalysis.allCandidates.find(item => item.jewelId === sourceId)
  const uniqueItem = input.uniqueAnalysis.allCandidates.find(item => item.uniqueId === sourceId)
  return { skill, support, passive, jewel, uniqueItem, confidence: skill?.confidence ?? support?.confidence ?? passive?.confidence ?? jewel?.confidence ?? uniqueItem?.confidence ?? 'medium' as Confidence }
}

function fromReason(reason: ScoreReason, input: ExplanationGeneratorInput, getName: (id?: string) => string): Observation {
  const data = recommendationData(input, reason.sourceId)
  const prefix = reason.sourceType === 'equipment' ? 'equipment' : reason.sourceType
  const matchCode = isKnownReason(reason.code) ? `${prefix}:${reason.code}` : `unresolved:${reason.code}`
  const recommendation = data.skill ?? data.support ?? data.passive ?? data.jewel ?? data.uniqueItem
  const pathCost = data.passive?.totalPointCost ?? data.jewel?.totalPointCost ?? 0
  const itemSlot = data.uniqueItem?.itemSlot ?? EXPLANATION_LABELS.unspecifiedSlot
  const weaponSet = data.skill?.preferredWeaponSet ?? data.support?.preferredWeaponSet ?? data.passive?.preferredWeaponSet ?? data.jewel?.preferredWeaponSet ?? data.uniqueItem?.preferredWeaponSet
  const mechanic = reason.affectedTags.length ? reason.affectedTags.join(', ') : EXPLANATION_LABELS.profileFields
  return { matchCode, sourceCode: reason.code, sourceIds: reason.sourceId ? [reason.sourceId] : [], recommendationIds: recommendation ? [recommendation.targetId] : [], impact: reason.impact, confidence: data.confidence, tone: reason.polarity === 'negative' ? 'warning' : reason.polarity === 'positive' ? 'positive' : 'neutral', warningLevel: reason.polarity === 'negative' ? 'warning' : 'none', placeholders: { reason: reasonLabel(reason.code), entityName: getName(reason.sourceId), skillName: getName(reason.sourceId), supportName: getName(reason.sourceId), uniqueName: getName(reason.sourceId), mechanic, damageType: mechanic, weaponSet: weaponLabel(weaponSet), scoreImpact: String(reason.impact), pathCost: String(pathCost), itemSlot, confidence: data.confidence, confidenceText: CONFIDENCE_TEXT[data.confidence] } }
}

function fromViolation(value: ConstraintViolation, getName: (id?: string) => string): Observation {
  const matchCode = value.blocking ? 'violation:any' : 'warning:any'
  return { matchCode, sourceCode: value.code, sourceIds: unique([value.sourceId ?? '', ...value.relatedIds]), recommendationIds: value.sourceId ? [value.sourceId] : [], impact: 0, confidence: 'low', tone: value.blocking ? 'blocking' : 'warning', warningLevel: value.severity, placeholders: { reason: reasonLabel(value.code), entityName: getName(value.sourceId), confidence: 'low', confidenceText: CONFIDENCE_TEXT.low } }
}

function rotationObservations(plan: RotationPlan, getName: (id?: string) => string): Observation[] {
  return plan.steps.map((step, index) => {
    const previous = [...plan.steps.slice(0, index)].reverse().find(item => item.skillId)
    const next = plan.steps.slice(index + 1).find(item => item.skillId)
    const sourceCode = step.reasonCodes[0]
    const isSwap = step.actionType === 'switch-weapon-set'
    const effectStatus = previous?.durationCondition === 'persistent' ? EXPLANATION_LABELS.persistentEffect : previous?.warnings.some(item => item.code === 'effect-expires-on-weapon-swap') ? EXPLANATION_LABELS.expiringEffect : EXPLANATION_LABELS.unknownEffect
    const condition = step.repeatCondition ?? step.activationCondition ?? EXPLANATION_LABELS.noCondition
    return { matchCode: isSwap ? 'rotation:weapon-swap' : `rotation:${plan.rotationType}:${sourceCode}`, sourceCode, sourceIds: unique([step.skillId ?? '', ...step.sourceRecommendationIds]), recommendationIds: step.sourceRecommendationIds, confidence: step.confidence, tone: step.warnings.length ? 'warning' : 'neutral', warningLevel: step.warnings.length ? 'warning' : 'none', placeholders: { order: String(step.order), action: actionLabel(step.actionType), skillName: getName(step.skillId), weaponSet: weaponLabel(step.weaponSet), reason: reasonLabel(sourceCode), condition: reasonLabel(condition), effectStatus, previousWeaponSet: weaponLabel(step.previousWeaponSet), nextWeaponSet: weaponLabel(step.nextWeaponSet), previousSkill: getName(previous?.skillId), nextSkill: getName(next?.skillId), confidence: step.confidence, confidenceText: CONFIDENCE_TEXT[step.confidence], entityName: getName(step.skillId) }, omitted: step.warnings.map(item => item.code) }
  })
}

function structuredObservations(input: ExplanationGeneratorInput, getName: (id?: string) => string): Observation[] {
  const values: Observation[] = []
  const topMain = input.skillAnalysis.topMainCandidates[0]
  if (topMain) { const sourceCode = topMain.reasons[0]?.code ?? 'recommended-role'; values.push({ matchCode: 'summary:build', sourceCode, sourceIds: [topMain.skillId], recommendationIds: [topMain.targetId], confidence: topMain.confidence, tone: 'neutral', warningLevel: 'none', placeholders: { skillName: getName(topMain.skillId), reason: reasonLabel(sourceCode) } }) }
  for (const item of input.skillAnalysis.eligibleCandidates.filter(candidate => candidate.recommendedRole !== 'main')) { const sourceCode = item.reasons[0]?.code ?? 'recommended-role'; values.push({ matchCode: 'additional-skill', sourceCode, sourceIds: [item.skillId], recommendationIds: [item.targetId], confidence: item.confidence, tone: 'neutral', warningLevel: 'none', placeholders: { skillName: getName(item.skillId), reason: reasonLabel(sourceCode), weaponSet: weaponLabel(item.preferredWeaponSet) } }) }
  const confidenceItems = [input.skillAnalysis.topMainCandidates[0], input.supportAnalysis.topCandidates[0], input.passiveAnalysis.eligibleCandidates[0], input.jewelAnalysis.eligibleCandidates[0], input.uniqueAnalysis.eligibleCandidates[0]].filter(Boolean)
  for (const item of confidenceItems) values.push({ matchCode: `confidence:${item.confidence}`, sourceCode: `confidence-${item.confidence}`, sourceIds: [item.targetId], recommendationIds: [item.targetId], confidence: item.confidence, tone: item.confidence === 'low' ? 'warning' : 'neutral', warningLevel: item.confidence === 'low' ? 'warning' : 'none', placeholders: { confidence: item.confidence, confidenceText: CONFIDENCE_TEXT[item.confidence], entityName: getName(item.targetId) } })
  for (const item of input.uniqueAnalysis.allCandidates) {
    values.push({ matchCode: 'unique-replacement-verdict', sourceCode: 'unique-replacement-verdict', sourceIds: [item.uniqueId], recommendationIds: [item.recommendationId], confidence: item.confidence, tone: item.replacementVerdict === 'downgrade' ? 'warning' : 'neutral', warningLevel: item.replacementVerdict === 'downgrade' ? 'warning' : 'none', placeholders: { uniqueName: getName(item.uniqueId), reason: reasonLabel(item.replacementVerdict) } })
    if (item.requiresReoptimization) values.push({ matchCode: 'unique-reoptimization', sourceCode: 'unique-reoptimization', sourceIds: [item.uniqueId, ...item.affectedModules], recommendationIds: [item.recommendationId], confidence: item.confidence, tone: 'warning', warningLevel: 'warning', placeholders: { uniqueName: getName(item.uniqueId), reason: `${EXPLANATION_LABELS.reoptimization} ${item.affectedModules.join(', ')}` } })
    if (item.gainedMechanics.length) values.push({ matchCode: 'unique-gained-mechanics', sourceCode: 'unique-gained-mechanics', sourceIds: [item.uniqueId], recommendationIds: [item.recommendationId], confidence: item.confidence, tone: 'neutral', warningLevel: 'none', placeholders: { uniqueName: getName(item.uniqueId), reason: `${EXPLANATION_LABELS.gainedMechanics} ${item.gainedMechanics.join(', ')}` } })
    if (item.lostMechanics.length) values.push({ matchCode: 'unique-lost-mechanics', sourceCode: 'unique-lost-mechanics', sourceIds: [item.uniqueId], recommendationIds: [item.recommendationId], confidence: item.confidence, tone: 'warning', warningLevel: 'warning', placeholders: { uniqueName: getName(item.uniqueId), reason: `${EXPLANATION_LABELS.lostMechanics} ${item.lostMechanics.join(', ')}` } })
  }
  values.push(...rotationObservations(input.rotationAnalysis.mappingRotation, getName), ...rotationObservations(input.rotationAnalysis.bossRotation, getName))
  values.push({ matchCode: LIMITATION_CODE, sourceCode: LIMITATION_CODE, sourceIds: ['engine'], recommendationIds: [], confidence: 'low', tone: 'warning', warningLevel: 'warning', placeholders: {} })
  return values
}

function priority(template: ExplanationTemplate, observation: Observation) {
  if (observation.tone === 'blocking') return EXPLANATION_PRIORITIES.blocking
  if (observation.tone === 'warning') return Math.max(template.priority, EXPLANATION_PRIORITIES.warning)
  return template.section === 'mapping-rotation' || template.section === 'boss-rotation' || template.section === 'weapon-swap' ? template.priority - Number(observation.placeholders.order ?? '0') / 100 : template.priority
}

export interface ExplanationGenerator { generate(input: ExplanationGeneratorInput, context: AnalyzerContext): ExplanationResult }
export const explanationGenerator: ExplanationGenerator = { generate(input, context) {
  context.trace?.push('explanations')
  const missing = new Set<string>(); const getName = nameResolver(input, missing)
  const observations = [...input.violations.map(item => fromViolation(item, getName)), ...input.reasons.map(item => fromReason(item, input, getName)), ...structuredObservations(input, getName)]
  const unresolvedReasonCodes = unique(observations.filter(item => !templateFor(item.matchCode)).map(item => item.sourceCode))
  const entries: ExplanationEntry[] = []; const traces: ExplainabilityTrace[] = []
  for (const [index, observation] of observations.entries()) {
    const template = templateFor(observation.matchCode); if (!template) continue
    const placeholders = Object.fromEntries(template.requiredPlaceholders.map(key => [key, observation.placeholders[key] ?? EXPLANATION_LABELS.missingPlaceholder]))
    const sourceKey = observation.sourceIds[0] ?? 'engine'; const explanationId = `explanation-${String(index + 1).padStart(4, '0')}-${template.templateId}-${sourceKey}`
    const entry: ExplanationEntry = { explanationId, section: template.section, priority: priority(template, observation), title: render(template.titleTemplateDe, placeholders), body: render(template.textTemplateDe, placeholders), shortBody: template.shortTemplateDe ? render(template.shortTemplateDe, placeholders) : undefined, tone: observation.tone === 'neutral' ? template.severity : observation.tone, sourceReasonCodes: [observation.sourceCode], sourceIds: observation.sourceIds, relatedRecommendationIds: observation.recommendationIds, impactSummary: observation.impact, confidence: observation.confidence, warningLevel: observation.warningLevel, status: 'experimental', templateId: template.templateId }
    entries.push(entry); traces.push({ explanationId, templateId: template.templateId, inputReasonCodes: [observation.sourceCode], inputSourceIds: observation.sourceIds, resolvedPlaceholders: placeholders, omittedReasons: observation.omitted ?? [], generatorVersion: EXPLANATION_GENERATOR_VERSION })
  }
  const sorted = entries.sort((a, b) => b.priority - a.priority || SECTION_PRIORITY[b.section] - SECTION_PRIORITY[a.section] || (a.sourceIds[0] ?? '').localeCompare(b.sourceIds[0] ?? '') || a.explanationId.localeCompare(b.explanationId))
  const sectionNames = unique(sorted.map(item => item.section)) as ExplanationSection[]
  const confidenceSummary: Record<Confidence, number> = { low: 0, medium: 0, high: 0 }; for (const item of sorted) confidenceSummary[item.confidence]++
  return { summary: sorted.filter(item => item.section === 'summary').slice(0, 5), sections: sectionNames.map(section => ({ section, entries: sorted.filter(item => item.section === section) })), allEntries: sorted, blockingEntries: sorted.filter(item => item.tone === 'blocking'), warningEntries: sorted.filter(item => item.tone === 'warning'), positiveEntries: sorted.filter(item => item.tone === 'positive'), rotationEntries: sorted.filter(item => ['mapping-rotation', 'boss-rotation', 'weapon-swap'].includes(item.section)), traces, unresolvedReasonCodes, missingDisplayNames: [...missing].sort(), confidenceSummary, limitations: sorted.filter(item => item.section === 'limitations'), status: 'experimental', generatorVersion: EXPLANATION_GENERATOR_VERSION }
} }
