import { expect, it } from 'vitest'
import { validSyntheticFixture } from './fixtures/valid-fixture'
import { importCanonicalData } from './pipeline'

it('führt den lokalen künstlichen Fixture-Import aus', () => {
  const result = importCanonicalData(validSyntheticFixture)
  console.log(JSON.stringify({ fixture: 'synthetic-fixture', ok: result.ok, status: result.report.status, schemaVersion: result.report.schemaVersion, sourceVersion: result.report.sourceVersion, importedRecords: result.report.importedRecords, rejectedRecords: result.report.rejectedRecords, counts: result.report.counts, datasetHash: result.report.hashes.dataset, warnings: result.report.warnings, errors: result.report.errors }, null, 2))
  expect(result.ok, result.report.errors.map(error => error.message).join('\n')).toBe(true)
})
