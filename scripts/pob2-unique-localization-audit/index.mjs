import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { parseDatc64, parseLuaSchemas, stable } from '../poe2-offline-item-audit/index.mjs'

export const AUDIT_FORMAT_VERSION = 1
export const PRODUCT_SHA256 = 'db3837b51c18fcae5e01572ef437a0f67186183f715402ac9cddb372c19a2452'
export const PRODUCT_SEMANTIC_HASH = 'a5a7e7bac84bb5d921002a83efa6a16e96fec794bead9664dbf7de0bd7f04329'
export const POB2_COMMIT = 'c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0'
export const CONTENT_SHA256 = 'a917a56f89ae631f1a93e0dd9a3ea169f08e826e07927c0083a01c6e68a18e28'
export const SCHEMA_SHA256 = '268ae3a318fb23604aa33f01ec2107a2b7fd0e8628294633faab93d0445d3d30'
export const REFERENCE_MANIFEST_SHA256 = 'a4bbcd99f21490520b516c83800e67bf3a0b691e971d0da59e318dfe6e971353'

const DEFAULTS = {
  productPath: 'generated/pob2/uniques.json',
  normalizedAuditPath: '.local-audits/poe2-offline-audit-parser/run-01/normalized-audit.json',
  referenceAuditPath: '.local-audits/poe2-offline-reference-extraction/run-01/audit/normalized-reference-audit.json',
  uniqueAuditPath: '.local-audits/poe2-unique-affix-audit/audit-run-01/unique-affix-audit.json',
  schemaPath: '.local-audits/poe2-german-parser-candidates/candidate-02-pob/repo/src/Export/spec.lua',
  wordsEnglishPath: '.local-audits/poe2-unique-affix-audit/extraction-run-01/data/balance/words.datc64',
  wordsGermanPath: '.local-audits/poe2-unique-affix-audit/extraction-run-01/data/balance/german/words.datc64',
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function textSignature(value) {
  return value
    .normalize('NFKC')
    .replace(/\[([^|\]]+)\|([^\]]+)\]/g, '$2')
    .replace(/\{[^}]*\d+[^}]*\}/g, '#')
    .replace(/\{value\d+\}/gi, '#')
    .replace(/\([-+]?\d+(?:\.\d+)?\s*-\s*[-+]?\d+(?:\.\d+)?\)/g, '#')
    .replace(/[-+]?\d+(?:\.\d+)?/g, '#')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('en-US')
}

