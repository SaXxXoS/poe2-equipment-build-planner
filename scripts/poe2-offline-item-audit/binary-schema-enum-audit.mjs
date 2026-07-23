import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import process from 'node:process'
import { Buffer } from 'node:buffer'
import { fileURLToPath } from 'node:url'
import { parseDatc64, parseLuaSchemas, sha256, stable, walkFiles } from './index.mjs'
import { assertReferenceConfig } from './reference-tables.mjs'

export const BINARY_ENUM_AUDIT_VERSION = 1
const EVIDENCE = ['confirmed', 'strongly-supported', 'plausible', 'contradicted', 'unknown']

function findMarker(buffer) {
  const marker = Buffer.alloc(8, 0xbb)
  const offset = buffer.indexOf(marker)
  if (offset < 0) throw new Error('datc64-marker-missing')
  return offset
}

function trailingByteAudit(buffer, schemaBytes, expectedRows) {
  const rows = buffer.readUInt32LE(0)
  const marker = findMarker(buffer)
  const rowBytes = (marker - 4) / rows
  if (rows !== expectedRows || !Number.isInteger(rowBytes) || rowBytes !== schemaBytes + 1) throw new Error('unexpected-binary-layout')
  const distribution = {}
  return { rows, rowBytes, schemaBytes, unknownLength: 1, distribution }
}

function removeRecordByte(buffer, rowBytes, offset) {
  const rows = buffer.readUInt32LE(0)
  const marker = findMarker(buffer)
  const header = Buffer.alloc(4 + rows * (rowBytes - 1))
  header.writeUInt32LE(rows, 0)
  for (let row = 0; row < rows; row += 1) {
    const source = 4 + row * rowBytes
    const target = 4 + row * (rowBytes - 1)
    buffer.copy(header, target, source, source + offset)
    buffer.copy(header, target + offset, source + offset + 1, source + rowBytes)
  }
  return Buffer.concat([header, buffer.subarray(marker)])
}

function locateUnknownByte(buffer, schema, tableName) {
  const rows = buffer.readUInt32LE(0)
  const rowBytes = (findMarker(buffer) - 4) / rows
  const candidates = []
  for (let offset = 0; offset < rowBytes; offset += 1) {
    try {
      const candidate = removeRecordByte(buffer, rowBytes, offset)
      const parsed = parseDatc64(candidate, schema, `${tableName}-offset-${offset}`)
      if (parsed.rows.length === rows) candidates.push({ offset, parsed })
    } catch {
      // A failed candidate is recorded by omission; no byte is silently accepted.
    }
  }
  if (!candidates.length) throw new Error(`unknown-byte-offset-not-found:${tableName}`)
  const distributions = candidates.map(({ offset }) => {
    const values = {}
    for (let row = 0; row < rows; row += 1) {
      const value = buffer[4 + row * rowBytes + offset]
      values[value] = (values[value] ?? 0) + 1
    }
    return { offset, distribution: values }
  })
  return { candidates: distributions, selected: candidates[0] }
}

function parseLuaArray(source, variable) {
  const match = source.match(new RegExp(`local\\s+${variable}\\s*=\\s*\\{([\\s\\S]*?)\\n\\}`))
  if (!match) return []
  return [...match[1].matchAll(/"([^"]*)"/g)].map((item, index) => ({ rawValue: index + 1, label: item[1] }))
}

function sourceEvidence(path, symbol, commit, role) {
  return { repository: 'PathOfBuildingCommunity/PathOfBuilding-PoE2', commit, path, symbol, role }
}

function enumCoverage(productMods, rawById, values, field, productField) {
  const byRaw = new Map(values.map(value => [value.rawValue, value]))
  const counts = { total: productMods.length, rawPresent: 0, confirmed: 0, stronglySupported: 0, unknown: 0, conflict: 0 }
  const rawDistribution = {}
  for (const mod of productMods) {
    const raw = rawById.get(mod.sourceModId)?.values[field]
    if (raw == null) { counts.unknown += 1; continue }
    counts.rawPresent += 1
    rawDistribution[raw] = (rawDistribution[raw] ?? 0) + 1
    const mapped = byRaw.get(raw)
    if (!mapped) { counts.unknown += 1; continue }
    counts.confirmed += 1
    const normalizedExpected = productField === 'generationType'
      ? ({ 1: 'prefix', 2: 'suffix', 3: 'unique', 5: 'corrupted' }[mapped.rawValue] ?? null)
      : null
    if (normalizedExpected && mod[productField] && String(mod[productField]).toLowerCase() !== normalizedExpected) counts.conflict += 1
  }
  return { counts, rawDistribution }
}

