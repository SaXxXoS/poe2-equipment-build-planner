/* global process, console */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const IMPORTER_VERSION = '1.0.0'
export const SCHEMA_VERSION = '1.0.0'
export const SOURCE_ID = 'ggg-poe2-skilltree-export'
export const REQUIRED_CATEGORIES = ['passive-nodes', 'passive-connections', 'passive-groups', 'class-start-nodes', 'ascendancy-start-nodes', 'jewel-sockets']
const ROOT_FIELDS = ['tree', 'classes', 'groups', 'nodes', 'edges', 'skillOverrides', 'jewelSlots', 'min_x', 'min_y', 'max_x', 'max_y']
const NODE_FIELDS = ['id', 'skill', 'name', 'icon', 'activeEffectImage', 'isKeystone', 'isNotable', 'isMastery', 'isBlighted', 'isJewelSocket', 'isAscendancyStart', 'isMultipleChoice', 'isMultipleChoiceOption', 'isFree', 'isGenericAttribute', 'hideConnection', 'ascendancyId', 'classStartIndex', 'group', 'orbit', 'orbitIndex', 'out', 'in', 'edges', 'x', 'y', 'stats', 'flavourText', 'recipe', 'keystonesInRadius', 'grantedStrength', 'grantedDexterity', 'grantedIntelligence', 'grantedPassivePoints', 'passivePointsGranted', 'weaponPassivePointsGranted', 'grantedSkill', 'multipleChoiceParent', 'unlockConstraint']
const GROUP_FIELDS = ['x', 'y', 'orbits', 'nodes']

const stable = value => JSON.stringify(sortObject(value), null, 2) + '\n'
const sortObject = value => Array.isArray(value) ? value.map(sortObject) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sortObject(value[key])])) : value
export const sha256 = value => createHash('sha256').update(value).digest('hex')
const sortedIds = values => [...new Set(values.map(String))].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
const textValue = sourceText => ({ sourceText: sourceText ?? null, sourceLocale: 'en', localizedText: null, localizedLocale: null, localizationSource: null, localizationStatus: sourceText ? 'pending' : 'unavailable' })
const issue = (code, path, message) => ({ code, path, message })

export function assertApproval(approval) {
  const source = approval?.reviewedSources?.find(item => item.sourceId === SOURCE_ID)
  if (!source || !['approved', 'conditionally-approved'].includes(source.status)) throw new Error('Import-Guard: offizielle Quelle ist nicht freigegeben')
  const unmet = (source.requiredConditions ?? []).filter(key => source.conditions?.[key] !== true)
  if (unmet.length) throw new Error(`Import-Guard: unerfüllte Bedingungen: ${unmet.join(', ')}`)
  for (const categoryId of REQUIRED_CATEGORIES) {
    const category = approval.categoryAssignments?.find(item => item.categoryId === categoryId)
    if (!category || category.primarySourceId !== SOURCE_ID || !['approved', 'conditionally-approved'].includes(category.status) || category.repositoryStorage !== true || category.offlineOnly !== true) throw new Error(`Import-Guard: Kategorie ${categoryId} ist nicht freigegeben`)
  }
  return true
}

