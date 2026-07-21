import type { TreeConnectionViewModel } from './types'

export type TreeConnectionRenderStatus = 'normalVisible' | 'hiddenUntilActive' | 'decorative' | 'glowOnly' | 'unknown'

export interface TreeConnectionRenderDecision {
  status: TreeConnectionRenderStatus
  visible: boolean
  reason: string
}

export function resolveTreeConnectionRenderDecision(connection: TreeConnectionViewModel, activeNodeIds: ReadonlySet<string>): TreeConnectionRenderDecision {
  if (connection.connectionType === 'layout-transition') return { status: 'unknown', visible: false, reason: 'separate-layout-transition' }
  if (connection.connectionType === 'decorative') return { status: 'decorative', visible: true, reason: 'explicit-decorative-layer' }
  if (connection.connectionType === 'glow-only') return { status: 'glowOnly', visible: activeNodeIds.has(connection.fromNodeId) && activeNodeIds.has(connection.toNodeId), reason: 'explicit-glow-layer' }
  if (connection.connectionType !== 'passive-tree') return { status: 'unknown', visible: false, reason: 'unsupported-connection-type' }
  if (connection.hideInDefaultState) return { status: 'hiddenUntilActive', visible: activeNodeIds.has(connection.fromNodeId) && activeNodeIds.has(connection.toNodeId), reason: 'official-endpoint-hideConnection' }
  return { status: 'normalVisible', visible: true, reason: 'official-passive-edge' }
}
