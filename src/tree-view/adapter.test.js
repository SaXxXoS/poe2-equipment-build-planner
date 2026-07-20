import { describe, expect, it } from 'vitest'
import importedTree from '../../generated/poe2-tree/tree.json'
import report from '../../generated/poe2-tree/import-report.json'
import { adaptImportedPoe2Tree, deriveTreeNodeType } from './adapter'

const adapt = () => adaptImportedPoe2Tree(importedTree, report)

describe('PoE2-Baum-Darstellungsadapter', () => {
  it('übernimmt alle 5.150 Knoten', () => expect(adapt().nodeCount).toBe(5150))
  it('übernimmt alle 6.067 Verbindungen', () => expect(adapt().connectionCount).toBe(6067))
  it('übernimmt alle 1.621 Gruppen', () => expect(adapt().groupCount).toBe(1621))
  it('erkennt sechs Klassenstarts', () => expect(adapt().classStartNodes).toHaveLength(6))
  it('bietet alle zwölf offiziellen Klassen zur Orientierung an', () => expect(adapt().classes).toHaveLength(12))
  it('erkennt 36 Aszendenzstarts', () => expect(adapt().ascendancyStartNodes).toHaveLength(36))
  it('erkennt 19 Juwelsockel', () => expect(adapt().jewelSockets).toHaveLength(19))
  it('erzeugt keine Cluster-Sockel', () => expect(adapt().nodes.some(node => node.nodeType === 'cluster-socket')).toBe(false))
  it('behält eindeutige IDs', () => { const tree = adapt(); expect(new Set(tree.nodes.map(node => node.id)).size).toBe(tree.nodeCount) })
  it('enthält nur gültige Verbindungsreferenzen', () => { const tree = adapt(), ids = new Set(tree.nodes.map(node => node.id)); expect(tree.connections.every(value => ids.has(value.fromNodeId) && ids.has(value.toNodeId))).toBe(true) })
  it('leitet unbekannte Typen kontrolliert ab', () => expect(deriveTreeNodeType({ nodeType: 'future' })).toBe('unknown'))
  it('berechnet endliche Bounds', () => expect(Object.values(adapt().bounds).every(Number.isFinite)).toBe(true))
  it('Bounds umfassen alle Knoten', () => { const tree = adapt(); expect(tree.nodes.every(node => node.x >= tree.bounds.minX && node.x <= tree.bounds.maxX && node.y >= tree.bounds.minY && node.y <= tree.bounds.maxY)).toBe(true) })
  it('sortiert Knoten deterministisch', () => expect(adapt().nodes.map(node => node.id)).toEqual(adapt().nodes.map(node => node.id)))
  it('sortiert Verbindungen deterministisch', () => expect(adapt().connections).toEqual(adapt().connections.slice().sort((a, b) => a.fromNodeId.localeCompare(b.fromNodeId, 'en', { numeric: true }) || a.toNodeId.localeCompare(b.toNodeId, 'en', { numeric: true }))))
  it('enthält keine Assetpfade oder Asset-URLs', () => expect(JSON.stringify(adapt())).not.toMatch(/Art\/|\.png|\.webp|sprite/i))
  it('behält den englischen Sprachstatus', () => expect(adapt()).toMatchObject({ sourceLocale: 'en', sourceVersion: '0.5.2' }))
  it('verwendet bei leerem Quellnamen die technische ID', () => expect(adapt().nodes.filter(node => node.sourceText === '').every(node => node.displayName === node.id)).toBe(true))
  it('erzeugt für gleichen Input dasselbe ViewModel', () => expect(adapt()).toEqual(adapt()))
  it('blockiert ungültige Positionen', () => { const value = JSON.parse(JSON.stringify(importedTree)); value.nodes[0].position.x = Number.NaN; expect(() => adaptImportedPoe2Tree(value, report)).toThrow(/Baumkoordinate/) })
})
