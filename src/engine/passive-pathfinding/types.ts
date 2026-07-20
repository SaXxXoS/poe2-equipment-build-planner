export type PassivePathSearchMode = 'shortest-path' | 'lowest-cost-path' | 'connect-targets'
export type PassivePathNodeType = 'normal' | 'notable' | 'keystone' | 'class-start' | 'ascendancy-start' | 'ascendancy' | 'jewel-socket' | 'unknown'
export type PassivePathStatus = 'success' | 'blocked' | 'unreachable' | 'over-budget' | 'invalid-graph'
export type PassivePathOptimalityClaim = 'exact' | 'shortest-per-step' | 'heuristic' | 'unknown'

export interface PassivePathSourceNode {
  id: string
  nodeType: string
  neighbourNodeIds: string[]
  isClassStart: boolean
  classStartIndex: number | number[] | null
  isAscendancyStart: boolean
  ascendancyId: string | null
  isJewelSocket: boolean
  enabled?: boolean
  pointCost?: number
  weaponSet?: 'set-1' | 'set-2' | 'both'
}
export interface PassivePathSourceConnection { id: string; fromNodeId: string; toNodeId: string }
export interface PassivePathSource { nodes: PassivePathSourceNode[]; connections: PassivePathSourceConnection[] }

export interface PassiveGraphNode {
  id: string
  neighbourNodeIds: readonly string[]
  nodeType: PassivePathNodeType
  classIds: readonly string[]
  ascendancyId?: string
  isJewelSocket: boolean
  enabled: boolean
  traversalCost: number
  weaponSet?: 'set-1' | 'set-2' | 'both'
}
export interface PassiveGraphConnection { id: string; fromNodeId: string; toNodeId: string }
export interface PassiveGraph {
  nodes: ReadonlyMap<string, PassiveGraphNode>
  connections: ReadonlyMap<string, PassiveGraphConnection>
  connectionIdByNodePair: ReadonlyMap<string, string>
  nodeCount: number
  connectionCount: number
  version: string
}

export interface PassivePathRequest {
  requestId?: string
  startNodeId: string
  targetNodeIds: string[]
  allocatedNodeIds?: string[]
  blockedNodeIds?: string[]
  allowedNodeTypes?: PassivePathNodeType[]
  maxPointBudget?: number
  ascendancyId?: string
  weaponSet?: 'set-1' | 'set-2' | 'both'
  searchMode: PassivePathSearchMode
}
export interface PassivePathViolation { code: string; message: string; nodeIds: string[]; blocking: true }
export interface PassivePathWarning { code: string; message: string; nodeIds: string[] }

export interface PassivePathResult {
  requestId: string
  startNodeId: string
  targetNodeIds: string[]
  orderedNodeIds: string[]
  orderedConnectionIds: string[]
  newlyAllocatedNodeIds: string[]
  reusedNodeIds: string[]
  traversedNodeCount: number
  newlyAllocatedNodeCount: number
  reusedNodeCount: number
  totalPointCost: number
  pathLength: number
  reachable: boolean
  withinBudget: boolean
  searchMode: PassivePathSearchMode
  algorithm: string
  tieBreaker: string
  warnings: PassivePathWarning[]
  violations: PassivePathViolation[]
  status: PassivePathStatus
  pathfinderVersion: string
}
export interface PassiveMultiTargetPathResult extends PassivePathResult {
  targetResults: PassivePathResult[]
  mergedNodeIds: string[]
  mergedConnectionIds: string[]
  connectionOrder: string[]
  totalUniqueNodeCount: number
  strategy: string
  optimalityClaim: PassivePathOptimalityClaim
}
