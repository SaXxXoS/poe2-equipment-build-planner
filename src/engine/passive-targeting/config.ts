import type { Confidence, ScoreCategory } from '../common/types'
import type { PassiveTargetNodeType, PassiveTargetScoreCategory, PassiveTargetTag } from './types'

export const PASSIVE_TARGET_ANALYZER_VERSION = '1.0.0'
export const PASSIVE_TARGET_CLASSIFIER_VERSION = '1.0.0'
export const PASSIVE_TARGET_CONFIG = {
  scoreMin: 0, scoreMax: 100, defaultMaximumResults: 20,
  profileStrong: 60, profileWeak: 20, profileConflict: 10, profileWeight: .45,
  profileSynergyWeight: .35, unprofiledRuleWeight: .25, offTargetGoalWeight: .5, goalWeight: .1,
  totalScoreDivisor: 5, dataQualityScoreWeight: .05, diversityBonus: 2, conflictPenalty: 12,
  unresolvedPenalty: 8, keystonePenalty: 12, notableBonus: 8, normalBonus: 2, ascendancyBonus: 10,
  socketScore: 1, mappingTagBonus: 9, bossTagBonus: 9, needWeight: .4, dataQualityWeight: .2,
  confidence: { highCoverage: .9, mediumCoverage: .55, highClarity: 70, mediumClarity: 35 },
  confidenceRank: { low: 0, medium: 1, high: 2 } as Record<Confidence, number>,
  scoreCategoryMap: { damage: 'damage', defence: 'defence', mapping: 'mapping', boss: 'boss', speed: 'speed', utility: 'utility', resource: 'resource', attribute: 'utility', 'class-synergy': 'utility', 'ascendancy-synergy': 'ascendancy-synergy', 'profile-synergy': 'equipment-synergy', 'data-quality': 'utility' } as Record<PassiveTargetScoreCategory, ScoreCategory>,
  nodeTypes: ['normal', 'notable', 'keystone', 'class-start', 'ascendancy-start', 'ascendancy', 'jewel-socket', 'unknown'] as PassiveTargetNodeType[],
  mappingTags: ['area', 'projectile', 'movement-speed', 'attack-speed', 'cast-speed', 'movement', 'area-of-effect'] as PassiveTargetTag[],
  bossTags: ['critical', 'damage-over-time', 'curse', 'mark', 'life', 'recovery', 'regeneration', 'leech', 'mana', 'resource-cost'] as PassiveTargetTag[],
  negativeEffectPatterns: [' reduced ', ' less ', ' lose ', ' loses ', ' cannot ', ' no longer ', ' take ', ' cost '],
  restrictionPatterns: [' only ', ' while ', ' if ', ' cannot ', ' requires ', ' limited '],
} as const
