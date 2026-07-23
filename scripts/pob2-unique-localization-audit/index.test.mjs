import { readFile } from 'node:fs/promises'
import { beforeAll, describe, expect, it } from 'vitest'
import { PRODUCT_SHA256, runAudit } from './index.mjs'

describe('PoB2 Unique German localization audit', () => {
  let audit
  beforeAll(async () => {
    audit = await runAudit()
  }, 20_000)

  it('classifies every product entity without approving a text-only join', async () => {
    const { reports, decisionStatus } = audit
    const names = reports['poe2-pob2-unique-german-name-coverage.json']
    const bases = reports['poe2-pob2-unique-german-base-coverage.json']
    const modifiers = reports['poe2-pob2-unique-german-modifier-coverage.json']
    const implicits = reports['poe2-pob2-unique-german-implicit-coverage.json']
    const variants = reports['poe2-pob2-unique-german-variant-coverage.json']
    expect(names.totalItems).toBe(435)
    expect(names.deterministicExact + names.deterministicDerived).toBe(0)
    expect(names.ambiguous + names.displayTextOnly + names.unresolved).toBe(435)
    expect(bases.deterministic + bases.ambiguous + bases.textCandidateOnly + bases.missing).toBe(435)
    expect(modifiers.total).toBe(2345)
    expect(modifiers.candidateOnly + modifiers.ambiguous + modifiers.unsupportedStructure + modifiers.noLocalSource).toBe(2345)
    expect(implicits.total).toBe(273)
    expect(implicits.candidateOnly + implicits.ambiguous + implicits.unsupportedStructure + implicits.noLocalSource).toBe(273)
    expect(variants.total).toBe(579)
    expect(variants.variantSpecificUnresolved).toBe(579)
    expect(decisionStatus).toBe('audit-only-no-safe-product-link')
  })

  it('keeps the English product byte-identical and proposes a separate display layer', async () => {
    const before = await readFile('generated/pob2/uniques.json')
    const { reports } = audit
    const after = await readFile('generated/pob2/uniques.json')
    const decision = reports['poe2-pob2-unique-german-localization-decision.json']
    expect(before).toEqual(after)
    expect(decision.sourceProductHash).toBe(PRODUCT_SHA256)
    expect(decision.proposedLocalizationModel.createdInThisTask).toBe(false)
    expect(decision.proposedLocalizationModel.duplicateEnglishProductData).toBe(false)
    expect(decision.remainingTranslationMissing).toEqual({
      items: 435,
      variants: 579,
      modifierLines: 2345,
      implicitLines: 273,
    })
  }, 15_000)

  it('retains the offline and fail-safe source policy', async () => {
    const { reports } = audit
    const decision = reports['poe2-pob2-unique-german-localization-decision.json']
    expect(decision.network).toEqual({
      http: false,
      https: false,
      dns: false,
      api: false,
      tradeApi: false,
      poe2db: false,
      scraping: false,
    })
    expect(decision.forbiddenMethods).toContain('name-only product join')
    expect(decision.forbiddenMethods).toContain('AI or automatic translation')
    expect(decision.proposedApprovalScope.status).toBe('not-created-not-approved')
  })
})
