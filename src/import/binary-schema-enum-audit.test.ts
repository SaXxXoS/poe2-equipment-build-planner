import { describe, expect, it } from 'vitest'
import itemClasses from '../../docs/audits/poe2-itemclasses-binary-schema.json'
import soulCores from '../../docs/audits/poe2-soulcores-binary-schema.json'
import domains from '../../docs/audits/poe2-mod-domain-enum-audit.json'
import generations from '../../docs/audits/poe2-mod-generation-type-enum-audit.json'
import groups from '../../docs/audits/poe2-mod-group-audit.json'
import coverage from '../../docs/audits/poe2-binary-schema-product-coverage.json'
import determinism from '../../docs/audits/poe2-binary-schema-determinism.json'

describe('5M.2.5 binary schema and enum audit', () => {
  it('retains ambiguous bytes instead of silently guessing an offset', () => {
    expect(itemClasses.english).toMatchObject({ rows: 117, rowBytes: 150, schemaBytes: 149, exactOffset: null, exactOffsetStatus: 'unknown' })
    expect(itemClasses.german.rows).toBe(117)
    expect(itemClasses.languageParity).toBe(true)
    expect(itemClasses.hypotheses.find(value => value.type === 'padding')?.evidence).toBe('contradicted')
  })

  it('tracks every Soul Core structure and parallel value array', () => {
    expect(soulCores).toMatchObject({ rows: 295, types: 5, statRows: 507, categories: 30, limits: 4 })
    expect(soulCores.statsValues).toMatchObject({ evidence: 'confirmed', lengthMismatchRows: 0 })
    expect(soulCores.bondedStats).toMatchObject({ evidence: 'confirmed', lengthMismatchRows: 0 })
    expect(soulCores.layout.exactOffset).toBeNull()
  })

  it('uses pinned schema, enum generator and consumer code as independent enum evidence', () => {
    expect(domains.sources).toHaveLength(3)
    expect(generations.sources).toHaveLength(3)
    expect(domains.coverage.counts).toMatchObject({ total: 2255, rawPresent: 2255, confirmed: 2255, unknown: 0, conflict: 0 })
    expect(generations.coverage.counts).toMatchObject({ total: 2255, rawPresent: 2255, confirmed: 2255, unknown: 0, conflict: 0 })
    expect(domains.unknownValues).toEqual([])
    expect(generations.unknownValues).toEqual([])
  })

  it('does not promote family/type identity into unproved conflict semantics', () => {
    expect(groups.modFamily.technicalIdentity).toBe('confirmed')
    expect(groups.modType.technicalIdentity).toBe('confirmed')
    expect(groups.conflictGroups.evidence).toBe('unknown')
    expect(coverage.coverage.productMods).toMatchObject({ total: 2255, resolved: 0, partiallyResolved: 2255 })
  })

  it('keeps product, approval, network and later tasks untouched', () => {
    expect(coverage).toMatchObject({
      productDataChanged: false, productPinChanged: false, approvalChanged: false,
      network: { http: false, https: false, dns: false, api: false, tradeApi: false, poe2db: false, websites: false },
    })
    expect(coverage.coverage).toMatchObject({
      productItemClasses: { total: 33 },
      soulCoreRows: { total: 295 },
      localization: { germanStatIds: { total: 431, missing: 12 }, templateGaps: { total: 485, remaining: 38 }, ocrAmbiguities: { total: 2189, resolvedByThisAudit: 0 } },
    })
  })

  it('is byte-identical across two complete audit runs', () => {
    expect(determinism).toMatchObject({ runs: 2, status: 'byteidentical', samePins: true, sameByteDistributions: true, sameEnums: true, sameCoverage: true })
    expect(determinism.run1Sha256).toBe(determinism.run2Sha256)
  })
})
