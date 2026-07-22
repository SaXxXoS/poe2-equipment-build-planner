import { createHash } from 'node:crypto'
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises'
import { join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

export const FORMAT_VERSION = 1
export const EXPECTED_PINS = Object.freeze({
  contentSha256: 'a917a56f89ae631f1a93e0dd9a3ea169f08e826e07927c0083a01c6e68a18e28',
  pobRepository: 'PathOfBuildingCommunity/PathOfBuilding-PoE2',
  pobCommit: 'c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0',
  oozVersion: '0.2.4',
  oozArtifactSha256: 'e6d7e728a8b02d2203a80f41bdf8f13c524afda2d393773930b8dfc0afd94af4',
  balanceManifestSha256: 'fa781004478566737dc5164e1d67cd5b304aea2121a529dd2ad0f298be7ac295',
  csdManifestSha256: '976a428f088618b24dad7779440413b9f296a9c906c5563659e446d4fd19b11d',
  formatVersion: FORMAT_VERSION,
})

export const AUDIT_STATUSES = Object.freeze([
  'resolved', 'partially-resolved', 'unresolved', 'missing-reference', 'schema-unknown',
  'source-conflict', 'localization-missing', 'localization-ambiguous',
  'unsupported-category', 'parser-error',
])

const TABLE_FILES = Object.freeze({
  mods: 'mods.datc64',
  stats: 'stats.datc64',
  baseitemtypes: 'baseitemtypes.datc64',
  itemclasses: 'itemclasses.datc64',
  tags: 'tags.datc64',
})

const TYPE_SIZE = Object.freeze({ Bool: 1, Int: 4, UInt16: 2, UInt: 4, Interval: 8, Float: 4, String: 8, Enum: 4, ShortKey: 8, Key: 16 })
const REF_TYPES = new Set(['Enum', 'ShortKey', 'Key'])
const NULL32 = 0xfefefefe
const NULL64 = 0xfefefefefefefefen

const sha256 = value => createHash('sha256').update(value).digest('hex')
const stable = value => JSON.stringify(sortValue(value), null, 2) + '\n'

function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, sortValue(value[key])]))
  return value
}

export function assertPinned(config) {
  for (const [key, expected] of Object.entries(EXPECTED_PINS)) {
    if (config.pins?.[key] !== expected) throw new Error(`pin-mismatch:${key}`)
  }
  if (!config.schemaPath || !config.balancePath || !config.csdPath || !config.outputPath) throw new Error('missing-input-manifest')
  const output = resolve(config.outputPath).toLowerCase()
  if (output.includes(`${sep}generated${sep}`) || output.endsWith(`${sep}generated`) || output.includes(`${sep}public${sep}`) || output.endsWith(`${sep}public`)) throw new Error('forbidden-output-path')
  if (!output.includes(`${sep}.local-audits${sep}`)) throw new Error('output-must-be-local-audits')
}

function extractBlock(source, start) {
  let depth = 0
  let quote = null
  let escaped = false
  for (let index = start; index < source.length; index += 1) {
    const char = source[index]
    if (quote) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === quote) quote = null
      continue
    }
    if (char === '"' || char === "'") { quote = char; continue }
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) return source.slice(start, index + 1)
    }
  }
  throw new Error('schema-unclosed-table')
}

