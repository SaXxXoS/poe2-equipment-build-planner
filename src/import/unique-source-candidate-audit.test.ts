import { describe, expect, it } from 'vitest'
import candidates from '../../docs/audits/poe2-unique-source-candidates.json'
import coverage from '../../docs/audits/poe2-unique-source-technical-coverage.json'
import parity from '../../docs/audits/poe2-unique-source-local-data-parity.json'
import legal from '../../docs/audits/poe2-unique-source-license-and-distribution.json'
import combinations from '../../docs/audits/poe2-unique-source-combination-options.json'
import decision from '../../docs/audits/poe2-unique-source-final-decision.json'

describe('5M.2.7 Unique source candidate decision', () => {
  it('documents every candidate and pins no more than three deep audits', () => {
    expect(candidates.sourceCount).toBe(candidates.sources.length)
    expect(candidates.deepCandidateCount).toBe(3)
    expect(candidates.sources.filter(source => source.deepAudit).every(source => source.commit)).toBe(true)
    expect(candidates.sources.every(source => source.status.length > 0 && source.finding)).toBe(true)
  })
  it('requires an ID-based end-to-end chain and rejects text evidence', () => {
    expect(candidates.requirements.forbiddenEvidence).toContain('display-name join')
    expect(coverage.candidates.every(candidate => !candidate.technicallySuitable)).toBe(true)
    expect(coverage.candidateMatrixStatus).toBe('no-technically-suitable-candidate')
  })
  it('compares candidates with pinned local technical data without prohibited joins', () => {
    expect(parity.localConfirmed).toMatchObject({ uniqueIdentityFragments: 449, confirmedItemIdentities: 0, distinctMods: 265, structuredStatLines: 278 })
    expect(parity.prohibitedJoinsUsed).toBe(false)
    expect(parity.candidates).toHaveLength(3)
  })
  it('separates code licenses, data origin and distribution', () => {
    expect(legal.codeAndDataLicensesSeparated).toBe(true)
    expect(legal.finalDistributionStatus).toBe('pending')
    expect(legal.candidates.every(candidate => candidate.repositoryStorage === false)).toBe(true)
  })
  it('rejects combinations without exact shared IDs and provenance', () => {
    expect(combinations.technicallyValidOptions).toBe(0)
    expect(combinations.options.every(option => option.result === 'rejected')).toBe(true)
    expect(combinations.provenanceModel).toEqual([
      'sourceIdentity', 'sourceBaseReference', 'sourceModReference', 'sourceStats',
      'sourceValues', 'sourceVariant', 'sourceLocalization',
    ])
  })
  it('keeps product, approval and later tasks unchanged', () => {
    expect(decision).toMatchObject({
      decision: 'no-technically-sufficient-candidate',
      technicallySuitableUniqueSourceFound: false,
      approvalUnchanged: true,
      productPinUnchanged: true,
      productDataChanged: false,
      uniqueDataImported: false,
      fullTextsCommitted: false,
      runtimeChanged: false,
      task5M2Started: false,
      task5NStarted: false,
    })
    expect(decision.network).toMatchObject({ productRuntime: false, hotlinks: false, scraping: false, tradeApiCalls: false, poe2dbCalls: false })
  })
})
