import type { AppliedModifier, EquipmentEntry, MechanicTag, ModifierDefinition } from '../../domain'
import type { AnalyzerContext, AnalyzerResult, BuildProfile, ConstraintViolation, DamageType, DefenceType, EngineRequest, EquipmentAnalysis, ScoreReason, SpeedType, WeaponSetDifference } from '../common/types'
import { blankProfile, scored } from '../common/scoring'
import { SYNTHETIC_EQUIPMENT_CONFIG, type EquipmentAnalyzerConfig } from './config'
import { normalizeAffinity, normalizeContribution } from './normalization'
import { EQUIPMENT_RULES, type EquipmentProfileField, type EquipmentRule } from './rules'

export const EQUIPMENT_ANALYZER_VERSION = '0.2.0-synthetic'
type SetId = 'set-1' | 'set-2'
type DefinitionValue = { applied: AppliedModifier; definition: ModifierDefinition; rawValue: number; entry: EquipmentEntry }
type ProfileResult = { profile: BuildProfile; reasons: ScoreReason[]; contributions: Map<string, number>; tags: Set<MechanicTag>; attributes: Record<'strength' | 'dexterity' | 'intelligence', number>; resistanceTotal: number }

export interface EquipmentAnalyzer {
  analyze(request: EngineRequest, context: AnalyzerContext, modifiers: ModifierDefinition[], config?: EquipmentAnalyzerConfig): AnalyzerResult<{ equipmentAnalysis: EquipmentAnalysis; buildProfile: BuildProfile }>
}

const numericValue = (value: AppliedModifier['value']): number => typeof value === 'number' ? value : (value.min + value.max) / 2
const setForSlot = (slotId: string): SetId | undefined => slotId.includes('set-1') ? 'set-1' : slotId.includes('set-2') ? 'set-2' : undefined
const ruleMatches = (rule: EquipmentRule, definition: ModifierDefinition): boolean => rule.enabled && (rule.applicableModifierIds?.includes(definition.id) ?? rule.applicableTags?.some(tag => definition.relevantTags.includes(tag)) ?? false)

function addProfileValue(profile: BuildProfile, field: EquipmentProfileField, contribution: number): number {
  const [section, key] = field.split('.') as [keyof BuildProfile, string]
  const target = profile[section] as unknown as Record<string, number>
  target[key] = normalizeAffinity(target[key] + contribution)
  return target[key]
}

