import { MECHANIC_TAGS, type DataProvenance, type GameDataMetadata, type MechanicTag, type ModifierDefinition } from '../domain'
import { contentHash, stableInternalId } from './hash'
import { IMPORT_SCHEMA_VERSION, RAW_CATEGORIES, isMechanicTag, type CanonicalRawData, type ImportCounts, type ImportedDomainData, type ImportIssue, type ImportResult, type RawBase } from './types'

const expectedTopLevel = new Set(['manifest', ...RAW_CATEGORIES])
const countRecords = (raw: CanonicalRawData): ImportCounts => Object.fromEntries(RAW_CATEGORIES.map(category => [category, raw[category].length])) as ImportCounts
const totalCount = (counts: ImportCounts) => Object.values(counts).reduce((sum, count) => sum + count, 0)

function issue(code: ImportIssue['code'], path: string, message: string, recordId?: string): ImportIssue { return { code, path, message, recordId } }
function duplicates(values: string[]): string[] { const seen = new Set<string>(); return [...new Set(values.filter(value => seen.has(value) || !seen.add(value)))] }

function validateManifest(raw: CanonicalRawData, errors: ImportIssue[]): void {
  const manifest = raw.manifest
  if (manifest.schemaVersion !== IMPORT_SCHEMA_VERSION) errors.push(issue('schema', 'manifest.schemaVersion', `Nicht unterstützte Schema-Version ${manifest.schemaVersion}`))
  for (const field of ['importerVersion', 'sourceId', 'sourceVersion', 'gameVersion', 'language', 'importedAt'] as const) if (!manifest[field]) errors.push(issue('manifest', `manifest.${field}`, `Erforderliches Manifestfeld ${field} fehlt`))
  if (Number.isNaN(Date.parse(manifest.importedAt))) errors.push(issue('manifest', 'manifest.importedAt', 'importedAt ist kein gültiger ISO-Zeitpunkt'))
  if (manifest.source === 'poe2db' && (manifest.sourceId !== 'poe2db' || !manifest.sourceUrl?.startsWith('https://poe2db.tw/'))) errors.push(issue('source', 'manifest.source', 'PoE2DB-Quelle benötigt sourceId poe2db und eine poe2db.tw-URL'))
  if (manifest.source === 'official' && (!manifest.sourceId.startsWith('official-ggg') || !manifest.sourceUrl?.includes('pathofexile.com'))) errors.push(issue('source', 'manifest.source', 'Offizielle Quelle benötigt eine GGG-Source-ID und offizielle URL'))
  if (manifest.source === 'local-placeholder' && !manifest.sourceId.startsWith('synthetic-')) errors.push(issue('source', 'manifest.sourceId', 'Lokale Fixture-Quelle muss eindeutig als synthetic gekennzeichnet sein'))
}