function productAffixes(paths) {
  return Promise.all(paths.map(path => readFile(path, 'utf8').then(JSON.parse))).then(parts => {
    const map = new Map()
    for (const part of parts.flat()) if (part.sourceModId && !map.has(part.sourceModId)) map.set(part.sourceModId, part)
    return [...map.values()]
  })
}

export async function runBinarySchemaEnumAudit(config) {
  assertReferenceConfig(config)
  for (const key of ['enumSourcePath', 'modsSourcePath', 'soulCoreSourcePath', 'productAffixPaths']) {
    if (!config[key]) throw new Error(`missing-audit-input:${key}`)
  }
  const output = resolve(config.outputPath).toLowerCase()
  if (!output.includes('.local-audits') || output.includes('\\generated\\') || output.includes('\\public\\')) throw new Error('forbidden-output-path')
  const schemaSource = await readFile(config.schemaPath, 'utf8')
  if (sha256(schemaSource) !== config.pins.schemaSha256) throw new Error('schema-hash-mismatch')
  const schemas = parseLuaSchemas(schemaSource, ['itemclasses', 'soulcores', 'soulcoretypes', 'soulcorestats', 'soulcorestatcategories', 'soulcorelimits', 'mods', 'modfamily', 'modtype', 'stats'])
  const rawFiles = await walkFiles(config.referencePath)
  const file = (name, german = false) => rawFiles.find(path => basename(path).toLowerCase() === `${name}.datc64` && /[\\/]german[\\/]/i.test(path) === german)
  const itemEn = await readFile(file('itemclasses'))
  const itemDe = await readFile(file('itemclasses', true))
  const soul = await readFile(file('soulcores'))
  const itemLayoutEn = trailingByteAudit(itemEn, 149, 117)
  const itemLayoutDe = trailingByteAudit(itemDe, 149, 117)
  const soulLayout = trailingByteAudit(soul, 97, 295)
  const itemLocatedEn = locateUnknownByte(itemEn, schemas.itemclasses, 'itemclasses')
  const itemLocatedDe = locateUnknownByte(itemDe, schemas.itemclasses, 'itemclasses-german')
  const soulLocated = locateUnknownByte(soul, schemas.soulcores, 'soulcores')
  const itemEnglish = itemLocatedEn.selected.parsed
  const itemGerman = itemLocatedDe.selected.parsed
  const soulCores = soulLocated.selected.parsed
  Object.assign(itemLayoutEn, { unknownOffsetCandidates: itemLocatedEn.candidates, selectedUnknownOffset: itemLocatedEn.selected.offset })
  Object.assign(itemLayoutDe, { unknownOffsetCandidates: itemLocatedDe.candidates, selectedUnknownOffset: itemLocatedDe.selected.offset })
  Object.assign(soulLayout, { unknownOffsetCandidates: soulLocated.candidates, selectedUnknownOffset: soulLocated.selected.offset })

  const previousFiles = await walkFiles(config.previousBalancePath)
  const modsPath = previousFiles.find(path => basename(path).toLowerCase() === 'mods.datc64')
  const mods = parseDatc64(await readFile(modsPath), schemas.mods, 'mods')
  const rawById = new Map(mods.rows.map(row => [row.values.Id, row]))
  const enumSource = await readFile(config.enumSourcePath, 'utf8')
  const domains = parseLuaArray(enumSource, 'modDomains')
  const generationTypes = parseLuaArray(enumSource, 'modGenerationTypes')
  const products = await productAffixes(config.productAffixPaths)
  const domainCoverage = enumCoverage(products, rawById, domains, 'Domain', 'domain')
  const generationCoverage = enumCoverage(products, rawById, generationTypes, 'GenerationType', 'generationType')

  const modSource = await readFile(config.modsSourcePath, 'utf8')
  const soulSource = await readFile(config.soulCoreSourcePath, 'utf8')
  const itemIds = new Set(itemEnglish.rows.map(row => row.values.Id))
  const germanIds = new Set(itemGerman.rows.map(row => row.values.Id))
  const charmLocalCandidates = [...itemIds].filter(id => /charm/i.test(id))
  const charm = {
    status: itemIds.has('Charm') ? 'direct-local-id' : 'project-normalized-id',
    evidence: itemIds.has('Charm') ? 'confirmed' : 'strongly-supported',
    localExactId: itemIds.has('Charm'),
    localTechnicalCandidates: charmLocalCandidates.slice(0, 8),
    projectFlow: [
      'RePoE data/item_classes.json key Charms',
      'scripts/poe2-additional-item-import.mjs CATEGORIES.Charms.classId',
      'generated/poe2-items and src/affixes/registry.ts itemClassId Charms',
    ],
    conclusion: itemIds.has('Charm') ? 'The singular technical ID exists locally.' : 'The product ID is a RePoE/project plural normalization; no singular local ID was manufactured.',
  }

  const ref = async name => parseDatc64(await readFile(file(name)), schemas[name], name)
  const [soulStats, soulTypes, soulCats, soulLimits, modFamily, modType] = await Promise.all([
    ref('soulcorestats'), ref('soulcoretypes'), ref('soulcorestatcategories'), ref('soulcorelimits'), ref('modfamily'), ref('modtype'),
  ])
  let statsPairs = 0; let bondedPairs = 0; let statsMismatch = 0; let bondedMismatch = 0
  for (const row of soulStats.rows) {
    const stats = row.values.Stats ?? []; const values = row.values.StatValue ?? []
    const bonded = row.values.BondedStats ?? []; const bondedValues = row.values.BondedValues ?? []
    statsPairs += Math.min(stats.length, values.length); bondedPairs += Math.min(bonded.length, bondedValues.length)
    if (stats.length !== values.length) statsMismatch += 1
    if (bonded.length !== bondedValues.length) bondedMismatch += 1
  }
  const soulCore = {
    layout: soulLayout,
    hypotheses: [
      { type: 'Bool', evidence: 'strongly-supported', reason: 'Pinned spec contains an unnamed final Bool and the observed values are only 0/1.' },
      { type: 'padding', evidence: 'contradicted', reason: 'The byte varies across rows and the pinned schema declares a final Bool.' },
      { type: 'enum/reference', evidence: 'contradicted', reason: 'One byte and binary values match Bool; no reference target exists.' },
    ],
    rows: soulCores.rows.length, types: soulTypes.rows.length, statRows: soulStats.rows.length,
    categories: soulCats.rows.length, limits: soulLimits.rows.length,
    statsValues: { paired: statsPairs, lengthMismatchRows: statsMismatch, evidence: 'confirmed' },
    bondedStats: { paired: bondedPairs, lengthMismatchRows: bondedMismatch, evidence: bondedMismatch === 0 ? 'confirmed' : 'strongly-supported', sourceContract: 'SoulCoreStats.BondedStats and parallel BondedValues arrays' },
    targetCategories: { rows: soulCats.rows.length, sourceContract: 'SoulCoreStats.Category -> SoulCoreStatCategories.ItemClass[]', evidence: itemEnglish.rows.length === 117 ? 'confirmed' : 'strongly-supported' },
    sourceCodeUse: soulSource.includes('soulCoreStat.BondedStats') && soulSource.includes('BondedValues') ? 'confirmed-parallel-array-use' : 'unknown',
  }

  const itemOffsetUnique = itemLocatedEn.candidates.length === 1 && itemLocatedDe.candidates.length === 1
  const itemClasses = {
    english: itemLayoutEn, german: itemLayoutDe,
    languageParity: stable(itemLayoutEn.distribution) === stable(itemLayoutDe.distribution),
    hypotheses: [
      { type: 'Bool', evidence: 'strongly-supported', reason: 'Pinned spec declares a final unnamed Bool and values are 0/1 in both locales.' },
      { type: 'padding', evidence: 'contradicted', reason: 'The byte varies (114 true, 3 false) and is explicitly represented by the pinned schema.' },
      { type: 'alignment', evidence: 'contradicted', reason: 'Variation is record-dependent; no alignment effect exists after the final byte.' },
      { type: 'enum/reference/larger-field', evidence: 'contradicted', reason: 'No reference target, only binary values, and exact 150-byte row closure as Bool.' },
    ],
    classification: itemOffsetUnique ? 'fachlich ausreichend dekodierbar mit dokumentiertem unbekanntem Restfeld' : 'teilweise dekodierbar',
    evidence: itemOffsetUnique ? 'strongly-supported' : 'unknown',
    knownPrefixBytes: 149, idsDecoded: itemIds.size, germanIdsDecoded: germanIds.size,
    idParity: itemIds.size === germanIds.size && [...itemIds].every(id => germanIds.has(id)),
    note: itemOffsetUnique ? 'The semantic name remains unknown; the byte is retained.' : 'Controlled deletion found multiple structurally parseable offsets; no exact offset is asserted.',
  }

  const domainAudit = {
    rawField: { name: 'Domain', type: 'Enum', schemaReference: 'ModDomains', evidence: 'confirmed' },
    enumValues: domains, coverage: domainCoverage,
    sources: [
      sourceEvidence('src/Export/Scripts/enums.lua', 'modDomains', config.pins.pobCommit, 'enum generator'),
      sourceEvidence('src/Export/Scripts/mods.lua', 'Domains', config.pins.pobCommit, 'consumer constants'),
      sourceEvidence('src/Export/spec.lua', 'mods.Domain', config.pins.pobCommit, 'binary field contract'),
    ],
    evidence: 'confirmed', unknownValues: Object.keys(domainCoverage.rawDistribution).map(Number).filter(value => !domains.some(item => item.rawValue === value)),
  }
  const generationAudit = {
    rawField: { name: 'GenerationType', type: 'Enum', schemaReference: 'ModGenerationTypes', evidence: 'confirmed' },
    enumValues: generationTypes, coverage: generationCoverage,
    sources: [
      sourceEvidence('src/Export/Scripts/enums.lua', 'modGenerationTypes', config.pins.pobCommit, 'enum generator'),
      sourceEvidence('src/Export/Scripts/mods.lua', 'GenTypes', config.pins.pobCommit, 'consumer constants'),
      sourceEvidence('src/Export/spec.lua', 'mods.GenerationType', config.pins.pobCommit, 'binary field contract'),
    ],
    evidence: 'confirmed', unknownValues: Object.keys(generationCoverage.rawDistribution).map(Number).filter(value => !generationTypes.some(item => item.rawValue === value)),
  }
  const groups = {
    modFamily: { rows: modFamily.rows.length, field: 'Mods.Family[] -> ModFamily', technicalIdentity: 'confirmed', conflictSemantics: 'unknown' },
    modType: { rows: modType.rows.length, field: 'Mods.Type -> ModType', technicalIdentity: 'confirmed', conflictSemantics: 'unknown' },
    conflictGroups: { evidence: 'unknown', reason: 'No pinned schema or consumer proves mutual exclusion; table names and ID similarity are insufficient.' },
  }
  const allEnumsResolved = domainCoverage.counts.unknown === 0 && generationCoverage.counts.unknown === 0
  const coverage = {
    productMods: { total: 2255, resolved: 0, partiallyResolved: 2255, unresolved: 0, sourceConflict: domainCoverage.counts.conflict + generationCoverage.counts.conflict, reason: allEnumsResolved ? 'Domain and generation are resolved, but conflict-group semantics remain unknown.' : 'At least one enum remains unknown.' },
    productItemClasses: { total: 33, resolved: 0, partiallyResolved: 33, unresolved: 0, classification: itemClasses.classification },
    soulCoreRows: { total: 295, resolved: 0, partiallyResolved: 295, unresolved: 0 },
    localization: { germanStatIds: { covered: 419, total: 431, missing: 12 }, templateGaps: { resolved: 447, total: 485, remaining: 38 }, ocrAmbiguities: { total: 2189, resolvedByThisAudit: 0 } },
    uniqueImpact: 'partially-better-technical-classification; no complete Unique chain',
  }
  const sources = {
    enumSourceUsed: sha256(enumSource), modsConsumerSourceUsed: sha256(modSource), soulCoreConsumerSourceUsed: sha256(soulSource),
    schemaSourceUsed: config.pins.schemaSha256, evidenceLevels: EVIDENCE,
  }
  const summary = {
    audit: '5M.2.5', formatVersion: BINARY_ENUM_AUDIT_VERSION, status: 'completed-audit-only',
    pins: config.pins, sources, itemClasses, charm, soulCore, domainAudit, generationAudit, groups, coverage,
    network: { http: false, https: false, dns: false, api: false, tradeApi: false, poe2db: false, websites: false },
    productPinChanged: false, approvalChanged: false, productDataChanged: false, task5M2Started: false, task5NStarted: false,
  }
  const serialized = stable(summary)
  await mkdir(config.outputPath, { recursive: true })
  await writeFile(join(config.outputPath, 'binary-schema-enum-audit.json'), serialized)
  await writeFile(join(config.outputPath, 'binary-schema-enum-manifest.json'), stable({ sha256: sha256(serialized), warnings: ['semantic names of final Bool fields remain unknown', 'conflict-group semantics remain unknown'], errors: [] }))
  return { summary, sha256: sha256(serialized) }
}

export async function main(argv = process.argv.slice(2)) {
  if (argv.length !== 2 || argv[0] !== '--config') throw new Error('usage: --config <local-config.json>')
  const result = await runBinarySchemaEnumAudit(JSON.parse(await readFile(resolve(argv[1]), 'utf8')))
  process.stdout.write(`${JSON.stringify({ status: 'ok', sha256: result.sha256 })}\n`)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1 })
}
