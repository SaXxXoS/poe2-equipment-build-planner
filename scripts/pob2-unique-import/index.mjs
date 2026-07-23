/* global process, URL */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  allowedFields, commit, contractVersion, fileMetadata, parserFormatVersion,
  productPath, repository, scopeId,
} from './constants.mjs'
import { parseSourceFile, sha256 } from './source-parser.mjs'

const stableJson = value => `${JSON.stringify(value, null, 2)}\n`
const sumObjects = values => values.reduce((result, value) => {
  for (const [key, count] of Object.entries(value)) result[key] = (result[key] ?? 0) + count
  return result
}, {})

export async function importPob2Uniques({ repoRoot, sourceRoot, outputPath }) {
  const contract = JSON.parse(await readFile(path.join(repoRoot, 'docs/audits/poe2-pob2-unique-import-contract.json'), 'utf8'))
  const approval = JSON.parse(await readFile(path.join(repoRoot, 'data-sources/source-approval.json'), 'utf8'))
  if (contract.contractVersion !== contractVersion || contract.pin.repository !== repository || contract.pin.commit !== commit) throw new Error('contract-pin')
  if (contract.output.planned !== productPath || JSON.stringify(contract.allowedFields) !== JSON.stringify(allowedFields)) throw new Error('contract-scope')
  if (contract.projectOwnerDecision !== 'approved-with-disclosed-uncertainty') throw new Error('project-owner-decision')
  const scope = approval.categoryAssignments.find(value => value.categoryId === scopeId)
  if (!scope || scope.constraints?.distributionStatus !== 'distribution-project-approved-with-disclosed-uncertainty'
    || !['5M.2.9-may-begin-under-existing-guards', '5M.2.9-imported-under-existing-guards'].includes(scope.constraints?.importStatus)) throw new Error('approval-scope')
  const head = (await readFile(path.join(sourceRoot, '.git/HEAD'), 'utf8')).trim()
  if (head !== commit) throw new Error(`source-commit:${head}`)
  const expectedFiles = Object.keys(fileMetadata)
  if (expectedFiles.length !== 20 || JSON.stringify(contract.input.files) !== JSON.stringify(expectedFiles)) throw new Error('source-file-scope')
  const sourceResults = []
  for (const file of expectedFiles) {
    const result = await parseSourceFile(sourceRoot, file)
    if (result.sha256 !== contract.input.fileHashes[file]) throw new Error(`source-hash:${file}`)
    sourceResults.push(result)
  }
  const items = sourceResults.flatMap(value => value.parsed.map(record => record.item)).sort((a, b) => a.sourceId.localeCompare(b.sourceId))
  if (new Set(items.map(value => value.sourceId)).size !== items.length) throw new Error('identity-collision')
  const omitted = sumObjects(sourceResults.flatMap(value => value.parsed.map(record => record.omitted)))
  const sourceFiles = sourceResults.map(({ file, sha256, recordCount }) => ({ path: file, sha256, recordCount }))
  const sourceFilesManifestHash = sha256(stableJson(sourceFiles))
  const counts = {
    sourceRecordCount: sourceResults.reduce((sum, value) => sum + value.recordCount, 0),
    recordCount: items.length,
    variantCount: items.reduce((sum, value) => sum + value.variants.length, 0),
    currentVariantCount: items.reduce((sum, value) => sum + value.variants.filter(item => item.currentOrLegacy === 'current').length, 0),
    legacyVariantCount: items.reduce((sum, value) => sum + value.variants.filter(item => item.currentOrLegacy === 'legacy').length, 0),
    modifierLineCount: items.reduce((sum, value) => sum + value.visibleModifiers.length, 0),
    implicitLineCount: items.reduce((sum, value) => sum + value.implicits.length, 0),
    rollRangeCount: items.reduce((sum, value) => sum + value.rollRanges.length, 0),
    linesWithoutStructuredValues: items.reduce((sum, value) => sum + [...value.visibleModifiers, ...value.implicits].filter(line => !line.rollRanges.length).length, 0),
    grantedSkillReferenceCount: omitted['Grants Skill'] ?? 0,
    grantedSupportReferenceCount: 0,
    blockedRecordCount: 0,
    rejectedRecordCount: 0,
    unknownFieldCount: 0,
    translationMissingCount: items.length,
  }
  const semantic = { items, counts, sourceFilesManifestHash }
  const generatedDataHash = sha256(stableJson(semantic))
  const product = {
    schemaVersion: '1.0.0',
    importContractVersion: contractVersion,
    parserFormatVersion,
    sourceScope: scopeId,
    sourceRepository: repository,
    sourceCommit: commit,
    sourceFilesManifestHash,
    generatedDataHash,
    ...counts,
    items,
    provenanceSummary: {
      sourceKind: 'pob2-planner-data',
      externalPermission: 'not-requested-not-obtained',
      uncertainty: 'unresolved-external-rights-disclosed-and-accepted-by-project-owner',
    },
    localizationSummary: { englishSource: items.length, translationMissing: items.length, germanImported: 0 },
    limitations: [
      'No technical GGG Unique, base-item, mod, or stat identity is asserted.',
      'No German Unique text, media, flavour text, raw mirror, or runtime network source is included.',
      'Granted-skill references remain pending and are not included in product records.',
    ],
  }
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, stableJson(product), 'utf8')
  return { product, sourceFiles, counts, omitted, productFileSha256: sha256(stableJson(product)) }
}

async function cli() {
  const options = Object.fromEntries(process.argv.slice(2).map(value => value.split('=', 2)))
  const repoRoot = path.resolve(options['--repo'] ?? '.')
  const sourceRoot = path.resolve(options['--source'] ?? '')
  const outputPath = path.resolve(options['--output'] ?? path.join(repoRoot, productPath))
  const reportPath = options['--report'] ? path.resolve(options['--report']) : null
  const result = await importPob2Uniques({ repoRoot, sourceRoot, outputPath })
  if (reportPath) {
    await mkdir(path.dirname(reportPath), { recursive: true })
    await writeFile(reportPath, stableJson({ sourceFiles: result.sourceFiles, counts: result.counts, omitted: result.omitted, productFileSha256: result.productFileSha256 }), 'utf8')
  }
  process.stdout.write(stableJson({ outputPath, ...result.counts, generatedDataHash: result.product.generatedDataHash, productFileSha256: result.productFileSha256 }))
}

if (process.argv[1] && import.meta.url === new URL(`file:///${process.argv[1].replace(/\\/g, '/')}`).href) cli().catch(error => {
  process.stderr.write(`${error.stack ?? error}\n`)
  process.exitCode = 1
})
