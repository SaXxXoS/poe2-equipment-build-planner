import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { assertReferenceConfig, REFERENCE_FORMAT_VERSION, REFERENCE_TABLES } from '../../scripts/poe2-offline-item-audit/reference-tables.mjs'
import inventory from '../../docs/audits/poe2-offline-reference-table-inventory.json'
import coverage from '../../docs/audits/poe2-offline-reference-resolution-coverage.json'
import uniques from '../../docs/audits/poe2-offline-reference-unique-coverage.json'
import socketables from '../../docs/audits/poe2-offline-reference-socketable-coverage.json'
import localization from '../../docs/audits/poe2-offline-reference-localization-coverage.json'
import determinism from '../../docs/audits/poe2-offline-reference-determinism.json'
import approval from '../../data-sources/source-approval.json'

const pins = inventory.pins
const config = () => ({ pins, schemaPath: 'schema', fileInventoryPath: 'inventory', referencePath: 'reference', previousBalancePath: 'balance', outputPath: resolve('.local-audits/reference-test') })

describe('5M.2.4 offline reference-table extraction audit', () => {
  it('blocks wrong or missing pins and forbidden outputs', () => {
    expect(() => assertReferenceConfig({ ...config(), pins: { ...pins, contentSha256: 'wrong' } })).toThrow('pin-mismatch:contentSha256')
    expect(() => assertReferenceConfig({ ...config(), pins: { ...pins, schemaSha256: '' } })).toThrow('unpinned-reference-source:schemaSha256')
    expect(() => assertReferenceConfig({ ...config(), outputPath: resolve('generated/reference') })).toThrow('output-must-be-local-audits')
    expect(() => assertReferenceConfig({ ...config(), outputPath: resolve('public/reference') })).toThrow('output-must-be-local-audits')
  })

  it('uses one modular pipeline and exactly the selected schema-backed table set', () => {
    expect(REFERENCE_FORMAT_VERSION).toBe(2)
    expect(REFERENCE_TABLES).toHaveLength(16)
    expect(inventory.tables).toHaveLength(22)
    expect(inventory.extraction).toMatchObject({ files: 22, networkAttempts: 0 })
    expect(inventory.tables.every(table => table.fieldDefinitions.length === table.fields)).toBe(true)
  })

  it('keeps unknown bytes unknown and never decodes ItemClasses by position', () => {
    expect(inventory.itemClassSchemaByte).toMatchObject({ byteCountPerRow: 1, safeToIgnore: false, losslessDecoding: false, referenceTarget: 'unknown' })
    expect(inventory.tables.filter(table => table.table.includes('itemclasses')).every(table => table.status === 'schema-unknown')).toBe(true)
    expect(coverage.charmId.classification).toBe('weiterhin unbekannt')
  })

  it('classifies every required product universe without claiming reference resolution', () => {
    expect(coverage.productCoverage.mods).toMatchObject({ total: 2255, resolved: 0, partiallyResolved: 2255, unresolved: 0 })
    expect(coverage.productCoverage.baseTypes.total).toBe(39)
    expect(coverage.productCoverage.itemClasses).toMatchObject({ total: 33, unresolved: 33 })
    expect(coverage.productCoverage.missingGermanStatIds).toMatchObject({ total: 12, unresolved: 12 })
    expect(coverage.productCoverage.templateGaps).toMatchObject({ total: 38, unresolved: 38 })
    expect(coverage.productCoverage.ocrAmbiguities).toMatchObject({ total: 2189, resolvedByReferenceTables: 0 })
  })

  it('does not invent absent ModDomain, generation, group or spawn-weight tables', () => {
    const absent = new Map(inventory.proposedTableAvailability.map(entry => [entry.table, entry.status]))
    for (const table of ['moddomains', 'modgenerationtypes', 'modgroups', 'spawnweights']) expect(absent.get(table)).toBe('not-present-under-proposed-name')
    expect(coverage.productCoverage.mods).toMatchObject({ domainResolved: 0, generationTypeResolved: 0, groupResolved: 0 })
  })

  it('keeps Unique reference chains unresolved instead of matching visible names', () => {
    expect(uniques).toMatchObject({ identities: 'unknown', baseTypeAssignments: 'unknown', modReferences: 'unknown', variants: 'unknown', approvalGranted: false })
    expect(uniques.extractedRelatedTables).toMatchObject({ uniqueStashLayout: 449, uniquechests: 48, mutatedUniqueModsClient: 1 })
  })

  it('reports Soul Core structure without inventing bonded or complete chains', () => {
    expect(socketables.identities).toMatchObject({ soulCores: 295, runes: 'unknown', idols: 'unknown', abyssalEyes: 'unknown', congealedMist: 'unknown' })
    expect(socketables).toMatchObject({ soulCoreStatRows: 507, targetCategories: 30, fullChains: 0, partialChains: 295, bondedStatsValues: 'not-present-under-proposed-name', approvalGranted: false })
  })

  it('keeps localization and OCR audit-only', () => {
    expect(localization).toMatchObject({ missingGermanStatIds: 12, remainingTemplateGaps: 38, ocrAmbiguities: 2189, newlyResolvedOcrAmbiguities: 0, textsVersioned: false, ocrImplemented: false })
  })

  it('proves two byte-identical extraction and audit runs', () => {
    expect(determinism.status).toBe('byteidentical')
    expect(determinism.normalizedSha256Run1).toBe(determinism.normalizedSha256Run2)
    expect(determinism.sanitizedSha256Run1).toBe(determinism.sanitizedSha256Run2)
    expect(determinism.warningsIdentical).toBe(true)
  })

  it('contains no runtime networking and preserves approval/product state', () => {
    const source = readFileSync(resolve('scripts/poe2-offline-item-audit/reference-tables.mjs'), 'utf8')
    expect(source).not.toMatch(/from ['"]node:(?:http|https|dns|net)['"]|\bfetch\s*\(/)
    const german = approval.categoryAssignments.filter(entry => entry.categoryId.startsWith('poe2-german-'))
    expect(german.every(entry => entry.status === 'pending' && entry.repositoryStorage === false)).toBe(true)
    expect(coverage).toMatchObject({ productDataChanged: false, productPinChanged: false, approvalChanged: false })
  })

  it('keeps local raw data ignored and reports free of local user paths', () => {
    expect(readFileSync(resolve('.gitignore'), 'utf8')).toContain('.local-audits/')
    expect(JSON.stringify({ inventory, coverage, uniques, socketables, localization, determinism })).not.toMatch(/C:\\\\Users|Program Files/)
  })
})
