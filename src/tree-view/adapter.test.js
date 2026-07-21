import { describe, expect, it } from 'vitest'
import importedTree from '../../generated/poe2-tree/tree.json'
import report from '../../generated/poe2-tree/import-report.json'
import { adaptImportedPoe2Tree, deriveTreeNodeType } from './adapter'
import { resolvePassiveNodeWorldPosition } from './geometry'
import { createTreeGeometryDiagnostics } from './geometry-diagnostics'
import storedGeometryDiagnostics from '../../generated/poe2-tree/geometry-diagnostics.json'

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
  it('Standard-Bounds umfassen den gesamten normalen Baum', () => { const tree = adapt(); expect(tree.nodes.filter(node=>!node.isAscendancyNode).every(node => node.x >= tree.bounds.minX && node.x <= tree.bounds.maxX && node.y >= tree.bounds.minY && node.y <= tree.bounds.maxY)).toBe(true) })
  it('World-Bounds umfassen alle Knoten einschließlich Aszendenzen', () => { const tree = adapt(); expect(tree.nodes.every(node => node.x >= tree.worldBounds.minX && node.x <= tree.worldBounds.maxX && node.y >= tree.worldBounds.minY && node.y <= tree.worldBounds.maxY)).toBe(true) })
  it('sortiert Knoten deterministisch', () => expect(adapt().nodes.map(node => node.id)).toEqual(adapt().nodes.map(node => node.id)))
  it('sortiert Verbindungen deterministisch', () => expect(adapt().connections).toEqual(adapt().connections.slice().sort((a, b) => a.fromNodeId.localeCompare(b.fromNodeId, 'en', { numeric: true }) || a.toNodeId.localeCompare(b.toNodeId, 'en', { numeric: true }))))
  it('enthält keine Assetpfade oder Asset-URLs', () => expect(JSON.stringify(adapt())).not.toMatch(/Art\/|\.png|\.webp|sprite/i))
  it('behält den englischen Sprachstatus', () => expect(adapt()).toMatchObject({ sourceLocale: 'en', sourceVersion: '0.5.2' }))
  it('verwendet bei leerem Quellnamen die technische ID', () => expect(adapt().nodes.filter(node => node.sourceText === '').every(node => node.displayName === node.id)).toBe(true))
  it('erzeugt für gleichen Input dasselbe ViewModel', () => expect(adapt()).toEqual(adapt()))
  it('blockiert ungültige Positionen', () => { const value = JSON.parse(JSON.stringify(importedTree)); value.nodes[0].position.x = Number.NaN; expect(() => adaptImportedPoe2Tree(value, report)).toThrow(/Baumkoordinate/) })
  it('verwendet offizielle absolute Knotenkoordinaten genau einmal',()=>{const node=importedTree.nodes.find(value=>value.id==='41311'),group=importedTree.groups.find(value=>value.groupId===node.groupId);expect(resolvePassiveNodeWorldPosition(node,group)).toEqual(node.position);expect(node.position.x).not.toBe(group.position.x)})
  it('behält Achsen, Skalierung und Orbitversatz unverändert',()=>{const node=importedTree.nodes.find(value=>value.id==='41311'),group=importedTree.groups.find(value=>value.groupId===node.groupId),position=resolvePassiveNodeWorldPosition(node,group);expect(position.x-group.position.x).toBeCloseTo(-726.6,1);expect(position.y-group.position.y).toBeCloseTo(419.5,1)})
  it('markiert ausschließlich 40 layoutübergreifende Übergänge als nicht zeichnbar',()=>{const tree=adapt();expect(tree.connectionCount).toBe(6067);expect(tree.drawableConnectionCount).toBe(6027);expect(tree.connections.filter(value=>value.connectionType==='layout-transition')).toHaveLength(40)})
  it('entfernt alle extrem langen Linien aus der zeichnenden Verbindungsschicht',()=>{const tree=adapt(),nodes=new Map(tree.nodes.map(value=>[value.id,value]));expect(tree.connections.filter(value=>value.connectionType==='passive-tree').every(value=>{const a=nodes.get(value.fromNodeId),b=nodes.get(value.toNodeId);return Math.hypot(a.x-b.x,a.y-b.y)<5000})).toBe(true)})
  it('erzeugt vollständige validierte Geometriediagnose',()=>{const diagnostic=createTreeGeometryDiagnostics(importedTree,adapt());expect(diagnostic).toMatchObject({sourceVersion:'0.5.2',nodeCount:5150,groupCount:1621,connectionCount:6067,drawableConnectionCount:6027,nodesAtZeroZero:[],missingGroupReferences:[],nonFinitePositions:[],extremeOutlierNodeIds:[],duplicatePositionCount:26,geometryVersion:'5D-fix-1.0.0',status:'validated'});expect(diagnostic.classStartPositions).toHaveLength(6);expect(diagnostic.jewelSocketPositions).toHaveLength(19)})
  it('stimmt mit der kompakten maschinenlesbaren Diagnosedatei überein',()=>expect(createTreeGeometryDiagnostics(importedTree,adapt())).toEqual(storedGeometryDiagnostics))
  it('besitzt getrennte Klassenstartpositionen und plausible Main-Bounds',()=>{const tree=adapt(),keys=new Set(tree.classStartNodes.map(value=>`${value.x},${value.y}`));expect(keys.size).toBe(6);expect(tree.bounds.width/tree.bounds.height).toBeGreaterThan(.7);expect(tree.bounds.width/tree.bounds.height).toBeLessThan(1.4)})
})