function analyzeProfile(values: DefinitionValue[], goal: EngineRequest['input']['goalProfile'], config: EquipmentAnalyzerConfig): ProfileResult {
  const profile = blankProfile()
  profile.goals = goal === 'mapping' ? { mappingWeight: 80, bossWeight: 30, defenceWeight: 40, damageWeight: 70 } : goal === 'boss' ? { mappingWeight: 30, bossWeight: 80, defenceWeight: 60, damageWeight: 70 } : profile.goals
  const reasons: ScoreReason[] = []
  const contributions = new Map<string, number>()
  const tags = new Set<MechanicTag>()
  const attributes = { strength: 0, dexterity: 0, intelligence: 0 }
  let resistanceTotal = 0

  for (const value of values) {
    value.definition.relevantTags.forEach(tag => tags.add(tag))
    if (value.definition.category === 'resistance') resistanceTotal += Math.max(0, value.rawValue)
    for (const attribute of Object.keys(attributes) as (keyof typeof attributes)[]) if (value.definition.id === `fixture-${attribute}`) attributes[attribute] += Math.max(0, value.rawValue)
    for (const rule of EQUIPMENT_RULES.filter(candidate => ruleMatches(candidate, value.definition))) {
      if (rule.minimumValue !== undefined && value.rawValue < rule.minimumValue) continue
      const contribution = normalizeContribution(value.rawValue, rule.weight, rule.maximumContribution, config)
      const result = addProfileValue(profile, rule.affectedProfileField, contribution)
      contributions.set(value.definition.id, (contributions.get(value.definition.id) ?? 0) + contribution)
      reasons.push({ code: rule.reasonCode, category: rule.affectedProfileField.startsWith('defence') ? 'defence' : rule.affectedProfileField.startsWith('speed') ? 'speed' : 'damage', messageKey: rule.descriptionKey, impact: contribution, polarity: 'positive', sourceType: 'equipment', sourceId: value.definition.id, affectedTags: value.definition.relevantTags, details: { ruleId: rule.ruleId, rawValue: value.rawValue, contribution, result, evidenceType: rule.evidenceType } })
    }
  }

  profile.defence.resistanceNeed = normalizeAffinity((config.resistanceTarget - resistanceTotal) / config.resistanceTarget * config.resistanceNeedScale, config)
  const defenceTotal = profile.defence.lifeAffinity + profile.defence.armourAffinity + profile.defence.evasionAffinity + profile.defence.energyShieldAffinity
  profile.defence.generalDefenceNeed = normalizeAffinity((config.defenceTarget - defenceTotal) / config.defenceTarget * config.affinityMax, config)
  profile.requirements.strengthNeed = normalizeAffinity(config.attributeTargets.strength - attributes.strength, config)
  profile.requirements.dexterityNeed = normalizeAffinity(config.attributeTargets.dexterity - attributes.dexterity, config)
  profile.requirements.intelligenceNeed = normalizeAffinity(config.attributeTargets.intelligence - attributes.intelligence, config)
  reasons.push({ code: 'equipment-resistance-need', category: 'defence', messageKey: 'engine.equipment.resistanceNeed', impact: -profile.defence.resistanceNeed, polarity: profile.defence.resistanceNeed > config.affinityMax / 2 ? 'negative' : 'neutral', sourceType: 'equipment', affectedTags: ['defensive'], details: { syntheticTarget: config.resistanceTarget, resistanceTotal, result: profile.defence.resistanceNeed } })
  reasons.push({ code: 'equipment-general-defence-need', category: 'defence', messageKey: 'engine.equipment.generalDefenceNeed', impact: -profile.defence.generalDefenceNeed, polarity: profile.defence.generalDefenceNeed > config.affinityMax / 2 ? 'negative' : 'neutral', sourceType: 'equipment', affectedTags: ['defensive'], details: { syntheticTarget: config.defenceTarget, defenceTotal, result: profile.defence.generalDefenceNeed } })
  return { profile, reasons, contributions, tags, attributes, resistanceTotal }
}

function ranked<T extends string>(values: Record<T, number>): T[] { return (Object.entries(values) as [T, number][]).sort(([idA, scoreA], [idB, scoreB]) => scoreB - scoreA || idA.localeCompare(idB)).map(([id]) => id) }
const dominant = <T extends string>(values: Record<T, number>): T | undefined => { const result = ranked(values); return result.length && values[result[0]] > 0 ? result[0] : undefined }
const flatProfile = (profile: BuildProfile): Record<string, number> => ({ ...Object.fromEntries(Object.entries(profile.damageTypes).map(([key, value]) => [`damageTypes.${key}`, value])), ...Object.fromEntries(Object.entries(profile.mechanics).map(([key, value]) => [`mechanics.${key}`, value])), ...Object.fromEntries(Object.entries(profile.speed).map(([key, value]) => [`speed.${key}`, value])), ...Object.fromEntries(Object.entries(profile.defence).map(([key, value]) => [`defence.${key}`, value])) })
function setDifferences(set1: BuildProfile, set2: BuildProfile): WeaponSetDifference[] { const left = flatProfile(set1); const right = flatProfile(set2); return Object.keys(left).sort().map(field => ({ field, set1Value: left[field], set2Value: right[field], delta: left[field] - right[field] })).filter(item => item.delta !== 0) }
function specialization(profile: BuildProfile): string[] { return [...ranked(profile.damageTypes).filter(key => profile.damageTypes[key] > 0).slice(0, 1).map(key => `damage:${key}`), ...ranked(profile.mechanics).filter(key => profile.mechanics[key] > 0).slice(0, 2).map(key => `mechanic:${key}`)] }
const offensiveScore = (profile: BuildProfile): number => Object.values(profile.damageTypes).reduce((sum, value) => sum + value, 0) + Object.values(profile.mechanics).reduce((sum, value) => sum + value, 0) + Object.values(profile.speed).reduce((sum, value) => sum + value, 0)

