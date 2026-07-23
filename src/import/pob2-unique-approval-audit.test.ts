import { describe, expect, it } from 'vitest'
import approvalJson from '../../data-sources/source-approval.json'
import decision from '../../docs/audits/poe2-pob2-unique-approval-decision.json'
import fields from '../../docs/audits/poe2-pob2-unique-field-approval.json'
import contract from '../../docs/audits/poe2-pob2-unique-import-contract.json'
import license from '../../docs/audits/poe2-pob2-unique-license-distribution.json'
import files from '../../docs/audits/poe2-pob2-unique-source-files.json'
import guards from '../../docs/audits/poe2-pob2-unique-guard-requirements.json'

const scope = approvalJson.categoryAssignments.find(value => value.categoryId === 'poe2-pob2-unique-planner-data')
const source = approvalJson.reviewedSources.find(value => value.sourceId === 'path-of-building-poe2-unique-planner-c5300ccd')

describe('5M.2.8 PoB2-Unique-Approval-Auditberichte', () => {
  it('pinnt einen ausschließlich auf Unique begrenzten Scope', () => {
    expect(source).toMatchObject({ status: 'conditionally-approved' })
    expect(scope).toMatchObject({ status: 'conditionally-approved', repositoryStorage: true, offlineOnly: true })
    expect(scope?.constraints?.exportCommit).toBe('c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0')
    expect(scope?.constraints?.sourceVersion).not.toContain('latest')
    expect(scope?.constraints?.allowedItemCategories).toEqual(['Unique Items'])
  })
  it('blockiert technische GGG-, Affix-, Crafting-, Medien- und Lokalisierungsfelder', () => {
    const forbidden = fields.fields.filter(value => value.status === 'forbidden').map(value => value.field)
    expect(forbidden).toEqual(expect.arrayContaining(['gggModId','gggStatId','spawnWeights','image','flavourText','germanText']))
    expect(scope?.constraints?.blockedDataCategories).toEqual(expect.arrayContaining(['normal-affixes','technical-mods','crafting-pools','german-csd','media','skills','supports']))
  })
  it('erlaubt nur die minimalen, gehashten statischen Quelldateien', () => {
    expect(files.allowed).toHaveLength(20)
    expect(files.allowed.every(value => /^[a-f0-9]{64}$/.test(value.sha256))).toBe(true)
    expect(files.rawDatabaseImportForbidden).toBe(true)
    expect(files.excluded.map(value => value.path)).toContain('src/Data/Uniques/Special/Generated.lua')
  })
  it('verlangt Provenienz und getrennte Namespaces', () => {
    expect(guards.guards.provenance).toContain('required-fields')
    expect(contract.deterministicId).toBe('pob2:<source-record-id>')
    expect(contract.modifierLines.technicalGggStatLink).toBe('null-unless-independently-proven')
  })
  it('erlaubt 5M.2.9 ausschließlich als Projektentscheidung mit offengelegter Unsicherheit', () => {
    expect(decision.decision).toBe('conditionally-approved')
    expect(decision.importStatus).toBe('5M.2.9-may-begin-under-guards')
    expect(decision.distributionStatus).toBe('distribution-project-approved-with-disclosed-uncertainty')
    expect(decision.externalPermissionStatus).toBe('not-requested-not-obtained')
    expect(license.bundledItemData.licenseCoverage).toBe('license-scope-unknown')
    expect(contract.output.createdInThisTask).toBe(false)
    expect(contract.output.currentlyBlocked).toBe(false)
  })
  it('enthält keine vollständigen PoB2-Rohdaten oder Produktdatei', () => {
    const reports = [decision, fields, contract, license, files, guards]
    expect(JSON.stringify(reports)).not.toContain('Unique Item')
    expect(contract.output.createdInThisTask).toBe(false)
    expect(files.rawDatabaseImportForbidden).toBe(true)
  })
})
