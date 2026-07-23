import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { basename, join, relative, resolve, sep } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { contentManifest, parseDatc64, parseLuaSchemas, sha256, stable, walkFiles } from './index.mjs'
import { assertReferenceConfig } from './reference-tables.mjs'

export const UNIQUE_AUDIT_FORMAT = 1
const TABLES = [
  'animateweaponuniques', 'blightcraftinguniques', 'flavourtext',
  'incursion2mutateduniquemodsclient', 'incursionuniqueupgradecomponents',
  'itemvisualidentity', 'mapstashuniquemapinfo', 'modgrantedskills',
  'passivejeweluniqueart', 'skillgemsforuniquestat', 'uniquechests',
  'uniquegoldprices', 'uniquejewellimits', 'uniquemageslegacy', 'uniquemaps',
  'uniquemapskillbooks', 'uniqueorigins', 'uniquestashlayout', 'uniquestashtypes',
  'words',
]
const PINS = {
  contentSha256: 'a917a56f89ae631f1a93e0dd9a3ea169f08e826e07927c0083a01c6e68a18e28',
  pobCommit: 'c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0',
  oozVersion: '0.2.4',
  schemaSha256: '268ae3a318fb23604aa33f01ec2107a2b7fd0e8628294633faab93d0445d3d30',
}

function tableName(path) { return basename(path).toLowerCase().replace('.datc64', '') }
function locale(path) { return /[\\/]german[\\/]/i.test(path) ? 'German' : 'English' }
function key(path) { return `${tableName(path)}:${locale(path)}` }
function technicalFields(schema) {
  return schema.map(field => ({ index: field.index, name: field.name || null, type: field.type, array: field.list, foreignKey: field.refTo || null }))
}
function classification(name) {
  return ({
    words: 'localization-source', itemvisualidentity: 'visual-only',
    uniquestashlayout: 'stash-layout-only', uniquestashtypes: 'stash-layout-only',
    flavourtext: 'localization-source', modgrantedskills: 'granted-skill-reference',
    skillgemsforuniquestat: 'granted-skill-reference',
    uniquechests: 'client-only', incursion2mutateduniquemodsclient: 'mod-reference-source',
    incursionuniqueupgradecomponents: 'variant-source', uniquemageslegacy: 'historical-only',
    uniquemaps: 'identity-source', mapstashuniquemapinfo: 'stash-layout-only',
    uniqueorigins: 'identity-fragment', uniquegoldprices: 'identity-fragment',
    uniquejewellimits: 'identity-fragment', uniquemapskillbooks: 'granted-skill-reference',
    animateweaponuniques: 'unknown', blightcraftinguniques: 'unknown',
    passivejeweluniqueart: 'visual-only',
  }[name] ?? 'unknown')
}
function collectRefs(rows, field) {
  const result = []
  for (const row of rows ?? []) {
    const value = row.values[field]
    for (const ref of Array.isArray(value) ? value : value == null ? [] : [value]) if (Number.isInteger(ref)) result.push(ref)
  }
  return result
}

