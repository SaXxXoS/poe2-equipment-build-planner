import { describe, expect, it, vi } from 'vitest'
import approvalJson from '../../data-sources/source-approval.json'
import { evaluateImportApproval, parseSourceApproval, type SourceApprovalFile } from './approval'

const base = approvalJson as SourceApprovalFile
const source = (status: SourceApprovalFile['reviewedSources'][number]['status'], requiredConditions: SourceApprovalFile['reviewedSources'][number]['requiredConditions'] = []) => ({ ...base.reviewedSources[0], sourceId: 'test-source', status, requiredConditions })
const category = (status: SourceApprovalFile['categoryAssignments'][number]['status']) => ({ ...base.categoryAssignments[0], categoryId: 'test-category', status, primarySourceId: 'test-source' })
const approval = (sourceStatus: SourceApprovalFile['reviewedSources'][number]['status'], categoryStatus = sourceStatus, requiredConditions: SourceApprovalFile['reviewedSources'][number]['requiredConditions'] = []): SourceApprovalFile => ({ ...base, reviewedSources: [source(sourceStatus, requiredConditions)], categoryAssignments: [category(categoryStatus)] })
const request = { sourceId: 'test-source', categoryId: 'test-category' }

describe('Import-Freigabesperre', () => {
  it('validiert die eingecheckte Approval-Datei', () => { expect(parseSourceApproval(approvalJson)).toEqual({ ok: true, approval: approvalJson, issues: [] }) })
  it('blockiert eine fehlende Approval-Datei', () => { expect(evaluateImportApproval(undefined, request).code).toBe('approval-missing') })
  it('blockiert eine ungültige Approval-Datei', () => { expect(evaluateImportApproval('{', request).code).toBe('approval-invalid') })
  it('blockiert eine unbekannte Quelle', () => { expect(evaluateImportApproval(base, { ...request, sourceId: 'unknown' }).code).toBe('source-unknown') })
  it('blockiert eine unbekannte Kategorie', () => { expect(evaluateImportApproval(base, { ...request, sourceId: base.reviewedSources[0].sourceId, categoryId: 'unknown' }).code).toBe('category-unknown') })
  it('erlaubt approved', () => { expect(evaluateImportApproval(approval('approved'), request).code).toBe('approved') })
  it('erlaubt conditionally-approved nur mit erfüllten Bedingungen', () => {
    const file = approval('conditionally-approved', 'conditionally-approved', ['attributionRequired'])
    expect(evaluateImportApproval(file, request)).toMatchObject({ allowed: false, code: 'conditions-unmet', unmetConditions: ['attributionRequired'] })
    expect(evaluateImportApproval(file, { ...request, satisfiedConditions: { attributionRequired: true } }).code).toBe('conditions-satisfied')
  })
  it.each(['pending', 'blocked', 'rejected'] as const)('blockiert den Quellenstatus %s', status => { expect(evaluateImportApproval(approval(status), request).code).toBe('source-blocked') })
  it('blockiert eine nicht freigegebene Kategorie', () => { expect(evaluateImportApproval(approval('approved', 'blocked'), request).code).toBe('category-blocked') })
  it('lässt Fixture-Importe ohne Approval-Datei zu', () => { expect(evaluateImportApproval(undefined, { ...request, fixture: true }).code).toBe('fixture-allowed') })
  it('liefert für gleiche Eingaben dieselbe Entscheidung', () => { expect(evaluateImportApproval(base, request)).toEqual(evaluateImportApproval(base, request)) })
  it('führt keine Netzwerkzugriffe aus', () => { const fetchSpy = vi.spyOn(globalThis, 'fetch'); evaluateImportApproval(base, request); expect(fetchSpy).not.toHaveBeenCalled(); fetchSpy.mockRestore() })
})
