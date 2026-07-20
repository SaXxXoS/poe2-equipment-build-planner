import type { PassivePathNodeType } from './types'

export const PASSIVE_PATHFINDER_VERSION = '1.0.0'
export const PASSIVE_GRAPH_VERSION = '1.0.0'
export const PASSIVE_PATH_ALGORITHM = 'deterministic-dijkstra-v1'
export const PASSIVE_PATH_TIE_BREAKER = 'total-cost, newly-allocated, path-length, lexicographic-node-id-sequence'
export const PASSIVE_MULTI_TARGET_STRATEGY = 'deterministic-greedy-connect-to-existing-subtree'

export interface PassivePathfindingConfig {
  defaultTraversalCosts: Readonly<Record<PassivePathNodeType, number>>
  startNodeTypes: readonly PassivePathNodeType[]
}
export const DEFAULT_PASSIVE_PATHFINDING_CONFIG: PassivePathfindingConfig = {
  defaultTraversalCosts: { normal: 1, notable: 1, keystone: 1, 'class-start': 0, 'ascendancy-start': 0, ascendancy: 1, 'jewel-socket': 1, unknown: 1 },
  startNodeTypes: ['class-start', 'ascendancy-start'],
}
