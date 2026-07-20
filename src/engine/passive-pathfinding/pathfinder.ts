import { PASSIVE_MULTI_TARGET_STRATEGY, PASSIVE_PATH_ALGORITHM, PASSIVE_PATH_TIE_BREAKER, PASSIVE_PATHFINDER_VERSION } from './config'
import { canonicalNodePair } from './graph'
import type { PassiveGraph, PassiveMultiTargetPathResult, PassivePathRequest, PassivePathResult, PassivePathStatus, PassivePathViolation } from './types'
import { traversalViolation, validatePassivePathRequest } from './validator'

interface SearchState { nodeId: string; nodeIds: string[]; cost: number; newlyAllocated: number; pathLength: number }
const lexicalPath = (a: string[], b: string[]) => a.join('\u0000').localeCompare(b.join('\u0000'), 'en')
const tieBreakerFor = (mode: PassivePathRequest['searchMode']) => mode === 'shortest-path' ? 'path-length, newly-allocated, total-cost, lexicographic-node-id-sequence' : PASSIVE_PATH_TIE_BREAKER
const compareState = (a: SearchState, b: SearchState, mode: PassivePathRequest['searchMode']) => mode === 'shortest-path'
  ? a.pathLength - b.pathLength || a.newlyAllocated - b.newlyAllocated || a.cost - b.cost || lexicalPath(a.nodeIds, b.nodeIds)
  : a.cost - b.cost || a.newlyAllocated - b.newlyAllocated || a.pathLength - b.pathLength || lexicalPath(a.nodeIds, b.nodeIds)

class MinHeap {
  private values: SearchState[] = []
  constructor(private readonly compare: (a: SearchState, b: SearchState) => number) {}
  push(value: SearchState) { this.values.push(value); for (let index = this.values.length - 1; index > 0;) { const parent = Math.floor((index - 1) / 2); if (this.compare(this.values[parent], value) <= 0) break; this.values[index] = this.values[parent]; index = parent; this.values[index] = value } }
  pop(): SearchState | undefined { const first = this.values[0], last = this.values.pop(); if (!first || !last || !this.values.length) return first; this.values[0] = last; for (let index = 0;;) { const left = index * 2 + 1, right = left + 1; let smallest = index; if (left < this.values.length && this.compare(this.values[left], this.values[smallest]) < 0) smallest = left; if (right < this.values.length && this.compare(this.values[right], this.values[smallest]) < 0) smallest = right; if (smallest === index) break; [this.values[index], this.values[smallest]] = [this.values[smallest], this.values[index]]; index = smallest } return first }
  get size() { return this.values.length }
}

function stableRequestId(request: PassivePathRequest): string {
  if (request.requestId) return request.requestId
  const canonical = JSON.stringify({ ...request, targetNodeIds: [...request.targetNodeIds], allocatedNodeIds: [...(request.allocatedNodeIds ?? [])].sort(), blockedNodeIds: [...(request.blockedNodeIds ?? [])].sort(), allowedNodeTypes: [...(request.allowedNodeTypes ?? [])].sort() })
  let hash = 2166136261
  for (let index = 0; index < canonical.length; index++) { hash ^= canonical.charCodeAt(index); hash = Math.imul(hash, 16777619) }
  return `passive-path-${(hash >>> 0).toString(16).padStart(8, '0')}`
}

function emptyResult(request: PassivePathRequest, violations: PassivePathViolation[], status: PassivePathStatus): PassivePathResult {
  return { requestId: stableRequestId(request), startNodeId: request.startNodeId, targetNodeIds: [...request.targetNodeIds], orderedNodeIds: [], orderedConnectionIds: [], newlyAllocatedNodeIds: [], reusedNodeIds: [], traversedNodeCount: 0, newlyAllocatedNodeCount: 0, reusedNodeCount: 0, totalPointCost: 0, pathLength: 0, reachable: false, withinBudget: status !== 'over-budget', searchMode: request.searchMode, algorithm: PASSIVE_PATH_ALGORITHM, tieBreaker: tieBreakerFor(request.searchMode), warnings: [], violations, status, pathfinderVersion: PASSIVE_PATHFINDER_VERSION }
}

function endpointViolations(graph: PassiveGraph, request: PassivePathRequest): PassivePathViolation[] {
  return [request.startNodeId, ...request.targetNodeIds].flatMap(id => traversalViolation(graph, request, id) ?? [])
}