export function parseLuaSchemas(source, names = Object.keys(TABLE_FILES)) {
  const schemas = {}
  for (const name of names) {
    const match = new RegExp(`(?:^|\\n)\\s*${name}=\\{`, 'm').exec(source)
    if (!match) throw new Error(`schema-table-missing:${name}`)
    const brace = source.indexOf('{', match.index)
    const table = extractBlock(source, brace)
    const columns = []
    const columnPattern = /\[(\d+)\]=\{/g
    let columnMatch
    while ((columnMatch = columnPattern.exec(table))) {
      const blockStart = table.indexOf('{', columnMatch.index)
      const block = extractBlock(table, blockStart)
      columnPattern.lastIndex = blockStart + block.length
      const property = key => {
        const stringValue = new RegExp(`${key}="([^"]*)"`).exec(block)
        if (stringValue) return stringValue[1]
        const scalar = new RegExp(`${key}=([^,\\n}]+)`).exec(block)
        return scalar?.[1]?.trim()
      }
      const type = property('type')
      if (!TYPE_SIZE[type]) throw new Error(`schema-type-unknown:${name}:${columnMatch[1]}:${type}`)
      columns.push({
        index: Number(columnMatch[1]),
        name: property('name') ?? '',
        type,
        list: property('list') === 'true',
        refTo: property('refTo') ?? '',
        enumBase: Number(property('enumBase') ?? 0),
      })
    }
    columns.sort((a, b) => a.index - b.index)
    if (!columns.length || columns.some((column, index) => column.index !== index + 1)) throw new Error(`schema-column-order-invalid:${name}`)
    schemas[name] = columns
  }
  return schemas
}

function findDataOffset(buffer) {
  for (let index = 4; index <= buffer.length - 8; index += 1) {
    let marker = true
    for (let offset = 0; offset < 8; offset += 1) if (buffer[index + offset] !== 0xbb) { marker = false; break }
    if (marker) return index
  }
  throw new Error('dat-data-marker-missing')
}

function readU64(buffer, offset) {
  if (offset < 0 || offset + 8 > buffer.length) throw new Error('dat-read-out-of-range')
  return buffer.readBigUInt64LE(offset)
}

function readUtf16(buffer, offset) {
  if (offset < 0 || offset >= buffer.length) throw new Error('dat-string-offset-invalid')
  let end = offset
  while (end + 1 < buffer.length && (buffer[end] !== 0 || buffer[end + 1] !== 0)) end += 2
  return buffer.subarray(offset, end).toString('utf16le')
}

function readScalar(buffer, offset, dataOffset, column) {
  switch (column.type) {
    case 'Bool': return buffer.readUInt8(offset) === 1
    case 'Int': return buffer.readInt32LE(offset)
    case 'UInt16': return buffer.readUInt16LE(offset)
    case 'UInt': return buffer.readUInt32LE(offset)
    case 'Interval': return { minimum: buffer.readInt32LE(offset), maximum: buffer.readInt32LE(offset + 4) }
    case 'Float': return buffer.readFloatLE(offset)
    case 'String': return readUtf16(buffer, dataOffset + Number(readU64(buffer, offset)))
    case 'Enum': {
      const value = buffer.readUInt32LE(offset)
      return value === NULL32 ? null : value
    }
    case 'ShortKey':
    case 'Key': {
      const value = readU64(buffer, offset)
      return value === NULL64 ? null : Number(value)
    }
    default: throw new Error(`dat-type-unsupported:${column.type}`)
  }
}

export function parseDatc64(buffer, schema, tableName) {
  const rowCount = buffer.readUInt32LE(0)
  const dataOffset = findDataOffset(buffer)
  if (rowCount === 0) throw new Error(`dat-empty:${tableName}`)
  const rowBytes = dataOffset - 4
  if (rowBytes % rowCount !== 0) throw new Error(`dat-row-size-nondeterministic:${tableName}`)
  const rowSize = rowBytes / rowCount
  let schemaSize = 0
  const offsets = schema.map(column => {
    const offset = schemaSize
    schemaSize += column.list ? 16 : TYPE_SIZE[column.type]
    return offset
  })
  if (schemaSize > rowSize) throw new Error(`schema-larger-than-row:${tableName}:${schemaSize}:${rowSize}`)
  if (schemaSize !== rowSize) {
    return { tableName, rowCount, rowSize, dataOffset, schemaSize, unknownTrailingBytes: rowSize - schemaSize, schema, rows: [], parserStatus: 'schema-unknown' }
  }
  const rows = []
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const rowBase = 4 + rowIndex * rowSize
    const values = {}
    for (let columnIndex = 0; columnIndex < schema.length; columnIndex += 1) {
      const column = schema[columnIndex]
      const key = column.name || `_unknown_${column.index}`
      const base = rowBase + offsets[columnIndex]
      if (column.list) {
        const count = Number(readU64(buffer, base))
        const listOffset = dataOffset + Number(readU64(buffer, base + 8))
        if (count > 100000) throw new Error(`dat-list-count-invalid:${tableName}:${rowIndex}:${column.index}`)
        if (listOffset < dataOffset || listOffset + count * TYPE_SIZE[column.type] > buffer.length) throw new Error(`dat-list-offset-invalid:${tableName}:${rowIndex}:${column.index}:${count}:${listOffset}`)
        values[key] = Array.from({ length: count }, (_, index) => readScalar(buffer, listOffset + index * TYPE_SIZE[column.type], dataOffset, column))
      } else {
        try { values[key] = readScalar(buffer, base, dataOffset, column) }
        catch (error) { throw new Error(`dat-cell-error:${tableName}:${rowIndex}:${column.index}:${error.message}`, { cause: error }) }
      }
    }
    rows.push({ rowIndex, values })
  }
  return {
    tableName,
    rowCount,
    rowSize,
    dataOffset,
    schemaSize,
    unknownTrailingBytes: rowSize - schemaSize,
    schema,
    rows,
  }
}

