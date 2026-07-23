import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { URL } from 'node:url'
import { describe, expect, it } from 'vitest'
import approvalJson from '../../data-sources/source-approval.json'
import { evaluateImportApproval, parseSourceApproval } from './approval'

const approval = approvalJson
const scopes = [
  'poe2-technical-unique-item-identity-data-for-build-planner',
  'poe2-technical-unique-mod-data-for-build-planner',
  'poe2-technical-unique-variant-data-for-build-planner',
  'poe2-technical-item-granted-effect-reference-data-for-build-planner',
]

const attemptedRequest = (categoryId, overrides = {}) => ({
  sourceId: 'repoe-poe2', categoryId, sourceVersion: '4.5.4.4.4',
  exportCommit: 'b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c',
  parserCommit: '14e3edc89ed705bd4e4eda5c8135756431c76e81',
  itemCategory: 'Unique Items', sourceFile: 'data/uniques.json',
  requestedFields: ['uniqueId'], dataCategories: ['unique-items'],
  sha256Manifest: true, deterministicNormalization: true,
  rawMirror: false, runtimeFetch: false, hotlink: false, ...overrides,
})

describe('5M.1B.0B Unique-Quellenentscheidung', () => {
  it('validiert die erweiterte Approval-Datei', () => expect(parseSourceApproval(approvalJson).ok).toBe(true))

  it.each(scopes)('gibt den Unique-Scope %s nicht frei', categoryId => {
    expect(evaluateImportApproval(approval, attemptedRequest(categoryId))).toMatchObject({ allowed: false, code: 'category-blocked' })
  })

  it.each([
    ['falsche Quelle', { sourceId: 'poe2db' }],
    ['ungepinnte Quelle', { exportCommit: 'main' }],
    ['latest', { sourceVersion: 'latest' }],
    ['falscher Parser', { parserCommit: 'main' }],
    ['falsche Datei', { sourceFile: 'data/skills.json' }],
    ['nicht erlaubtes Feld', { requestedFields: ['germanDisplayName'] }],
    ['deutsche Displaynamen', { dataCategories: ['display-names'] }],
    ['deutsche Modtexte', { dataCategories: ['german-stat-texts'] }],
    ['Medien', { dataCategories: ['media'] }],
    ['Rohspiegel', { rawMirror: true }],
    ['Laufzeitabruf', { runtimeFetch: true }],
    ['Hotlink', { hotlink: true }],
    ['Runen', { dataCategories: ['runes'] }],
    ['Soul Cores', { dataCategories: ['soul-cores'] }],
    ['Desecrated Mods', { dataCategories: ['desecrated-mods'] }],
    ['Mutated Mods', { dataCategories: ['mutated-mods'] }],
    ['vollständige Skilldaten', { dataCategories: ['skills'] }],
    ['vollständige Supportdaten', { dataCategories: ['supports'] }],
    ['granted Skill-ID', { dataCategories: ['granted-skill-references'] }],
    ['granted Support-ID', { dataCategories: ['granted-support-references'] }],
    ['Unique-Jewel', { itemCategory: 'Unique Jewels' }],
    ['Unique-Flask', { itemCategory: 'Unique Flasks' }],
    ['historische Variante', { dataCategories: ['historical-uniques'] }],
  ])('blockiert %s im Unique-Modscope', (_label, override) => {
    const decision = evaluateImportApproval(approval, attemptedRequest(scopes[1], override))
    expect(decision.allowed).toBe(false)
    expect(decision.code).toBe(_label === 'falsche Quelle' ? 'source-blocked' : 'category-blocked')
  })

  it('lässt die bestehenden 5M.1B.0A-Scopes gültig', () => {
    const ids = approval.categoryAssignments.map(value => value.categoryId)
    expect(ids).toContain('poe2-technical-jewel-mod-data-for-build-planner')
    expect(ids).toContain('poe2-technical-charm-mod-data-for-build-planner')
    expect(ids).toContain('poe2-technical-flask-mod-data-for-build-planner')
  })
})

const immutableFiles = {
  '../../src/domain/uniques.ts': '4b8fc6fb4df5b126b6a3ef634adbab14156df6ab3722b184edc58ac7c2781775',
  '../../src/engine/uniques/analyzer.ts': 'b4e9071fbf1a44f1763aed9c8a4db27268ae6c2b837af2a87a1bcf1be19247ac',
  '../../src/engine/fixtures/index.ts': '709f04fe63e28bd9d334b0d50d9d110f7dc7f7b601e4128303ef4a6fd0c81b79',
  // V1.3 explicitly authorizes rarity/socket transport; source separation remains guarded below.
  '../../src/domain/equipment.ts': '128712ca13ea0b61d4ff1f975e44c66cd207c9787cf49f0b536cebe5b64db448',
  '../../src/engine/orchestration/analyze-build.ts': '1a01596e5fd4535bcddc2c473771acbc4d0507b3b9c6e2829279f3c52e30ba59',
  '../../src/engine/jewels/analyzer.ts': 'f0233feb4471f5798293e117ce8865b25a4edad50ea3d617aee5b4ee2a42e3c8',
  '../../src/engine/equipment/analyzer.ts': 'b2cdfa2a4b521d7c8bbc59df73837d6b8ae991572895fd359bd399110c2a4fca',
  '../../src/tree-view/adapter.ts': '0a7199bdd6e8a59d251ed3e9de5926654afddb1c39fc2b6aa8336a2c44ddaaba',
}

describe('5M.1B.0B Produktgrenzen', () => {
  it.each(Object.entries(immutableFiles))('hält %s bytegleich', async (path, hash) => {
    const bytes = await readFile(new URL(path, import.meta.url))
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(hash)
  })
})
