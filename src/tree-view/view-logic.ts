import type { PassiveTreeViewModel, TreeDisplayFilter, TreeNodeViewModel } from './types'
import { clampTreeZoom } from './gestures'

export const TREE_NODE_RADIUS = { normal: 48, notable: 72, keystone: 100, 'class-start': 118, 'ascendancy-start': 108, ascendancy: 76, 'jewel-socket': 88, unknown: 52 } as const
export const SEARCH_RESULT_LIMIT = 20

export function nodeMatchesFilter(node: TreeNodeViewModel, filter: TreeDisplayFilter) {
  if (filter === 'all') return true
  if (filter === 'ascendancy') return node.isAscendancyNode
  return node.nodeType === filter
}

export function searchTreeNodes(nodes: TreeNodeViewModel[], query: string) {
  const value = query.trim().toLocaleLowerCase('en')
  if (!value) return []
  return nodes.filter(node => node.id.toLocaleLowerCase('en').includes(value) || node.displayName.toLocaleLowerCase('en').includes(value) || node.stats.some(stat => stat.toLocaleLowerCase('en').includes(value))).slice(0, SEARCH_RESULT_LIMIT)
}

export function initialTreeCamera(tree: PassiveTreeViewModel) { return { centerX: tree.bounds.minX + tree.bounds.width / 2, centerY: tree.bounds.minY + tree.bounds.height / 2, zoom: 1 } }
export function centeredTreeCamera(tree: PassiveTreeViewModel, node: TreeNodeViewModel, zoom = 6) { return { centerX: node.x, centerY: node.y, zoom: clampTreeZoom(zoom) } }
