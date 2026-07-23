import { describe, expect, it } from 'vitest'
import approvalJson from '../../data-sources/source-approval.json'
import contract from '../../docs/audits/poe2-pob2-unique-import-contract.json'
import decision from '../../docs/audits/poe2-pob2-unique-project-owner-distribution-decision.json'
import notice from '../../THIRD_PARTY_NOTICES.md?raw'
import gggDraft from '../../docs/drafts/GGG_DERIVED_UNIQUE_DATA_DISTRIBUTION_REQUEST.md?raw'
import pob2Draft from '../../docs/drafts/POB2_UNIQUE_DATA_USAGE_REQUEST.md?raw'

const scope = approvalJson.categoryAssignments.find(
  value => value.categoryId === 'poe2-pob2-unique-planner-data',
)

describe('5M.2.8B Auftraggeberentscheidung', () => {
  it('ersetzt genau den historischen Pending-Status durch eine Projektentscheidung', () => {
    expect(decision.previousDistributionStatus).toBe('distribution-pending-both')
    expect(decision.distributionStatus).toBe(
      'distribution-project-approved-with-disclosed-uncertainty',
    )
    expect(decision.projectOwnerDecision).toBe('approved-with-disclosed-uncertainty')
    expect(decision.externalPermissionStatus).toBe(
      'not-requested-not-obtained-not-required-by-project-policy',
    )
    expect(decision.uncertaintyStatus).toContain('unresolved-external-rights')
    expect(decision.externalApprovalClaimed).toBe(false)
    expect(decision.legalClearanceClaimed).toBe(false)
  })

  it('markiert beide Entwürfe dauerhaft als nicht verfolgt', () => {
    for (const draft of [pob2Draft, gggDraft]) {
      expect(draft).toContain('not-pursued')
      expect(draft).toContain('nicht versendet')
      expect(draft).toContain('weder eine Antwort noch eine')
    }
    expect(decision.clarificationRequestStatus).toBe('drafts-retained-not-sent-not-pursued')
  })

  it('ändert nur den dedizierten Scope und erzeugt keinen generischen Pending-Bypass', () => {
    expect(scope?.constraints?.projectOwnerDecision).toBe('approved-with-disclosed-uncertainty')
    const otherPending = approvalJson.categoryAssignments.filter(
      value => value.categoryId !== 'poe2-pob2-unique-planner-data' && value.status === 'pending',
    )
    expect(otherPending.length).toBeGreaterThan(0)
    expect(otherPending.every(value => value.constraints?.projectOwnerDecision === undefined)).toBe(true)
  })

  it('gibt 5M.2.9 nur unter dem exakten reduzierten Vertrag frei', () => {
    expect(decision.importStatus).toBe('5M.2.9-may-begin-under-existing-guards')
    expect(contract.followUp).toBe('5M.2.9-imported-under-existing-guards')
    expect(contract.input.files).toHaveLength(20)
    expect(Object.keys(contract.input.fileHashes)).toHaveLength(20)
    expect(contract.output).toMatchObject({
      planned: 'generated/pob2/uniques.json',
      format: 'normalized-json',
      createdInThisTask: true,
      currentlyBlocked: false,
    })
    expect(contract.localization.germanUniqueTexts).toBe('not-approved')
    expect(contract.failures).not.toContain('distribution-pending')
  })

  it('behält Attribution, Herkunftsunsicherheit und Verbote sichtbar', () => {
    expect(notice).toContain('PathOfBuildingCommunity/PathOfBuilding-PoE2')
    expect(notice).toContain('c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0')
    expect(notice).toContain('MIT')
    expect(notice).toContain('has not requested')
    expect(notice).toContain('does not claim external permission')
    expect(decision.forbiddenArtifacts).toEqual(expect.arrayContaining([
      'raw PoB2 Lua files', 'full PoB2 Unique database', 'images', 'flavour text',
      'German Unique texts', 'normal affix data', 'technical GGG ID claims',
    ]))
  })
})
