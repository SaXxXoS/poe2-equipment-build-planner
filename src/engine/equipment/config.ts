export interface EquipmentAnalyzerConfig {
  affinityMin: number
  affinityMax: number
  rawValueDivisor: number
  resistanceTarget: number
  resistanceNeedScale: number
  defenceTarget: number
  conflictStrongThreshold: number
  conflictDamageGap: number
  conflictImpact: number
  unusedContributionThreshold: number
  weakContributionRatio: number
  unusedReasonImpact: number
  weakReasonImpact: number
  highClarityThreshold: number
  attributeTargets: { strength: number; dexterity: number; intelligence: number }
}

export const SYNTHETIC_EQUIPMENT_CONFIG: EquipmentAnalyzerConfig = {
  affinityMin: 0,
  affinityMax: 100,
  rawValueDivisor: 5,
  resistanceTarget: 120,
  resistanceNeedScale: 100,
  defenceTarget: 120,
  conflictStrongThreshold: 30,
  conflictDamageGap: 15,
  conflictImpact: 25,
  unusedContributionThreshold: 3,
  weakContributionRatio: 0.45,
  unusedReasonImpact: 10,
  weakReasonImpact: 5,
  highClarityThreshold: 70,
  attributeTargets: { strength: 60, dexterity: 60, intelligence: 60 },
}