function validateRecords(raw: CanonicalRawData, errors: ImportIssue[], duplicateList: string[], missingReferences: string[]): void {
  for (const category of RAW_CATEGORIES) {
    const ids = raw[category].map(record => record.sourceRecordId); const found = duplicates(ids)
    duplicateList.push(...found.map(id => `${category}:${id}`)); found.forEach(id => errors.push(issue('duplicate', category, `Doppelte Quell-ID ${id}`, id)))
  }
  const allTagRecords: { path: string; record: RawBase }[] = RAW_CATEGORIES.filter(category => category !== 'passiveConnections').flatMap(category => (raw[category] as RawBase[]).map(record => ({ path: category, record })))
  for (const { path, record } of allTagRecords) for (const tag of record.tags) if (!isMechanicTag(tag)) errors.push(issue('tag', `${path}.${record.sourceRecordId}.tags`, `Unbekannter Tag ${tag}`, record.sourceRecordId))
  for (const support of raw.supports) for (const [field, tags] of [['requiredTags', support.requiredTags], ['excludedTags', support.excludedTags], ['ownTags', support.ownTags]] as const) for (const tag of tags) if (!isMechanicTag(tag)) errors.push(issue('tag', `supports.${support.sourceRecordId}.${field}`, `Unbekannter Tag ${tag}`, support.sourceRecordId))

  const classIds = new Set(raw.classes.map(value => value.sourceRecordId)); const supportIds = new Set(raw.supports.map(value => value.sourceRecordId)); const modifierIds = new Set(raw.modifiers.map(value => value.sourceRecordId)); const nodeIds = new Set(raw.passiveNodes.map(value => value.sourceRecordId))
  const missing = (path: string, recordId: string, target: string, kind: string) => { const text = `${path}:${target}`; missingReferences.push(text); errors.push(issue('reference', path, `Fehlende ${kind}-Referenz ${target}`, recordId)) }
  raw.ascendancies.forEach(value => { if (!classIds.has(value.classSourceRecordId)) missing(`ascendancies.${value.sourceRecordId}`, value.sourceRecordId, value.classSourceRecordId, 'Klassen') })
  raw.skills.forEach(value => value.supportSourceRecordIds?.forEach(id => { if (!supportIds.has(id)) missing(`skills.${value.sourceRecordId}`, value.sourceRecordId, id, 'Support') }))
  const modifierReferences = [...raw.jewels, ...raw.clusterJewels, ...raw.uniqueClusterJewels, ...raw.uniques, ...raw.passiveNodes]
  modifierReferences.forEach(value => value.modifierSourceRecordIds.forEach(id => { if (!modifierIds.has(id)) missing(`records.${value.sourceRecordId}`, value.sourceRecordId, id, 'Modifier') }))
  raw.clusterJewels.forEach(value => value.passiveNodeSourceRecordIds.forEach(id => { if (!nodeIds.has(id)) missing(`clusterJewels.${value.sourceRecordId}`, value.sourceRecordId, id, 'Knoten') }))
  raw.passiveConnections.forEach(value => { if (!nodeIds.has(value.fromNodeSourceRecordId)) missing(`passiveConnections.${value.sourceRecordId}`, value.sourceRecordId, value.fromNodeSourceRecordId, 'Startknoten'); if (!nodeIds.has(value.toNodeSourceRecordId)) missing(`passiveConnections.${value.sourceRecordId}`, value.sourceRecordId, value.toNodeSourceRecordId, 'Zielknoten') })

  raw.modifiers.forEach(value => { if (value.minValue !== undefined && !Number.isFinite(value.minValue)) errors.push(issue('value', `modifiers.${value.sourceRecordId}.minValue`, 'Minimum ist keine endliche Zahl', value.sourceRecordId)); if (value.maxValue !== undefined && !Number.isFinite(value.maxValue)) errors.push(issue('value', `modifiers.${value.sourceRecordId}.maxValue`, 'Maximum ist keine endliche Zahl', value.sourceRecordId)); if (value.minValue !== undefined && value.maxValue !== undefined && value.minValue > value.maxValue) errors.push(issue('value', `modifiers.${value.sourceRecordId}`, `Ungültiger Wertebereich ${value.minValue}–${value.maxValue}`, value.sourceRecordId)) })
  raw.clusterJewels.forEach(value => { if (!Number.isInteger(value.additionalPathCost) || value.additionalPathCost < 0) errors.push(issue('value', `clusterJewels.${value.sourceRecordId}.additionalPathCost`, 'Pfadkosten müssen eine nichtnegative Ganzzahl sein', value.sourceRecordId)) })
  raw.passiveNodes.forEach(value => { if (![value.x, value.y].every(Number.isFinite)) errors.push(issue('value', `passiveNodes.${value.sourceRecordId}.position`, 'Knotenposition muss aus endlichen Zahlen bestehen', value.sourceRecordId)) })
}

function metadata(raw: CanonicalRawData, category: string, value: RawBase): GameDataMetadata {
  const provenance: DataProvenance = { sourceId: raw.manifest.sourceId, sourceUrl: raw.manifest.sourceUrl, sourceRecordId: value.sourceRecordId, sourceLanguage: raw.manifest.language, sourceVersion: raw.manifest.sourceVersion, gameVersion: raw.manifest.gameVersion, importedAt: raw.manifest.importedAt, importerVersion: raw.manifest.importerVersion, contentHash: contentHash(value), verificationStatus: 'structure-validated' }
  return { id: stableInternalId(category, raw.manifest.sourceId, value.sourceRecordId), displayNameDe: value.nameDe.trim(), nameEn: value.nameEn?.trim(), dataVersion: raw.manifest.sourceVersion, source: raw.manifest.source, status: 'imported', tags: [...value.tags].sort() as MechanicTag[], provenance }
}

