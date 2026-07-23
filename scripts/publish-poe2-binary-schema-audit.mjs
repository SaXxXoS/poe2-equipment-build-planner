import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'
import { sha256, stable } from './poe2-offline-item-audit/index.mjs'

const [run1Path, run2Path] = process.argv.slice(2)
if (!run1Path || !run2Path) throw new Error('usage: <run-01.json> <run-02.json>')
const run1Text = await readFile(resolve(run1Path), 'utf8')
const run2Text = await readFile(resolve(run2Path), 'utf8')
if (sha256(run1Text) !== sha256(run2Text)) throw new Error('audit-runs-not-byteidentical')
const audit = JSON.parse(run1Text)
const compactLayout = layout => ({
  rows: layout.rows, rowBytes: layout.rowBytes, schemaBytes: layout.schemaBytes,
  unknownLength: layout.unknownLength,
  candidateOffsetCount: layout.unknownOffsetCandidates.length,
  candidateOffsetMinimum: Math.min(...layout.unknownOffsetCandidates.map(value => value.offset)),
  candidateOffsetMaximum: Math.max(...layout.unknownOffsetCandidates.map(value => value.offset)),
  exactOffset: layout.unknownOffsetCandidates.length === 1 ? layout.unknownOffsetCandidates[0].offset : null,
  exactOffsetStatus: layout.unknownOffsetCandidates.length === 1 ? 'confirmed' : 'unknown',
  observedBinaryCandidates: layout.unknownOffsetCandidates.filter(value => Object.keys(value.distribution).every(key => key === '0' || key === '1')).slice(0, 8),
})
const common = { audit: audit.audit, status: audit.status, pins: audit.pins, network: audit.network, productDataChanged: false, productPinChanged: false, approvalChanged: false }
const reports = {
  'poe2-itemclasses-binary-schema.json': { ...common, english: compactLayout(audit.itemClasses.english), german: compactLayout(audit.itemClasses.german), languageParity: audit.itemClasses.languageParity, hypotheses: audit.itemClasses.hypotheses, classification: audit.itemClasses.classification, evidence: audit.itemClasses.evidence, idsDecodedInExperiment: audit.itemClasses.idsDecoded, idParity: audit.itemClasses.idParity, charm: audit.charm },
  'poe2-soulcores-binary-schema.json': { ...common, layout: compactLayout(audit.soulCore.layout), hypotheses: audit.soulCore.hypotheses, rows: audit.soulCore.rows, types: audit.soulCore.types, statRows: audit.soulCore.statRows, categories: audit.soulCore.categories, limits: audit.soulCore.limits, statsValues: audit.soulCore.statsValues, bondedStats: audit.soulCore.bondedStats, targetCategories: audit.soulCore.targetCategories, sourceCodeUse: audit.soulCore.sourceCodeUse },
  'poe2-mod-domain-enum-audit.json': { ...common, ...audit.domainAudit },
  'poe2-mod-generation-type-enum-audit.json': { ...common, ...audit.generationAudit },
  'poe2-mod-group-audit.json': { ...common, ...audit.groups },
  'poe2-binary-schema-product-coverage.json': { ...common, coverage: audit.coverage, charm: audit.charm },
}
const runHash = sha256(run1Text)
reports['poe2-binary-schema-determinism.json'] = { ...common, runs: 2, run1Sha256: runHash, run2Sha256: runHash, status: 'byteidentical', samePins: true, sameByteDistributions: true, sameEnums: true, sameEvidenceLevels: true, sameCoverage: true, warnings: ['Exact unknown-byte offsets remain unproven; ambiguity is deterministic.'], errors: [] }
for (const [name, value] of Object.entries(reports)) await writeFile(resolve('docs/audits', name), stable(value))
process.stdout.write(`${JSON.stringify({ status: 'ok', reports: Object.keys(reports).length, sha256: runHash })}\n`)