export function validateRaw(raw, metadata) {
  const errors = [], warnings = [], unknownFields = []
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { errors: [issue('root-schema', 'root', 'Root muss ein Objekt sein')], warnings, unknownFields }
  for (const key of ROOT_FIELDS) if (!(key in raw)) errors.push(issue('root-schema', key, `Root-Feld ${key} fehlt`))
  for (const key of Object.keys(raw)) if (!ROOT_FIELDS.includes(key)) unknownFields.push(`root.${key}`)
  if (raw.tree !== 'Default') errors.push(issue('tree-version', 'tree', 'Nur der offizielle Default-Baum wird unterstützt'))
  if (!Array.isArray(raw.classes) || !Array.isArray(raw.edges) || !Array.isArray(raw.jewelSlots) || !raw.nodes || Array.isArray(raw.nodes) || !raw.groups || Array.isArray(raw.groups)) errors.push(issue('root-schema', 'root', 'classes, edges, jewelSlots, nodes oder groups haben einen ungültigen Typ'))
  if (!metadata?.releaseTag || !metadata?.commitHash || !/^[a-f0-9]{40}$/.test(metadata.commitHash) || !/^[a-f0-9]{64}$/.test(metadata.sourceFileHash ?? '')) errors.push(issue('source-version', 'metadata', 'Release, Voll-Commit oder Quellhash fehlen'))
  if (errors.length) return { errors, warnings, unknownFields }
  const nodeEntries = Object.entries(raw.nodes), groupEntries = Object.entries(raw.groups), nodeIds = new Set(nodeEntries.map(([id]) => id)), groupIds = new Set(groupEntries.map(([id]) => id))
  if (nodeEntries.length !== nodeIds.size) errors.push(issue('duplicate-node', 'nodes', 'Doppelte Node-ID'))
  for (const [id, node] of nodeEntries) {
    for (const key of Object.keys(node)) if (!NODE_FIELDS.includes(key)) unknownFields.push(`nodes.${id}.${key}`)
    if (id === 'root') continue
    if (String(node.skill) !== id) errors.push(issue('node-id', `nodes.${id}.skill`, 'Dictionary-ID und skill stimmen nicht überein'))
    if (![node.x, node.y].every(Number.isFinite)) errors.push(issue('position', `nodes.${id}`, 'Knotenposition ist ungültig'))
    if (!groupIds.has(String(node.group))) errors.push(issue('group-reference', `nodes.${id}.group`, `Gruppe ${node.group} fehlt`))
    for (const linked of [...(node.out ?? []), ...(node.in ?? [])].map(String)) if (!nodeIds.has(linked)) errors.push(issue('node-reference', `nodes.${id}`, `Knoten ${linked} fehlt`))
  }
  for (const [id, group] of groupEntries) {
    for (const key of Object.keys(group)) if (!GROUP_FIELDS.includes(key)) unknownFields.push(`groups.${id}.${key}`)
    if (![group.x, group.y].every(Number.isFinite)) errors.push(issue('position', `groups.${id}`, 'Gruppenposition ist ungültig'))
    for (const nodeId of (group.nodes ?? []).map(String)) if (!nodeIds.has(nodeId)) errors.push(issue('group-node-reference', `groups.${id}.nodes`, `Knoten ${nodeId} fehlt`))
  }
  const pairs = new Set()
  for (let index = 0; index < raw.edges.length; index++) {
    const edge = raw.edges[index], from = String(edge?.from), to = String(edge?.to), key = sortedIds([from, to]).join(':')
    if (!nodeIds.has(from) || !nodeIds.has(to)) errors.push(issue('edge-reference', `edges.${index}`, 'Verbindung referenziert unbekannten Knoten'))
    if (from === to) warnings.push(issue('official-self-edge', `edges.${index}`, `Offiziell enthaltene Selbstverbindung ${from} wird kontrolliert ignoriert`))
    if (pairs.has(key)) errors.push(issue('duplicate-edge', `edges.${index}`, `Doppelte Verbindung ${key}`)); pairs.add(key)
  }
  unknownFields.sort()
  if (unknownFields.length) warnings.push(issue('unknown-fields', 'root', `${unknownFields.length} unbekannte Felder werden nicht importiert`))
  const explicitSockets = new Set(nodeEntries.filter(([, node]) => node.isJewelSocket === true).map(([id]) => id))
  const unresolvedSlots = raw.jewelSlots.map(String).filter(id => !explicitSockets.has(id))
  if (unresolvedSlots.length) warnings.push(issue('ambiguous-jewel-slots', 'jewelSlots', `${unresolvedSlots.length} Einträge sind keine explizit markierten Sockelknoten und werden ignoriert`))
  const orphanIds = nodeEntries.filter(([id, node]) => id !== 'root' && (node.in?.length ?? 0) + (node.out?.length ?? 0) === 0).map(([id]) => id)
  if (orphanIds.length) warnings.push(issue('official-orphan-nodes', 'nodes', `${orphanIds.length} im offiziellen Export isolierte Knoten bleiben erhalten und werden gemeldet`))
  return { errors, warnings, unknownFields }
}

