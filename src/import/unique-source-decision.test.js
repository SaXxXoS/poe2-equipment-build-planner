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
  '../../src/engine/uniques/analyzer.ts': 'c89177fd560e649be82ae5a597eda775db7aead8c74a0c747318e71597c67383',
  '../../src/engine/fixtures/index.ts': '709f04fe63e28bd9d334b0d50d9d110f7dc7f7b601e4128303ef4a6fd0c81b79',
  // V1.3 explicitly authorizes rarity/socket transport; source separation remains guarded below.
  '../../src/domain/equipment.ts': '7355d900a14730f46a11d085d554379cb0b53131183f6eca539976698546eb20',
  '../../src/engine/orchestration/analyze-build.ts': 'e94776f0aafb8592d15f4fed375d3c5c69ea61b9d0c61e159fe219c622485def',
  '../../src/engine/jewels/analyzer.ts': 'f0233feb4471f5798293e117ce8865b25a4edad50ea3d617aee5b4ee2a42e3c8',
  '../../src/engine/equipment/analyzer.ts': '3b6a09e06f765f0e183715344ffe823f078f3439475943a8e56868f4dc3051f8',
  '../../src/tree-view/adapter.ts': '0a7199bdd6e8a59d251ed3e9de5926654afddb1c39fc2b6aa8336a2c44ddaaba',
}

describe('5M.1B.0B Produktgrenzen', () => {
  it.each(Object.entries(immutableFiles))('hält %s bytegleich', async (path, hash) => {
    const bytes = await readFile(new URL(path, import.meta.url))
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(hash)
  })
})
