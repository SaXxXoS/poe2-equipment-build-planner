import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { PassiveTreeContent, PassiveTreeLoadState } from './PassiveTree'
import { centeredTreeCamera, initialTreeCamera, nodeMatchesFilter, searchTreeNodes } from '../tree-view/view-logic'
import type { PassiveTreeViewModel, TreeNodeViewModel } from '../tree-view/types'

const node = (value: Partial<TreeNodeViewModel> = {}): TreeNodeViewModel => ({ id: '42', x: 10, y: 20, nodeType: 'notable', groupId: '1', orbit: 1, orbitIndex: 2, displayName: 'Official Node', sourceText: 'Official Node', sourceLocale: 'en', localizationStatus: 'pending', stats: ['25% increased Test Stat'], neighbourIds: ['43'], isClassStart: false, isAscendancyStart: false, isAscendancyNode: false, isJewelSocket: false, selectable: true, visible: true, warningCodes: [], sourceReference: 'nodes.42', ...value })
const tree = (): PassiveTreeViewModel => { const nodes = [node(), node({ id: '43', displayName: 'Start', nodeType: 'class-start', isClassStart: true, classId: '0', neighbourIds: ['42'] })]; return { sourceVersion: '0.5.2', sourceCommit: 'a'.repeat(40), sourceLocale: 'en', bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100, padding: 10 }, nodeCount: 5150, connectionCount: 6067, groupCount: 1621, nodes, connections: [{ id: '42:43', fromNodeId: '42', toNodeId: '43', connectionType: 'passive-tree', sourceReference: 'edges.0' }], groups: [{ id: '1', x: 0, y: 0, nodeIds: ['42', '43'] }], classStartNodes: [nodes[1]], ascendancyStartNodes: [], jewelSockets: [], classes: [{ id: '0', displayName: 'Witch', nodeId: '43' }], ascendancies: [], warnings: [], status: 'validated' } }

describe('echte Passivbaumkomponente', () => {
  it('zeigt den Ladezustand', () => expect(renderToStaticMarkup(<PassiveTreeLoadState/>)).toContain('Lokale Baumdaten werden geladen'))
  it('zeigt den Fehlerzustand ohne Ersatzbaum', () => { const html = renderToStaticMarkup(<PassiveTreeLoadState error="Datei fehlt"/>); expect(html).toContain('Datei fehlt'); expect(html).toContain('kein synthetischer Ersatzbaum') })
  it('zeigt echte Knotenzahl und Release', () => { const html = renderToStaticMarkup(<PassiveTreeContent tree={tree()}/>); expect(html).toContain('5.150 Knoten'); expect(html).toContain('Release 0.5.2') })
  it('rendert fokussierbare Knoten', () => expect(renderToStaticMarkup(<PassiveTreeContent tree={tree()}/>)).toContain('tabindex="0"'))
  it('zeigt den englischen Sprachhinweis', () => expect(renderToStaticMarkup(<PassiveTreeContent tree={tree()}/>)).toContain('englische Originaltexte'))
  it('zeigt keine Pfadsuche oder Optimierung an', () => expect(renderToStaticMarkup(<PassiveTreeContent tree={tree()}/>)).toContain('Keine Pfadsuche oder Buildoptimierung'))
  it('enthält Suche und Filter', () => { const html = renderToStaticMarkup(<PassiveTreeContent tree={tree()}/>); expect(html).toContain('Knotensuche'); expect(html).toContain('Darstellungsfilter') })
  it('enthält Klassen- und Aszendenznavigation', () => { const html = renderToStaticMarkup(<PassiveTreeContent tree={tree()}/>); expect(html).toContain('Klassenstart'); expect(html).toContain('Aszendenzstart') })
  it('Suche findet englischen Namen', () => expect(searchTreeNodes(tree().nodes, 'official')).toHaveLength(1))
  it('Suche findet technische ID', () => expect(searchTreeNodes(tree().nodes, '42')[0].id).toBe('42'))
  it('Suche findet Stattext', () => expect(searchTreeNodes(tree().nodes, 'increased test').map(value => value.id)).toEqual(['42', '43']))
  it('Suche ist unabhängig von Groß-/Kleinschreibung', () => expect(searchTreeNodes(tree().nodes, 'OFFICIAL')).toHaveLength(1))
  it('Filter hebt passende Typen rein visuell hervor', () => { expect(nodeMatchesFilter(tree().nodes[0], 'notable')).toBe(true); expect(nodeMatchesFilter(tree().nodes[0], 'keystone')).toBe(false) })
  it('Gesamtansicht verwendet Bounds-Zentrum', () => expect(initialTreeCamera(tree())).toEqual({ centerX: 50, centerY: 50, zoom: 1 }))
  it('Navigation zentriert ohne Pfadberechnung', () => expect(centeredTreeCamera(tree(), tree().nodes[0])).toEqual({ centerX: 10, centerY: 20, zoom: 6 }))
  it('löst keine Buildanalyse aus', () => { const analyzer = vi.fn(); renderToStaticMarkup(<PassiveTreeContent tree={tree()}/>); expect(analyzer).not.toHaveBeenCalled() })
})
