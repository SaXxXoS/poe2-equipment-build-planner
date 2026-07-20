import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { loadPoe2TreeViewModel } from '../tree-view/data'
import { centeredTreeCamera, initialTreeCamera, nodeMatchesFilter, searchTreeNodes, TREE_NODE_RADIUS } from '../tree-view/view-logic'
import type { PassiveTreeViewModel, TreeDisplayFilter, TreeNodeViewModel } from '../tree-view/types'
import './passive-tree.css'

type Camera = ReturnType<typeof initialTreeCamera>
const FILTERS: Array<{ id: TreeDisplayFilter; label: string }> = [{ id: 'all', label: 'Alle Knoten' }, { id: 'class-start', label: 'Klassenstarts' }, { id: 'ascendancy', label: 'Aszendenzen' }, { id: 'jewel-socket', label: 'Juwelsockel' }, { id: 'keystone', label: 'Keystones' }, { id: 'notable', label: 'Notables' }]

const ConnectionLayer = memo(function ConnectionLayer({ tree, selected }: { tree: PassiveTreeViewModel; selected: TreeNodeViewModel | null }) {
  const positions = useMemo(() => new Map(tree.nodes.map(node => [node.id, node])), [tree.nodes])
  const selectedConnections = selected ? new Set(selected.neighbourIds.map(id => [selected.id, id].sort().join(':'))) : new Set<string>()
  return <g className="tree-connections" aria-hidden="true">{tree.connections.map(connection => { const from = positions.get(connection.fromNodeId)!, to = positions.get(connection.toNodeId)!; return <line key={connection.id} x1={from.x} y1={from.y} x2={to.x} y2={to.y} className={selectedConnections.has([connection.fromNodeId, connection.toNodeId].sort().join(':')) ? 'selected' : ''}/> })}</g>
})

const NodeLayer = memo(function NodeLayer({ tree, selectedId, filter, onSelect }: { tree: PassiveTreeViewModel; selectedId: string | null; filter: TreeDisplayFilter; onSelect: (node: TreeNodeViewModel) => void }) {
  return <g className="tree-nodes">{tree.nodes.map(node => { const dimmed = !nodeMatchesFilter(node, filter); return <circle key={node.id} cx={node.x} cy={node.y} r={TREE_NODE_RADIUS[node.nodeType]} className={`tree-node tree-node-${node.nodeType}${selectedId === node.id ? ' selected' : ''}${dimmed ? ' dimmed' : ''}`} role="button" aria-label={`${node.displayName}, ${node.nodeType}, ID ${node.id}`} tabIndex={0} onPointerDown={event => event.stopPropagation()} onClick={() => onSelect(node)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(node) } }}><title>{node.displayName}</title></circle> })}</g>
})

export function PassiveTree({ loader = loadPoe2TreeViewModel }: { loader?: () => Promise<PassiveTreeViewModel> }) {
  const [tree, setTree] = useState<PassiveTreeViewModel | null>(null), [error, setError] = useState(''), [full, setFull] = useState(false)
  useEffect(() => { let active = true; loader().then(value => { if (active) setTree(value) }).catch(value => { if (active) setError(value instanceof Error ? value.message : 'Unbekannter Ladefehler') }); return () => { active = false } }, [loader])
  useEffect(() => { if (tree) performance.mark('poe2-tree-rendered') }, [tree])
  if (error) return <PassiveTreeLoadState error={error}/>
  if (!tree) return <PassiveTreeLoadState/>
  return <PassiveTreeContent tree={tree} full={full} onToggleFull={() => setFull(value => !value)}/>
}

export function PassiveTreeLoadState({ error = '' }: { error?: string }) {
  return <section><h2>5. Offizieller PoE2-Passivbaum</h2>{error ? <div className="tree-error" role="alert"><h3>Baumdaten konnten nicht angezeigt werden</h3><p>{error}</p><small>Es wird kein synthetischer Ersatzbaum verwendet.</small></div> : <div className="tree-loading" role="status">Lokale Baumdaten werden geladen …</div>}</section>
}