function findPath(graph: PassiveGraph, request: PassivePathRequest, startNodeId: string, targetNodeId: string, allocated: Set<string>): SearchState | undefined {
  const start: SearchState = { nodeId: startNodeId, nodeIds: [startNodeId], cost: 0, newlyAllocated: 0, pathLength: 0 }
  const heap = new MinHeap((a, b) => compareState(a, b, request.searchMode))
  const best = new Map<string, SearchState>([[startNodeId, start]])
  heap.push(start)
  while (heap.size) {
    const current = heap.pop()!
    if (best.get(current.nodeId) !== current) continue
    if (current.nodeId === targetNodeId) return current
    const node = graph.nodes.get(current.nodeId)!
    for (const neighbourId of node.neighbourNodeIds) {
      if (traversalViolation(graph, request, neighbourId)) continue
      if (current.nodeIds.includes(neighbourId)) continue
      const neighbour = graph.nodes.get(neighbourId)!
      const isNew = !allocated.has(neighbourId) && neighbour.traversalCost > 0
      const candidate: SearchState = { nodeId: neighbourId, nodeIds: [...current.nodeIds, neighbourId], cost: current.cost + (allocated.has(neighbourId) ? 0 : neighbour.traversalCost), newlyAllocated: current.newlyAllocated + Number(isNew), pathLength: current.pathLength + 1 }
      const previous = best.get(neighbourId)
      if (!previous || compareState(candidate, previous, request.searchMode) < 0) { best.set(neighbourId, candidate); heap.push(candidate) }
    }
  }
  return undefined
}

function resultFromState(graph: PassiveGraph, request: PassivePathRequest, state: SearchState, allocated: Set<string>): PassivePathResult {
  const orderedConnectionIds = state.nodeIds.slice(1).map((id, index) => graph.connectionIdByNodePair.get(canonicalNodePair(state.nodeIds[index], id))!).filter(Boolean)
  const newlyAllocatedNodeIds = state.nodeIds.filter(id => !allocated.has(id) && graph.nodes.get(id)!.traversalCost > 0)
  const reusedNodeIds = state.nodeIds.filter(id => allocated.has(id) || graph.nodes.get(id)!.traversalCost === 0)
  const withinBudget = request.maxPointBudget === undefined || state.cost <= request.maxPointBudget
  const violations = withinBudget ? [] : [{ code: 'point-budget-exceeded', message: `Pfadkosten ${state.cost} überschreiten das Punktbudget ${request.maxPointBudget}.`, nodeIds: [...newlyAllocatedNodeIds], blocking: true as const }]
  return { requestId: stableRequestId(request), startNodeId: state.nodeIds[0], targetNodeIds: [...request.targetNodeIds], orderedNodeIds: state.nodeIds, orderedConnectionIds, newlyAllocatedNodeIds, reusedNodeIds, traversedNodeCount: state.nodeIds.length, newlyAllocatedNodeCount: newlyAllocatedNodeIds.length, reusedNodeCount: reusedNodeIds.length, totalPointCost: state.cost, pathLength: state.pathLength, reachable: true, withinBudget, searchMode: request.searchMode, algorithm: PASSIVE_PATH_ALGORITHM, tieBreaker: tieBreakerFor(request.searchMode), warnings: [], violations, status: withinBudget ? 'success' : 'over-budget', pathfinderVersion: PASSIVE_PATHFINDER_VERSION }
}

export function findPassivePath(graph: PassiveGraph, request: PassivePathRequest): PassivePathResult {
  const violations = [...validatePassivePathRequest(graph, request), ...endpointViolations(graph, request)]
  if (request.searchMode === 'connect-targets') violations.push({ code: 'invalid-single-target-mode', message: 'connect-targets muss über die Mehrzielsuche ausgeführt werden.', nodeIds: [], blocking: true })
  if (request.targetNodeIds.length !== 1) violations.push({ code: 'single-target-required', message: 'Die Einzelzielsuche erwartet genau ein Ziel.', nodeIds: [...request.targetNodeIds], blocking: true })
  if (violations.length) return emptyResult(request, violations, 'blocked')
  const allocated = new Set([request.startNodeId, ...(request.allocatedNodeIds ?? [])])
  const state = findPath(graph, request, request.startNodeId, request.targetNodeIds[0], allocated)
  if (!state) return emptyResult(request, [{ code: 'unreachable-target', message: `Ziel ${request.targetNodeIds[0]} ist unter den angegebenen Grenzen nicht erreichbar.`, nodeIds: [request.targetNodeIds[0]], blocking: true }], 'unreachable')
  return resultFromState(graph, request, state, allocated)
}

