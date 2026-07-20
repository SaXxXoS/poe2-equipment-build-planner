import type { PassivePathSource, PassivePathSourceConnection, PassivePathSourceNode } from './types'

const node = (id: string, neighbours: string[], properties: Partial<PassivePathSourceNode> = {}): PassivePathSourceNode => ({ id, nodeType: 'normal', neighbourNodeIds: neighbours, isClassStart: false, classStartIndex: null, isAscendancyStart: false, ascendancyId: null, isJewelSocket: false, ...properties })
const edge = (fromNodeId: string, toNodeId: string): PassivePathSourceConnection => ({ id: `${fromNodeId}-${toNodeId}`, fromNodeId, toNodeId })

export const SYNTHETIC_PASSIVE_PATH_SOURCE: PassivePathSource = {
  nodes: [
    node('A', ['B', 'C', 'AS-A'], { nodeType: 'class-start', isClassStart: true, classStartIndex: 1 }),
    node('B', ['A', 'D', 'T']), node('C', ['A', 'T']), node('D', ['B']), node('T', ['B', 'C'], { nodeType: 'notable' }),
    node('X', []),
    node('AS-A', ['A', 'AA'], { nodeType: 'ascendancy-start', isAscendancyStart: true, ascendancyId: 'asc-a' }),
    node('AA', ['AS-A'], { ascendancyId: 'asc-a' }),
  ],
  connections: [edge('A', 'B'), edge('A', 'C'), edge('A', 'AS-A'), edge('B', 'D'), edge('B', 'T'), edge('C', 'T'), edge('AS-A', 'AA')],
}

export const clonePassivePathSource = (source: PassivePathSource = SYNTHETIC_PASSIVE_PATH_SOURCE): PassivePathSource => structuredClone(source)
