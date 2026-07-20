import { describe, expect, it } from 'vitest'
import officialTree from '../../../generated/poe2-tree/tree.json'
import { clonePassivePathSource, SYNTHETIC_PASSIVE_PATH_SOURCE } from './fixtures'
import { buildPassiveGraph, PassiveGraphError } from './graph'
import { connectPassiveTargets, findPassivePath } from './pathfinder'
import type { PassivePathRequest, PassivePathSource } from './types'

const graph = buildPassiveGraph(SYNTHETIC_PASSIVE_PATH_SOURCE)
const request = (targetNodeIds: string[], overrides: Partial<PassivePathRequest> = {}): PassivePathRequest => ({ startNodeId: 'A', targetNodeIds, searchMode: 'lowest-cost-path', ...overrides })

describe('deterministische passive Pfadsuche', () => {
  it('baut alle 5.150 offiziellen Knoten und 6.067 Verbindungen auf', () => { const full = buildPassiveGraph(officialTree as PassivePathSource); expect(full.nodeCount).toBe(5150); expect(full.connectionCount).toBe(6067) })
  it('sortiert Nachbarlisten deterministisch', () => expect(graph.nodes.get('A')?.neighbourNodeIds).toEqual(['AS-A', 'B', 'C']))
  it('findet einen direkten bekannten offiziellen Pfad', () => { const full = buildPassiveGraph(officialTree as PassivePathSource); expect(findPassivePath(full, { startNodeId: '4', targetNodeIds: ['11578'], searchMode: 'shortest-path' }).orderedNodeIds).toEqual(['4', '11578']) })
  it('findet einen Pfad über mehrere Knoten', () => expect(findPassivePath(graph, request(['D'])).orderedNodeIds).toEqual(['A', 'B', 'D']))
  it('berechnet Ziel, neue, wiederverwendete und traversierte Knoten getrennt', () => { const result = findPassivePath(graph, request(['T'], { allocatedNodeIds: ['B'] })); expect(result.orderedNodeIds).toEqual(['A', 'B', 'T']); expect(result.newlyAllocatedNodeIds).toEqual(['T']); expect(result.reusedNodeIds).toEqual(['A', 'B']); expect(result.totalPointCost).toBe(1); expect(result.traversedNodeCount).toBe(3) })
  it('umgeht blockierte Knoten', () => expect(findPassivePath(graph, request(['T'], { blockedNodeIds: ['B'] })).orderedNodeIds).toEqual(['A', 'C', 'T']))
  it('meldet nicht erreichbare Ziele', () => expect(findPassivePath(graph, request(['X'])).status).toBe('unreachable'))
  it('blockiert unbekannte Startknoten', () => expect(findPassivePath(graph, request(['T'], { startNodeId: 'missing' })).violations[0].code).toBe('unknown-start-node'))
  it('blockiert unbekannte Ziele', () => expect(findPassivePath(graph, request(['missing'])).violations.some(value => value.code === 'unknown-target-node')).toBe(true))
  it('hält ein ausreichendes Punktbudget ein', () => expect(findPassivePath(graph, request(['T'], { maxPointBudget: 2 })).withinBudget).toBe(true))
  it('meldet Budgetüberschreitung mit gefundenem Pfad', () => { const result = findPassivePath(graph, request(['T'], { maxPointBudget: 1 })); expect(result.status).toBe('over-budget'); expect(result.orderedNodeIds).toEqual(['A', 'B', 'T']) })
  it('blockiert ungültige Punktbudgets', () => expect(findPassivePath(graph, request(['T'], { maxPointBudget: -1 })).violations.some(value => value.code === 'invalid-point-budget')).toBe(true))
  it('sperrt Aszendenzknoten ohne Kontext', () => expect(findPassivePath(graph, request(['AA'])).violations.some(value => value.code === 'disallowed-ascendancy-node')).toBe(true))
  it('erlaubt die passende Aszendenz', () => expect(findPassivePath(graph, request(['AA'], { ascendancyId: 'asc-a' })).orderedNodeIds).toEqual(['A', 'AS-A', 'AA']))
  it('sperrt eine fremde Aszendenz', () => expect(findPassivePath(graph, request(['AA'], { ascendancyId: 'asc-b' })).status).toBe('blocked'))
  it('verwendet bei gleich teuren Pfaden die lexikografisch kleinere Node-ID-Folge', () => expect(findPassivePath(graph, request(['T'])).orderedNodeIds).toEqual(['A', 'B', 'T']))
  it('unterscheidet kürzesten und günstigsten Pfad', () => {
    const source: PassivePathSource = { nodes: [
      { id: 'S', nodeType: 'class-start', neighbourNodeIds: ['H', 'L1'], isClassStart: true, classStartIndex: 1, isAscendancyStart: false, ascendancyId: null, isJewelSocket: false },
      { id: 'H', nodeType: 'normal', neighbourNodeIds: ['S', 'Z'], isClassStart: false, classStartIndex: null, isAscendancyStart: false, ascendancyId: null, isJewelSocket: false, pointCost: 5 },
      { id: 'L1', nodeType: 'normal', neighbourNodeIds: ['S', 'L2'], isClassStart: false, classStartIndex: null, isAscendancyStart: false, ascendancyId: null, isJewelSocket: false },
      { id: 'L2', nodeType: 'normal', neighbourNodeIds: ['L1', 'Z'], isClassStart: false, classStartIndex: null, isAscendancyStart: false, ascendancyId: null, isJewelSocket: false },
      { id: 'Z', nodeType: 'notable', neighbourNodeIds: ['H', 'L2'], isClassStart: false, classStartIndex: null, isAscendancyStart: false, ascendancyId: null, isJewelSocket: false },
    ], connections: [{ id: 'S-H', fromNodeId: 'S', toNodeId: 'H' }, { id: 'H-Z', fromNodeId: 'H', toNodeId: 'Z' }, { id: 'S-L1', fromNodeId: 'S', toNodeId: 'L1' }, { id: 'L1-L2', fromNodeId: 'L1', toNodeId: 'L2' }, { id: 'L2-Z', fromNodeId: 'L2', toNodeId: 'Z' }] }
    const weighted = buildPassiveGraph(source)
    expect(findPassivePath(weighted, { startNodeId: 'S', targetNodeIds: ['Z'], searchMode: 'shortest-path' }).orderedNodeIds).toEqual(['S', 'H', 'Z'])
    expect(findPassivePath(weighted, { startNodeId: 'S', targetNodeIds: ['Z'], searchMode: 'lowest-cost-path' }).orderedNodeIds).toEqual(['S', 'L1', 'L2', 'Z'])
  })
  it('liefert für gleiche Eingaben exakt gleiche Ausgaben', () => expect(findPassivePath(graph, request(['T']))).toEqual(findPassivePath(graph, request(['T']))))
  it('erzeugt ohne vorgegebene ID eine stabile Request-ID', () => expect(findPassivePath(graph, request(['T'])).requestId).toMatch(/^passive-path-[0-9a-f]{8}$/))
  it('verbindet mehrere Ziele über gemeinsame Teilstücke', () => { const result = connectPassiveTargets(graph, request(['D', 'T'], { searchMode: 'connect-targets' })); expect(result.status).toBe('success'); expect(result.mergedNodeIds).toEqual(['A', 'B', 'D', 'T']); expect(result.totalPointCost).toBe(3); expect(result.optimalityClaim).toBe('shortest-per-step') })
  it('berechnet Mehrzielknoten und Verbindungen nicht doppelt', () => { const result = connectPassiveTargets(graph, request(['D', 'T'], { searchMode: 'connect-targets' })); expect(new Set(result.mergedNodeIds).size).toBe(result.mergedNodeIds.length); expect(new Set(result.mergedConnectionIds).size).toBe(result.mergedConnectionIds.length) })
  it('sortiert und erzeugt Verbindungen stabil', () => expect(findPassivePath(graph, request(['T'])).orderedConnectionIds).toEqual(['A-B', 'B-T']))
  it('blockiert leere Ziele', () => expect(findPassivePath(graph, request([])).violations.some(value => value.code === 'empty-targets')).toBe(true))
  it('blockiert doppelte Ziele kontrolliert', () => expect(connectPassiveTargets(graph, request(['T', 'T'], { searchMode: 'connect-targets' })).violations.some(value => value.code === 'duplicate-target')).toBe(true))
  it('verändert den Quellbaum nicht', () => { const source = clonePassivePathSource(); const before = structuredClone(source); buildPassiveGraph(source); expect(source).toEqual(before) })
  it('ignoriert eine deklarierte Selbstnachbarschaft kontrolliert', () => { const source = clonePassivePathSource(); source.nodes[0].neighbourNodeIds.push('A'); expect(buildPassiveGraph(source).nodes.get('A')?.neighbourNodeIds).not.toContain('A') })
  it('blockiert unbekannte Verbindungsreferenzen und Selbstverbindungen', () => { const source = clonePassivePathSource(); source.connections.push({ id: 'bad', fromNodeId: 'A', toNodeId: 'missing' }); expect(() => buildPassiveGraph(source)).toThrow(PassiveGraphError); const self = clonePassivePathSource(); self.connections.push({ id: 'self', fromNodeId: 'A', toNodeId: 'A' }); expect(() => buildPassiveGraph(self)).toThrow(PassiveGraphError) })
  it('beachtet erlaubte Knotentypen', () => expect(findPassivePath(graph, request(['T'], { allowedNodeTypes: ['class-start', 'normal'] })).status).toBe('blocked'))
  it('verarbeitet mehrere bekannte offizielle Ziele deterministisch', () => { const full = buildPassiveGraph(officialTree as PassivePathSource); const input: PassivePathRequest = { startNodeId: '4', targetNodeIds: ['11578', '48833'], searchMode: 'connect-targets' }; const result = connectPassiveTargets(full, input); expect(result.mergedNodeIds).toEqual(['4', '11578', '48833']); expect(result).toEqual(connectPassiveTargets(full, input)) })
  it('prüft offizielle Aszendenzgrenzen', () => { const full = buildPassiveGraph(officialTree as PassivePathSource); expect(findPassivePath(full, { startNodeId: '74', targetNodeIds: ['1347'], searchMode: 'lowest-cost-path' }).status).toBe('blocked'); expect(findPassivePath(full, { startNodeId: '74', targetNodeIds: ['1347'], ascendancyId: 'Monk3', searchMode: 'lowest-cost-path' }).status).toBe('success') })
})