function placeholderCount(signature) {
  return [...signature.matchAll(/#/g)].length
}

function buildCsdIndex(csdFiles) {
  const index = new Map()
  let entryCount = 0
  let germanEnglishPairs = 0
  for (const file of csdFiles) {
    for (const entry of file.entries ?? []) {
      entryCount += 1
      const english = (entry.variants ?? []).filter(variant => variant.locale === 'English')
      const german = (entry.variants ?? []).filter(variant => variant.locale === 'German')
      if (english.length && german.length) germanEnglishPairs += 1
      for (const variant of english) {
        const signature = textSignature(variant.text)
        const records = index.get(signature) ?? new Map()
        const key = `${file.fileName}:${entry.id}:${(entry.statIds ?? []).join(',')}`
        records.set(key, {
          key,
          statIds: entry.statIds ?? [],
          germanAvailable: german.length > 0,
          parameterCount: placeholderCount(signature),
        })
        index.set(signature, records)
      }
    }
  }
  return {
    entryCount,
    germanEnglishPairs,
    index: new Map([...index].map(([key, values]) => [key, [...values.values()]])),
  }
}

function classifyPlannerLines(lines, csdIndex) {
  const result = {
    total: lines.length,
    technicallyExact: 0,
    templateExact: 0,
    valueSafe: 0,
    candidateOnly: 0,
    ambiguous: 0,
    unsupportedStructure: 0,
    noLocalSource: 0,
    translationMissing: lines.length,
    parameterCountExactCandidates: 0,
    parameterCountMismatchCandidates: 0,
    structuredRollRanges: 0,
    rollRangesWithExactCandidateParameterCount: 0,
    rollRangesNotSafelyAssignable: 0,
  }
  for (const line of lines) {
    const signature = textSignature(line.normalizedPlannerLine)
    const candidates = (csdIndex.get(signature) ?? []).filter(candidate => candidate.germanAvailable)
    const sourceParameters = placeholderCount(signature)
    const exactParameters = candidates.filter(candidate => candidate.parameterCount === sourceParameters)
    const ranges = line.rollRanges?.length ?? 0
    result.structuredRollRanges += ranges
    if (candidates.length === 0) {
      result.noLocalSource += 1
      result.rollRangesNotSafelyAssignable += ranges
    } else if (exactParameters.length === 1) {
      result.candidateOnly += 1
      result.parameterCountExactCandidates += 1
      if (ranges && exactParameters[0].parameterCount === ranges) {
        result.rollRangesWithExactCandidateParameterCount += ranges
      } else {
        result.rollRangesNotSafelyAssignable += ranges
      }
    } else if (exactParameters.length > 1) {
      result.ambiguous += 1
      result.parameterCountExactCandidates += 1
      result.rollRangesNotSafelyAssignable += ranges
    } else {
      result.unsupportedStructure += 1
      result.parameterCountMismatchCandidates += 1
      result.rollRangesNotSafelyAssignable += ranges
    }
  }
  return result
}

function mapRowsByVisibleText(rows) {
  const result = new Map()
  for (const row of rows) {
    for (const text of new Set([row.values.Text, row.values.Text2].filter(Boolean))) {
      const indexes = result.get(text) ?? []
      indexes.push(row.rowIndex)
      result.set(text, indexes)
    }
  }
  return result
}

function classifyNames(items, englishWords, germanWords) {
  const byText = mapRowsByVisibleText(englishWords.rows)
  const result = {
    totalItems: items.length,
    deterministicExact: 0,
    deterministicDerived: 0,
    ambiguous: 0,
    displayTextOnly: 0,
    unresolved: 0,
    candidateRowsWithDistinctGermanDisplay: 0,
    translationMissing: items.length,
  }
  for (const item of items) {
    const candidates = byText.get(item.name) ?? []
    if (candidates.length === 1) {
      result.displayTextOnly += 1
      const german = germanWords.rows[candidates[0]]?.values.Text2
      if (german && german !== item.name) result.candidateRowsWithDistinctGermanDisplay += 1
    } else if (candidates.length > 1) {
      result.ambiguous += 1
    } else {
      result.unresolved += 1
    }
  }
  return result
}

function classifyBases(items, englishBaseRows, germanBaseRows) {
  const byName = new Map()
  for (const row of englishBaseRows) {
    const values = byName.get(row.values.Name) ?? []
    values.push(row)
    byName.set(row.values.Name, values)
  }
  const germanById = new Map(germanBaseRows.map(row => [row.values.Id, row]))
  const result = {
    totalItems: items.length,
    deterministic: 0,
    ambiguous: 0,
    textCandidateOnly: 0,
    missing: 0,
    candidateRowsWithGermanName: 0,
    candidateDistinctBaseIds: 0,
  }
  const candidateIds = new Set()
  for (const item of items) {
    const candidates = byName.get(item.baseDisplayName) ?? []
    if (candidates.length === 1) {
      result.textCandidateOnly += 1
      candidateIds.add(candidates[0].values.Id)
      if (germanById.get(candidates[0].values.Id)?.values.Name) result.candidateRowsWithGermanName += 1
    } else if (candidates.length > 1) {
      result.ambiguous += 1
    } else {
      result.missing += 1
    }
  }
  result.candidateDistinctBaseIds = candidateIds.size
  return result
}

function sourceInventory(referenceAudit, uniqueAudit, normalizedAudit) {
  const selected = new Map(referenceAudit.summary.selectedTables.map(table => [table.table, table]))
  return [
    {
      source: 'local-german-csd-stat-descriptions',
      path: DEFAULTS.normalizedAuditPath,
      pin: CONTENT_SHA256,
      format: 'normalized JSON from 589 CSD files',
      language: 'German and English',
      records: normalizedAudit.csd.reduce((sum, file) => sum + (file.entries?.length ?? 0), 0),
      uniqueIdentityFields: false,
      statIds: true,
      baseItemIds: false,
      visibleNames: false,
      variants: false,
      status: 'teilweise-geeignet',
      productUse: 'only after an independent technical Unique line to Stat-ID chain',
    },
    {
      source: 'BaseItemTypes English/German',
      path: DEFAULTS.referenceAuditPath,
      pin: REFERENCE_MANIFEST_SHA256,
      format: 'normalized DAT audit JSON',
      language: 'German and English',
      records: selected.get('baseitemtypes')?.rows ?? 0,
      uniqueIdentityFields: false,
      statIds: false,
      baseItemIds: true,
      visibleNames: true,
      variants: false,
      status: 'teilweise-geeignet',
      productUse: 'German base name only after an independent PoB2 Unique to BaseItemTypes ID link',
    },
    {
      source: 'Words English/German',
      path: '.local-audits/poe2-unique-affix-audit/extraction-run-01/data/balance/{german/,}words.datc64',
      pin: uniqueAudit.extraction.manifestSha256,
      format: 'DATC64 decoded with pinned PoB2 schema',
      language: 'German and English',
      records: 3246,
      uniqueIdentityFields: false,
      statIds: false,
      baseItemIds: false,
      visibleNames: true,
      variants: false,
      status: 'nur-Anzeigehilfe',
      productUse: 'text candidates only; not product approved',
    },
    {
      source: 'Unique-related local DAT tables',
      path: '.local-audits/poe2-unique-affix-audit/audit-run-01/unique-affix-audit.json',
      pin: uniqueAudit.extraction.manifestSha256,
      format: 'normalized offline audit JSON',
      language: 'German and English where present',
      records: uniqueAudit.identity.candidates,
      uniqueIdentityFields: false,
      statIds: false,
      baseItemIds: false,
      visibleNames: true,
      variants: false,
      status: 'Audit-only',
      productUse: 'no stable Unique-ID to base/mod/variant chain',
    },
    {
      source: 'ItemClasses English/German',
      path: DEFAULTS.referenceAuditPath,
      pin: REFERENCE_MANIFEST_SHA256,
      format: 'normalized DAT audit JSON',
      language: 'German and English',
      records: selected.get('itemclasses')?.rows ?? 0,
      uniqueIdentityFields: false,
      statIds: false,
      baseItemIds: false,
      visibleNames: true,
      variants: false,
      status: 'nicht-geeignet',
      productUse: 'one schema byte remains unknown and no Unique foreign key exists',
    },
  ]
}

export async function runAudit(options = {}) {
  const config = { ...DEFAULTS, ...options }
  const productBytes = await readFile(resolve(config.productPath))
  assert(sha256(productBytes) === PRODUCT_SHA256, 'product-hash-mismatch')
  const product = JSON.parse(productBytes)
  assert(product.generatedDataHash === PRODUCT_SEMANTIC_HASH, 'product-semantic-hash-mismatch')
  assert(product.sourceCommit === POB2_COMMIT, 'pob2-pin-mismatch')
  assert(product.recordCount === 435 && product.variantCount === 579, 'product-count-mismatch')
  assert(product.modifierLineCount === 2345 && product.implicitLineCount === 273, 'line-count-mismatch')

  const [normalizedAudit, referenceAudit, uniqueAudit, schemaSource] = await Promise.all([
    readFile(resolve(config.normalizedAuditPath), 'utf8').then(JSON.parse),
    readFile(resolve(config.referenceAuditPath), 'utf8').then(JSON.parse),
    readFile(resolve(config.uniqueAuditPath), 'utf8').then(JSON.parse),
    readFile(resolve(config.schemaPath), 'utf8'),
  ])
  assert(referenceAudit.summary.pins.contentSha256 === CONTENT_SHA256, 'content-pin-mismatch')
  assert(referenceAudit.summary.pins.schemaSha256 === SCHEMA_SHA256, 'schema-pin-mismatch')
  assert(referenceAudit.summary.pins.referenceManifestSha256 === REFERENCE_MANIFEST_SHA256, 'reference-manifest-mismatch')
  assert(sha256(schemaSource) === SCHEMA_SHA256, 'schema-source-hash-mismatch')
  assert(uniqueAudit.network.http === false && uniqueAudit.network.https === false && uniqueAudit.network.dns === false, 'offline-source-violation')

  const schemas = parseLuaSchemas(schemaSource, ['words'])
  const [englishWords, germanWords] = await Promise.all([
    readFile(resolve(config.wordsEnglishPath)).then(bytes => parseDatc64(bytes, schemas.words, 'words:English')),
    readFile(resolve(config.wordsGermanPath)).then(bytes => parseDatc64(bytes, schemas.words, 'words:German')),
  ])
  assert(englishWords.rowCount === germanWords.rowCount && englishWords.rowCount === 3246, 'words-language-parity-mismatch')

  const baseEnglish = referenceAudit.tables.baseitemtypes.rows
  const baseGerman = referenceAudit.tables['baseitemtypes-german'].rows
  assert(baseEnglish.length === baseGerman.length && baseEnglish.length === 5476, 'base-language-parity-mismatch')

  const csd = buildCsdIndex(normalizedAudit.csd)
  const modifierLines = product.items.flatMap(item => item.visibleModifiers)
  const implicitLines = product.items.flatMap(item => item.implicits)
  const names = classifyNames(product.items, englishWords, germanWords)
  const bases = classifyBases(product.items, baseEnglish, baseGerman)
  const modifiers = classifyPlannerLines(modifierLines, csd.index)
  const implicits = classifyPlannerLines(implicitLines, csd.index)
  const variants = {
    total: product.variantCount,
    safelyLocalizableVariants: 0,
    itemWideLocalizationOnly: 0,
    variantSpecificUnresolved: product.variantCount,
    current: product.currentVariantCount,
    legacy: product.legacyVariantCount,
    unknownStatus: product.variantCount - product.currentVariantCount - product.legacyVariantCount,
    systemLabelsEligibleForNormalUiLocalization: product.currentVariantCount + product.legacyVariantCount,
    caveat: 'Current/Legacy are UI system labels; they do not localize Unique item content.',
  }
  const inventory = sourceInventory(referenceAudit, uniqueAudit, normalizedAudit)
  const decisionStatus = 'audit-only-no-safe-product-link'
  const common = {
    audit: '5M.2.10',
    auditFormatVersion: AUDIT_FORMAT_VERSION,
    sourceProductHash: PRODUCT_SHA256,
    sourceProductSemanticHash: PRODUCT_SEMANTIC_HASH,
    sourceScope: product.sourceScope,
    sourcePins: {
      contentSha256: CONTENT_SHA256,
      pob2Commit: POB2_COMMIT,
      schemaSha256: SCHEMA_SHA256,
      referenceManifestSha256: REFERENCE_MANIFEST_SHA256,
    },
    network: { http: false, https: false, dns: false, api: false, tradeApi: false, poe2db: false, scraping: false },
  }
  const reports = {
    'poe2-pob2-unique-german-localization-source-inventory.json': {
      ...common,
      sources: inventory,
      conclusion: 'Local German names, bases and CSD templates exist, but no source supplies a shared technical Unique identity chain to the PoB2 records.',
    },
    'poe2-pob2-unique-german-name-coverage.json': {
      ...common,
      ...names,
      allowedProductMatches: 0,
      note: 'All visible-name matches are audit-only because the PoB2 product has no shared technical Unique-ID with Words.',
    },
    'poe2-pob2-unique-german-base-coverage.json': {
      ...common,
      ...bases,
      allowedProductMatches: 0,
      note: 'PoB2 baseDisplayName is a visible label, not a BaseItemTypes ID.',
    },
    'poe2-pob2-unique-german-modifier-coverage.json': {
      ...common,
      ...modifiers,
      note: 'candidateOnly is text-template similarity for audit; no candidate is product approved without a technical Stat-ID chain.',
    },
    'poe2-pob2-unique-german-implicit-coverage.json': {
      ...common,
      ...implicits,
      baseTypeImplicitSafe: 0,
      uniqueSpecificImplicitSafe: 0,
      note: 'No PoB2 implicit carries a confirmed GGG base/mod/stat identity.',
    },
    'poe2-pob2-unique-german-variant-coverage.json': { ...common, ...variants },
    'poe2-pob2-unique-german-localization-decision.json': {
      ...common,
      scopeId: 'poe2-pob2-unique-german-localization-audit',
      germanSourceCandidates: inventory.map(source => ({ source: source.source, status: source.status })),
      totalItems: product.recordCount,
      totalVariants: product.variantCount,
      totalModifierLines: product.modifierLineCount,
      totalImplicitLines: product.implicitLineCount,
      deterministicNameMatches: 0,
      deterministicBaseMatches: 0,
      deterministicModifierMatches: 0,
      deterministicImplicitMatches: 0,
      candidateOnlyMatches: names.displayTextOnly + bases.textCandidateOnly + modifiers.candidateOnly + implicits.candidateOnly,
      ambiguousMatches: names.ambiguous + bases.ambiguous + modifiers.ambiguous + implicits.ambiguous,
      unresolvedMatches: names.unresolved + bases.missing + modifiers.noLocalSource + modifiers.unsupportedStructure + implicits.noLocalSource + implicits.unsupportedStructure,
      remainingTranslationMissing: {
        items: product.recordCount,
        variants: product.variantCount,
        modifierLines: product.modifierLineCount,
        implicitLines: product.implicitLineCount,
      },
      proposedLocalizationModel: {
        path: 'generated/localization/de/pob2-uniques.json',
        createdInThisTask: false,
        joinKeys: ['uniqueId', 'sourceVariantId', 'sourceLineId'],
        itemFields: ['uniqueId', 'localizedName', 'localizedBaseDisplayName', 'localizedVariants', 'localizedModifiers', 'localizedImplicits', 'localizationStatus', 'sourceReferences', 'resolutionMethod', 'confidenceClass', 'unresolvedFields'],
        duplicateEnglishProductData: false,
        fieldLevelStatusRequired: true,
        fallbackOrder: ['deterministic-german', 'english-pob2-source-if-product-policy-allows', 'translation-missing'],
      },
      proposedApprovalScope: {
        id: 'poe2-local-german-unique-localization',
        status: 'not-created-not-approved',
        prerequisite: 'a shared stable Unique identity and line-level Mod/Stat chain or another separately approved deterministic localization source',
      },
      allowedMethods: ['shared stable technical ID', 'fully reproducible derivation from approved unambiguous technical fields', 'field-level provenance', 'audit-only text candidate generation'],
      forbiddenMethods: ['name-only product join', 'text-similarity product join', 'base-display-name-only join', 'number-only join', 'AI or automatic translation', 'invented GGG IDs', 'variant merging'],
      decisionStatus,
      nextTask: '5M.2.10A: identify or approve a deterministic Unique identity bridge; if none exists, keep German Unique fields translation-missing',
    },
  }
  const serialized = Object.fromEntries(Object.entries(reports).map(([name, value]) => [name, stable(value)]))
  const semanticHash = sha256(stable(reports))
  return { reports, serialized, semanticHash, decisionStatus }
}

export async function writeAudit(outputPath, options = {}) {
  const output = resolve(outputPath)
  const result = await runAudit(options)
  await mkdir(output, { recursive: true })
  for (const [name, value] of Object.entries(result.serialized)) await writeFile(join(output, name), value)
  if (output.toLowerCase().includes(`${process.platform === 'win32' ? '\\' : '/'}.local-audits${process.platform === 'win32' ? '\\' : '/'}`)) {
    await writeFile(join(output, 'audit-manifest.json'), stable({
      audit: '5M.2.10',
      auditFormatVersion: AUDIT_FORMAT_VERSION,
      semanticHash: result.semanticHash,
      decisionStatus: result.decisionStatus,
      reportFiles: Object.keys(result.serialized).sort(),
      warnings: ['Text and template candidates are audit-only and not approved product localization links.'],
      errors: [],
    }))
  }
  return result
}

async function main(argv = process.argv.slice(2)) {
  const outputIndex = argv.indexOf('--output')
  if (outputIndex < 0 || !argv[outputIndex + 1]) throw new Error('usage: --output <directory>')
  const result = await writeAudit(argv[outputIndex + 1])
  process.stdout.write(`${JSON.stringify({ status: 'ok', semanticHash: result.semanticHash, decisionStatus: result.decisionStatus })}\n`)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main().catch(error => {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  })
}