function buildDomainData(raw: CanonicalRawData): ImportedDomainData {
  const modifiers = raw.modifiers.map(value => ({ ...metadata(raw, 'modifier', value), category: value.category, valueType: value.unit === 'range' ? 'range' as const : 'number' as const, unit: value.unit, minValue: value.minValue, maxValue: value.maxValue, scope: value.scope, relevantTags: [...value.tags].sort() as MechanicTag[], allowedEquipmentSlotIds: value.allowedSlotIds }))
  const modifierMap = new Map(raw.modifiers.map((value, index) => [value.sourceRecordId, modifiers[index]])); const nodeId = (id: string) => stableInternalId('passive', raw.manifest.sourceId, id)
  const resolveModifiers = (ids: string[]): ModifierDefinition[] => ids.map(id => modifierMap.get(id)!)
  const passiveConnections = raw.passiveConnections.map(value => ({ id: stableInternalId('connection', raw.manifest.sourceId, value.sourceRecordId), fromNodeId: nodeId(value.fromNodeSourceRecordId), toNodeId: nodeId(value.toNodeSourceRecordId), selected: false }))
  const connectionIds = (sourceId: string) => raw.passiveConnections.flatMap(value => value.fromNodeSourceRecordId === sourceId ? [nodeId(value.toNodeSourceRecordId)] : value.toNodeSourceRecordId === sourceId ? [nodeId(value.fromNodeSourceRecordId)] : [])
  return {
    classes: raw.classes.map(value => metadata(raw, 'class', value)),
    ascendancies: raw.ascendancies.map(value => ({ ...metadata(raw, 'ascendancy', value), classId: stableInternalId('class', raw.manifest.sourceId, value.classSourceRecordId) })),
    modifiers,
    skills: raw.skills.map(value => metadata(raw, 'skill', value)),
    supports: raw.supports.map(value => ({ ...metadata(raw, 'support', value), requiredTags: [...value.requiredTags].sort() as MechanicTag[], excludedTags: [...value.excludedTags].sort() as MechanicTag[], ownTags: [...value.ownTags].sort() as MechanicTag[] })),
    jewels: raw.jewels.map(value => ({ ...metadata(raw, 'jewel', value), jewelType: 'normal', description: value.description, modifiers: resolveModifiers(value.modifierSourceRecordIds) })),
    clusterJewels: raw.clusterJewels.map(value => ({ ...metadata(raw, 'cluster-jewel', value), jewelType: 'cluster', description: value.description, modifiers: resolveModifiers(value.modifierSourceRecordIds), clusterSize: value.clusterSize, possiblePassiveNodeIds: value.passiveNodeSourceRecordIds.map(nodeId), additionalPathCost: value.additionalPathCost })),
    uniqueClusterJewels: raw.uniqueClusterJewels.map(value => ({ ...metadata(raw, 'unique-cluster-jewel', value), jewelType: 'unique-cluster', description: value.description, modifiers: resolveModifiers(value.modifierSourceRecordIds) })),
    uniques: raw.uniques.map(value => ({ ...metadata(raw, 'unique', value), itemType: value.itemType, modifiers: resolveModifiers(value.modifierSourceRecordIds) })),
    passiveNodes: raw.passiveNodes.map(value => ({ ...metadata(raw, 'passive', value), nodeType: value.nodeType, position: { x: value.x, y: value.y }, modifiers: resolveModifiers(value.modifierSourceRecordIds), connectedNodeIds: connectionIds(value.sourceRecordId), selected: false })),
    passiveConnections,
  }
}

export function importCanonicalData(input: unknown): ImportResult {
  if (!input || typeof input !== 'object') { const errors = [issue('manifest', 'root', 'Rohdaten müssen ein Objekt sein')]; const counts = Object.fromEntries(RAW_CATEGORIES.map(category => [category, 0])) as ImportCounts; return { ok: false, report: { status: 'rejected', schemaVersion: '', sourceVersion: '', importedRecords: 0, rejectedRecords: 1, counts, hashes: {}, warnings: [], errors, duplicates: [], missingReferences: [] } } }
  const raw = input as CanonicalRawData; const errors: ImportIssue[] = []; const duplicateList: string[] = []; const missingReferences: string[] = []
  for (const key of Object.keys(raw)) if (!expectedTopLevel.has(key)) errors.push(issue('category', key, `Nicht unterstützte Kategorie ${key}`))
  if (!raw.manifest || RAW_CATEGORIES.some(category => !Array.isArray(raw[category]))) { errors.push(issue('manifest', 'root', 'Manifest oder erforderliche Kategorien fehlen')); const counts = Object.fromEntries(RAW_CATEGORIES.map(category => [category, Array.isArray(raw[category]) ? raw[category].length : 0])) as ImportCounts; return { ok: false, report: { status: 'rejected', schemaVersion: raw.manifest?.schemaVersion ?? '', sourceVersion: raw.manifest?.sourceVersion ?? '', importedRecords: 0, rejectedRecords: totalCount(counts), counts, hashes: {}, warnings: [], errors, duplicates: [], missingReferences: [] } } }
  validateManifest(raw, errors); validateRecords(raw, errors, duplicateList, missingReferences)
  const counts = countRecords(raw); for (const category of RAW_CATEGORIES) if (raw.manifest.counts[category] !== counts[category]) errors.push(issue('count', `manifest.counts.${category}`, `Manifest zählt ${raw.manifest.counts[category]}, berechnet wurden ${counts[category]}`))
  const hashes = Object.fromEntries([...RAW_CATEGORIES.map(category => [category, contentHash(raw[category])]), ['dataset', contentHash({ ...raw, manifest: { ...raw.manifest, hashes: {} } })]])
  const rejectedRecords = new Set(errors.map(error => error.recordId).filter(Boolean)).size + errors.filter(error => !error.recordId).length
  const ok = errors.length === 0; const data = ok ? buildDomainData(raw) : undefined
  return { ok, data, report: { status: ok ? (raw.manifest.status === 'fixture' ? 'fixture' : 'validated') : 'rejected', schemaVersion: raw.manifest.schemaVersion, sourceVersion: raw.manifest.sourceVersion, importedRecords: ok ? totalCount(counts) : Math.max(0, totalCount(counts) - rejectedRecords), rejectedRecords, counts, hashes, warnings: [...raw.manifest.warnings], errors, duplicates: duplicateList, missingReferences } }
}

export { MECHANIC_TAGS }