function resolveReferences(tables) {
  const issues = []
  let resolved = 0
  let missing = 0
  for (const table of Object.values(tables)) {
    for (const row of table.rows) {
      for (const column of table.schema.filter(value => REF_TYPES.has(value.type) && value.refTo)) {
        const key = column.name || `_unknown_${column.index}`
        const values = column.list ? row.values[key] : [row.values[key]]
        for (const reference of values) {
          if (reference === null) continue
          const target = tables[column.refTo.toLowerCase()]
          if (!target) { missing += 1; issues.push({ sourceTable: table.tableName, sourceField: key, targetTable: column.refTo, status: 'schema-unknown' }); continue }
          const targetIndex = reference + (column.type === 'Enum' && column.refTo.toLowerCase() !== table.tableName ? 0 : 0)
          if (targetIndex < 0 || targetIndex >= target.rowCount) { missing += 1; issues.push({ sourceTable: table.tableName, sourceField: key, targetTable: column.refTo, status: 'missing-reference' }) }
          else resolved += 1
        }
      }
    }
  }
  return { resolved, missing, issues: aggregateIssues(issues) }
}

function decodeCsd(buffer) {
  if (buffer[0] === 0xff && buffer[1] === 0xfe) return buffer.subarray(2).toString('utf16le')
  if (buffer[0] === 0xfe && buffer[1] === 0xff) throw new Error('csd-big-endian-unsupported')
  return buffer.toString('utf16le')
}

export function parseCsd(buffer, fileName = '<fixture>') {
  const source = decodeCsd(buffer)
  const entries = []
  let entry = null
  let locale = 'English'
  let order = 0
  let unknownLines = 0
  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('include ')) continue
    const description = /^(?:handed_)?description(?:\s+([\w_]+))?$/.exec(line)
    if (description) { entry = { id: description[1] ?? `entry-${order}`, order: order++, statIds: [], variants: [] }; entries.push(entry); locale = 'English'; continue }
    const noDescription = /^no_description\s+([\w_+%-]+)/.exec(line)
    if (noDescription) { entries.push({ id: noDescription[1], order: order++, statIds: [noDescription[1]], variants: [], noDescription: true }); entry = null; continue }
    if (!entry) { unknownLines += 1; continue }
    const stats = /^(\d+)\s+([\w_+% -]+)$/.exec(line)
    if (stats && entry.statIds.length === 0) { entry.statIds = stats[2].trim().split(/\s+/); continue }
    const language = /^lang\s+"([^"]+)"/.exec(line)
    if (language) { locale = language[1]; continue }
    if (/^\d+$/.test(line) || line === 'no_identifiers') continue
    if (line === 'table_only') continue
    const variant = /^(.+?)\s+"((?:\\.|[^"])*)"\s*(.*)$/.exec(line)
    if (variant) {
      const prefixTokens = variant[1].trim().split(/\s+/)
      const limitTokens = prefixTokens.slice(0, entry.statIds.length)
      if (limitTokens.length !== entry.statIds.length) { unknownLines += 1; continue }
      const limits = limitTokens.map(token => {
        if (token === '#') return { operator: 'any' }
        if (/^!-?\d+$/.test(token)) return { operator: 'not-equal', value: Number(token.slice(1)) }
        if (/^-?\d+$/.test(token)) return { operator: 'equal', value: Number(token) }
        const range = /^(-?\d+|#)\|(-?\d+|#)$/.exec(token)
        return range ? { operator: 'range', minimum: range[1] === '#' ? null : Number(range[1]), maximum: range[2] === '#' ? null : Number(range[2]) } : { operator: 'unknown', raw: token }
      })
      const formatTokens = variant[3].trim().split(/\s+/).filter(Boolean)
      entry.variants.push({ locale, limits, quality: prefixTokens[entry.statIds.length] ?? null, text: variant[2], formatTokens })
    } else unknownLines += 1
  }
  return { fileName, entries, unknownLines }
}

