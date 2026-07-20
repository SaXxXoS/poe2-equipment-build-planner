import type { BuildInput, EntityId, MechanicTag, SkillGemDefinition, SupportGemDefinition, AnyJewelDefinition, UniqueItemDefinition, PassiveNodeDefinition, PassiveConnection } from '../../domain'

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
export interface UniqueRecommendation extends RecommendationBase { uniqueId: EntityId; ascendancySynergyScore: number; equipmentSynergyScore: number; buildEnabler: boolean; tradeOffs: string[] }
export type RotationSkillRole = 'setup' | 'debuff' | 'buff' | 'main-damage' | 'secondary-damage' | 'movement' | 'defensive'
export interface RotationStepAnalysis { order: number; skillId: EntityId; weaponSet: 'set-1' | 'set-2'; actionType: RotationSkillRole | 'weapon-swap'; reasonCodes: string[]; repeatCondition?: string; durationCondition?: string }
export interface RotationPlan { type: 'mapping' | 'boss'; steps: RotationStepAnalysis[]; status: EngineStatus }
export type MappingRotation = RotationPlan & { type: 'mapping' }
export type BossRotation = RotationPlan & { type: 'boss' }
export interface ExplanationEntry { section: string; priority: number; titleKey: string; reasonCodes: string[]; sourceIds: EntityId[]; impactSummary: number; warningLevel: 'none' | 'warning' | 'error'; relatedRecommendationId?: EntityId }
export interface PassiveClusterCandidate { clusterId: EntityId; targetNodeIds: EntityId[]; requiredPathNodeIds: EntityId[]; entryNodeId: EntityId; totalPointCost?: number; weaponSet?: 'set-1' | 'set-2' | 'both'; classId?: EntityId; ascendancyId?: EntityId; experimental?: boolean }
export interface PassiveCandidate { id: EntityId; candidateType?: 'node' | 'cluster'; nodeId?: EntityId; cluster?: PassiveClusterCandidate; nodes?: PassiveNodeDefinition[]; connections?: PassiveConnection[]; tags?: MechanicTag[]; utilityScore?: number; pathCost?: number; reachable?: boolean; availablePointBudget?: number }
export interface UniqueCandidate extends UniqueItemDefinition { ascendancyIds: EntityId[]; buildEnabler?: boolean }
export interface EngineCandidates { skills: SkillGemDefinition[]; supports: SupportGemDefinition[]; passives: PassiveCandidate[]; jewels: AnyJewelDefinition[]; uniques: UniqueCandidate[] }
export interface BuildAnalysis { equipmentAnalysis: EquipmentAnalysis; buildProfile: BuildProfile; skillAnalysis: SkillAnalysis; skillRecommendations: SkillRecommendation[]; supportAnalysis: SupportAnalysis; supportRecommendations: SupportRecommendation[]; passiveAnalysis: PassiveAnalysis; passiveRecommendations: PassiveRecommendation[]; jewelAnalysis: JewelAnalysis; jewelRecommendations: JewelRecommendation[]; uniqueRecommendations: UniqueRecommendation[]; mappingRotation: MappingRotation; bossRotation: BossRotation; explanations: ExplanationEntry[]; warnings: ConstraintViolation[]; status: EngineStatus; engineVersion: string; moduleTrace: string[] }
export interface EngineRequest { input: BuildInput; candidates: EngineCandidates }
