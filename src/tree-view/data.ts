import treeDataUrl from '../../generated/poe2-tree/tree.json?url'
import report from '../../generated/poe2-tree/import-report.json'
import { adaptImportedPoe2Tree } from './adapter'
import type { ImportedPoe2Tree, PassiveTreeViewModel, TreeImportReport } from './types'

let cachedTree: PassiveTreeViewModel | null = null
export const treeLoadMetrics = { dataLoadMs: 0, adapterMs: 0, totalMs: 0 }

export async function loadPoe2TreeViewModel(): Promise<PassiveTreeViewModel> {
  if (cachedTree) return cachedTree
  const loadStarted = performance.now()
  const response = await fetch(treeDataUrl)
  if (!response.ok) throw new Error(`Lokale Baumdatei konnte nicht geladen werden (${response.status})`)
  const input = await response.json() as ImportedPoe2Tree
  const adapterStarted = performance.now()
  cachedTree = adaptImportedPoe2Tree(input, report as TreeImportReport)
  const adapterEnded = performance.now()
  treeLoadMetrics.dataLoadMs = adapterStarted - loadStarted
  treeLoadMetrics.adapterMs = adapterEnded - adapterStarted
  treeLoadMetrics.totalMs = adapterEnded - loadStarted
  if (cachedTree.status !== 'validated') throw new Error('Der lokale Baumdatenstand ist nicht validiert')
  return cachedTree
}
