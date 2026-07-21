import type { AnalyzerContext, BuildProfile, Confidence } from '../common/types'
import type { PassiveGraph } from '../passive-pathfinding/types'
import type { PassiveTargetAnalysis, PassiveTargetNodeType, PassiveTargetRecommendation } from '../passive-targeting/types'

export type PassivePlanningMode = 'value-first' | 'efficiency-first' | 'balanced'
export type PassivePlanningStatus = 'complete' | 'partial' | 'blocked' | 'no-eligible-targets' | 'budget-exhausted' | 'required-target-unreachable' | 'required-target-over-budget' | 'invalid-input'

export interface PassivePlanningInput {
  requestId: string
  buildProfile: BuildProfile
  characterClassId: string
  ascendancyId?: string
  startNodeId: string
  pointBudget: number
  targetProfile: 'mapping' | 'boss' | 'balanced'
  targetingResult: PassiveTargetAnalysis
  passiveGraph: PassiveGraph
  alreadyAllocatedNodeIds?: string[]
  blockedNodeIds?: string[]
  requiredTargetNodeIds?: string[]
  excludedTargetNodeIds?: string[]
  maximumSelectedTargets: number
  candidatePoolLimit: number
  minimumTargetScore: number
  minimumConfidence: Confidence
  planningMode: PassivePlanningMode
  analyzerContext: AnalyzerContext
  sourceVersion: string
  allowReoptimizationTargets?: boolean
  pathCache?: PassivePlanningPathCache
}

export interface PassivePlanValueComponents {
  targetValue: number
  profileValue: number
  modeValue: number
  confidenceAdjustedValue: number
  conflictPenalty: number
  unresolvedPenalty: number
  reoptimizationPenalty: number
  redundancyPenalty: number
  effectiveValue: number
}

export interface PassivePlanCandidate extends PassivePlanValueComponents {
  recommendation: PassiveTargetRecommendation
  required: boolean
  dominantCategory: string
  tagSignature: string
}

export interface PassivePlanningPathCache { entries: Map<string, PassivePlanCachedPath> }
export interface PassivePlanCachedPath {
  reachable: boolean
  withinBudget: boolean
  pathNodeIds: string[]
  connectionIds: string[]
  addedNodeIds: string[]
  reusedNodeIds: string[]
  pointCost: number
  pathLength: number
}

export interface PassivePlanSelectedTarget {
  nodeId: string
  displayName: string
  nodeType: PassiveTargetNodeType
  originalTargetScore: number
  confidence: Confidence
  effectiveValue: number
  incrementalPointCost: number
  valuePerPoint: number
  incrementalValuePerPoint: number
  addedNodeIds: string[]
  reusedNodeIds: string[]
  pathNodeIds: string[]
  reasons: string[]
  warnings: string[]
  valueComponents: PassivePlanValueComponents
  keystone: boolean
}

export interface PassivePlanSelectionStep {
  stepIndex: number
  candidateNodeId: string
  evaluatedCandidateCount: number
  selected: boolean
  effectiveValue: number
  incrementalPointCost: number
  valuePerPoint: number
  budgetBefore: number
  budgetAfter: number
  addedNodeIds: string[]
  reusedNodeIds: string[]
  rejectedReasonCodes: string[]
}

export interface PassivePlanResult {
  requestId: string
  sourceVersion: string
  planningMode: PassivePlanningMode
  startNodeId: string
  pointBudget: number
  usedPointBudget: number
  remainingPointBudget: number
  selectedTargetIds: string[]
  requiredTargetIds: string[]
  skippedTargetIds: string[]
  mergedNodeIds: string[]
  mergedConnectionIds: string[]
  newlyAllocatedNodeIds: string[]
  reusedNodeIds: string[]
  selectedTargets: PassivePlanSelectedTarget[]
  selectionSteps: PassivePlanSelectionStep[]
  totalTargetValue: number
  totalEffectiveValue: number
  averageConfidence: number
  totalPathLength: number
  pathReuseRatio: number
  redundancyWarnings: string[]
  conflictWarnings: string[]
  keystoneWarnings: string[]
  unresolvedWarnings: string[]
  violations: string[]
  warnings: string[]
  status: PassivePlanningStatus
  strategy: string
  optimalityClaim: 'heuristic' | 'shortest-per-step' | 'unknown'
  plannerVersion: string
  candidateCount: number
  planningIterationCount: number
  pathSearchCount: number
  pathCacheHitCount: number
  safetyLimitReached: boolean
}
