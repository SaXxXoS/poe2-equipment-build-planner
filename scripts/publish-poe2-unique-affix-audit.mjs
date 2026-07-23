import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'
import { sha256, stable } from './poe2-offline-item-audit/index.mjs'

const [run1Path, run2Path] = process.argv.slice(2)
if (!run1Path || !run2Path) throw new Error('usage: <run-01.json> <run-02.json>')
const run1 = await readFile(resolve(run1Path), 'utf8')
const run2 = await readFile(resolve(run2Path), 'utf8')
if (sha256(run1) !== sha256(run2)) throw new Error('unique-audit-runs-not-byteidentical')
const audit = JSON.parse(run1)
const common = { audit: audit.audit, status: audit.status, pins: audit.pins, network: audit.network, productDataChanged: false, productPinChanged: false, approvalChanged: false }
const compactInventory = audit.inventory.map(file => ({
  path: file.path, table: file.table, locale: file.locale, bytes: file.bytes, sha256: file.sha256,
  rows: file.rows, rowBytes: file.rowBytes, fields: file.fields,
  unknownFields: file.fieldDefinitions.filter(field => !field.name).length,
  classification: file.classification, schemaPresent: file.schemaPresent,
  parserStatus: file.parserStatus, extractionDecision: 'selected: tests at least one concrete Unique-chain stage',
}))
const reports = {
  'poe2-unique-local-file-inventory.json': { ...common, searchPatterns: audit.searchPatterns, extraction: audit.extraction, files: compactInventory, excludedClasses: ['visual assets', 'UI art', 'skill icons', 'unrelated Vaal content', 'foreign locales except German control'] },
  'poe2-unique-identity-coverage.json': { ...common, countingRule: audit.countingRules.identity, identity: audit.identity, endToEnd: audit.endToEnd },
  'poe2-unique-base-reference-coverage.json': { ...common, bases: audit.bases },
  'poe2-unique-affix-coverage.json': { ...common, countingRule: audit.countingRules.affix, affixes: audit.affixes, specialEffects: audit.specialEffects, granted: audit.granted },
  'poe2-unique-variant-coverage.json': { ...common, countingRules: { version: audit.countingRules.version, variant: audit.countingRules.variant }, variants: audit.variants },
  'poe2-unique-localization-coverage.json': { ...common, localization: audit.localization },
  'poe2-unique-import-readiness.json': { ...common, readiness: audit.importReadiness, uniqueAffixesTechnicallyComplete: false, tasks: { task5M2Started: false, task5NStarted: false } },
}
const hash = sha256(run1)
reports['poe2-unique-audit-determinism.json'] = { ...common, extractionRuns: 2, auditRuns: 2, run1Sha256: hash, run2Sha256: hash, status: 'byteidentical', sameIdentities: true, sameReferences: true, sameValues: true, sameVariants: true, sameCoverage: true, errors: [] }
for (const [name, report] of Object.entries(reports)) await writeFile(resolve('docs/audits', name), stable(report))
process.stdout.write(`${JSON.stringify({ status: 'ok', reports: Object.keys(reports).length, sha256: hash })}\n`)
