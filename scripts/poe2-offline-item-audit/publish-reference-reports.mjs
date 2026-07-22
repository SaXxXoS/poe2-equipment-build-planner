import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { stable } from './index.mjs'

const localSummaryPath = resolve('.local-audits/poe2-offline-reference-extraction/run-01/audit/sanitized-reference-summary.json')
const localRun1Path = resolve('.local-audits/poe2-offline-reference-extraction/run-01/audit/reference-run-manifest.json')
const localRun2Path = resolve('.local-audits/poe2-offline-reference-extraction/run-02/audit/reference-run-manifest.json')
const summary = JSON.parse(await readFile(localSummaryPath, 'utf8'))
const run1 = JSON.parse(await readFile(localRun1Path, 'utf8'))
const run2 = JSON.parse(await readFile(localRun2Path, 'utf8'))
const shared = { schemaVersion: 1, audit: '5M.2.4', status: 'audit-only', pins: summary.pins }

const reports = {
  'docs/audits/poe2-offline-reference-table-inventory.json': {
    ...shared, extraction: summary.extraction, tables: summary.selectedTables,
    proposedTableAvailability: summary.proposedTableAvailability,
    itemClassSchemaByte: summary.itemClassSchemaByte,
  },
  'docs/audits/poe2-offline-reference-resolution-coverage.json': {
    ...shared, references: summary.references, productCoverage: summary.productCoverage,
    charmId: summary.charmId, productDataChanged: false, productPinChanged: false, approvalChanged: false,
  },
  'docs/audits/poe2-offline-reference-unique-coverage.json': { ...shared, ...summary.uniqueCoverage },
  'docs/audits/poe2-offline-reference-socketable-coverage.json': { ...shared, ...summary.socketableCoverage },
  'docs/audits/poe2-offline-reference-localization-coverage.json': {
    ...shared, ...summary.localization,
    categoryReadiness: {
      regularPrefixes: 'partially-suitable', regularSuffixes: 'partially-suitable', baseImplicits: 'partially-suitable',
      corruptionMods: 'only-with-context-logic', jewels: 'partially-suitable', charms: 'partially-suitable', flasks: 'partially-suitable',
      uniques: 'unknown', runes: 'unknown', soulCores: 'only-with-additional-context', otherSocketables: 'unknown',
    },
    textsVersioned: false, ocrImplemented: false,
  },
  'docs/audits/poe2-offline-reference-determinism.json': {
    ...shared, status: run1.normalizedSha256 === run2.normalizedSha256 && run1.sanitizedSha256 === run2.sanitizedSha256 ? 'byteidentical' : 'not-deterministic',
    extractionManifestRun1: summary.extraction.manifestSha256,
    extractionManifestRun2: summary.extraction.manifestSha256,
    normalizedSha256Run1: run1.normalizedSha256, normalizedSha256Run2: run2.normalizedSha256,
    sanitizedSha256Run1: run1.sanitizedSha256, sanitizedSha256Run2: run2.sanitizedSha256,
    warningsIdentical: stable(run1.warnings) === stable(run2.warnings), errorsIdentical: stable(run1.errors) === stable(run2.errors),
    timestampsInSemanticHash: false,
  },
}

for (const [path, report] of Object.entries(reports)) await writeFile(resolve(path), stable(report))
