import { describe, expect, it } from 'vitest'
import approval from '../../../data-sources/source-approval.json'
import { assertApproval, compareTrees, importTree, normalizeTree, selectRelease, sha256, validateRaw } from '../../../scripts/poe2-tree-import.mjs'

const raw = () => ({
  tree: 'Default', classes: [{ name: 'Witch', ascendancies: [{ id: 'Witch1', name: 'Infernalist', image: 'ignored.png' }] }],
  groups: { 1: { x: 10, y: 20, orbits: [0, 82], nodes: ['1', '2'] } },
  nodes: {
    root: { group: 0, orbit: 0, orbitIndex: 0, out: ['1'], in: [], edges: [0] },
    1: { id: 'start', skill: 1, name: 'Start', icon: 'ignored.png', stats: [], group: 1, orbit: 0, orbitIndex: 0, x: 10, y: 20, classStartIndex: 0, out: ['2'], in: ['root'], edges: [0, 1] },
    2: { id: 'socket', skill: 2, name: '[Jewel] Socket', icon: 'ignored.png', stats: ['Official English stat'], group: 1, orbit: 1, orbitIndex: 0, x: 11, y: 21, isJewelSocket: true, out: [], in: ['1'], edges: [1] }
  },
  edges: [{ from: 'root', to: 1 }, { from: 1, to: 2 }], skillOverrides: {}, jewelSlots: [2], min_x: 0, min_y: 0, max_x: 100, max_y: 100
})
const metaFor = value => ({ sourceId: 'ggg-poe2-skilltree-export', repositoryUrl: 'https://github.com/grindinggear/poe2-skilltree-export', releaseTag: 'test-1', commitHash: 'a'.repeat(40), retrievedAt: '2026-07-20T00:00:00.000Z', gameVersion: 'test-1', seasonName: 'Test', sourceFile: 'data.json', rawFile: 'fixture.json', sourceFileHash: sha256(JSON.stringify(value)), importerVersion: '1.0.0', schemaVersion: '1.0.0' })
const run = value => importTree({ rawText: JSON.stringify(value), metadata: metaFor(value), approval })

describe('offizieller PoE2-Passivbaumimport', () => {
  it('blockiert fehlende, latest- und main-Versionen', () => { for (const value of [null, 'latest', 'main']) expect(() => selectRelease({ releases: [] }, value)).toThrow(/explizite/) })
  it('blockiert unbekannte Versionen', () => expect(() => selectRelease({ releases: [] }, 'unknown')).toThrow(/Unbekannte/))
  it('besteht den Import-Guard', () => expect(assertApproval(approval)).toBe(true))
  it('erzeugt einen SHA-256', () => expect(sha256('tree')).toMatch(/^[a-f0-9]{64}$/))
  it('validiert das Root-Schema', () => expect(validateRaw({}, metaFor({})).errors.some(value => value.code === 'root-schema')).toBe(true))
  it('importiert eindeutige Node-IDs', () => expect(run(raw()).data.nodes.map(value => value.id)).toEqual(['1', '2']))
  it('normalisiert Positionen', () => expect(run(raw()).data.nodes[0].position).toEqual({ x: 10, y: 20 }))
  it('erkennt Startknoten', () => expect(run(raw()).report.classStartNodeCount).toBe(1))
  it('erkennt Juwelsockel', () => expect(run(raw()).report.jewelSocketCount).toBe(1))
  it('erfindet keine Cluster-Sockel', () => expect(run(raw()).report.clusterSocketCount).toBe(0))
  it('übernimmt keine Assets', () => expect(JSON.stringify(run(raw()).data)).not.toContain('ignored.png'))
  it('kennzeichnet englischen Quelltext und fehlendes Deutsch', () => expect(run(raw()).data.nodes[0].name).toMatchObject({ sourceText: 'Start', sourceLocale: 'en', localizedText: null, localizationStatus: 'pending' }))
  it('behält englische Stats als Fallback', () => expect(run(raw()).data.nodes[1].stats[0].sourceText).toBe('Official English stat'))
  it('ist deterministisch sortiert', () => expect(run(raw()).data).toEqual(run(raw()).data))
  it('erzeugt einen vollständigen Bericht', () => expect(run(raw()).report).toMatchObject({ importedNodeCount: 2, importedConnectionCount: 1, importedGroupCount: 1, status: 'validated', unknownFieldCount: 0, errorCount: 0 }))
  it('erkennt unbekannte Felder', () => { const value = raw(); value.nodes[1].mystery = true; expect(run(value).report.unknownFields).toContain('nodes.1.mystery') })
  it('lehnt einen falschen Hash ab', () => expect(() => importTree({ rawText: JSON.stringify(raw()), metadata: { ...metaFor(raw()), sourceFileHash: '0'.repeat(64) }, approval })).toThrow(/Quellhash/))
  it('lehnt ungültige Gruppenreferenzen ab', () => { const value = raw(); value.nodes[1].group = 99; expect(run(value).ok).toBe(false) })
  it('lehnt ungültige Verbindungsreferenzen ab', () => { const value = raw(); value.edges[1].to = 99; expect(run(value).report.errors.some(error => error.code === 'edge-reference')).toBe(true) })
  it('prüft und ignoriert offiziell enthaltene Selbstverbindungen kontrolliert', () => { const value = raw(); value.edges[1] = { from: 1, to: 1 }; expect(run(value).report.warnings.some(warning => warning.code === 'official-self-edge')).toBe(true); expect(run(value).data.connections).toHaveLength(0) })
  it('lehnt doppelte Verbindungen ab', () => { const value = raw(); value.edges.push({ from: 2, to: 1 }); expect(run(value).report.errors.some(error => error.code === 'duplicate-edge')).toBe(true) })
  it('erzeugt deterministische Versionsvergleiche', () => { const data = normalizeTree(raw(), metaFor(raw())); const newer = JSON.parse(JSON.stringify(data)); newer.nodes[0].name.sourceText = 'Changed'; expect(compareTrees(data, newer)).toEqual(compareTrees(data, newer)); expect(compareTrees(data, newer).changedNames).toEqual(['1']) })
})
