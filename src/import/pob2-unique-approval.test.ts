import { describe, expect, it } from 'vitest'
import approvalJson from '../../data-sources/source-approval.json'
import type { SourceApprovalFile } from './approval'
import {
  evaluatePob2UniqueDistribution, guardPob2UniquePlannerData, POB2_UNIQUE_COMMIT, POB2_UNIQUE_REPOSITORY,
  POB2_UNIQUE_SCOPE_ID, POB2_UNIQUE_SOURCE_ID, type Pob2UniqueGuardRequest,
} from './pob2-unique-approval'

const approval = approvalJson as SourceApprovalFile
const request = (): Pob2UniqueGuardRequest => ({
  mode: 'audit',
  sourceId: POB2_UNIQUE_SOURCE_ID,
  scopeId: POB2_UNIQUE_SCOPE_ID,
  repository: POB2_UNIQUE_REPOSITORY,
  commit: POB2_UNIQUE_COMMIT,
  sourceFile: 'src/Data/Uniques/amulet.lua',
  requestedFields: ['sourceId', 'name', 'slot', 'variants', 'visibleModifiers', 'provenance'],
  namespace: 'pob2:src/Data/Uniques/amulet.lua#1',
  provenance: {
    sourceKind: 'pob2-planner-data', sourceRepository: POB2_UNIQUE_REPOSITORY,
    sourceCommit: POB2_UNIQUE_COMMIT, sourceRecordIdentifier: 'src/Data/Uniques/amulet.lua#1',
    sourceLicense: 'MIT-code-data-rights-pending', technicalIdentityStatus: 'pob2-source-identity',
    gggIdentityStatus: 'unknown', identityStatus: 'planner-only', localizationStatus: 'english-only',
    importedAtBuild: false, localizationSource: 'pob2-english',
    valueSource: 'pob2-structured', variantSource: 'pob2-variant',
  },
  sha256Manifest: true, deterministicNormalization: true, runtimeNetwork: false,
  hotlinks: false, scraping: false, media: false, rawMirror: false,
  dataCategories: ['unique-planner-items'],
})

describe('PoB2-Unique-Approval- und Trennungsguard', () => {
  it('erlaubt nur den gepinnten Auditvertrag', () => expect(guardPob2UniquePlannerData(approval, request())).toEqual({ allowed: true, code: 'audit-allowed', issues: [] }))
  it('blockiert den Produktimport solange Distribution pending ist', () => expect(guardPob2UniquePlannerData(approval, { ...request(), mode: 'product-import' })).toMatchObject({ allowed: false, code: 'product-import-blocked' }))
  it('blockiert den belegten Status pending-both mit beiden externen Lücken', () => {
    expect(evaluatePob2UniqueDistribution('distribution-pending-both', {
      maintainerConfirmed: false, gggConfirmed: false, attributionIncluded: true, licenseNoticeIncluded: true,
    })).toEqual({ allowed: false, issues: ['maintainer-confirmation-missing', 'ggg-confirmation-missing'] })
  })
  it('validiert eine spätere bedingte Freigabe vollständig', () => {
    expect(evaluatePob2UniqueDistribution('distribution-conditionally-approved', {
      maintainerConfirmed: true, gggConfirmed: true, attributionIncluded: true, licenseNoticeIncluded: true,
    })).toEqual({ allowed: true, issues: [] })
    expect(evaluatePob2UniqueDistribution('distribution-conditionally-approved', {
      maintainerConfirmed: true, gggConfirmed: true, attributionIncluded: false, licenseNoticeIncluded: true,
    }).allowed).toBe(false)
  })
  it('hebt bei approved keine übrigen Scopeguards auf', () => {
    expect(evaluatePob2UniqueDistribution('distribution-approved', {
      maintainerConfirmed: true, gggConfirmed: true, attributionIncluded: true, licenseNoticeIncluded: true,
    }).allowed).toBe(true)
    expect(guardPob2UniquePlannerData(approval, { ...request(), mode: 'product-import', requestedFields: ['gggStatId'] }).allowed).toBe(false)
  })
  it.each([
    ['latest', { commit: 'latest' }],
    ['normales Affix', { dataCategories: ['normal-affixes'] }],
    ['GGG-Mod-ID', { requestedFields: ['gggModId'] }],
    ['GGG-Stat-ID', { requestedFields: ['gggStatId'] }],
    ['Bild', { media: true }],
    ['Hotlink', { hotlinks: true }],
    ['Runtime-Netz', { runtimeNetwork: true }],
    ['Scraping', { scraping: true }],
    ['Flavour Text', { requestedFields: ['flavourText'] }],
    ['unbekanntes Feld', { requestedFields: ['mysteryField'] }],
    ['vollständiger Mirror', { rawMirror: true }],
    ['generated-Ausgabe', { outputPath: 'generated/pob2/uniques.json' }],
    ['public-Ausgabe', { outputPath: 'public/pob2/uniques.json' }],
  ])('blockiert %s', (_label, override) => expect(guardPob2UniquePlannerData(approval, { ...request(), ...override } as Pob2UniqueGuardRequest).allowed).toBe(false))
  it('blockiert fehlende Provenienz', () => expect(guardPob2UniquePlannerData(approval, { ...request(), provenance: {} })).toMatchObject({ allowed: false, code: 'guard-denied' }))
  it('trennt Fixture- und PoB2-Namespace', () => expect(guardPob2UniquePlannerData(approval, { ...request(), namespace: 'fixture:test' }).allowed).toBe(false))
  it('blockiert Skill- und Support-Vollimporte', () => {
    expect(guardPob2UniquePlannerData(approval, { ...request(), dataCategories: ['skills'] }).allowed).toBe(false)
    expect(guardPob2UniquePlannerData(approval, { ...request(), dataCategories: ['supports'] }).allowed).toBe(false)
  })
})
