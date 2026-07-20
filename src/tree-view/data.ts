import treeDataUrl from '../../generated/poe2-tree/tree.json?url'
import report from '../../generated/poe2-tree/import-report.json'
import { adaptImportedPoe2Tree } from './adapter'
import type { ImportedPoe2Tree, PassiveTreeViewModel, TreeImportReport } from './types'

let cachedTree: PassiveTreeViewModel | null = null

export async function loadPoe2TreeViewModel(): Promise<PassiveTreeViewModel> {
  if (cachedTree) return cachedTree
  performance.mark('poe2-tree-load-start')
  const response = await fetch(treeDataUrl)
  if (!response.ok) throw new Error(`Lokale Baumdatei konnte nicht geladen werden (${response.status})`)
  const input = await response.json() as ImportedPoe2Tree
  performance.mark('poe2-tree-data-loaded')
  performance.mark('poe2-tree-adapter-start')
  cachedTree = adaptImportedPoe2Tree(input, report as TreeImportReport)
  performance.mark('poe2-tree-adapter-end')
  if (cachedTree.status !== 'validated') throw new Error('Der lokale Baumdatenstand ist nicht validiert')
  return cachedTree
}