async function walkFiles(root) {
  const result = []
  for (const item of await readdir(root, { withFileTypes: true })) {
    const path = join(root, item.name)
    if (item.isDirectory()) result.push(...await walkFiles(path))
    else if (item.isFile()) result.push(path)
  }
  return result.sort((a, b) => a.toLowerCase() < b.toLowerCase() ? -1 : a.toLowerCase() > b.toLowerCase() ? 1 : a < b ? -1 : a > b ? 1 : 0)
}

function aggregateIssues(issues) {
  const counts = new Map()
  for (const issue of issues) {
    const key = JSON.stringify(issue)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts].map(([key, count]) => ({ ...JSON.parse(key), count })).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
}

async function contentManifest(root, files) {
  const records = []
  for (const path of files) {
    const bytes = await readFile(path)
    records.push({ relativePath: `/${relative(root, path).split(sep).join('/')}`, bytes: bytes.length, sha256: sha256(bytes) })
  }
  return { files: records.length, bytes: records.reduce((sum, record) => sum + record.bytes, 0), sha256: sha256(records.map(record => `${record.relativePath}|${record.bytes}|${record.sha256}`).join('\n')), records }
}

function productUniverse(product) {
  const modFiles = [product.affixes, product.jewelMods, product.charmMods, product.lifeFlaskMods, product.manaFlaskMods]
  const mods = new Map()
  for (const list of modFiles) for (const mod of list) mods.set(mod.sourceModId, mod)
  const statLines = [...mods.values()].flatMap(mod => mod.statLines)
  const combinations = new Set([...mods.values()].map(mod => mod.statLines.map(line => line.statId).join('|')))
  return { mods, statLines, statIds: new Set(statLines.map(line => line.statId)), combinations }
}

async function readJson(path) { return JSON.parse(await readFile(path, 'utf8')) }

function classify(total, assessable, extra = {}) {
  return { total, resolved: assessable, partiallyResolved: 0, unresolved: total - assessable, ...extra }
}

function assertUniqueTechnicalIds(tables) {
  for (const table of Object.values(tables)) {
    if (!table.schema.some(column => column.name === 'Id') || !table.rows.length) continue
    const ids = new Set()
    for (const row of table.rows) {
      const id = row.values.Id
      if (!id) continue
      if (ids.has(id)) throw new Error(`duplicate-id:${table.tableName}:${id}`)
      ids.add(id)
    }
  }
}

