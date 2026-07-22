import { describe, expect, it } from 'vitest'
import candidates from '../../docs/audits/poe2-german-parser-candidates.json'
import coverage from '../../docs/audits/poe2-german-parser-candidate-coverage.json'
import comparison from '../../docs/audits/poe2-german-parser-candidate-comparison.json'
import approval from '../../data-sources/source-approval.json'

describe('5M.2.2 German parser candidate audit', () => {
  it('pins at most three deep candidates and every dependency exactly', () => {
    expect(candidates.deepCandidates.length).toBeLessThanOrEqual(candidates.deepCandidateLimit)
    expect(candidates.deepCandidates).toHaveLength(3)
    for (const candidate of candidates.deepCandidates) {
      expect(candidate.commit).toMatch(/^[0-9a-f]{40}$/)
      expect(candidate.decision).toBeTruthy()
      for (const dependency of candidate.dependencies) {
        expect('commit' in dependency || 'version' in dependency).toBe(true)
      }
    }
  })

  it('does not turn parser failures into zero coverage', () => {
    const totals = coverage.productUniverse
    for (const candidate of coverage.candidates) {
      for (const key of ['mods', 'statLines', 'statIds', 'statIdCombinations', 'multilineAndHybridMods', 'baseTypes', 'itemClasses', 'technicalTemplateGaps'] as const) {
        const result = candidate[key]
        expect(result.total).toBe(totals[key])
        const classified = Number('complete' in result ? result.complete ?? 0 : 0)
          + Number('partial' in result ? result.partial ?? 0 : 0)
          + ('missing' in result && typeof result.missing === 'number' ? result.missing : 0)
          + Number('ambiguous' in result ? result.ambiguous ?? 0 : 0)
          + Number('conflict' in result ? result.conflict ?? 0 : 0)
          + Number('notAssessable' in result ? result.notAssessable ?? 0 : 0)
        expect(classified).toBe(result.total)
      }
    }
  })

  it('records deterministic raw extraction without claiming structured coverage', () => {
    const pob = coverage.candidates.find(candidate => candidate.id === 'pob2-datview-ooz')
    expect(pob?.rawBalanceTables?.run1ManifestSha256).toBe(pob?.rawBalanceTables?.run2ManifestSha256)
    expect(pob?.rawStatDescriptions?.run1ManifestSha256).toBe(pob?.rawStatDescriptions?.run2ManifestSha256)
    expect(pob?.status).toBe('raw-extraction-success-structured-coverage-not-assessable')
  })

  it('records the forbidden runtime sources as unused', () => {
    expect(candidates.networkPolicy).toMatchObject({
      runtimeExtractionNetworkUsed: false,
      tradeApiUsed: false,
      poe2dbUsed: false,
      webScrapingUsed: false,
    })
  })

  it('keeps product pins, approval and localization unchanged', () => {
    expect(candidates.productionPinChanged).toBe(false)
    expect(candidates.productApprovalChanged).toBe(false)
    expect(candidates.productDataChanged).toBe(false)
    const germanScopes = approval.categoryAssignments.filter(value => value.categoryId.startsWith('poe2-german-'))
    expect(germanScopes.length).toBeGreaterThan(0)
    expect(germanScopes.every(value => value.status === 'pending' && value.repositoryStorage === false)).toBe(true)
  })

  it('makes exactly one conservative conclusion', () => {
    expect(comparison.sufficientCandidate).toBeNull()
    expect(comparison.singleConclusion).toBe('A limited own parser adaptation is required.')
  })

  it('contains no local user path or German raw-text inventory', () => {
    const serialized = JSON.stringify({ candidates, coverage, comparison })
    expect(serialized).not.toMatch(/C:\\\\Users|Program Files/)
    expect(serialized).not.toContain('rawGermanTexts')
  })
})