export async function runUniqueAffixAudit(config) {
  assertReferenceConfig(config)
  for (const [name, value] of Object.entries(PINS)) if (config.pins[name] !== value) throw new Error(`pin-mismatch:${name}`)
  if (config.uniqueAuditFormat !== UNIQUE_AUDIT_FORMAT) throw new Error('pin-mismatch:uniqueAuditFormat')
  const output = resolve(config.outputPath).toLowerCase()
  if (!output.includes(`${sep}.local-audits${sep}`) || output.includes(`${sep}generated${sep}`) || output.includes(`${sep}public${sep}`)) throw new Error('forbidden-output-path')
  const schemaSource = await readFile(config.schemaPath, 'utf8')
  if (sha256(schemaSource) !== config.pins.schemaSha256) throw new Error('schema-hash-mismatch')
  const requestedSchemas = [...TABLES, 'mods', 'stats', 'baseitemtypes', 'itemclasses']
    .filter(name => new RegExp(`\\n\\s*${name}=\\{`).test(schemaSource))
  const schemas = parseLuaSchemas(schemaSource, requestedSchemas)
  const files = (await walkFiles(config.uniquePath)).filter(path => path.toLowerCase().endsWith('.datc64'))
  const manifest = await contentManifest(config.uniquePath, files)
  const tables = {}
  const inventory = []
  for (const path of files) {
    const name = tableName(path)
    const record = manifest.records.find(item => item.relativePath === `/${relative(config.uniquePath, path).split(sep).join('/')}`)
    const schema = schemas[name] ?? []
    let parsed = null; let error = null
    try { parsed = schema.length ? parseDatc64(await readFile(path), schema, key(path)) : null } catch (cause) { error = cause.message }
    if (parsed) tables[key(path)] = parsed
    inventory.push({
      path: record.relativePath, table: name, locale: locale(path), bytes: record.bytes, sha256: record.sha256,
      rows: parsed?.rowCount ?? (await readFile(path)).readUInt32LE(0), rowBytes: parsed?.rowSize ?? null,
      fields: schema.length, fieldDefinitions: technicalFields(schema),
      unknownTrailingBytes: parsed?.unknownTrailingBytes ?? null,
      classification: classification(name), schemaPresent: schema.length > 0,
      parserStatus: error ? 'schema-unknown' : parsed ? (parsed.unknownTrailingBytes ? 'partially-resolved' : 'resolved') : 'schema-unknown',
      error,
    })
  }

  const previous = JSON.parse(await readFile(config.previousNormalizedPath, 'utf8'))
  const modRows = previous.tables.mods.rows
  const statRows = previous.tables.stats.rows
  const modByIndex = new Map(modRows.map(row => [row.rowIndex, row]))
  const statByIndex = new Map(statRows.map(row => [row.rowIndex, row.values.Id]))
  const csd = new Map()
  for (const file of Object.values(previous.csd)) for (const entry of file.entries ?? []) {
    for (const statId of entry.statIds ?? []) {
      const locales = csd.get(statId) ?? new Set()
      for (const variant of entry.variants ?? []) locales.add(variant.locale)
      csd.set(statId, locales)
    }
  }

  const refSets = [
    ['uniquechests:English', 'ModsKeys', 'unique-chest-only'],
    ['incursion2mutateduniquemodsclient:English', 'Mods', 'mutated-modset-without-item-id'],
  ]
  const referencedMods = []
  for (const [tableKey, field, source] of refSets) for (const index of collectRefs(tables[tableKey]?.rows, field)) {
    const mod = modByIndex.get(index)
    referencedMods.push({ source, rowIndex: index, modId: mod?.values.Id ?? null, resolved: Boolean(mod) })
  }
  const uniqueModIds = [...new Set(referencedMods.map(value => value.modId).filter(Boolean))]
  let statLines = 0; let structuredValues = 0; let german = 0; let english = 0
  const statIds = new Set()
  for (const id of uniqueModIds) {
    const mod = modRows.find(row => row.values.Id === id)
    for (let index = 1; index <= 4; index += 1) {
      const statIndex = mod?.values[`Stat${index}`]
      if (statIndex == null) continue
      statLines += 1
      const statId = statByIndex.get(statIndex)
      if (statId) statIds.add(statId)
      if (mod.values[`Stat${index}Value`]) structuredValues += 1
      const locales = csd.get(statId)
      if (locales?.has('German')) german += 1
      if (locales?.has('English')) english += 1
    }
  }

  const stashRows = tables['uniquestashlayout:English']?.rows.length ?? 0
  const mapRows = tables['uniquemaps:English']?.rows.length ?? 0
  const mutatedRows = tables['incursion2mutateduniquemodsclient:English']?.rows.length ?? 0
  const grantedSkillRows = tables['modgrantedskills:English']?.rows.length ?? 0
  const identity = {
    candidates: stashRows + mapRows,
    confirmedItemIdentities: 0,
    stronglySupportedIdentities: 0,
    stashOnly: stashRows,
    mapIdentityFragments: mapRows,
    ambiguous: 0,
    unknown: stashRows + mapRows,
    conclusion: 'No local table supplies a stable item Unique-ID with base-item and affix references. Words rows, visual identities and stash positions are not promoted to item identities.',
  }
  const bases = {
    identities: 0, uniqueBaseReferences: 0, itemClassReferences: 0,
    multiplePossibleBases: 0, missingOrNotAssessable: identity.candidates,
    itemClassesUnknownByteBlocksChain: false,
    reason: 'The chain fails before ItemClasses: no item Unique-ID → BaseItemTypes foreign key exists in the selected local sources.',
  }
  const affixes = {
    itemUniqueAffixReferences: 0,
    nonItemTechnicalModReferences: referencedMods.length,
    resolvedNonItemModReferences: referencedMods.filter(value => value.resolved).length,
    distinctNonItemModIds: uniqueModIds.length,
    directUniqueStatDefinitions: 0,
    statIds: statIds.size, statLines, structuredValues,
    germanCsdLines: german, englishCsdLines: english,
    fullyResolvedGerman: 0, fullyResolvedEnglishOnly: 0,
    technicallyResolvedLocalizationMissing: 0, technicallyResolvedValuesMissing: 0,
    partiallyResolved: 0, textOnly: 0, unresolved: 0,
    caveat: 'UniqueChests and Incursion mutated mod sets are not unique item affixes and are excluded from item coverage.',
  }
  const variants = {
    uniqueItemVersions: 0, uniqueItemVariants: 0, rollVariants: 0,
    legacyDefinitions: tables['uniquemageslegacy:English']?.rows.length ?? 0,
    mutatedDefinitionRows: mutatedRows, vaalOrCorruptionVariants: 0,
    unresolved: identity.candidates,
    conclusion: 'No parent/version/modset key links a unique item identity to an item variant.',
  }
  const localization = {
    technicallyLinkedItemAffixes: 0, germanRenderable: 0, englishOnly: 0,
    germanMissing: 0, ambiguous: 0, structuralConflicts: 0,
    nonItemReferencedStatLines: statLines, nonItemGermanCsdLines: german, nonItemEnglishCsdLines: english,
    conclusion: 'CSD availability cannot establish identity, base, values or variants and therefore yields no renderable unique item affix.',
  }
  const importReadiness = {
    ready: false, uniqueAffixesTechnicallyComplete: false,
    fields: {
      identity: false, slot: false, baseType: false, itemClass: false,
      modReferences: false, structuredValues: false, variants: false,
      germanPresentation: false, grantedSkills: false, grantedSupports: false,
    },
    analyzer: {
      existingData: 'synthetic fixtures only', logicChanged: false,
      requiredRealFields: ['uniqueId', 'baseTypeId', 'itemClassId', 'versionId', 'affixes', 'structuredValues'],
      missingFromLocalChain: ['stable item Unique-ID', 'BaseItemTypes FK', 'item Mod-ID/Stat chain', 'version/variant key'],
    },
  }
  const summary = {
    audit: '5M.2.6', formatVersion: UNIQUE_AUDIT_FORMAT, status: 'completed-audit-only',
    pins: config.pins, extraction: { files: manifest.files, bytes: manifest.bytes, manifestSha256: manifest.sha256, exitCode: 0, networkAttempts: 0 },
    searchPatterns: ['Unique','Uniques','UniqueItem','UniqueName','UniqueType','UniqueVersion','UniqueVariants','UniqueMods','UniqueChests','UniqueStash','Mutated','Vaal','CorruptedUnique','RelicUnique','TrialUnique','ItemSet','ItemVisualIdentity','GrantedSkill','GrantedEffect','AlternateArt','FlavourText'],
    inventory, identity, bases, affixes, variants, localization,
    specialEffects: { itemUniqueImplicits: 0, baseImplicitsResolved: 0, runtimeOrMechanicEffects: 'unknown' },
    granted: { modGrantedSkillRows: grantedSkillRows, itemUniqueLinkedSkills: 0, itemUniqueLinkedSupports: 0, supportsStatus: 'unknown' },
    endToEnd: { fullyResolved: 0, technicallyResolvedLocalizationPartial: 0, partiallyResolved: 0, identityOnly: 0, localizationOnly: 0, schemaUnknown: 0, sourceConflict: 0, unresolved: identity.candidates },
    countingRules: {
      identity: 'stable language-independent item key, not visible text, stash row or visual ID',
      version: 'explicit version/parent key', variant: 'explicit variant/modset key; roll range is not a variant',
      affix: 'item Unique-ID linked to Mod-ID or direct Stat-ID plus structured values',
      unresolvedEffect: 'visible/client fragment lacking an independent technical item-affix chain',
    },
    importReadiness,
    evidenceLevels: ['confirmed','strongly-supported','plausible','contradicted','unknown'],
    network: { http: false, https: false, dns: false, api: false, tradeApi: false, poe2db: false, websites: false },
    productDataChanged: false, productPinChanged: false, approvalChanged: false, analyzerChanged: false, task5M2Started: false, task5NStarted: false,
  }
  const serialized = stable(summary)
  await mkdir(config.outputPath, { recursive: true })
  await writeFile(join(config.outputPath, 'unique-affix-audit.json'), serialized)
  await writeFile(join(config.outputPath, 'unique-affix-manifest.json'), stable({ sha256: sha256(serialized), warnings: ['No complete item Unique identity/base/affix chain exists in the audited local sources.'], errors: [] }))
  return { summary, sha256: sha256(serialized) }
}

export async function main(argv = process.argv.slice(2)) {
  if (argv.length !== 2 || argv[0] !== '--config') throw new Error('usage: --config <local-config.json>')
  const result = await runUniqueAffixAudit(JSON.parse(await readFile(resolve(argv[1]), 'utf8')))
  process.stdout.write(`${JSON.stringify({ status: 'ok', sha256: result.sha256 })}\n`)
}
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) main().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1 })
