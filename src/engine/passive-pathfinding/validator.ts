import type { PassiveGraph, PassivePathRequest, PassivePathViolation } from './types'

const violation = (code: string, message: string, nodeIds: string[] = []): PassivePathViolation => ({ code, message, nodeIds, blocking: true })

export function validatePassivePathRequest(graph: PassiveGraph, request: PassivePathRequest): PassivePathViolation[] {
  const result: PassivePathViolation[] = []
  if (!graph.nodeCount || graph.connectionCount < 0) result.push(violation('invalid-graph', 'Das Graphmodell ist leer oder fehlerhaft.'))
  if (!graph.nodes.has(request.startNodeId)) result.push(violation('unknown-start-node', `Unbekannter Startknoten ${request.startNodeId}.`, [request.startNodeId]))
  if (!request.targetNodeIds.length) result.push(violation('empty-targets', 'Mindestens ein Zielknoten ist erforderlich.'))
  const seen = new Set<string>()
  for (const id of request.targetNodeIds) {
    if (seen.has(id)) result.push(violation('duplicate-target', `Zielknoten ${id} wurde doppelt angegeben.`, [id]))
    seen.add(id)
    if (!graph.nodes.has(id)) result.push(violation('unknown-target-node', `Unbekannter Zielknoten ${id}.`, [id]))
  }
  if (request.maxPointBudget !== undefined && (!Number.isInteger(request.maxPointBudget) || request.maxPointBudget < 0)) result.push(violation('invalid-point-budget', 'Das Punktbudget muss eine nichtnegative ganze Zahl sein.'))
  const blocked = new Set(request.blockedNodeIds ?? [])
  if (blocked.has(request.startNodeId)) result.push(violation('blocked-start-node', 'Der Startknoten ist blockiert.', [request.startNodeId]))
  for (const id of request.targetNodeIds) if (blocked.has(id)) result.push(violation('blocked-target-node', 'Ein Zielknoten ist blockiert.', [id]))
  for (const id of [...blocked, ...(request.allocatedNodeIds ?? [])]) if (!graph.nodes.has(id)) result.push(violation('unknown-request-node', `Unbekannte Knotenreferenz ${id}.`, [id]))
  return result
}

export function traversalViolation(graph: PassiveGraph, request: PassivePathRequest, nodeId: string): PassivePathViolation | undefined {
  const node = graph.nodes.get(nodeId)
  if (!node) return violation('unknown-node', `Unbekannter Knoten ${nodeId}.`, [nodeId])
  if (!node.enabled) return violation('disabled-node', `Knoten ${nodeId} ist deaktiviert.`, [nodeId])
  if (request.blockedNodeIds?.includes(nodeId)) return violation('blocked-node', `Knoten ${nodeId} ist blockiert.`, [nodeId])
  if (request.allowedNodeTypes && !request.allowedNodeTypes.includes(node.nodeType)) return violation('disallowed-node-type', `Knotentyp ${node.nodeType} ist nicht erlaubt.`, [nodeId])
  if (node.ascendancyId && node.ascendancyId !== request.ascendancyId) return violation('disallowed-ascendancy-node', `Aszendenzknoten ${nodeId} gehört nicht zum expliziten Kontext.`, [nodeId])
  if (node.weaponSet && request.weaponSet && node.weaponSet !== 'both' && request.weaponSet !== 'both' && node.weaponSet !== request.weaponSet) return violation('disallowed-weapon-set-node', `Knoten ${nodeId} gehört zu einem anderen Waffen-Set.`, [nodeId])
  return undefined
}
