import { describe, expect, it, vi } from 'vitest'
import approvalJson from '../../data-sources/source-approval.json'
import { evaluateImportApproval, parseSourceApproval, type SourceApprovalFile } from './approval'

const base = approvalJson as SourceApprovalFile
const source = (status: SourceApprovalFile['reviewedSources'][number]['status'], requiredConditions: SourceApprovalFile['reviewedSources'][number]['requiredConditions'] = []) => ({ ...base.reviewedSources[0], sourceId: 'test-source', status, requiredConditions })
const category = (status: SourceApprovalFile['categoryAssignments'][number]['status']) => ({ ...base.categoryAssignments[0], categoryId: 'test-category', status, primarySourceId: 'test-source' })
const approval = (sourceStatus: SourceApprovalFile['reviewedSources'][number]['status'], categoryStatus = sourceStatus, requiredConditions: SourceApprovalFile['reviewedSources'][number]['requiredConditions'] = []): SourceApprovalFile => ({ ...base, reviewedSources: [source(sourceStatus, requiredConditions)], categoryAssignments: [category(categoryStatus)] })
const request = { sourceId: 'test-source', categoryId: 'test-category' }
const allConditions = { attributionRequired: true, derivedRedistributionAllowed: true, automatedAccessAllowed: true, localStorageAllowed: true, repositoryStorageAllowed: true, patchVersionRequired: true, rateLimitKnown: true, manualApprovalRequired: true }
const scopedRequest = (categoryId: string, itemCategory: string) => ({ sourceId: 'repoe-poe2', categoryId, satisfiedConditions: allConditions, sourceVersion: '4.5.4.4.4', exportCommit: 'b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c', parserCommit: '14e3edc89ed705bd4e4eda5c8135756431c76e81', itemCategory, sourceFile: 'data/mods.json', requestedFields: ['modId', 'statId', 'generationType'], dataCategories: ['technical-mods'], sha256Manifest: true, deterministicNormalization: true, rawMirror: false, runtimeFetch: false, hotlink: false })