export async function runOfflineAudit(config) {
  assertPinned(config)
  const schemaSource = await readFile(config.schemaPath, 'utf8')
  if (sha256(schemaSource) !== config.schemaSha256) throw new Error('schema-hash-mismatch')
  const schemas = parseLuaSchemas(schemaSource)
  const balanceFiles = (await walkFiles(config.balancePath)).filter(path => path.toLowerCase().endsWith('.datc64'))
  const csdFiles = (await walkFiles(config.csdPath)).filter(path => path.toLowerCase().endsWith('.csd'))
  const balanceManifest = await contentManifest(config.balancePath, balanceFiles)
  const csdManifest = await contentManifest(config.csdPath, csdFiles)
  if (balanceManifest.sha256 !== EXPECTED_PINS.balanceManifestSha256) throw new Error('balance-manifest-mismatch')
  if (csdManifest.sha256 !== EXPECTED_PINS.csdManifestSha256) throw new Error(`csd-manifest-mismatch:${csdManifest.sha256}`)
  if (balanceFiles.length !== 5 || csdFiles.length !== 589) throw new Error('input-count-mismatch')

  const tables = {}
  for (const [name, fileName] of Object.entries(TABLE_FILES)) {
    const path = balanceFiles.find(value => value.toLowerCase().endsWith(fileName))
    if (!path) throw new Error(`balance-table-missing:${name}`)
    tables[name] = parseDatc64(await readFile(path), schemas[name], name)
  }
  assertUniqueTechnicalIds(tables)
  const references = resolveReferences(tables)

  const csdParsed = []
  for (const path of csdFiles) csdParsed.push(parseCsd(await readFile(path), relative(config.csdPath, path).split(sep).join('/')))
  const csdEntries = csdParsed.flatMap(file => file.entries.map(entry => ({ ...entry, fileName: file.fileName })))
  const csdStatIds = new Set(csdEntries.flatMap(entry => entry.statIds))
  const germanVariants = csdEntries.flatMap(entry => entry.variants).filter(variant => variant.locale === 'German')
  const englishVariants = csdEntries.flatMap(entry => entry.variants).filter(variant => variant.locale === 'English')
  const germanStatIds = new Set(csdEntries.filter(entry => entry.variants.some(variant => variant.locale === 'German')).flatMap(entry => entry.statIds))
  const englishStatIds = new Set(csdEntries.filter(entry => entry.variants.some(variant => variant.locale === 'English')).flatMap(entry => entry.statIds))
  let csdStructuralConflicts = 0
  let csdComparableEntries = 0
  for (const entry of csdEntries) {
    const german = entry.variants.filter(variant => variant.locale === 'German')
    const english = entry.variants.filter(variant => variant.locale === 'English')
    if (!german.length || !english.length) continue
    csdComparableEntries += 1
    const structure = variants => variants.map(variant => ({ limits: variant.limits, quality: variant.quality, formatTokens: variant.formatTokens })).sort((a, b) => stable(a).localeCompare(stable(b)))
    if (stable(structure(german)) !== stable(structure(english))) csdStructuralConflicts += 1
  }

  const product = productUniverse({
    affixes: await readJson(config.product.affixes),
    jewelMods: await readJson(config.product.jewelMods),
    charmMods: await readJson(config.product.charmMods),
    lifeFlaskMods: await readJson(config.product.lifeFlaskMods),
    manaFlaskMods: await readJson(config.product.manaFlaskMods),
  })
  const localModIds = new Set(tables.mods.rows.map(row => row.values.Id).filter(Boolean))
  const localMods = new Map(tables.mods.rows.filter(row => row.values.Id).map(row => {
    const statIds = []
    const statValues = []
    for (let index = 1; index <= 6; index += 1) {
      const reference = row.values[`Stat${index}`]
      if (reference === null || reference === undefined) continue
      const statId = tables.stats.rows[reference]?.values.Id
      if (statId) { statIds.push(statId); statValues.push(row.values[`Stat${index}Value`]) }
    }
    return [row.values.Id, { statIds, statValues }]
  }))
  const localStatIds = new Set(tables.stats.rows.map(row => row.values.Id).filter(Boolean))
  const modClassifications = [...product.mods.values()].map(mod => {
    const local = localMods.get(mod.sourceModId)
    if (!local) return 'missing'
    const sourceIds = mod.statLines.map(line => line.statId)
    if (sourceIds.join('|') !== local.statIds.join('|')) return 'stat-id-conflict'
    const valuesMatch = mod.statLines.every((line, index) => local.statValues[index]?.minimum === line.minimum && local.statValues[index]?.maximum === line.maximum)
    return valuesMatch ? 'id-stat-values-match' : 'value-conflict'
  })
  const matchedMods = modClassifications.filter(value => value === 'id-stat-values-match')
  const matchedStats = [...product.statIds].filter(id => localStatIds.has(id))
  const localizedStats = [...product.statIds].filter(id => germanStatIds.has(id))
  const missingTemplateLines = product.statLines.filter(line => !line.technicalTemplate)
  const gapGerman = missingTemplateLines.filter(line => germanStatIds.has(line.statId)).length
  const gapEnglish = missingTemplateLines.filter(line => englishStatIds.has(line.statId)).length

  const normalizedGermanTemplates = new Map()
  for (const entry of csdEntries) for (const variant of entry.variants.filter(value => value.locale === 'German')) {
    const normalized = variant.text.replace(/\{\d+\}/g, '{#}').replace(/\s+/g, ' ').trim().toLowerCase()
    const ids = normalizedGermanTemplates.get(normalized) ?? new Set()
    entry.statIds.forEach(id => ids.add(id))
    normalizedGermanTemplates.set(normalized, ids)
  }
  const ambiguousGermanTemplates = [...normalizedGermanTemplates.values()].filter(ids => ids.size > 1).length
  const categoryCoverage = {}
  for (const generationType of ['prefix', 'suffix', 'corrupted']) {
    const items = [...product.mods.values()].filter(mod => mod.generationType === generationType)
    const matches = items.filter(mod => localModIds.has(mod.sourceModId)).length
    categoryCoverage[generationType] = { total: items.length, partiallyResolved: matches, unresolved: items.length - matches }
  }
  const implicitItems = [...product.mods.values()].filter(mod => mod.sourceSides.includes('implicit'))
  categoryCoverage.baseImplicits = { total: implicitItems.length, partiallyResolved: implicitItems.filter(mod => localModIds.has(mod.sourceModId)).length, unresolved: implicitItems.filter(mod => !localModIds.has(mod.sourceModId)).length }
  const uniqueGenerationItems = [...product.mods.values()].filter(mod => mod.generationType === 'unique')
  categoryCoverage.uniqueGenerationMods = { total: uniqueGenerationItems.length, partiallyResolved: uniqueGenerationItems.filter(mod => localModIds.has(mod.sourceModId)).length, unresolved: uniqueGenerationItems.filter(mod => !localModIds.has(mod.sourceModId)).length, note: 'Generation type unique is not a Unique-item identity layer.' }
  for (const [category, classId] of [['jewels', 'Jewels'], ['charms', 'Charms'], ['lifeFlasks', 'Life Flasks'], ['manaFlasks', 'Mana Flasks']]) {
    const items = [...product.mods.values()].filter(mod => mod.itemClassIds.includes(classId))
    const matches = items.filter(mod => localModIds.has(mod.sourceModId)).length
    categoryCoverage[category] = { total: items.length, partiallyResolved: matches, unresolved: items.length - matches }
  }

  const baseItems = [
    ...await readJson(config.product.jewelBaseItems), ...await readJson(config.product.charmBaseItems),
    ...await readJson(config.product.lifeFlaskBaseItems), ...await readJson(config.product.manaFlaskBaseItems),
  ]
  const affixClasses = await readJson(config.product.affixItemClasses)
  const additionalIndex = await readJson(config.product.additionalItemClassIndex)
  const classIds = new Set([...affixClasses.map(value => value.itemClassId), ...Object.keys(additionalIndex)])
  const productBaseIds = new Set(baseItems.map(value => value.baseItemId))
  const localBaseIds = new Set(tables.baseitemtypes.rows.map(row => row.values.Id).filter(Boolean))
  const localClassKeys = new Set(tables.itemclasses.rows.map(row => row.values.Id).filter(Boolean))

  const unknownRequestedTables = ['ModGroups','SpawnWeights','UniqueItems','UniqueItemVersions','ItemVisualIdentity','ItemGrantedSkills','ItemGrantedSupports','Augments','Runes','SoulCores','Idols','AbyssalEyes','CongealedMist','BondedStatsValues','ImplicitMods','CorruptionMods','Enchantments','Anointments']
  const tableInventory = Object.values(tables).map(table => ({
    table: table.tableName,
    file: TABLE_FILES[table.tableName],
    bytes: balanceManifest.records.find(record => record.relativePath.toLowerCase().endsWith(TABLE_FILES[table.tableName]))?.bytes,
    sha256: balanceManifest.records.find(record => record.relativePath.toLowerCase().endsWith(TABLE_FILES[table.tableName]))?.sha256,
    rows: table.rowCount,
    rowSize: table.rowSize,
    fields: table.schema.length,
    fieldSchema: table.schema.map(column => ({ index: column.index, name: column.name || null, type: column.type, list: column.list, refTo: column.refTo || null })),
    namedFields: table.schema.filter(column => column.name).length,
    unknownFields: table.schema.filter(column => !column.name).length,
    unknownTrailingBytes: table.unknownTrailingBytes,
    parserStatus: table.parserStatus ?? (table.unknownTrailingBytes === 0 ? 'resolved' : 'partially-resolved'),
  }))

  const full = {
    formatVersion: FORMAT_VERSION,
    pins: config.pins,
    runtime: process.version,
    manifests: { balance: balanceManifest, csd: csdManifest, schemaSha256: config.schemaSha256 },
    tables: Object.fromEntries(Object.entries(tables).map(([name, table]) => [name, { ...table, rows: table.rows }])),
    csd: csdParsed,
    references,
    localCoverage: { localModIds: localModIds.size, localStatIds: localStatIds.size, csdStatIds: csdStatIds.size },
  }
  const summary = {
    schemaVersion: 1,
    audit: '5M.2.3',
    status: 'completed-audit-only',
    pins: config.pins,
    runtime: process.version,
    tableInventory,
    absentOrNotExtractedTables: unknownRequestedTables.map(table => ({ table, status: 'schema-unknown' })),
    csdInventory: { files: csdFiles.length, bytes: csdManifest.bytes, entries: csdEntries.length, statIds: csdStatIds.size, variants: csdEntries.reduce((sum, entry) => sum + entry.variants.length, 0), germanVariants: germanVariants.length, englishVariants: englishVariants.length, germanStatIds: germanStatIds.size, englishStatIds: englishStatIds.size, sharedStatIds: [...germanStatIds].filter(id => englishStatIds.has(id)).length, germanOnlyStatIds: [...germanStatIds].filter(id => !englishStatIds.has(id)).length, englishOnlyStatIds: [...englishStatIds].filter(id => !germanStatIds.has(id)).length, comparableEntries: csdComparableEntries, structuralConflicts: csdStructuralConflicts, unknownLines: csdParsed.reduce((sum, file) => sum + file.unknownLines, 0) },
    referenceResolution: { resolved: references.resolved, missing: references.missing, issueCategories: references.issues },
    referenceMatrix: Object.values(tables).flatMap(table => table.schema.filter(column => REF_TYPES.has(column.type) && column.refTo).map(column => ({ sourceTable: table.tableName, sourceField: column.name || `_unknown_${column.index}`, targetTable: column.refTo, cardinality: column.list ? 'many' : 'one', nullable: true, array: column.list, orderRelevant: column.list, status: tables[column.refTo.toLowerCase()] ? 'partially-resolved' : 'schema-unknown' }))),
    productCoverage: {
      mods: { total: product.mods.size, resolved: 0, partiallyResolved: matchedMods.length, unresolved: product.mods.size - matchedMods.length, directIdMatches: modClassifications.filter(value => value !== 'missing').length, idStatValueMatches: matchedMods.length, statIdConflicts: modClassifications.filter(value => value === 'stat-id-conflict').length, valueConflicts: modClassifications.filter(value => value === 'value-conflict').length, reason: 'GenerationType, Domain and item-class reference tables are not present in the five-table input.' },
      statLines: classify(product.statLines.length, product.statLines.filter(line => localStatIds.has(line.statId)).length),
      statIds: classify(product.statIds.size, matchedStats.length, { localized: localizedStats.length }),
      statIdCombinations: classify(product.combinations.size, [...product.combinations].filter(combo => combo.split('|').every(id => localStatIds.has(id))).length),
      multilineAndHybridMods: { total: 429, resolved: 0, partiallyResolved: [...product.mods.values()].filter(mod => mod.isHybrid && localModIds.has(mod.sourceModId)).length, unresolved: 429 - [...product.mods.values()].filter(mod => mod.isHybrid && localModIds.has(mod.sourceModId)).length },
      baseTypes: { total: 39, resolved: 0, partiallyResolved: [...productBaseIds].filter(id => localBaseIds.has(id)).length, unresolved: 39 - [...productBaseIds].filter(id => localBaseIds.has(id)).length, reason: 'Metadata IDs resolve; ItemClasses is schema-unknown.' },
      itemClasses: classify(33, [...classIds].filter(id => localClassKeys.has(id)).length),
      technicalTemplateGaps: { total: missingTemplateLines.length, resolved: 0, partiallyResolved: gapGerman, unresolved: missingTemplateLines.length - gapGerman, germanCsdStructures: gapGerman, englishCsdStructures: gapEnglish, reason: 'CSD structure exists for some gaps, but no product text is generated.' },
    },
    categoryCoverage,
    charmId: { directItemClassIdPresent: localClassKeys.has('Charm'), status: localClassKeys.has('Charm') ? 'resolved' : 'unresolved', conclusion: 'No name-derived mapping performed.' },
    uniqueCoverage: { status: 'unsupported-category', identities: 'unknown', baseTypeAssignments: 'unknown', modReferences: 'unknown', variants: 'unknown', grantedSkills: 'unknown', grantedSupports: 'unknown', reason: 'Required Unique tables are not among the five pinned balance inputs.' },
    socketableCoverage: { status: 'unsupported-category', identities: { runes: 'unknown', soulCores: 'unknown', idols: 'unknown', abyssalEyes: 'unknown', congealedMist: 'unknown' }, statsValues: 'not-end-to-end-resolved', bondedStatsValues: 'schema-unknown', reason: 'Identity and Augments tables are not among the five pinned balance inputs.' },
    ocrReadiness: { normalizedGermanTemplates: normalizedGermanTemplates.size, ambiguousGermanTemplates, regularAffixes: localizedStats.length ? 'partially-suitable' : 'unknown', implicits: 'partially-suitable', corruptionMods: 'only-with-additional-context', jewels: 'partially-suitable', charms: 'partially-suitable', flasks: 'partially-suitable', uniques: 'unknown', runes: 'unknown', soulCores: 'unknown', otherSocketables: 'unknown', implementationCreated: false },
    network: { http: false, https: false, dns: false, tradeApi: false, poe2db: false, websites: false },
    productDataChanged: false,
    approvalChanged: false,
  }
  const normalized = stable(full)
  const sanitized = stable(summary)
  await mkdir(config.outputPath, { recursive: true })
  await writeFile(join(config.outputPath, 'normalized-audit.json'), normalized)
  await writeFile(join(config.outputPath, 'sanitized-summary.json'), sanitized)
  await writeFile(join(config.outputPath, 'run-manifest.json'), stable({ formatVersion: FORMAT_VERSION, normalizedSha256: sha256(normalized), sanitizedSha256: sha256(sanitized), warnings: references.issues, errors: [] }))
  return { summary, normalizedSha256: sha256(normalized), sanitizedSha256: sha256(sanitized) }
}

export async function main(argv = process.argv.slice(2)) {
  if (argv.length !== 2 || argv[0] !== '--config') throw new Error('usage: --config <local-config.json>')
  const config = await readJson(resolve(argv[1]))
  return runOfflineAudit(config)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main().then(result => process.stdout.write(`${JSON.stringify({ status: 'ok', normalizedSha256: result.normalizedSha256, sanitizedSha256: result.sanitizedSha256 })}\n`)).catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1 })
}