export function normalizeTree(raw, metadata) {
  const nodeEntries = Object.entries(raw.nodes).filter(([id]) => id !== 'root')
  const nodes = nodeEntries.map(([sourceNodeId, node]) => {
    const neighbours = sortedIds([...(node.in ?? []), ...(node.out ?? [])].filter(id => String(id) !== 'root'))
    const nodeType = node.isAscendancyStart ? 'ascendancy-start' : node.classStartIndex !== undefined ? 'class-start' : node.isJewelSocket ? 'jewel-socket' : node.isKeystone ? 'keystone' : node.isNotable ? 'notable' : node.isMastery ? 'mastery' : 'normal'
    return { id: sourceNodeId, sourceInternalId: node.id ?? null, name: textValue(node.name ?? null), stats: (node.stats ?? []).map(textValue), nodeType, position: { x: node.x, y: node.y }, groupId: String(node.group), orbit: node.orbit, orbitIndex: node.orbitIndex, neighbourNodeIds: neighbours, isClassStart: node.classStartIndex !== undefined, classStartIndex: node.classStartIndex ?? null, isAscendancyStart: node.isAscendancyStart === true, ascendancyId: node.ascendancyId ?? null, isJewelSocket: node.isJewelSocket === true, isClusterSocket: false, tags: sortedIds(['isFree', 'isGenericAttribute', 'isMultipleChoice', 'isMultipleChoiceOption'].filter(key => node[key] === true)), sourceReference: `nodes.${sourceNodeId}` }
  }).sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }))
  const nodeIds = new Set(nodes.map(node => node.id))
  const connections = raw.edges.filter(edge => nodeIds.has(String(edge.from)) && nodeIds.has(String(edge.to)) && String(edge.from) !== String(edge.to)).map((edge, sourceIndex) => { const [fromNodeId, toNodeId] = sortedIds([edge.from, edge.to]),hideInDefaultState=raw.nodes[fromNodeId]?.hideConnection === true || raw.nodes[toNodeId]?.hideConnection === true,touchesMastery=raw.nodes[fromNodeId]?.isMastery === true || raw.nodes[toNodeId]?.isMastery === true,hasArc=[edge.orbitX,edge.orbitY].every(Number.isFinite); return { id: `${fromNodeId}:${toNodeId}`, fromNodeId, toNodeId, connectionType: 'passive-tree', directed: false, ...(hideInDefaultState?{hideInDefaultState:true}:{}), ...(touchesMastery?{touchesMastery:true}:{}), ...(hasArc?{orbit:edge.orbit,orbitCenter:{x:edge.orbitX,y:edge.orbitY}}:{}), sourceReference: `edges.${sourceIndex}` } }).sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }))
  const groups = Object.entries(raw.groups).map(([groupId, group]) => ({ groupId, position: { x: group.x, y: group.y }, nodeIds: sortedIds((group.nodes ?? []).filter(id => nodeIds.has(String(id)))), orbits: [...(group.orbits ?? [])], sourceReference: `groups.${groupId}` })).sort((a, b) => a.groupId.localeCompare(b.groupId, 'en', { numeric: true }))
  const jewelSockets = nodes.filter(node => node.isJewelSocket).map(node => ({ nodeId: node.id, position: node.position, socketType: 'jewel', groupId: node.groupId, sourceReference: node.sourceReference }))
  const classes = raw.classes.map((value, classStartIndex) => ({ classStartIndex, name: textValue(value.name ?? null), ascendancies: (value.ascendancies ?? []).map(item => ({ id: item.id, name: textValue(item.name ?? null) })).sort((a, b) => a.id.localeCompare(b.id)) }))
  return { schemaVersion: SCHEMA_VERSION, metadata: { ...metadata, sourceLocale: 'en', availableLocales: ['en'], localizationFallback: ['verified-de', 'source-en', 'technical-id'], assetsIncluded: false }, bounds: { minX: raw.min_x, minY: raw.min_y, maxX: raw.max_x, maxY: raw.max_y }, classes, nodes, connections, groups, jewelSockets }
}

const comparableNode = node => ({ name: node.name.sourceText, stats: node.stats.map(value => value.sourceText), position: node.position, groupId: node.groupId, isClassStart: node.isClassStart, classStartIndex: node.classStartIndex, isAscendancyStart: node.isAscendancyStart, ascendancyId: node.ascendancyId, isJewelSocket: node.isJewelSocket, isClusterSocket: node.isClusterSocket })
export function compareTrees(previous, next) {
  const oldNodes = new Map((previous?.nodes ?? []).map(node => [node.id, node])), newNodes = new Map(next.nodes.map(node => [node.id, node]))
  const addedNodes = sortedIds([...newNodes.keys()].filter(id => !oldNodes.has(id))), removedNodes = sortedIds([...oldNodes.keys()].filter(id => !newNodes.has(id))), changedNodes = [], unchangedNodes = [], changedNames = [], changedDescriptions = [], changedPositions = [], changedGroups = [], changedStartNodes = [], changedSockets = []
  for (const id of sortedIds([...newNodes.keys()].filter(id => oldNodes.has(id)))) { const oldNode = comparableNode(oldNodes.get(id)), newNode = comparableNode(newNodes.get(id)); if (stable(oldNode) === stable(newNode)) unchangedNodes.push(id); else { changedNodes.push(id); if (oldNode.name !== newNode.name) changedNames.push(id); if (stable(oldNode.stats) !== stable(newNode.stats)) changedDescriptions.push(id); if (stable(oldNode.position) !== stable(newNode.position)) changedPositions.push(id); if (oldNode.groupId !== newNode.groupId) changedGroups.push(id); if (stable([oldNode.isClassStart, oldNode.classStartIndex, oldNode.isAscendancyStart, oldNode.ascendancyId]) !== stable([newNode.isClassStart, newNode.classStartIndex, newNode.isAscendancyStart, newNode.ascendancyId])) changedStartNodes.push(id); if (stable([oldNode.isJewelSocket, oldNode.isClusterSocket]) !== stable([newNode.isJewelSocket, newNode.isClusterSocket])) changedSockets.push(id) } }
  const oldConnections = new Set((previous?.connections ?? []).map(value => value.id)), newConnections = new Set(next.connections.map(value => value.id)), addedConnections = sortedIds([...newConnections].filter(id => !oldConnections.has(id))), removedConnections = sortedIds([...oldConnections].filter(id => !newConnections.has(id)))
  return { addedNodes, removedNodes, changedNodes, unchangedNodes, addedConnections, removedConnections, changedNames, changedDescriptions, changedPositions, changedGroups, changedStartNodes, changedSockets, summary: { addedNodeCount: addedNodes.length, removedNodeCount: removedNodes.length, changedNodeCount: changedNodes.length, unchangedNodeCount: unchangedNodes.length, addedConnectionCount: addedConnections.length, removedConnectionCount: removedConnections.length } }
}