export function connectPassiveTargets(graph: PassiveGraph, request: PassivePathRequest): PassiveMultiTargetPathResult {
  const normalized = { ...request, searchMode: 'connect-targets' as const }
  const violations = [...validatePassivePathRequest(graph, normalized), ...endpointViolations(graph, normalized)]
  if (violations.length) return { ...emptyResult(normalized, violations, 'blocked'), targetResults: [], mergedNodeIds: [], mergedConnectionIds: [], connectionOrder: [], totalUniqueNodeCount: 0, strategy: PASSIVE_MULTI_TARGET_STRATEGY, optimalityClaim: 'unknown' }
  const allocated = new Set([normalized.startNodeId, ...(normalized.allocatedNodeIds ?? [])])
  const merged = new Set<string>([normalized.startNodeId])
  const mergedConnections = new Set<string>()
  const targetResults: PassivePathResult[] = []
  const connectionOrder: string[] = []
  const remaining = new Set(normalized.targetNodeIds)
  while (remaining.size) {
    const candidates: Array<{ targetId: string; result: PassivePathResult }> = []
    for (const targetId of [...remaining].sort()) {
      for (const anchor of [...merged].sort()) {
        const stepRequest: PassivePathRequest = { ...normalized, startNodeId: anchor, targetNodeIds: [targetId], allocatedNodeIds: [...new Set([...allocated, ...merged])], searchMode: 'lowest-cost-path', maxPointBudget: undefined }
        const state = findPath(graph, stepRequest, anchor, targetId, new Set(stepRequest.allocatedNodeIds))
        if (state) candidates.push({ targetId, result: resultFromState(graph, stepRequest, state, new Set(stepRequest.allocatedNodeIds)) })
      }
    }
    candidates.sort((a, b) => a.result.totalPointCost - b.result.totalPointCost || a.result.newlyAllocatedNodeCount - b.result.newlyAllocatedNodeCount || a.result.pathLength - b.result.pathLength || lexicalPath(a.result.orderedNodeIds, b.result.orderedNodeIds) || a.targetId.localeCompare(b.targetId))
    const chosen = candidates[0]
    if (!chosen) return { ...emptyResult(normalized, [{ code: 'unreachable-target', message: 'Mindestens ein Ziel ist unter den angegebenen Grenzen nicht erreichbar.', nodeIds: [...remaining].sort(), blocking: true }], 'unreachable'), targetResults, mergedNodeIds: [...merged], mergedConnectionIds: [...mergedConnections], connectionOrder, totalUniqueNodeCount: merged.size, strategy: PASSIVE_MULTI_TARGET_STRATEGY, optimalityClaim: 'shortest-per-step' }
    targetResults.push(chosen.result); connectionOrder.push(chosen.targetId); remaining.delete(chosen.targetId)
    chosen.result.orderedNodeIds.forEach(id => { merged.add(id); allocated.add(id) })
    chosen.result.orderedConnectionIds.forEach(id => mergedConnections.add(id))
  }
  const mergedNodeIds = [...merged]
  const newlyAllocatedNodeIds = mergedNodeIds.filter(id => !(request.allocatedNodeIds ?? []).includes(id) && id !== request.startNodeId && graph.nodes.get(id)!.traversalCost > 0)
  const reusedNodeIds = mergedNodeIds.filter(id => !newlyAllocatedNodeIds.includes(id))
  const totalPointCost = newlyAllocatedNodeIds.reduce((sum, id) => sum + graph.nodes.get(id)!.traversalCost, 0)
  const withinBudget = request.maxPointBudget === undefined || totalPointCost <= request.maxPointBudget
  const budgetViolations = withinBudget ? [] : [{ code: 'point-budget-exceeded', message: `Gesamtkosten ${totalPointCost} überschreiten das Punktbudget ${request.maxPointBudget}.`, nodeIds: [...newlyAllocatedNodeIds], blocking: true as const }]
  return { requestId: stableRequestId(normalized), startNodeId: normalized.startNodeId, targetNodeIds: [...normalized.targetNodeIds], orderedNodeIds: mergedNodeIds, orderedConnectionIds: [...mergedConnections], newlyAllocatedNodeIds, reusedNodeIds, traversedNodeCount: mergedNodeIds.length, newlyAllocatedNodeCount: newlyAllocatedNodeIds.length, reusedNodeCount: reusedNodeIds.length, totalPointCost, pathLength: mergedConnections.size, reachable: true, withinBudget, searchMode: 'connect-targets', algorithm: PASSIVE_PATH_ALGORITHM, tieBreaker: PASSIVE_PATH_TIE_BREAKER, warnings: [{ code: 'non-global-optimum', message: 'Die Ziele werden schrittweise an den bestehenden Teilbaum angebunden; globale Steiner-Optimalität wird nicht behauptet.', nodeIds: [] }], violations: budgetViolations, status: withinBudget ? 'success' : 'over-budget', pathfinderVersion: PASSIVE_PATHFINDER_VERSION, targetResults, mergedNodeIds, mergedConnectionIds: [...mergedConnections], connectionOrder, totalUniqueNodeCount: mergedNodeIds.length, strategy: PASSIVE_MULTI_TARGET_STRATEGY, optimalityClaim: 'shortest-per-step' }
}