export function PassiveTreeContent({ tree, full = false, onToggleFull = () => undefined }: { tree: PassiveTreeViewModel; full?: boolean; onToggleFull?: () => void }) {
  const [camera, setCamera] = useState<Camera>(() => initialTreeCamera(tree)), [drag, setDrag] = useState<{ x: number; y: number; camera: Camera } | null>(null), [selected, setSelected] = useState<TreeNodeViewModel | null>(null), [filter, setFilter] = useState<TreeDisplayFilter>('all'), [query, setQuery] = useState('')
  const viewportRef = useRef<HTMLDivElement>(null), results = useMemo(() => searchTreeNodes(tree.nodes, query), [tree.nodes, query])
  const viewWidth = tree.bounds.width / camera.zoom, viewHeight = tree.bounds.height / camera.zoom, viewBox = `${camera.centerX - viewWidth / 2} ${camera.centerY - viewHeight / 2} ${viewWidth} ${viewHeight}`
  const focusNode = (node: TreeNodeViewModel) => { setSelected(node); setCamera(centeredTreeCamera(tree, node)) }
  const zoomBy = (factor: number) => setCamera(value => ({ ...value, zoom: Math.max(1, Math.min(12, value.zoom * factor)) }))
  const orient = (nodeId: string) => { const node = tree.nodes.find(value => value.id === nodeId); if (node) focusNode(node) }
  return <section className={full ? 'tree-full' : ''}><div className="row"><div><h2>5. Offizieller PoE2-Passivbaum</h2><p className="muted">GGG-Export · Release {tree.sourceVersion} · {tree.nodeCount.toLocaleString('de-DE')} Knoten · englische Originaltexte</p></div><button className="secondary" onClick={onToggleFull}>{full ? 'Verkleinern' : 'Vergrößern'}</button></div>
    <div className="tree-status"><b>Technische Ansicht:</b> Keine deutschen Knotentexte verfügbar. Keine Pfadsuche oder Buildoptimierung. Die Auswahl dient nur der Inspektion.</div>
    <div className="tree-tools"><label>Knotensuche<input value={query} onChange={event => setQuery(event.target.value)} placeholder="Englischer Name, Stat oder ID"/></label><label>Darstellungsfilter<select value={filter} onChange={event => setFilter(event.target.value as TreeDisplayFilter)}>{FILTERS.map(value => <option key={value.id} value={value.id}>{value.label}</option>)}</select></label><label>Klassenstart<select defaultValue="" onChange={event => { orient(event.target.value); event.target.value = '' }}><option value="">Klasse auswählen</option>{tree.classes.map(value => <option key={value.nodeId} value={value.nodeId}>{value.displayName}</option>)}</select></label><label>Aszendenzstart<select defaultValue="" onChange={event => { orient(event.target.value); event.target.value = '' }}><option value="">Aszendenz auswählen</option>{tree.ascendancies.map(value => <option key={value.nodeId} value={value.nodeId}>{value.displayName}</option>)}</select></label></div>
    {query.trim() && <div className="tree-search-results" aria-label="Suchergebnisse"><span>{results.length} Treffer angezeigt</span>{results.map(node => <button key={node.id} className="secondary" onClick={() => focusNode(node)}>{node.displayName} <small>#{node.id}</small></button>)}</div>}
    <div className="tree-controls"><button onClick={() => zoomBy(1.4)}>Zoom +</button><button onClick={() => zoomBy(1 / 1.4)}>Zoom −</button><button className="secondary" onClick={() => { setCamera(initialTreeCamera(tree)); setSelected(null) }}>Gesamtansicht</button><output>{Math.round(camera.zoom * 100)} %</output></div>
    <div ref={viewportRef} className="tree-viewport" data-node-count={tree.nodeCount} data-connection-count={tree.connectionCount} onWheel={event => { event.preventDefault(); zoomBy(event.deltaY < 0 ? 1.15 : 1 / 1.15) }} onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); setDrag({ x: event.clientX, y: event.clientY, camera }) }} onPointerMove={event => { if (!drag || !viewportRef.current) return; const rect = viewportRef.current.getBoundingClientRect(); setCamera({ ...drag.camera, centerX: drag.camera.centerX - (event.clientX - drag.x) * (tree.bounds.width / drag.camera.zoom) / rect.width, centerY: drag.camera.centerY - (event.clientY - drag.y) * (tree.bounds.height / drag.camera.zoom) / rect.height }) }} onPointerUp={() => setDrag(null)} onPointerCancel={() => setDrag(null)}>
      <svg viewBox={viewBox} preserveAspectRatio="xMidYMid meet" aria-label={`Offizieller PoE2-Passivbaum mit ${tree.nodeCount} Knoten`}><ConnectionLayer tree={tree} selected={selected}/><NodeLayer tree={tree} selectedId={selected?.id ?? null} filter={filter} onSelect={focusNode}/></svg>
    </div>
    <div className="legend"><span>● Normal</span><span>● Notable</span><span>● Keystone</span><span>● Klassenstart</span><span>● Aszendenz</span><span>● Juwelsockel</span></div>
    <div className="tree-details" aria-live="polite">{selected ? <><h3>{selected.displayName}</h3><p><b>Technische ID:</b> {selected.id} · <b>Typ:</b> {selected.nodeType}</p><p><b>Sprache:</b> {selected.sourceLocale} · <b>Lokalisierung:</b> {selected.localizationStatus}</p>{selected.classId && <p><b>Klassenindex:</b> {selected.classId}</p>}{selected.ascendancyId && <p><b>Aszendenz:</b> {selected.ascendancyId}</p>}<h4>Offizielle Stats</h4>{selected.stats.length ? <ul>{selected.stats.map((stat, index) => <li key={`${selected.id}-${index}`}>{stat}</li>)}</ul> : <p className="muted">Keine Stats im offiziellen Export.</p>}</> : <p className="muted">Knoten anklicken oder per Tastatur auswählen, um englische Originaldetails anzuzeigen.</p>}</div>
  </section>
}