export function importTree({ rawText, metadata, approval, previous = null }) {
  assertApproval(approval)
  if (sha256(rawText) !== metadata.sourceFileHash) throw new Error('Quellhash stimmt nicht mit dem Manifest überein')
  const raw = JSON.parse(rawText), validation = validateRaw(raw, metadata)
  if (validation.errors.length) return { ok: false, data: null, diff: null, report: reportFor(null, metadata, validation, raw, 'rejected') }
  const data = normalizeTree(raw, metadata), diff = compareTrees(previous, data)
  return { ok: true, data, diff, report: reportFor(data, metadata, validation, raw, 'validated') }
}

function reportFor(data, metadata, validation, raw, status) {
  const nodes = data?.nodes ?? [], generatedFiles = ['generated/poe2-tree/tree.json', 'generated/poe2-tree/import-report.json', 'generated/poe2-tree/version-diff.json']
  return { sourceVersion: metadata.releaseTag, sourceCommit: metadata.commitHash, sourceHash: metadata.sourceFileHash, importedNodeCount: nodes.length, importedConnectionCount: data?.connections.length ?? 0, importedGroupCount: data?.groups.length ?? 0, jewelSocketCount: data?.jewelSockets.length ?? 0, clusterSocketCount: nodes.filter(node => node.isClusterSocket).length, classStartNodeCount: nodes.filter(node => node.isClassStart).length, ascendancyNodeCount: nodes.filter(node => node.ascendancyId).length, ascendancyStartNodeCount: nodes.filter(node => node.isAscendancyStart).length, skippedRecordCount: raw?.nodes?.root ? 1 + (raw.jewelSlots ?? []).filter(id => !raw.nodes[String(id)]?.isJewelSocket).length : 0, warningCount: validation.warnings.length, errorCount: validation.errors.length, unknownFieldCount: validation.unknownFields.length, unknownFields: validation.unknownFields, warnings: validation.warnings, errors: validation.errors, generatedFiles, importerVersion: IMPORTER_VERSION, status }
}

function parseArgs(argv) { const mode = argv[2], index = argv.indexOf('--release'); return { mode, release: index >= 0 ? argv[index + 1] : null } }
export function selectRelease(manifest, release) {
  if (!release || release === 'latest' || release === 'main') throw new Error('Eine explizite, gepinnte Release-Version ist erforderlich; latest/main sind unzulässig')
  const entry = manifest.releases.find(value => value.releaseTag === release)
  if (!entry) throw new Error(`Unbekannte oder nicht freigegebene Release-Version: ${release}`)
  return entry
}
function readJson(path) { return JSON.parse(readFileSync(path, 'utf8')) }
function writeJson(path, value) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, stable(value), 'utf8') }

export function runCli(argv = process.argv, rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')) {
  const { mode, release } = parseArgs(argv)
  if (!['import', 'check'].includes(mode)) throw new Error('Modus muss import oder check sein')
  const manifest = readJson(resolve(rootDir, 'data-sources/poe2-tree/source-manifest.json')), entry = selectRelease(manifest, release)
  const approval = readJson(resolve(rootDir, 'data-sources/source-approval.json')), rawPath = resolve(rootDir, entry.rawFile), rawText = readFileSync(rawPath, 'utf8'), generatedPath = resolve(rootDir, 'generated/poe2-tree/tree.json'), previous = existsSync(generatedPath) ? readJson(generatedPath) : null
  const result = importTree({ rawText, metadata: entry, approval, previous })
  if (!result.ok) throw new Error(`Import abgelehnt: ${result.report.errors.map(value => value.code).join(', ')}`)
  if (mode === 'check') { process.stdout.write(stable({ mode, release, report: result.report, diff: result.diff })); return result }
  writeJson(generatedPath, result.data); writeJson(resolve(rootDir, 'generated/poe2-tree/import-report.json'), result.report); writeJson(resolve(rootDir, 'generated/poe2-tree/version-diff.json'), result.diff)
  process.stdout.write(stable(result.report)); return result
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) { try { runCli() } catch (error) { console.error(error.message); process.exitCode = 1 } }
