import { describe, expect, it } from 'vitest'
import product from '../../generated/pob2/uniques.json'
import approval from '../../data-sources/source-approval.json'
import { syntheticInput } from '../engine/fixtures'
import { uniqueAnalyzer } from '../engine/uniques/analyzer'
import { pob2UniqueAnalyzerCandidates, pob2UniquePlannerRegistry } from '../uniques/pob2-registry'
import {
  POB2_UNIQUE_ALLOWED_FIELDS,
  POB2_UNIQUE_COMMIT,
  POB2_UNIQUE_DISTRIBUTION_STATUS,
  POB2_UNIQUE_PRODUCT_OUTPUT,
  POB2_UNIQUE_PROJECT_OWNER_DECISION,
  POB2_UNIQUE_REPOSITORY,
  POB2_UNIQUE_SCOPE_ID,
  POB2_UNIQUE_SOURCE_FILE_HASHES,
  POB2_UNIQUE_SOURCE_ID,
  guardPob2UniquePlannerData,
  type Pob2UniqueProvenance,
} from './pob2-unique-approval'
import type { SourceApprovalFile } from './approval'

const provenance: Pob2UniqueProvenance = {
  sourceKind: 'pob2-planner-data',
  sourceRepository: POB2_UNIQUE_REPOSITORY,
  sourceCommit: POB2_UNIQUE_COMMIT,
  sourceRecordIdentifier: 'src/Data/Uniques/amulet.lua#1',
  sourceLicense: 'MIT-code-data-rights-project-approved-with-disclosed-uncertainty',
  importedAtBuild: true,
  technicalIdentityStatus: 'pob2-source-identity',
  gggIdentityStatus: 'unknown',
  localizationSource: 'pob2-english',
  valueSource: 'pob2-parser-defined',
  variantSource: 'pob2-variant',
  identityStatus: 'planner-only',
  localizationStatus: 'translation-missing',
}
const request = (overrides: Record<string, unknown> = {}) => ({
  mode: 'product-import' as const,
  sourceId: POB2_UNIQUE_SOURCE_ID,
  scopeId: POB2_UNIQUE_SCOPE_ID,
  repository: POB2_UNIQUE_REPOSITORY,
  commit: POB2_UNIQUE_COMMIT,
  sourceFile: 'src/Data/Uniques/amulet.lua',
  sourceFileSha256: POB2_UNIQUE_SOURCE_FILE_HASHES['src/Data/Uniques/amulet.lua'],
  requestedFields: [...POB2_UNIQUE_ALLOWED_FIELDS],
  outputPath: POB2_UNIQUE_PRODUCT_OUTPUT,
  namespace: 'pob2:src/Data/Uniques/amulet.lua#1',
  provenance,
  sha256Manifest: true,
  deterministicNormalization: true,
  runtimeNetwork: false,
  hotlinks: false,
  scraping: false,
  media: false,
  rawMirror: false,
  dataCategories: ['unique-planner-items'],
  projectOwnerDistributionDecision: POB2_UNIQUE_PROJECT_OWNER_DECISION,
  attributionIncluded: true,
  licenseNoticeIncluded: true,
  sourceLabelIncluded: true,
  ...overrides,
})

describe('PoB2 Unique product import', () => {
  const typedApproval = approval as SourceApprovalFile
  it('uses the exact approved source scope', () => {
    expect(Object.keys(POB2_UNIQUE_SOURCE_FILE_HASHES)).toHaveLength(20)
    expect(product.sourceCommit).toBe(POB2_UNIQUE_COMMIT)
    expect(product.importContractVersion).toBe('2')
    expect(product.recordCount).toBe(435)
  })
  it('is approved only under the versioned project decision', () => {
    expect(POB2_UNIQUE_DISTRIBUTION_STATUS).toBe('distribution-project-approved-with-disclosed-uncertainty')
    expect(guardPob2UniquePlannerData(typedApproval, request()).allowed).toBe(true)
    expect(guardPob2UniquePlannerData(typedApproval, request({ projectOwnerDistributionDecision: undefined })).allowed).toBe(false)
  })
  it.each([
    ['wrong commit', { commit: 'wrong' }],
    ['wrong hash', { sourceFileSha256: '0'.repeat(64) }],
    ['unknown file', { sourceFile: 'src/Data/Uniques/unknown.lua' }],
    ['unknown field', { requestedFields: [...POB2_UNIQUE_ALLOWED_FIELDS, 'unknownField'] }],
    ['media', { media: true }],
    ['raw mirror', { rawMirror: true }],
    ['runtime network', { runtimeNetwork: true }],
    ['GGG stat claim', { requestedFields: ['gggStatId'] }],
  ])('fails closed for %s', (_label, overrides) => {
    expect(guardPob2UniquePlannerData(typedApproval, request(overrides)).allowed).toBe(false)
  })
  it('keeps planner and fixture namespaces separate with complete provenance', () => {
    expect(pob2UniquePlannerRegistry).toHaveLength(435)
    expect(pob2UniqueAnalyzerCandidates.every(item => item.id.startsWith('pob2:'))).toBe(true)
    expect(pob2UniqueAnalyzerCandidates.some(item => item.id.startsWith('fixture:'))).toBe(false)
    expect(product.items.every(item => item.provenance.gggIdentityStatus === 'unknown')).toBe(true)
    expect(product.items.every(item => item.provenance.germanLocalizationStatus === 'translation-missing')).toBe(true)
  })
  it('feeds real PoB2 candidates to the existing analyzer without GGG stat assumptions', () => {
    const candidate = pob2UniqueAnalyzerCandidates.find(item => item.itemSlot === 'weapon')!
    const result = uniqueAnalyzer.analyzeRanked(
      { damageTypes: { physical: 0, fire: 0, cold: 0, lightning: 0, chaos: 0 }, mechanics: { attack: 0, spell: 0, projectile: 0, melee: 0, area: 0, critical: 0, 'damage-over-time': 0, minion: 0, movement: 0, buff: 0, debuff: 0 }, speed: { attackSpeedAffinity: 0, castSpeedAffinity: 0, movementAffinity: 0 }, defence: { lifeAffinity: 0, armourAffinity: 0, evasionAffinity: 0, energyShieldAffinity: 0, resistanceNeed: 0, generalDefenceNeed: 0 }, requirements: { strengthNeed: 0, dexterityNeed: 0, intelligenceNeed: 0, resourceNeed: 0 }, goals: { mappingWeight: 0, bossWeight: 0, defenceWeight: 0, damageWeight: 0 } },
      syntheticInput([]),
      [candidate],
      { engineVersion: 'test', fixtureMode: true },
    )
    expect(result.allCandidates[0].uniqueId).toBe(candidate.id)
    expect(candidate.modifiers).toEqual([])
  })
})