describe('Import-Freigabesperre', () => {
  it('validiert die eingecheckte Approval-Datei', () => { expect(parseSourceApproval(approvalJson)).toEqual({ ok: true, approval: approvalJson, issues: [] }) })
  it('erlaubt den eng begrenzten offiziellen Passivbaumimport', () => {
    const result = evaluateImportApproval(base, { sourceId: 'ggg-poe2-skilltree-export', categoryId: 'passive-nodes', satisfiedConditions: { attributionRequired: true, rawRedistributionAllowed: true, derivedRedistributionAllowed: true, localStorageAllowed: true, repositoryStorageAllowed: true, patchVersionRequired: true, manualApprovalRequired: true } })
    expect(result.allowed).toBe(true)
  })
  it('erlaubt ausschließlich die eng begrenzte gepinnte Export-Assetkategorie',()=>{const result=evaluateImportApproval(base,{sourceId:'ggg-poe2-skilltree-export',categoryId:'official-poe2-passive-tree-export-assets',satisfiedConditions:{attributionRequired:true,rawRedistributionAllowed:true,derivedRedistributionAllowed:true,localStorageAllowed:true,repositoryStorageAllowed:true,patchVersionRequired:true,manualApprovalRequired:true}});expect(result.allowed).toBe(true);expect(evaluateImportApproval(base,{sourceId:'ggg-poe2-skilltree-export',categoryId:'icons-images'}).allowed).toBe(false)})
  it('erlaubt RePoE nur im bedingten technischen Affixscope', () => {
    const satisfiedConditions = { attributionRequired: true, derivedRedistributionAllowed: true, automatedAccessAllowed: true, localStorageAllowed: true, repositoryStorageAllowed: true, patchVersionRequired: true, rateLimitKnown: true, manualApprovalRequired: true }
    expect(evaluateImportApproval(base, { sourceId: 'repoe-poe2', categoryId: 'poe2-technical-affix-data-for-build-planner', satisfiedConditions })).toMatchObject({ allowed: true, code: 'conditions-satisfied' })
    expect(evaluateImportApproval(base, { sourceId: 'repoe-poe2', categoryId: 'poe2-technical-affix-data-for-build-planner' })).toMatchObject({ allowed: false, code: 'conditions-unmet' })
    expect(evaluateImportApproval(base, { sourceId: 'repoe-poe2', categoryId: 'display-names', satisfiedConditions }).allowed).toBe(false)
    expect(evaluateImportApproval(base, { sourceId: 'repoe-poe2', categoryId: 'skills', satisfiedConditions }).allowed).toBe(false)
  })
  it.each([
    ['poe2-technical-jewel-mod-data-for-build-planner', 'Jewels'],
    ['poe2-technical-charm-mod-data-for-build-planner', 'Charms'],
    ['poe2-technical-flask-mod-data-for-build-planner', 'Life Flasks'],
    ['poe2-technical-flask-mod-data-for-build-planner', 'Mana Flasks'],
  ])('erlaubt den eng begrenzten neuen Scope %s für %s', (categoryId, itemCategory) => {
    expect(evaluateImportApproval(base, scopedRequest(categoryId, itemCategory))).toMatchObject({ allowed: true, code: 'conditions-satisfied' })
  })
  it('lässt Relics deferred', () => { expect(evaluateImportApproval(base, scopedRequest('poe2-technical-relic-mod-data-for-build-planner', 'Relics'))).toMatchObject({ allowed: false, code: 'category-blocked' }) })
  it.each([
    ['sourceVersion', { sourceVersion: 'latest' }], ['exportCommit', { exportCommit: 'main' }],
    ['parserCommit', { parserCommit: undefined }], ['itemCategory', { itemCategory: 'Unique Jewels' }],
    ['sourceFile', { sourceFile: 'data/uniques.json' }], ['requestedFields', { requestedFields: ['technicalName'] }],
    ['sha256Manifest', { sha256Manifest: false }], ['deterministicNormalization', { deterministicNormalization: false }],
    ['rawMirror', { rawMirror: true }], ['runtimeFetch', { runtimeFetch: true }], ['hotlink', { hotlink: true }],
  ])('blockiert Scope-Verstoß %s', (_name, override) => {
    expect(evaluateImportApproval(base, { ...scopedRequest('poe2-technical-jewel-mod-data-for-build-planner', 'Jewels'), ...override })).toMatchObject({ allowed: false, code: 'request-constraints-unmet' })
  })
  it.each(['unique-items','unique-mods','unique-jewels','cluster-jewels','corrupted-mods','passive-jewel-mechanics','runes','soul-cores','desecrated-mods','mutated-mods','skills','supports','display-names','german-stat-texts','media','raw-export-mirror'])('blockiert Jewel-Datenkategorie %s', dataCategory => {
    expect(evaluateImportApproval(base, { ...scopedRequest('poe2-technical-jewel-mod-data-for-build-planner', 'Jewels'), dataCategories: [dataCategory] })).toMatchObject({ allowed: false, code: 'request-constraints-unmet' })
  })
  it.each(['flask-simulation','flask-quality-rules','enchantments','unique-items','skills','supports','display-names','german-stat-texts','media'])('blockiert Flask-Negativscope %s', dataCategory => {
    expect(evaluateImportApproval(base, { ...scopedRequest('poe2-technical-flask-mod-data-for-build-planner', 'Life Flasks'), dataCategories: [dataCategory] })).toMatchObject({ allowed: false, code: 'request-constraints-unmet' })
  })
  it('lässt andere echte Datenkategorien blockiert', () => { expect(evaluateImportApproval(base, { sourceId: 'repoe-poe2', categoryId: 'skills' }).allowed).toBe(false) })
  it.each([
    ['poe2-german-stat-template-data-for-build-planner', 'repoe-poe2'],
    ['poe2-german-item-mod-localization-for-build-planner', 'repoe-poe2'],
    ['poe2-german-base-item-localization-for-build-planner', 'repoe-poe2'],
    ['poe2-german-item-class-localization-for-build-planner', 'repoe-poe2'],
    ['poe2-german-socketable-identity-localization-for-build-planner', 'repoe-poe2'],
    ['poe2-curated-id-localization-mapping-for-build-planner', 'manual-transcription'],
  ])('blockiert den noch nicht freigegebenen deutschen Scope %s', (categoryId, sourceId) => {
    const decision = evaluateImportApproval(base, { sourceId, categoryId })
    expect(decision.allowed).toBe(false)
    expect(['source-blocked', 'category-blocked']).toContain(decision.code)
  })
  it('blockiert photo-derived-unverified als produktive Lokalisierung', () => {
    expect(evaluateImportApproval(base, { sourceId: 'manual-transcription', categoryId: 'poe2-photo-derived-localization-mapping-for-build-planner' }).allowed).toBe(false)
  })
  it.each([
    'free-ai-translation', 'unconfirmed-text-match', 'poe2db-scrape', 'poe2db-html',
    'website-dump', 'raw-game-text-mirror', 'media', 'unique-texts', 'skill-texts',
    'support-texts', 'runtime-fetch', 'hotlink',
  ])('erteilt über einen pending Lokalisierungsscope keine Freigabe für %s', dataCategory => {
    expect(evaluateImportApproval(base, {
      sourceId: 'repoe-poe2',
      categoryId: 'poe2-german-item-mod-localization-for-build-planner',
      dataCategories: [dataCategory],
    })).toMatchObject({ allowed: false, code: 'category-blocked' })
  })
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
