import type { Confidence } from '../common/types'
import type { PassivePlanningMode } from './types'

export const PASSIVE_PLANNER_VERSION = '5G-1.2.0'
export const PASSIVE_PLANNING_STRATEGY = 'required-first-incremental-subtree-with-evidenced-budget-completion'

export const PASSIVE_PLANNING_CONFIG = Object.freeze({
  limits: { maximumCandidates: 150, maximumSelectedTargets: 123, maximumPointBudget: 123, maximumPathSearches: 4000, maximumIterations: 123 },
  confidenceRank: { low: 1, medium: 2, high: 3 } satisfies Record<Confidence, number>,
  confidenceMultiplier: { low: 0.55, medium: 0.8, high: 1 } satisfies Record<Confidence, number>,
  valueWeights: { target: 0.45, profile: 0.25, mode: 0.3 },
  penalties: { conflict: 7, unresolved: 3, reoptimization: 18, redundancy: 24, strongRedundancy: 42 },
  modeWeights: {
    'value-first': { value: 1, efficiency: 0.08, reuse: 2, cost: 0.05 },
    'efficiency-first': { value: 0.25, efficiency: 1, reuse: 8, cost: 0.5 },
    balanced: { value: 0.65, efficiency: 0.55, reuse: 5, cost: 0.25 },
  } satisfies Record<PassivePlanningMode, { value:number; efficiency:number; reuse:number; cost:number }>,
  zeroCostDivisor: 1,
  strongRedundancyThreshold: 2,
})
