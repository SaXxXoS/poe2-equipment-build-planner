export const SYNTHETIC_SKILL_CONFIG = {
  scoreMin: 0, scoreMax: 100, profileStrong: 30, profileWeak: 10,
  defaultBaseScore: 50, totalScoreDivisor: 4,
  damageWeight: 0.42, secondaryDamageWeight: 0.24, mechanicWeight: 0.28,
  speedWeight: 0.22, classPreferenceBonus: 8, ascendancyPreferenceBonus: 12,
  mappingTagBonus: 6, bossTagBonus: 8, utilityTagBonus: 12,
  defenceWeight: 0.2, resourceWeight: 0.2, preferredSetBonus: 5,
  conflictingDamagePenalty: 12, unusedDominantPenalty: 6,
  mappingGoalWeights: { mapping: 1.05, boss: 0.65, balanced: 1 },
  bossGoalWeights: { mapping: 0.65, boss: 1.05, balanced: 1 },
  categoryLimit: 100, topCandidateCount: 3,
  highClarity: 70, mediumClarity: 40, conflictWarning: 50,
  exclusiveProfileHigh: 30, exclusiveProfileLow: 10, attributeDeficitThreshold: 0,
  setTieTolerance: 0,
} as const
export type SkillAnalyzerConfig = typeof SYNTHETIC_SKILL_CONFIG
