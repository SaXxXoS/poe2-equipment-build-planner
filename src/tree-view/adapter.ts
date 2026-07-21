import type { ImportedPoe2Tree, PassiveTreeViewModel, TreeImportReport, TreeNodeViewModel, TreeNodeViewType } from './types'
import { calculateTreeBounds,isDrawableTreeConnection,resolvePassiveNodeWorldPosition,TREE_VIEW_PADDING } from './geometry'

const compareId = (a: string, b: string) => a.localeCompare(b, 'en', { numeric: true })
const finite = (value: number, path: string) => { if (!Number.isFinite(value)) throw new Error(`Ungültige Baumkoordinate: ${path}`); return value }

export function deriveTreeNodeType(node: ImportedPoe2Tree['nodes'][number]): TreeNodeViewType {
  if (node.isClassStart) return 'class-start'
  if (node.isAscendancyStart) return 'ascendancy-start'
  if (node.isJewelSocket) return 'jewel-socket'
  if (node.nodeType === 'keystone') return 'keystone'
  if (node.nodeType === 'notable') return 'notable'
  if (node.ascendancyId) return 'ascendancy'
  if (node.nodeType === 'normal') return 'normal'
  return 'unknown'
}

export function adaptImportedPoe2Tree(input: ImportedPoe2Tree, report: TreeImportReport): PassiveTreeViewModel {
  if (!input?.metadata || !Array.isArray(input.nodes) || !Array.isArray(input.connections) || !Array.isArray(input.groups)) throw new Error('Ungültiges Format der lokalen Baumdaten')
  const ascendancyNames = new Map(input.classes.flatMap(value => value.ascendancies.map(item => [item.id, item.name.sourceText || item.id] as const)))
  const inputGroups=new Map(input.groups.map(group=>[group.groupId,group])),inputNodes=new Map(input.nodes.map(node=>[node.id,node]))
  const nodes = input.nodes.map(node => {
    const nodeType = deriveTreeNodeType(node), warningCodes = nodeType === 'unknown' ? [`unknown-node-type:${node.nodeType}`] : []
    const position=resolvePassiveNodeWorldPosition(node,inputGroups.get(node.groupId)!)
    return { id: node.id, x: position.x, y: position.y, nodeType, groupId: node.groupId, orbit: node.orbit, orbitIndex: node.orbitIndex, displayName: node.name.localizedText || node.name.sourceText || node.id, sourceText: node.name.sourceText, sourceLocale: node.name.sourceLocale, localizationStatus: node.name.localizationStatus, stats: node.stats.map(value => value.sourceText).filter((value): value is string => Boolean(value)), neighbourIds: [...node.neighbourNodeIds].sort(compareId), isClassStart: node.isClassStart, classId: node.classStartIndex === null ? undefined : (Array.isArray(node.classStartIndex) ? node.classStartIndex : [node.classStartIndex]).join(','), isAscendancyStart: node.isAscendancyStart, ascendancyId: node.ascendancyId ?? undefined, isAscendancyNode: Boolean(node.ascendancyId), isJewelSocket: node.isJewelSocket, selectable: true, visible: true, warningCodes, sourceReference: node.sourceReference } satisfies TreeNodeViewModel
  }).sort((a, b) => compareId(a.id, b.id))
  const nodeIds = new Set(nodes.map(node => node.id))
  if (nodeIds.size !== nodes.length) throw new Error('Doppelte technische Knoten-ID im Darstellungsadapter')
  const connections = input.connections.map(connection => ({ ...connection,hideInDefaultState:connection.hideInDefaultState===true,connectionType:isDrawableTreeConnection(inputNodes.get(connection.fromNodeId)!,inputNodes.get(connection.toNodeId)!)?'passive-tree':'layout-transition' })).sort((a, b) => compareId(a.fromNodeId, b.fromNodeId) || compareId(a.toNodeId, b.toNodeId))
  for (const connection of connections) if (!nodeIds.has(connection.fromNodeId) || !nodeIds.has(connection.toNodeId)) throw new Error(`Ungültige Verbindung ${connection.id}`)
  const groups = input.groups.map(group => ({ id: group.groupId, x: finite(group.position.x, `groups.${group.groupId}.x`), y: finite(group.position.y, `groups.${group.groupId}.y`), nodeIds: [...group.nodeIds].sort(compareId) })).sort((a, b) => compareId(a.id, b.id))
  const classStartNodes = nodes.filter(node => node.isClassStart), ascendancyStartNodes = nodes.filter(node => node.isAscendancyStart), jewelSockets = nodes.filter(node => node.isJewelSocket)
  const classes = input.classes.map(value => { const node = classStartNodes.find(candidate => candidate.classId?.split(',').includes(String(value.classStartIndex))); return node ? { id: String(value.classStartIndex), displayName: value.name.sourceText || String(value.classStartIndex), nodeId: node.id } : null }).filter((value): value is NonNullable<typeof value> => Boolean(value)).sort((a, b) => a.displayName.localeCompare(b.displayName, 'en'))
  const ascendancyClasses = new Map(input.classes.flatMap(value => value.ascendancies.map(item => [item.id, String(value.classStartIndex)] as const)))
  const ascendancies = ascendancyStartNodes.map(node => ({ id: node.ascendancyId || node.id, displayName: ascendancyNames.get(node.ascendancyId || '') || node.displayName || node.id, nodeId: node.id, classId: ascendancyClasses.get(node.ascendancyId || '') })).sort((a, b) => a.displayName.localeCompare(b.displayName, 'en'))
  const adapterWarnings = [...new Set(nodes.flatMap(node => node.warningCodes))].sort()
  const mainNodes=nodes.filter(node=>!node.isAscendancyNode)
  return { sourceVersion: input.metadata.releaseTag, sourceCommit: input.metadata.commitHash, sourceLocale: input.metadata.sourceLocale, bounds: calculateTreeBounds(mainNodes,TREE_VIEW_PADDING),worldBounds:calculateTreeBounds(nodes,TREE_VIEW_PADDING), nodeCount: nodes.length, connectionCount: connections.length,drawableConnectionCount:connections.filter(value=>value.connectionType==='passive-tree').length, groupCount: groups.length, nodes, connections, groups, classStartNodes, ascendancyStartNodes, jewelSockets, classes, ascendancies, warnings: [...report.warnings.map(value => `${value.code}: ${value.message}`), ...adapterWarnings], status: report.status === 'validated' ? 'validated' : 'rejected' }
}
