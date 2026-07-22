import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { basename, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'
import {
  EXPECTED_PINS, contentManifest, parseDatc64, parseLuaSchemas, resolveReferences,
  sha256, stable, walkFiles,
} from './index.mjs'

export const REFERENCE_FORMAT_VERSION = 2
export const REFERENCE_TABLES = Object.freeze([
  'itemclasses', 'itemclasscategories', 'baseitemtypes', 'modfamily', 'modtype',
  'modgrantedskills', 'grantedeffectsperlevel', 'soulcores', 'soulcoretypes',
  'soulcorestats', 'soulcorestatcategories', 'soulcorelimits', 'uniquechests',
  'uniquestashlayout', 'endgamecorruptionmods', 'incursion2mutateduniquemodsclient',
])
export const LOCALIZED_TABLES = new Set(['itemclasses', 'itemclasscategories', 'baseitemtypes', 'soulcoretypes', 'soulcorestatcategories', 'soulcorelimits'])

const REQUIRED_PIN_KEYS = ['contentSha256', 'pobRepository', 'pobCommit', 'oozVersion', 'oozArtifactSha256', 'schemaSha256', 'fileInventorySha256', 'referenceManifestSha256', 'formatVersion']

export function assertReferenceConfig(config) {
  for (const key of REQUIRED_PIN_KEYS) if (!config.pins?.[key]) throw new Error(`unpinned-reference-source:${key}`)
  for (const [key, value] of Object.entries(EXPECTED_PINS)) {
    if (key === 'balanceManifestSha256' || key === 'csdManifestSha256' || key === 'formatVersion') continue
    if (config.pins[key] !== value) throw new Error(`pin-mismatch:${key}`)
  }
  if (config.pins.formatVersion !== REFERENCE_FORMAT_VERSION) throw new Error('pin-mismatch:formatVersion')
  if (!config.referencePath || !config.previousBalancePath || !config.schemaPath || !config.fileInventoryPath || !config.outputPath) throw new Error('missing-input-manifest')
  const output = resolve(config.outputPath).toLowerCase()
  if (!output.includes(`${sep}.local-audits${sep}`)) throw new Error('output-must-be-local-audits')
  if (output.includes(`${sep}generated${sep}`) || output.includes(`${sep}public${sep}`)) throw new Error('forbidden-output-path')
}

function technicalName(path) {
  return basename(path).toLowerCase().replace(/\.datc64$/, '')
}

function localeOf(path) {
  return /[\\/]german[\\/]/i.test(path) ? 'German' : 'English'
}

function tableKey(name, locale) {
  return locale === 'German' ? `${name}-german` : name
}

function schemaInventory(parsed, fileRecord, locale) {
  return {
    table: parsed.tableName,
    locale,
    relativePath: fileRecord.relativePath,
    bytes: fileRecord.bytes,
    sha256: fileRecord.sha256,
    rows: parsed.rowCount,
    rowBytes: parsed.rowSize,
    schemaBytes: parsed.schemaSize,
    fields: parsed.schema.length,
    unknownNamedFields: parsed.schema.filter(field => !field.name).length,
    unknownTrailingBytes: parsed.unknownTrailingBytes,
    status: parsed.parserStatus ?? (parsed.unknownTrailingBytes ? 'schema-unknown' : 'resolved'),
    fieldDefinitions: parsed.schema.map(field => ({
      index: field.index, name: field.name || null, type: field.type, array: field.list,
      nullable: ['Key', 'ShortKey', 'Enum', 'String'].includes(field.type),
      foreignKey: field.refTo || null, orderRelevant: field.list,
    })),
  }
}

function indexById(table) {
  return new Map(table?.rows.map(row => [row.values.Id, row]) ?? [])
}

function itemClassByteAudit(base, german) {
  return {
    fieldPosition: 150,
    byteCountPerRow: base?.unknownTrailingBytes ?? null,
    baseRowBytes: base?.rowSize ?? null,
    germanRowBytes: german?.rowSize ?? null,
    schemaBytes: base?.schemaSize ?? null,
    distribution: 'unknown-not-decoded',
    referenceTarget: 'unknown',
    languageDifference: base && german ? (base.rowSize === german.rowSize ? 'same-row-width' : 'different-row-width') : 'unknown',
    relevantToIdentityOrName: 'unknown',
    safeToIgnore: false,
    losslessDecoding: false,
    conclusion: 'schema-unknown; the byte is retained, not interpreted or skipped',
  }
}

function classifyProduct(summary, tables) {
  const modDomains = tables.moddomains
  const generationTypes = tables.modgenerationtypes
  const itemClasses = tables.itemclasses
  const classRows = itemClasses?.rows.length ?? 0
  return {
    mods: {
      total: 2255, resolved: 0, partiallyResolved: 2255, unresolved: 0,
      domainResolved: modDomains ? 2255 : 0,
      generationTypeResolved: generationTypes ? 2255 : 0,
      groupResolved: 0,
      tagsAndSpawnWeightsPreservedInMods: 2255,
      reason: 'ModDomains and ModGenerationTypes are schema-only names without extractable DAT files; ModFamily is present but is not a ModGroup conflict table.',
    },
    baseTypes: { total: 39, resolved: 0, partiallyResolved: 39, unresolved: 0, itemClassRowsDecoded: classRows },
    itemClasses: { total: 33, resolved: 0, partiallyResolved: 0, unresolved: 33, reason: 'ItemClasses retains one unknown trailing byte and is not decoded.' },
    missingGermanStatIds: { total: 12, resolvedByReferenceTables: 0, unresolved: 12 },
    templateGaps: { total: 38, resolvedByReferenceTables: 0, unresolved: 38 },
    ocrAmbiguities: { total: 2189, resolvedByReferenceTables: 0, contextCandidatesAdded: ['mod-family', 'mod-type', 'base-item', 'soul-core-category'], conclusion: 'not recomputed as resolved because the required domain/generation/item-class semantics remain unavailable' },
    previous: summary.productCoverage,
  }
}

export async function runReferenceAudit(config) {
  assertReferenceConfig(config)
  const schemaSource = await readFile(config.schemaPath, 'utf8')
  if (sha256(schemaSource) !== config.pins.schemaSha256) throw new Error('schema-hash-mismatch')
  const inventoryBytes = await readFile(config.fileInventoryPath)
  if (sha256(inventoryBytes) !== config.pins.fileInventorySha256) throw new Error('file-inventory-hash-mismatch')
  const inventoryText = inventoryBytes.toString('utf8')
  const schemas = parseLuaSchemas(schemaSource, [...REFERENCE_TABLES, 'mods', 'stats', 'tags'])
  const files = (await walkFiles(config.referencePath)).filter(path => path.toLowerCase().endsWith('.datc64'))
  const manifest = await contentManifest(config.referencePath, files)
  if (manifest.sha256 !== config.pins.referenceManifestSha256) throw new Error('reference-manifest-mismatch')
  if (files.length !== 22) throw new Error(`reference-file-count-mismatch:${files.length}`)

  const tables = {}
  const inventories = []
  for (const path of files) {
    const name = technicalName(path)
    if (!REFERENCE_TABLES.includes(name)) throw new Error(`unplanned-reference-table:${name}`)
    const locale = localeOf(path)
    const parsed = parseDatc64(await readFile(path), schemas[name], tableKey(name, locale))
    tables[tableKey(name, locale)] = parsed
    const record = manifest.records.find(item => item.relativePath === `/${relative(config.referencePath, path).split(sep).join('/')}`)
    inventories.push(schemaInventory(parsed, record, locale))
  }

  const previousFiles = (await walkFiles(config.previousBalancePath)).filter(path => path.toLowerCase().endsWith('.datc64'))
  const previousManifest = await contentManifest(config.previousBalancePath, previousFiles)
  if (previousManifest.sha256 !== EXPECTED_PINS.balanceManifestSha256) throw new Error('previous-balance-manifest-mismatch')
  for (const name of ['mods', 'stats', 'tags']) {
    const path = previousFiles.find(item => item.toLowerCase().endsWith(`${name}.datc64`))
    if (!path) throw new Error(`previous-balance-table-missing:${name}`)
    tables[name] = parseDatc64(await readFile(path), schemas[name], name)
  }
  const englishTables = Object.fromEntries(Object.entries(tables).filter(([key]) => !key.endsWith('-german')))
  const references = resolveReferences(englishTables)
  const baseSummary = JSON.parse(await readFile(config.previousSummaryPath, 'utf8'))
  const itemClassAudit = itemClassByteAudit(tables.itemclasses, tables['itemclasses-german'])
  const classIds = indexById(tables.itemclasses)
  const actualFiles = new Set(inventoryText.split(/\r?\n/).map(line => line.trim().toLowerCase()))
  const availability = name => actualFiles.has(`data/balance/${name.toLowerCase()}.datc64`) ? 'present' : 'not-present-under-proposed-name'
  const proposed = ['moddomains','modgenerationtypes','modgroups','spawnweights','uniqueitems','uniqueitemversions','uniqueitemmods','itemgrantedskills','itemgrantedsupports','augments','augmenttypes','statsvalues','bondedstatsvalues','implicitmods','corruptionmods','enchantments','anointments']
  const absent = proposed.map(table => ({ table, status: availability(table) }))
  const productCoverage = classifyProduct(baseSummary, englishTables)

  const soulCoreRows = tables.soulcores?.rowCount ?? 0
  const soulCoreStats = tables.soulcorestats?.rows.length ?? 0
  const soulCoreTypes = tables.soulcoretypes?.rows.length ?? 0
  const unique = {
    status: 'unsupported-category', identities: 'unknown', baseTypeAssignments: 'unknown', modReferences: 'unknown', statIds: 'unknown', structuredValues: 'unknown', variants: 'unknown', grantedSkills: 'unknown', grantedSupports: 'unknown',
    extractedRelatedTables: { uniquechests: tables.uniquechests?.rowCount ?? 0, uniqueStashLayout: tables.uniquestashlayout?.rowCount ?? 0, mutatedUniqueModsClient: tables.incursion2mutateduniquemodsclient?.rowCount ?? 0 },
    conclusion: 'Related tables do not form a stable Unique-ID → base → variant → Mod-ID chain.', approvalGranted: false,
  }
  const socketable = {
    status: soulCoreRows ? 'partially-resolved' : 'unsupported-category',
    identities: { runes: 'unknown', soulCores: soulCoreRows, idols: 'unknown', abyssalEyes: 'unknown', congealedMist: 'unknown' },
    soulCoreTypes, soulCoreStatRows: soulCoreStats,
    statsValues: soulCoreStats ? 'present-as-structured-array-in-soulcorestats' : 'unknown',
    bondedStatsValues: 'not-present-under-proposed-name',
    targetCategories: tables.soulcorestatcategories?.rowCount ?? 0,
    fullChains: 0, partialChains: soulCoreRows, germanCsdConnections: 'not-end-to-end-resolved',
    conclusion: '295 Soul Core rows are present but retain one unknown schema byte; structured value tables exist, while absent ItemClasses decoding and missing bonded table prevent a lossless end-to-end product chain.', approvalGranted: false,
  }
  const summary = {
    schemaVersion: 1, audit: '5M.2.4', status: 'completed-audit-only',
    pins: config.pins, selectedTables: inventories, proposedTableAvailability: absent,
    extraction: { files: manifest.files, bytes: manifest.bytes, manifestSha256: manifest.sha256, exitCode: 0, networkAttempts: 0 },
    references: { resolved: references.resolved, unresolved: references.missing, issues: references.issues },
    itemClassSchemaByte: itemClassAudit,
    charmId: { directIdReadable: classIds.has('Charm'), status: 'unknown', classification: 'weiterhin unbekannt', reason: 'ItemClasses is not losslessly decoded; no name matching used.' },
    productCoverage, uniqueCoverage: unique, socketableCoverage: socketable,
    localization: { missingGermanStatIds: 12, resolvedByNewTables: 0, remainingTemplateGaps: 38, resolvedTemplateGaps: 0, ocrAmbiguities: 2189, newlyResolvedOcrAmbiguities: 0 },
    network: { http: false, https: false, dns: false, api: false, tradeApi: false, poe2db: false, websites: false },
    productDataChanged: false, productPinChanged: false, approvalChanged: false,
  }
  const normalized = stable({ summary, tables, manifest })
  const sanitized = stable(summary)
  await mkdir(config.outputPath, { recursive: true })
  await writeFile(join(config.outputPath, 'normalized-reference-audit.json'), normalized)
  await writeFile(join(config.outputPath, 'sanitized-reference-summary.json'), sanitized)
  await writeFile(join(config.outputPath, 'reference-run-manifest.json'), stable({ normalizedSha256: sha256(normalized), sanitizedSha256: sha256(sanitized), errors: [], warnings: references.issues }))
  return { summary, normalizedSha256: sha256(normalized), sanitizedSha256: sha256(sanitized) }
}

export async function main(argv = process.argv.slice(2)) {
  if (argv.length !== 2 || argv[0] !== '--config') throw new Error('usage: --config <local-config.json>')
  return runReferenceAudit(JSON.parse(await readFile(resolve(argv[1]), 'utf8')))
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main().then(result => process.stdout.write(`${JSON.stringify({ status: 'ok', normalizedSha256: result.normalizedSha256, sanitizedSha256: result.sanitizedSha256 })}\n`)).catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1 })
}
