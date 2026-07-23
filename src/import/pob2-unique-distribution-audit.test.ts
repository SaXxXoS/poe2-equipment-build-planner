import { describe, expect, it } from 'vitest'
import approvalJson from '../../data-sources/source-approval.json'
import attribution from '../../docs/audits/poe2-pob2-unique-attribution-plan.json'
import decision from '../../docs/audits/poe2-pob2-unique-distribution-decision.json'
import clarification from '../../docs/audits/poe2-pob2-unique-external-clarification-status.json'
import origins from '../../docs/audits/poe2-pob2-unique-file-origin-audit.json'
import license from '../../docs/audits/poe2-pob2-unique-license-scope-audit.json'
import options from '../../docs/audits/poe2-pob2-unique-distribution-options.json'
import gggDraft from '../../docs/drafts/GGG_DERIVED_UNIQUE_DATA_DISTRIBUTION_REQUEST.md?raw'
import pob2Draft from '../../docs/drafts/POB2_UNIQUE_DATA_USAGE_REQUEST.md?raw'

const scope = approvalJson.categoryAssignments.find(
  value => value.categoryId === 'poe2-pob2-unique-planner-data',
)

describe('5M.2.8A PoB2-Unique-Distributionsaudit', () => {
  it('klassifiziert alle 20 gepinnten Dateien mit Hash und unbekannter Datenlizenz', () => {
    expect(origins.fileCount).toBe(20)
    expect(origins.files).toHaveLength(20)
    expect(new Set(origins.files.map(file => file.path)).size).toBe(20)
    for (const file of origins.files) {
      expect(file.sha256).toMatch(/^[a-f0-9]{64}$/)
      expect(file.header).toBe('Item data (c) Grinding Gear Games')
      expect(file.rightsStatus).toBe('distribution-pending-both')
      expect(file.introduction.sha).toMatch(/^[a-f0-9]{40}$/)
    }
    expect(license.repositoryLicense.dataCoverage).toBe('license-scope-unknown')
  })

  it('trifft genau eine fail-closed Entscheidung und blockiert 5M.2.9', () => {
    expect(decision.exactlyOneStatus).toBe(true)
    expect(decision.status).toBe('distribution-pending-both')
    expect(decision.fiveM29).toBe('blocked')
    expect(decision.conditions).toContain('written PoB2 maintainer confirmation')
    expect(decision.conditions).toContain('written GGG confirmation')
    expect(options.recommended).toBe('D')
  })

  it('spiegelt den Status im Approval-Scope ohne Distributionsartefakt', () => {
    expect(scope).toBeDefined()
    if (!scope?.constraints) throw new Error('PoB2 approval constraints fehlen')
    expect(scope.constraints.distributionStatus).toBe('distribution-pending-both')
    expect(scope.constraints.allowedDistributionArtifacts).toEqual([])
    expect(scope.constraints.clarificationStatus).toBe(
      'maintainer-and-ggg-confirmation-missing',
    )
  })

  it('dokumentiert Attribution und nicht versendete externe Entwürfe', () => {
    expect(attribution.status).toBe('prepared-not-activated')
    expect(attribution.requiredLocations).toContain('THIRD_PARTY_NOTICES.md')
    expect(clarification.automaticMessagesSent).toBe(false)
    expect(clarification.maintainer.sent).toBe(false)
    expect(clarification.ggg.sent).toBe(false)
    for (const draft of [pob2Draft, gggDraft]) {
      expect(draft).toContain('nicht versendet')
    }
  })

  it('blockiert Mirror, Medien, Flavour Text und deutsche Texte', () => {
    expect(decision.fullMirror).toBe('forbidden')
    for (const subject of ['images and media', 'flavour text', 'German texts']) {
      expect(decision.fieldMatrix).toContainEqual(
        expect.objectContaining({ subject, status: 'forbidden' }),
      )
    }
  })
})
