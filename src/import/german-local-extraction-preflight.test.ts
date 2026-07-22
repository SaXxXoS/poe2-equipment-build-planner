import { describe, expect, it } from 'vitest'
import coverage from '../../docs/audits/poe2-german-local-extraction-coverage.json'
import parity from '../../docs/audits/poe2-german-local-extraction-parity.json'
import distribution from '../../docs/audits/poe2-german-local-extraction-distribution-options.json'
import approval from '../../data-sources/source-approval.json'

describe('5M.2.1 sanitized local extraction preflight', () => {
  it('classifies every current product entity without claiming failed coverage', () => {
    for (const value of Object.values(coverage.results)) {
      expect(value.complete + value.partial + value.missing + value.ambiguous + value.conflict + value.notAssessable).toBe(value.total)
    }
  })

  it('records byte-identical German item-class runs and English ID parity', () => {
    expect(parity.germanRuns).toHaveLength(2)
    expect(parity.germanRuns[0].sha256).toBe(parity.germanRuns[1].sha256)
    expect(parity.itemClassIdParity).toEqual({ german: 117, english: 117, both: 117, germanOnly: 0, englishOnly: 0 })
    expect(parity.statParity.status).toBe('unknown')
  })

  it('keeps all German product scopes nonproductive', () => {
    const ids = ['poe2-german-stat-template-data-for-build-planner','poe2-german-item-mod-localization-for-build-planner','poe2-german-base-item-localization-for-build-planner','poe2-german-item-class-localization-for-build-planner']
    const categories = approval.categoryAssignments.filter(value => ids.includes(value.categoryId))
    expect(categories).toHaveLength(ids.length)
    expect(categories.every(value => value.status === 'pending' && value.repositoryStorage === false)).toBe(true)
    expect(coverage.productLocalizationStatus).toBe('translation-missing')
    expect(distribution.decision).toBe('no-production-approval')
  })

  it('contains no local Windows path or German raw-text inventory', () => {
    const serialized = JSON.stringify({ coverage, parity, distribution })
    expect(serialized).not.toMatch(/C:\\\\Users|Program Files/)
    expect(serialized).not.toContain('rawGermanTexts')
  })
})
