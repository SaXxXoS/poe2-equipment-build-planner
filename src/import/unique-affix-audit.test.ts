import { describe, expect, it } from 'vitest'
import inventory from '../../docs/audits/poe2-unique-local-file-inventory.json'
import identities from '../../docs/audits/poe2-unique-identity-coverage.json'
import bases from '../../docs/audits/poe2-unique-base-reference-coverage.json'
import affixes from '../../docs/audits/poe2-unique-affix-coverage.json'
import variants from '../../docs/audits/poe2-unique-variant-coverage.json'
import localization from '../../docs/audits/poe2-unique-localization-coverage.json'
import readiness from '../../docs/audits/poe2-unique-import-readiness.json'
import determinism from '../../docs/audits/poe2-unique-audit-determinism.json'

describe('5M.2.6 unique identity and affix audit', () => {
  it('uses a pinned, minimal, deterministic local inventory', () => {
    expect(inventory.extraction).toMatchObject({ files: 25, bytes: 25477050, exitCode: 0, networkAttempts: 0 })
    expect(inventory.files.every(file => file.sha256 && file.extractionDecision)).toBe(true)
    expect(inventory.searchPatterns).toContain('UniqueItem')
  })
  it('does not promote names, visuals or stash rows to identities', () => {
    expect(identities.identity).toMatchObject({ candidates: 449, confirmedItemIdentities: 0, stashOnly: 449, unknown: 449 })
    expect(identities.endToEnd).toMatchObject({ fullyResolved: 0, unresolved: 449 })
    expect(bases.bases).toMatchObject({ uniqueBaseReferences: 0, itemClassReferences: 0, missingOrNotAssessable: 449 })
  })
  it('separates non-item mod references from unique item affixes', () => {
    expect(affixes.affixes).toMatchObject({
      itemUniqueAffixReferences: 0, nonItemTechnicalModReferences: 311,
      resolvedNonItemModReferences: 311, distinctNonItemModIds: 265,
      statLines: 278, structuredValues: 278,
    })
    expect(affixes.affixes.caveat).toContain('not unique item affixes')
  })
  it('keeps versions, rolls, mutation and legacy concepts separate', () => {
    expect(variants.variants).toMatchObject({
      uniqueItemVersions: 0, uniqueItemVariants: 0, rollVariants: 0,
      legacyDefinitions: 14, mutatedDefinitionRows: 1, unresolved: 449,
    })
  })
  it('does not use CSD presence to manufacture a technical chain', () => {
    expect(localization.localization).toMatchObject({
      technicallyLinkedItemAffixes: 0, germanRenderable: 0,
      nonItemReferencedStatLines: 278, nonItemGermanCsdLines: 261, nonItemEnglishCsdLines: 261,
    })
  })
  it('keeps product, approval, analyzer, later tasks and network untouched', () => {
    expect(readiness).toMatchObject({
      productDataChanged: false, productPinChanged: false, approvalChanged: false,
      uniqueAffixesTechnicallyComplete: false,
      tasks: { task5M2Started: false, task5NStarted: false },
      network: { http: false, https: false, dns: false, api: false, tradeApi: false, poe2db: false, websites: false },
    })
    expect(readiness.readiness.analyzer.logicChanged).toBe(false)
  })
  it('is byte-identical across two extraction and audit runs', () => {
    expect(determinism).toMatchObject({ extractionRuns: 2, auditRuns: 2, status: 'byteidentical', sameIdentities: true, sameReferences: true, sameValues: true, sameVariants: true, sameCoverage: true })
    expect(determinism.run1Sha256).toBe(determinism.run2Sha256)
  })
})
