/* global performance, process, console */
import { describe, expect, it } from 'vitest'
import officialTree from '../../../generated/poe2-tree/tree.json'
import { buildPassiveGraph } from './graph'
import { connectPassiveTargets, findPassivePath } from './pathfinder'

const elapsed = (start) => Math.round((performance.now() - start) * 100) / 100

describe('Pfadsuche auf dem vollständigen offiziellen Graphen', () => {
  it('protokolliert reale Einzelmessungen ohne künstlichen Grenzwert', () => {
    const memoryBefore = process.memoryUsage().heapUsed
    let started = performance.now(); const graph = buildPassiveGraph(officialTree); const graphBuildMs = elapsed(started)
    const memoryAfterGraph = process.memoryUsage().heapUsed
    started = performance.now(); const single = findPassivePath(graph, { startNodeId: '4', targetNodeIds: ['32258'], searchMode: 'lowest-cost-path' }); const singleTargetMs = elapsed(started)
    const targets = ['32258', '8957', '19644', '57021', '6502', '31757', '3866', '14505', '45343', '8535']
    started = performance.now(); const repeated = targets.map(targetNodeId => findPassivePath(graph, { startNodeId: '4', targetNodeIds: [targetNodeId], searchMode: 'lowest-cost-path' })); const tenSingleTargetsMs = elapsed(started)
    started = performance.now(); const multi = connectPassiveTargets(graph, { startNodeId: '4', targetNodeIds: targets.slice(0, 4), searchMode: 'connect-targets' }); const fourTargetConnectMs = elapsed(started)
    const memoryAfterSearch = process.memoryUsage().heapUsed
    console.info('PASSIVE_PATH_PERFORMANCE', JSON.stringify({ runtime: process.version, platform: `${process.platform}-${process.arch}`, graphBuildMs, singleTargetMs, tenSingleTargetsMs, fourTargetConnectMs, observedHeapDeltaGraphMiB: Math.round((memoryAfterGraph - memoryBefore) / 10485.76) / 100, observedHeapDeltaTotalMiB: Math.round((memoryAfterSearch - memoryBefore) / 10485.76) / 100 }))
    expect(single.status).toBe('success'); expect(single.pathLength).toBeGreaterThan(0)
    expect(repeated.every(result => result.status === 'success')).toBe(true)
    expect(multi.status).toBe('success'); expect(multi.optimalityClaim).toBe('shortest-per-step')
  }, 15000)
})
