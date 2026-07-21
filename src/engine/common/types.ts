import type { BuildInput, EntityId, MechanicTag, SkillGemDefinition, SupportGemDefinition, AnyJewelDefinition, UniqueItemDefinition, PassiveNodeDefinition, PassiveConnection } from '../../domain'
import type { RealPassivePlanningConfiguration,RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'

export const SCORE_CATEGORIES = ['damage', 'defence', 'mapping', 'boss', 'speed', 'utility', 'resource', 'ascendancy-synergy', 'equipment-synergy', 'path-efficiency'] as const
export type ScoreCategory = (typeof SCORE_CATEGORIES)[number]
export type EngineStatus = 'placeholder' | 'experimental'
export type Confidence = 'low' | 'medium' | 'high'
export type ReasonPolarity = 'positive' | 'negative' | 'neutral'
export type ReasonSourceType = 'equipment' | 'class' | 'ascendancy' | 'skill' | 'support' | 'passive' | 'jewel' | 'unique' | 'goal' | 'constraint'

export interface ScoreReason { code: string; category: ScoreCategory; messageKey: string; impact: number; polarity: ReasonPolarity; sourceType: ReasonSourceType; sourceId?: EntityId; affectedTags: MechanicTag[]; details?: Record<string, string | number | boolean> }
export interface ConstraintViolation { code: string; severity: 'warning' | 'error'; messageKey: string; sourceId?: EntityId; relatedIds: EntityId[]; blocking: boolean }
export interface Score { totalScore: number; reasons: ScoreReason[]; violations: ConstraintViolation[]; categoryScores: Partial<Record<ScoreCategory, number>>; confidence: Confidence; status: EngineStatus }
export interface AnalyzerContext { engineVersion: string; fixtureMode: true; trace?: string[] }
export interface AnalyzerResult<T> { value: T; reasons: ScoreReason[]; violations: ConstraintViolation[] }

export interface BuildProfile {
  damageTypes: Record<'physical' | 'fire' | 'cold' | 'lightning' | 'chaos', number>
  mechanics: Record<'attack' | 'spell' | 'projectile' | 'melee' | 'area' | 'critical' | 'damage-over-time' | 'minion' | 'movement' | 'buff' | 'debuff', number>
  speed: { attackSpeedAffinity: number; castSpeedAffinity: number; movementAffinity: number }
  defence: { lifeAffinity: number; armourAffinity: number; evasionAffinity: number; energyShieldAffinity: number; resistanceNeed: number; generalDefenceNeed: number }
  requirements: { strengthNeed: number; dexterityNeed: number; intelligenceNeed: number; resourceNeed: number }
  goals: { mappingWeight: number; bossWeight: number; defenceWeight: number; damageWeight: number }
}
export type DamageType = keyof BuildProfile['damageTypes']
export type MechanicType = keyof BuildProfile['mechanics']
export type DefenceType = 'life' | 'armour' | 'evasion' | 'energy-shield'
export type SpeedType = 'attack-speed' | 'cast-speed' | 'movement'
export interface WeaponSetDifference { field: string; set1Value: number; set2Value: number; delta: number }
export interface EquipmentAnalysis {
  combinedProfile: BuildProfile
  profileSet1: BuildProfile
  profileSet2: BuildProfile
  detectedTags: MechanicTag[]
  recognizedTags: MechanicTag[]
  recognizedWeaponSets: string[]
  recognizedRequirements: string[]
  dominantDamageType?: DamageType
  secondaryDamageType?: DamageType
  dominantMechanic?: MechanicType
  secondaryMechanic?: MechanicType
  dominantDefence?: DefenceType
  dominantSpeed?: SpeedType
  dominantWeaponSet: 'set-1' | 'set-2' | 'balanced'
  weaponSetDifferences: WeaponSetDifference[]
  weaponSetSpecializations: Record<'set-1' | 'set-2', string[]>
  profileClarity: number
  conflictLevel: number
  unusedModifierIds: EntityId[]
  weaklyUsedModifierIds: EntityId[]
  conflictingModifierIds: EntityId[]
  reasons: ScoreReason[]
  violations: ConstraintViolation[]
  warnings: ConstraintViolation[]
  status: EngineStatus
  analyzerVersion: string
  score: Score
}
export type RecommendationBase = Score & { targetId: EntityId }
export type SkillEligibility = 'eligible' | 'blocked'
export interface SkillRecommendation extends RecommendationBase {
  skillId: EntityId
  suitability: 'main' | 'secondary' | 'utility' | 'movement' | 'defensive'
  eligibility: SkillEligibility
  recommendedRole: 'main' | 'secondary' | 'utility' | 'movement' | 'defensive'
  possibleRoles: ('main' | 'secondary' | 'utility' | 'movement' | 'defensive')[]
  mappingScore: number
  bossScore: number
  damageScore: number
  utilityScore: number
  equipmentSynergyScore: number
  ascendancySynergyScore: number
  scoreSet1: number
  scoreSet2: number
  preferredWeaponSet: 'set-1' | 'set-2' | 'both' | 'none'
  setDifference: number
  matchedProfileFields: string[]
  weaklyMatchedProfileFields: string[]
  unusedDominantProfileFields: string[]
  conflictingProfileFields: string[]
  warnings: ConstraintViolation[]
  valid: boolean
  analyzerVersion: string
}
export interface SkillAnalysis {
  allCandidates: SkillRecommendation[]
  eligibleCandidates: SkillRecommendation[]
  blockedCandidates: SkillRecommendation[]
  topMainCandidates: SkillRecommendation[]
  topUtilityCandidates: SkillRecommendation[]
  topMovementCandidates: SkillRecommendation[]
  mappingRanking: SkillRecommendation[]
  bossRanking: SkillRecommendation[]
  status: EngineStatus
  analyzerVersion: string
}
export type SupportTradeOffType = 'reducedSpeed' | 'increasedResourceNeed' | 'reducedDefence' | 'restrictedSkillUse' | 'mappingPenalty' | 'bossPenalty' | 'weaponSetRestriction'
export interface SupportTradeOff { type: SupportTradeOffType; value: number; reasonCode: string }
export interface SupportRecommendation extends RecommendationBase { supportId: EntityId; skillId: EntityId; eligibility: 'eligible' | 'blocked'; damageScore: number; defenceScore: number; mappingScore: number; bossScore: number; speedScore: number; utilityScore: number; resourceScore: number; equipmentSynergyScore: number; ascendancySynergyScore: number; scoreSet1: number; scoreSet2: number; preferredWeaponSet: 'set-1' | 'set-2' | 'both' | 'none'; setDifference: number; setReasons: ScoreReason[]; matchedSkillTags: MechanicTag[]; matchedProfileFields: string[]; weaklyMatchedProfileFields: string[]; unusedSupportTags: MechanicTag[]; conflictingSkillTags: MechanicTag[]; conflictingProfileFields: string[]; tradeOffs: SupportTradeOff[]; warnings: ConstraintViolation[]; valid: boolean; analyzerVersion: string }
export interface SupportAnalysis { allCandidates: SupportRecommendation[]; eligibleCandidates: SupportRecommendation[]; blockedCandidates: SupportRecommendation[]; topCandidates: SupportRecommendation[]; topDamageSupports: SupportRecommendation[]; topMappingSupports: SupportRecommendation[]; topBossSupports: SupportRecommendation[]; topUtilitySupports: SupportRecommendation[]; topDefensiveSupports: SupportRecommendation[]; status: EngineStatus; analyzerVersion: string }
export interface PassiveTradeOff { type: string; nodeId: EntityId; fields: string[] }
export interface PassiveRecommendation extends RecommendationBase { recommendationId: EntityId; candidateType: 'node' | 'cluster'; nodeId?: EntityId; clusterId?: EntityId; targetNodeIds: EntityId[]; pathNodeIds: EntityId[]; eligibility: 'eligible' | 'blocked'; utilityScore: number; pathEfficiencyScore: number; scorePerPoint: number; damageScore: number; defenceScore: number; mappingScore: number; bossScore: number; speedScore: number; utilityCategoryScore: number; resourceScore: number; ascendancySynergyScore: number; equipmentSynergyScore: number; targetPointCost: number; pathPointCost: number; totalPointCost: number; pathCost: number; scoreSet1: number; scoreSet2: number; preferredWeaponSet: 'set-1' | 'set-2' | 'both' | 'none'; setDifference: number; setReasons: ScoreReason[]; matchedProfileFields: string[]; weaklyMatchedProfileFields: string[]; conflictingProfileFields: string[]; redundantNodeIds: EntityId[]; conflictingNodeIds: EntityId[]; weaklyUsefulNodeIds: EntityId[]; tradeOffs: PassiveTradeOff[]; warnings: ConstraintViolation[]; valid: boolean; analyzerVersion: string }
export interface PassiveAnalysis { allCandidates: PassiveRecommendation[]; eligibleCandidates: PassiveRecommendation[]; blockedCandidates: PassiveRecommendation[]; topDamageCandidates: PassiveRecommendation[]; topDefensiveCandidates: PassiveRecommendation[]; topMappingCandidates: PassiveRecommendation[]; topBossCandidates: PassiveRecommendation[]; topPathEfficiencyCandidates: PassiveRecommendation[]; topAscendancyCandidates: PassiveRecommendation[]; topKeystoneCandidates: PassiveRecommendation[]; topClusterCandidates: PassiveRecommendation[]; status: EngineStatus; analyzerVersion: string }
export interface JewelRecommendation extends RecommendationBase { recommendationId: EntityId; jewelId: EntityId; jewelType: 'normal' | 'cluster' | 'unique-cluster'; eligibility: 'eligible' | 'blocked'; damageScore: number; defenceScore: number; mappingScore: number; bossScore: number; speedScore: number; utilityScore: number; resourceScore: number; equipmentSynergyScore: number; ascendancySynergyScore: number; pathEfficiencyScore: number; buildEnablerScore: number; uniqueMechanicScore: number; modifierUtilityScore: number; passiveUtilityScore: number; notableUtilityScore: number; addedSocketValue: number; socketPointCost: number; entryPointCost: number; internalPathCost: number; totalPointCost: number; scorePerPoint: number; scoreSet1: number; scoreSet2: number; preferredWeaponSet: 'set-1' | 'set-2' | 'both' | 'none'; setDifference: number; setReasons: ScoreReason[]; matchedProfileFields: string[]; weaklyMatchedProfileFields: string[]; conflictingProfileFields: string[]; matchedSkillTags: MechanicTag[]; redundantModifierIds: EntityId[]; weaklyUsedModifierIds: EntityId[]; conflictingModifierIds: EntityId[]; conflictingMechanics: string[]; tradeOffs: string[]; warnings: ConstraintViolation[]; recognizedSynergies: MechanicTag[]; valid: boolean; analyzerVersion: string; pathCost?: number }
export interface JewelAnalysis { allCandidates: JewelRecommendation[]; eligibleCandidates: JewelRecommendation[]; blockedCandidates: JewelRecommendation[]; topNormalJewels: JewelRecommendation[]; topClusterJewels: JewelRecommendation[]; topUniqueClusterJewels: JewelRecommendation[]; topDamageJewels: JewelRecommendation[]; topDefensiveJewels: JewelRecommendation[]; topMappingJewels: JewelRecommendation[]; topBossJewels: JewelRecommendation[]; topPathEfficiencyJewels: JewelRecommendation[]; topAscendancySynergyJewels: JewelRecommendation[]; topBuildEnablerJewels: JewelRecommendation[]; status: EngineStatus; analyzerVersion: string }
export interface UniqueRecommendation extends RecommendationBase { recommendationId: EntityId; uniqueId: EntityId; itemSlot: string; eligibility: 'eligible' | 'blocked'; damageScore: number; defenceScore: number; mappingScore: number; bossScore: number; speedScore: number; utilityScore: number; resourceScore: number; classSynergyScore: number; ascendancySynergyScore: number; equipmentSynergyScore: number; skillSynergyScore: number; supportSynergyScore: number; passiveSynergyScore: number; jewelSynergyScore: number; pathEfficiencyScore: number; buildEnabler: boolean; buildEnablerScore: number; uniqueMechanicScore: number; currentSlotUtilityScore: number; uniqueSlotUtilityScore: number; replacementDelta: number; replacementVerdict: 'clear-upgrade' | 'situational-upgrade' | 'sidegrade' | 'downgrade' | 'unknown'; supportsCurrentBuild: boolean; enablesAlternativeBuild: boolean; requiresReoptimization: boolean; affectedModules: string[]; alternativeBuildTags: string[]; scoreSet1: number; scoreSet2: number; preferredWeaponSet: 'set-1' | 'set-2' | 'both' | 'none'; setDifference: number; setReasons: ScoreReason[]; matchedProfileFields: string[]; weaklyMatchedProfileFields: string[]; conflictingProfileFields: string[]; matchedSkillTags: MechanicTag[]; matchedAscendancyTags: string[]; conflictingAscendancyTags: string[]; ascendancyReasonCodes: string[]; redundantModifierIds: EntityId[]; weaklyUsedModifierIds: EntityId[]; conflictingModifierIds: EntityId[]; conflictingMechanics: string[]; gainedMechanics: string[]; lostMechanics: string[]; lostCoreMechanics: string[]; requiredFollowUpChanges: string[]; tradeOffs: string[]; warnings: ConstraintViolation[]; valid: boolean; analyzerVersion: string }
export interface UniqueAnalysis { allCandidates: UniqueRecommendation[]; eligibleCandidates: UniqueRecommendation[]; blockedCandidates: UniqueRecommendation[]; topCurrentBuildUniques: UniqueRecommendation[]; topAscendancyUniques: UniqueRecommendation[]; topEquipmentSynergyUniques: UniqueRecommendation[]; topDamageUniques: UniqueRecommendation[]; topDefensiveUniques: UniqueRecommendation[]; topMappingUniques: UniqueRecommendation[]; topBossUniques: UniqueRecommendation[]; topWeaponUniques: UniqueRecommendation[]; topArmourUniques: UniqueRecommendation[]; topAccessoryUniques: UniqueRecommendation[]; topClearUpgrades: UniqueRecommendation[]; topSituationalUpgrades: UniqueRecommendation[]; topBuildEnablers: UniqueRecommendation[]; topAlternativeBuildUniques: UniqueRecommendation[]; status: EngineStatus; analyzerVersion: string }
export type RotationSkillRole = 'setup' | 'debuff' | 'buff' | 'main-damage' | 'secondary-damage' | 'movement' | 'defensive'
export type RotationType = 'mapping' | 'boss' | 'defensive' | 'emergency'
export type RotationActionType = 'use-skill' | 'switch-weapon-set' | 'move' | 'wait-for-condition' | 'repeat' | 'maintain-buff' | 'refresh-debuff' | 'defensive-response'
export type RotationWeaponSet = 'set-1' | 'set-2' | 'both' | 'none'
export type RotationCondition = 'on-debuff-expired' | 'on-buff-expired' | 'on-cooldown-ready' | 'on-resource-available' | 'on-boss-phase' | 'on-enemy-group' | 'on-danger' | 'continuous' | 'once'
export interface RotationStepAnalysis { stepId: EntityId; order: number; rotationType: RotationType; actionType: RotationActionType; skillId?: EntityId; skillRole?: RotationSkillRole; weaponSet: RotationWeaponSet; previousWeaponSet?: Exclude<RotationWeaponSet, 'none'>; nextWeaponSet?: Exclude<RotationWeaponSet, 'none'>; reasonCodes: string[]; sourceRecommendationIds: EntityId[]; repeatCondition?: RotationCondition; durationCondition?: 'short' | 'medium' | 'long' | 'persistent'; targetCondition?: RotationCondition; activationCondition?: RotationCondition; warnings: ConstraintViolation[]; status: EngineStatus; confidence: Confidence }
export interface RotationPlan { rotationId: EntityId; rotationType: 'mapping' | 'boss'; type: 'mapping' | 'boss'; steps: RotationStepAnalysis[]; openingSequence: RotationStepAnalysis[]; maintenanceSequence: RotationStepAnalysis[]; repeatSequence: RotationStepAnalysis[]; emergencySteps: RotationStepAnalysis[]; requiredSkills: EntityId[]; requiredWeaponSets: Exclude<RotationWeaponSet, 'none'>[]; weaponSwapCount: number; estimatedComplexity: 'low' | 'medium' | 'high'; missingRoles: RotationSkillRole[]; warnings: ConstraintViolation[]; violations: ConstraintViolation[]; reasonCodes: string[]; confidence: Confidence; status: EngineStatus; generatorVersion: string }
export type MappingRotation = RotationPlan & { rotationType: 'mapping'; type: 'mapping' }
export type BossRotation = RotationPlan & { rotationType: 'boss'; type: 'boss' }
export interface RotationAnalysis { mappingRotation: MappingRotation; bossRotation: BossRotation; allPlans: RotationPlan[]; validPlans: RotationPlan[]; blockedPlans: RotationPlan[]; preferredMappingPlan?: MappingRotation; preferredBossPlan?: BossRotation; warnings: ConstraintViolation[]; violations: ConstraintViolation[]; status: EngineStatus; generatorVersion: string }
export interface RotationGeneratorInput { buildProfile: BuildProfile; skillAnalysis: SkillAnalysis; selectedSkills: SkillRecommendation[]; skillDefinitions: SkillGemDefinition[]; selectedSupports?: SupportRecommendation[]; uniqueAnalysis?: UniqueAnalysis; profileClarity?: number; availableWeaponSets?: ('set-1' | 'set-2')[] }
export type ExplanationSection = 'summary' | 'equipment' | 'main-skill' | 'additional-skills' | 'supports' | 'passives' | 'jewels' | 'uniques' | 'mapping-rotation' | 'boss-rotation' | 'weapon-swap' | 'affix-improvements' | 'conflicts' | 'warnings' | 'confidence' | 'limitations'
export type ExplanationTone = 'positive' | 'neutral' | 'warning' | 'blocking'
export interface ExplanationEntry { explanationId: EntityId; section: ExplanationSection; priority: number; title: string; body: string; shortBody?: string; tone: ExplanationTone; sourceReasonCodes: string[]; sourceIds: EntityId[]; relatedRecommendationIds: EntityId[]; impactSummary?: number; confidence: Confidence; warningLevel: 'none' | 'warning' | 'error'; status: EngineStatus; templateId: EntityId }
export interface ExplainabilityTrace { explanationId: EntityId; templateId: EntityId; inputReasonCodes: string[]; inputSourceIds: EntityId[]; resolvedPlaceholders: Record<string, string>; omittedReasons: string[]; generatedAt?: string; generatorVersion: string }
export interface ExplanationSectionResult { section: ExplanationSection; entries: ExplanationEntry[] }
export interface ExplanationResult { summary: ExplanationEntry[]; sections: ExplanationSectionResult[]; allEntries: ExplanationEntry[]; blockingEntries: ExplanationEntry[]; warningEntries: ExplanationEntry[]; positiveEntries: ExplanationEntry[]; rotationEntries: ExplanationEntry[]; traces: ExplainabilityTrace[]; unresolvedReasonCodes: string[]; missingDisplayNames: EntityId[]; confidenceSummary: Record<Confidence, number>; limitations: ExplanationEntry[]; status: EngineStatus; generatorVersion: string }
export interface ExplanationGeneratorInput { reasons: ScoreReason[]; violations: ConstraintViolation[]; equipmentAnalysis: EquipmentAnalysis; skillAnalysis: SkillAnalysis; supportAnalysis: SupportAnalysis; passiveAnalysis: PassiveAnalysis; jewelAnalysis: JewelAnalysis; uniqueAnalysis: UniqueAnalysis; rotationAnalysis: RotationAnalysis; displayNames: Record<EntityId, string | undefined> }
export interface PassiveClusterCandidate { clusterId: EntityId; targetNodeIds: EntityId[]; requiredPathNodeIds: EntityId[]; entryNodeId: EntityId; totalPointCost?: number; weaponSet?: 'set-1' | 'set-2' | 'both'; classId?: EntityId; ascendancyId?: EntityId; experimental?: boolean }
export interface PassiveCandidate { id: EntityId; candidateType?: 'node' | 'cluster'; nodeId?: EntityId; cluster?: PassiveClusterCandidate; nodes?: PassiveNodeDefinition[]; connections?: PassiveConnection[]; tags?: MechanicTag[]; utilityScore?: number; pathCost?: number; reachable?: boolean; availablePointBudget?: number }
export interface UniqueCandidate extends UniqueItemDefinition { ascendancyIds: EntityId[]; buildEnabler?: boolean }
export interface EngineCandidates { skills: SkillGemDefinition[]; supports: SupportGemDefinition[]; passives: PassiveCandidate[]; jewels: AnyJewelDefinition[]; uniques: UniqueCandidate[] }
export interface BuildAnalysis { equipmentAnalysis: EquipmentAnalysis; buildProfile: BuildProfile; skillAnalysis: SkillAnalysis; skillRecommendations: SkillRecommendation[]; supportAnalysis: SupportAnalysis; supportRecommendations: SupportRecommendation[]; passiveAnalysis: PassiveAnalysis; passiveRecommendations: PassiveRecommendation[]; jewelAnalysis: JewelAnalysis; jewelRecommendations: JewelRecommendation[]; uniqueAnalysis: UniqueAnalysis; uniqueRecommendations: UniqueRecommendation[]; rotationAnalysis: RotationAnalysis; mappingRotation: MappingRotation; bossRotation: BossRotation; explanations: ExplanationResult; warnings: ConstraintViolation[]; status: EngineStatus; engineVersion: string; moduleTrace: string[]; realPassivePlanning?:RealPassivePlanningIntegrationResult }
export interface EngineRequest { input: BuildInput; candidates: EngineCandidates; realPassivePlanning?:RealPassivePlanningConfiguration }
