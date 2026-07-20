import { DEFAULT_PASSIVE_PATHFINDING_CONFIG, PASSIVE_GRAPH_VERSION, type PassivePathfindingConfig } from './config'
import type { PassiveGraph, PassiveGraphConnection, PassiveGraphNode, PassivePathNodeType, PassivePathSource, PassivePathSourceNode } from './types'

const compareId = (a: string, b: string) => a.localeCompare(b, 'en', { numeric: true })
export const canonicalNodePair = (a: string, b: string) => compareId(a, b) <= 0 ? `${a}\u0000${b}` : `${b}\u0000${a}`

export class PassiveGraphError extends Error {
  constructor(public readonly violations: string[]) { super(`Fehlerhaftes passives Graphmodell: ${violations.join('; ')}`) }
}

function nodeType(node: PassivePathSourceNode): PassivePathNodeType {
  if (node.isClassStart) return 'class-start'
  if (node.isAscendancyStart) return 'ascendancy-start'
  if (node.isJewelSocket) return 'jewel-socket'
  if (node.ascendancyId) return 'ascendancy'
  return ['normal', 'notable', 'keystone'].includes(node.nodeType) ? node.nodeType as PassivePathNodeType : 'unknown'
}

export function buildPassiveGraph(source: PassivePathSource, config: PassivePathfindingConfig = DEFAULT_PASSIVE_PATHFINDING_CONFIG): PassiveGraph {
  const violations: string[] = []
  const sourceIds = new Set<string>()
  for (const node of source.nodes) {
    if (!node.id || sourceIds.has(node.id)) violations.push(`duplicate-or-empty-node:${node.id}`)
    sourceIds.add(node.id)
  }
  const adjacency = new Map<string, Set<string>>([...sourceIds].map(id => [id, new Set<string>()]))
  const connections = new Map<string, PassiveGraphConnection>()
  const connectionIdByNodePair = new Map<string, string>()
  for (const connection of source.connections) {
    if (!connection.id || connections.has(connection.id)) { violations.push(`duplicate-or-empty-connection:${connection.id}`); continue }
    if (!sourceIds.has(connection.fromNodeId) || !sourceIds.has(connection.toNodeId)) { violations.push(`unknown-connection-reference:${connection.id}`); continue }
    if (connection.fromNodeId === connection.toNodeId) { violations.push(`self-connection:${connection.id}`); continue }
    const pair = canonicalNodePair(connection.fromNodeId, connection.toNodeId)
    if (connectionIdByNodePair.has(pair)) { violations.push(`duplicate-connection:${pair}`); continue }
    const [fromNodeId, toNodeId] = compareId(connection.fromNodeId, connection.toNodeId) <= 0 ? [connection.fromNodeId, connection.toNodeId] : [connection.toNodeId, connection.fromNodeId]
    connections.set(connection.id, Object.freeze({ id: connection.id, fromNodeId, toNodeId }))
    connectionIdByNodePair.set(pair, connection.id)
    adjacency.get(fromNodeId)?.add(toNodeId)
    adjacency.get(toNodeId)?.add(fromNodeId)
  }
  for (const node of source.nodes) for (const neighbourId of node.neighbourNodeIds) {
    if (!sourceIds.has(neighbourId)) violations.push(`unknown-neighbour-reference:${node.id}:${neighbourId}`)
    else if (neighbourId === node.id) continue
    else if (!connectionIdByNodePair.has(canonicalNodePair(node.id, neighbourId))) violations.push(`missing-connection:${node.id}:${neighbourId}`)
  }
  if (violations.length) throw new PassiveGraphError([...new Set(violations)].sort())
  const nodes = new Map<string, PassiveGraphNode>()
  for (const sourceNode of [...source.nodes].sort((a, b) => compareId(a.id, b.id))) {
    const type = nodeType(sourceNode)
    const traversalCost = sourceNode.pointCost ?? config.defaultTraversalCosts[type]
    if (!Number.isInteger(traversalCost) || traversalCost < 0) throw new PassiveGraphError([`invalid-traversal-cost:${sourceNode.id}`])
    const indices = sourceNode.classStartIndex === null ? [] : Array.isArray(sourceNode.classStartIndex) ? sourceNode.classStartIndex : [sourceNode.classStartIndex]
    nodes.set(sourceNode.id, Object.freeze({ id: sourceNode.id, neighbourNodeIds: Object.freeze([...(adjacency.get(sourceNode.id) ?? [])].sort(compareId)), nodeType: type, classIds: Object.freeze(indices.map(String).sort(compareId)), ascendancyId: sourceNode.ascendancyId ?? undefined, isJewelSocket: sourceNode.isJewelSocket, enabled: sourceNode.enabled !== false, traversalCost, weaponSet: sourceNode.weaponSet }))
  }
  return Object.freeze({ nodes, connections, connectionIdByNodePair, nodeCount: nodes.size, connectionCount: connections.size, version: PASSIVE_GRAPH_VERSION })
}
