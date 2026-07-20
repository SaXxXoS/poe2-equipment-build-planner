import type { BuildInput, EntityId, MechanicTag, SkillGemDefinition, SupportGemDefinition, AnyJewelDefinition, UniqueItemDefinition } from '../../domain'

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
export interface SkillRecommendation extends RecommendationBase { skillId: EntityId; suitability: 'main' | 'secondary' | 'utility' | 'movement' | 'defensive'; mappingScore: number; bossScore: number; valid: boolean }
export interface SupportRecommendation extends RecommendationBase { supportId: EntityId; skillId: EntityId; valid: boolean }
export interface PassiveRecommendation extends RecommendationBase { nodeId?: EntityId; clusterId?: EntityId; utilityScore: number; pathCost: number; scorePerPoint: number }
export interface JewelRecommendation extends RecommendationBase { jewelId: EntityId; jewelType: 'normal' | 'cluster' | 'unique-cluster'; pathCost?: number; recognizedSynergies: MechanicTag[] }
export interface UniqueRecommendation extends RecommendationBase { uniqueId: EntityId; ascendancySynergyScore: number; equipmentSynergyScore: number; buildEnabler: boolean; tradeOffs: string[] }
export type RotationSkillRole = 'setup' | 'debuff' | 'buff' | 'main-damage' | 'secondary-damage' | 'movement' | 'defensive'
export interface RotationStepAnalysis { order: number; skillId: EntityId; weaponSet: 'set-1' | 'set-2'; actionType: RotationSkillRole | 'weapon-swap'; reasonCodes: string[]; repeatCondition?: string; durationCondition?: string }
export interface RotationPlan { type: 'mapping' | 'boss'; steps: RotationStepAnalysis[]; status: EngineStatus }
export type MappingRotation = RotationPlan & { type: 'mapping' }
export type BossRotation = RotationPlan & { type: 'boss' }
export interface ExplanationEntry { section: string; priority: number; titleKey: string; reasonCodes: string[]; sourceIds: EntityId[]; impactSummary: number; warningLevel: 'none' | 'warning' | 'error'; relatedRecommendationId?: EntityId }
export interface PassiveCandidate { id: EntityId; tags: MechanicTag[]; utilityScore: number; pathCost: number; reachable: boolean }
export interface UniqueCandidate extends UniqueItemDefinition { ascendancyIds: EntityId[]; buildEnabler?: boolean }
export interface EngineCandidates { skills: SkillGemDefinition[]; supports: SupportGemDefinition[]; passives: PassiveCandidate[]; jewels: AnyJewelDefinition[]; uniques: UniqueCandidate[] }
export interface BuildAnalysis { equipmentAnalysis: EquipmentAnalysis; buildProfile: BuildProfile; skillRecommendations: SkillRecommendation[]; supportRecommendations: SupportRecommendation[]; passiveRecommendations: PassiveRecommendation[]; jewelRecommendations: JewelRecommendation[]; uniqueRecommendations: UniqueRecommendation[]; mappingRotation: MappingRotation; bossRotation: BossRotation; explanations: ExplanationEntry[]; warnings: ConstraintViolation[]; status: EngineStatus; engineVersion: string; moduleTrace: string[] }
export interface EngineRequest { input: BuildInput; candidates: EngineCandidates }
