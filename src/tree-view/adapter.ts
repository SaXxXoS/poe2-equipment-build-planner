import type { ImportedPoe2Tree, PassiveTreeViewModel, TreeBoundsViewModel, TreeImportReport, TreeNodeViewModel, TreeNodeViewType } from './types'

export const TREE_VIEW_PADDING = 420
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

function calculateBounds(nodes: TreeNodeViewModel[]): TreeBoundsViewModel {
  if (!nodes.length) throw new Error('Der importierte Baum enthält keine Knoten')
  const xs = nodes.map(node => finite(node.x, `nodes.${node.id}.x`)), ys = nodes.map(node => finite(node.y, `nodes.${node.id}.y`))
  const minX = Math.min(...xs) - TREE_VIEW_PADDING, minY = Math.min(...ys) - TREE_VIEW_PADDING, maxX = Math.max(...xs) + TREE_VIEW_PADDING, maxY = Math.max(...ys) + TREE_VIEW_PADDING
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY, padding: TREE_VIEW_PADDING }
}

export function adaptImportedPoe2Tree(input: ImportedPoe2Tree, report: TreeImportReport): PassiveTreeViewModel {
  if (!input?.metadata || !Array.isArray(input.nodes) || !Array.isArray(input.connections) || !Array.isArray(input.groups)) throw new Error('Ungültiges Format der lokalen Baumdaten')
  const classNames = new Map(input.classes.map(value => [value.classStartIndex, value.name.sourceText ?? `Klasse ${value.classStartIndex}`]))
  const ascendancyNames = new Map(input.classes.flatMap(value => value.ascendancies.map(item => [item.id, item.name.sourceText ?? item.id] as const)))
  const nodes = input.nodes.map(node => {
    const nodeType = deriveTreeNodeType(node), warningCodes = nodeType === 'unknown' ? [`unknown-node-type:${node.nodeType}`] : []
    return { id: node.id, x: finite(node.position.x, `nodes.${node.id}.x`), y: finite(node.position.y, `nodes.${node.id}.y`), nodeType, groupId: node.groupId, orbit: node.orbit, orbitIndex: node.orbitIndex, displayName: node.name.localizedText ?? node.name.sourceText ?? node.id, sourceText: node.name.sourceText, sourceLocale: node.name.sourceLocale, localizationStatus: node.name.localizationStatus, stats: node.stats.map(value => value.sourceText).filter((value): value is string => Boolean(value)), neighbourIds: [...node.neighbourNodeIds].sort(compareId), isClassStart: node.isClassStart, classId: node.classStartIndex === null ? undefined : String(node.classStartIndex), isAscendancyStart: node.isAscendancyStart, ascendancyId: node.ascendancyId ?? undefined, isAscendancyNode: Boolean(node.ascendancyId), isJewelSocket: node.isJewelSocket, selectable: true, visible: true, warningCodes, sourceReference: node.sourceReference } satisfies TreeNodeViewModel
  }).sort((a, b) => compareId(a.id, b.id))
  const nodeIds = new Set(nodes.map(node => node.id))
  if (nodeIds.size !== nodes.length) throw new Error('Doppelte technische Knoten-ID im Darstellungsadapter')
  const connections = input.connections.map(connection => ({ ...connection })).sort((a, b) => compareId(a.fromNodeId, b.fromNodeId) || compareId(a.toNodeId, b.toNodeId))
  for (const connection of connections) if (!nodeIds.has(connection.fromNodeId) || !nodeIds.has(connection.toNodeId)) throw new Error(`Ungültige Verbindung ${connection.id}`)
  const groups = input.groups.map(group => ({ id: group.groupId, x: finite(group.position.x, `groups.${group.groupId}.x`), y: finite(group.position.y, `groups.${group.groupId}.y`), nodeIds: [...group.nodeIds].sort(compareId) })).sort((a, b) => compareId(a.id, b.id))
  const classStartNodes = nodes.filter(node => node.isClassStart), ascendancyStartNodes = nodes.filter(node => node.isAscendancyStart), jewelSockets = nodes.filter(node => node.isJewelSocket)
  const classes = classStartNodes.map(node => ({ id: node.classId!, displayName: classNames.get(Number(node.classId)) ?? node.displayName, nodeId: node.id })).sort((a, b) => a.displayName.localeCompare(b.displayName, 'en'))
  const ascendancies = ascendancyStartNodes.map(node => ({ id: node.ascendancyId ?? node.id, displayName: ascendancyNames.get(node.ascendancyId ?? '') ?? node.displayName, nodeId: node.id })).sort((a, b) => a.displayName.localeCompare(b.displayName, 'en'))
  const adapterWarnings = [...new Set(nodes.flatMap(node => node.warningCodes))].sort()
  return { sourceVersion: input.metadata.releaseTag, sourceCommit: input.metadata.commitHash, sourceLocale: input.metadata.sourceLocale, bounds: calculateBounds(nodes), nodeCount: nodes.length, connectionCount: connections.length, groupCount: groups.length, nodes, connections, groups, classStartNodes, ascendancyStartNodes, jewelSockets, classes, ascendancies, warnings: [...report.warnings.map(value => `${value.code}: ${value.message}`), ...adapterWarnings], status: report.status === 'validated' ? 'validated' : 'rejected' }
}