function conflict(code: string, ids: string[], strength: number): { warning: ConstraintViolation; reason: ScoreReason } {
  return { warning: { code, severity: 'warning', messageKey: `engine.equipment.conflict.${code}`, relatedIds: [...new Set(ids)].sort(), blocking: false }, reason: { code, category: 'equipment-synergy', messageKey: `engine.equipment.conflict.${code}`, impact: -strength, polarity: 'negative', sourceType: 'constraint', affectedTags: [], details: { conflictStrength: strength } } }
}

export const equipmentAnalyzer: EquipmentAnalyzer = { analyze({ input }, context, modifiers, config = SYNTHETIC_EQUIPMENT_CONFIG) {
  context.trace?.push('equipment')
  const definitions = new Map(modifiers.map(item => [item.id, item]))
  const unknownIds = new Set<string>()
  const values: DefinitionValue[] = input.equipment.flatMap(entry => entry.modifierValues.flatMap(applied => { const definition = definitions.get(applied.modifierId); if (!definition) { unknownIds.add(applied.modifierId); return [] } return [{ applied, definition, rawValue: numericValue(applied.value), entry }] }))
  const combined = analyzeProfile(values, input.goalProfile, config)
  const set1 = analyzeProfile(values.filter(value => setForSlot(value.entry.slotId) === 'set-1'), input.goalProfile, config)
  const set2 = analyzeProfile(values.filter(value => setForSlot(value.entry.slotId) === 'set-2'), input.goalProfile, config)
  const reasons = [...combined.reasons]
  const violations: ConstraintViolation[] = [...unknownIds].sort().map(id => ({ code: 'unknown-modifier', severity: 'error', messageKey: 'engine.constraint.unknownModifier', sourceId: id, relatedIds: [id], blocking: true }))
  const warnings: ConstraintViolation[] = []
  const conflictingIds = new Set<string>()
  const idsFor = (predicate: (definition: ModifierDefinition) => boolean) => values.filter(value => predicate(value.definition)).map(value => value.definition.id)
  const addConflict = (code: string, ids: string[]) => { const item = conflict(code, ids, config.conflictImpact); warnings.push(item.warning); reasons.push(item.reason); ids.forEach(id => conflictingIds.add(id)) }
  const mechanics = combined.profile.mechanics
  if (mechanics.attack >= config.conflictStrongThreshold && mechanics.spell >= config.conflictStrongThreshold) addConflict('mixed-attack-spell', idsFor(item => item.relevantTags.includes('attack') || item.relevantTags.includes('spell')))
  if (mechanics.melee >= config.conflictStrongThreshold && mechanics.projectile >= config.conflictStrongThreshold) addConflict('melee-projectile', idsFor(item => item.relevantTags.includes('melee') || item.relevantTags.includes('projectile')))
  const activeDamage = (Object.entries(combined.profile.damageTypes) as [DamageType, number][]).filter(([, value]) => value >= config.conflictStrongThreshold).sort(([a, av], [b, bv]) => bv - av || a.localeCompare(b))
  if (activeDamage.length > 1 && activeDamage[0][1] - activeDamage[1][1] <= config.conflictDamageGap) addConflict('competing-damage-types', idsFor(item => item.relevantTags.some(tag => ['physical', 'fire', 'cold', 'lightning', 'chaos'].includes(tag))))
  const criticalIds = idsFor(item => item.relevantTags.includes('critical')); if (criticalIds.length === 1) addConflict('isolated-critical', criticalIds)
  const attackSpeedIds = idsFor(item => item.id === 'fixture-attack-speed'); if (combined.profile.speed.attackSpeedAffinity > 0 && mechanics.spell >= config.conflictStrongThreshold && mechanics.attack < config.conflictStrongThreshold) addConflict('attack-speed-in-spell-profile', attackSpeedIds)
  const castSpeedIds = idsFor(item => item.id === 'fixture-cast-speed'); if (combined.profile.speed.castSpeedAffinity > 0 && mechanics.attack >= config.conflictStrongThreshold && mechanics.spell < config.conflictStrongThreshold) addConflict('cast-speed-in-attack-profile', castSpeedIds)
  const minionIds = idsFor(item => item.relevantTags.includes('minion')); if (minionIds.length === 1) addConflict('isolated-minion', minionIds)

  const maxContribution = Math.max(0, ...combined.contributions.values())
  const unusedModifierIds = new Set<string>(unknownIds)
  const weaklyUsedModifierIds = new Set<string>()
  for (const value of values) { const contribution = combined.contributions.get(value.definition.id) ?? 0; if (contribution <= config.unusedContributionThreshold && !['resistance', 'attribute'].includes(value.definition.category)) unusedModifierIds.add(value.definition.id); else if (maxContribution > 0 && contribution < maxContribution * config.weakContributionRatio && !conflictingIds.has(value.definition.id) && !['resistance', 'attribute'].includes(value.definition.category)) weaklyUsedModifierIds.add(value.definition.id) }
  for (const id of unusedModifierIds) reasons.push({ code: 'equipment-unused-modifier', category: 'equipment-synergy', messageKey: 'engine.equipment.unusedModifier', impact: -config.unusedReasonImpact, polarity: 'negative', sourceType: 'equipment', sourceId: id, affectedTags: [], details: { threshold: config.unusedContributionThreshold } })
  for (const id of weaklyUsedModifierIds) reasons.push({ code: 'equipment-weakly-used-modifier', category: 'equipment-synergy', messageKey: 'engine.equipment.weaklyUsedModifier', impact: -config.weakReasonImpact, polarity: 'negative', sourceType: 'equipment', sourceId: id, affectedTags: [], details: { ratio: config.weakContributionRatio } })

  const set1Score = offensiveScore(set1.profile); const set2Score = offensiveScore(set2.profile)
  const dominantWeaponSet = set1Score === set2Score ? 'balanced' : set1Score > set2Score ? 'set-1' : 'set-2'
  reasons.push({ code: 'equipment-dominant-weapon-set', category: 'equipment-synergy', messageKey: 'engine.equipment.dominantWeaponSet', impact: Math.abs(set1Score - set2Score), polarity: 'neutral', sourceType: 'equipment', affectedTags: [], details: { set1Score, set2Score, dominantWeaponSet } })
  const conflictLevel = normalizeAffinity(warnings.length * config.conflictImpact, config)
  const profileClarity = normalizeAffinity(config.affinityMax - conflictLevel, config)
  const damageRank = ranked(combined.profile.damageTypes); const mechanicRank = ranked(combined.profile.mechanics)
  const defenceMap: Record<DefenceType, number> = { life: combined.profile.defence.lifeAffinity, armour: combined.profile.defence.armourAffinity, evasion: combined.profile.defence.evasionAffinity, 'energy-shield': combined.profile.defence.energyShieldAffinity }
  const speedMap: Record<SpeedType, number> = { 'attack-speed': combined.profile.speed.attackSpeedAffinity, 'cast-speed': combined.profile.speed.castSpeedAffinity, movement: combined.profile.speed.movementAffinity }
  const dominantDamageType = dominant(combined.profile.damageTypes)
  const dominantMechanic = dominant(combined.profile.mechanics)
  const dominantDefence = ranked(defenceMap)[0]
  const dominantSpeed = dominant(speedMap)
  const recognizedRequirements = (Object.entries(combined.profile.requirements) as [string, number][]).filter(([, value]) => value > 0).map(([key]) => key).sort()
  for (const requirement of recognizedRequirements) { const value = combined.profile.requirements[requirement as keyof BuildProfile['requirements']]; reasons.push({ code: 'equipment-attribute-need', category: 'resource', messageKey: 'engine.equipment.attributeNeed', impact: -value, polarity: 'negative', sourceType: 'equipment', affectedTags: [], details: { requirement, syntheticTarget: requirement === 'resourceNeed' ? 0 : config.attributeTargets[requirement.replace('Need', '') as keyof typeof config.attributeTargets], result: value } }); warnings.push({ code: 'synthetic-attribute-deficit', severity: 'warning', messageKey: 'engine.equipment.syntheticAttributeDeficit', relatedIds: [requirement], blocking: false }) }
  reasons.push({ code: 'equipment-profile-clarity', category: 'equipment-synergy', messageKey: 'engine.equipment.profileClarity', impact: profileClarity, polarity: profileClarity >= config.highClarityThreshold ? 'positive' : 'negative', sourceType: 'equipment', affectedTags: [], details: { profileClarity, conflictLevel, threshold: config.highClarityThreshold } })
  if (dominantDamageType) reasons.push({ code: 'equipment-dominant-damage', category: 'damage', messageKey: 'engine.equipment.dominantDamage', impact: combined.profile.damageTypes[dominantDamageType], polarity: 'positive', sourceType: 'equipment', affectedTags: [dominantDamageType], details: { dominantDamageType } })
  if (dominantMechanic) reasons.push({ code: 'equipment-dominant-mechanic', category: 'equipment-synergy', messageKey: 'engine.equipment.dominantMechanic', impact: combined.profile.mechanics[dominantMechanic], polarity: 'positive', sourceType: 'equipment', affectedTags: [dominantMechanic], details: { dominantMechanic } })
  reasons.push({ code: 'equipment-dominant-defence', category: 'defence', messageKey: 'engine.equipment.dominantDefence', impact: defenceMap[dominantDefence], polarity: defenceMap[dominantDefence] > 0 ? 'positive' : 'neutral', sourceType: 'equipment', affectedTags: ['defensive'], details: { dominantDefence } })
  if (dominantSpeed) reasons.push({ code: 'equipment-dominant-speed', category: 'speed', messageKey: 'engine.equipment.dominantSpeed', impact: speedMap[dominantSpeed], polarity: 'positive', sourceType: 'equipment', affectedTags: dominantSpeed === 'movement' ? ['movement'] : dominantSpeed === 'attack-speed' ? ['attack'] : ['spell'], details: { dominantSpeed } })
  const allViolations = [...violations, ...warnings]
  const equipmentAnalysis: EquipmentAnalysis = { combinedProfile: combined.profile, profileSet1: set1.profile, profileSet2: set2.profile, detectedTags: [...combined.tags].sort(), recognizedTags: [...combined.tags].sort(), recognizedWeaponSets: [...new Set(input.equipment.map(item => setForSlot(item.slotId) ?? 'not-applicable'))].sort(), recognizedRequirements, dominantDamageType, secondaryDamageType: combined.profile.damageTypes[damageRank[1]] > 0 ? damageRank[1] : undefined, dominantMechanic, secondaryMechanic: combined.profile.mechanics[mechanicRank[1]] > 0 ? mechanicRank[1] : undefined, dominantDefence, dominantSpeed, dominantWeaponSet, weaponSetDifferences: setDifferences(set1.profile, set2.profile), weaponSetSpecializations: { 'set-1': specialization(set1.profile), 'set-2': specialization(set2.profile) }, profileClarity, conflictLevel, unusedModifierIds: [...unusedModifierIds].sort(), weaklyUsedModifierIds: [...weaklyUsedModifierIds].sort(), conflictingModifierIds: [...conflictingIds].sort(), reasons, violations: allViolations, warnings, status: 'experimental', analyzerVersion: EQUIPMENT_ANALYZER_VERSION, score: scored(reasons, allViolations) }
  return { value: { equipmentAnalysis, buildProfile: combined.profile }, reasons, violations: allViolations }
} }
