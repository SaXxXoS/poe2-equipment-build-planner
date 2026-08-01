import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { URL } from 'node:url'
import { describe, expect, it } from 'vitest'
import approvalJson from '../../data-sources/source-approval.json'
import { evaluateImportApproval, parseSourceApproval } from './approval'

const conditions = {
  attributionRequired: true,
  derivedRedistributionAllowed: true,
  automatedAccessAllowed: true,
  localStorageAllowed: true,
  repositoryStorageAllowed: true,
  patchVersionRequired: true,
  rateLimitKnown: true,
  manualApprovalRequired: true,
}

const request = (categoryId, itemCategory, overrides = {}) => ({
  sourceId: 'repoe-poe2', categoryId, itemCategory,
  sourceVersion: '4.5.4.4.4',
  exportCommit: 'b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c',
  parserCommit: '14e3edc89ed705bd4e4eda5c8135756431c76e81',
  sourceFile: 'data/augments.json', requestedFields: ['socketableId', 'typeId'],
  dataCategories: ['socketable-identities'], sha256Manifest: true,
  deterministicNormalization: true, rawMirror: false, runtimeFetch: false,
  hotlink: false, satisfiedConditions: conditions, ...overrides,
})

const approved = [
  ['poe2-technical-rune-identity-data-for-build-planner', 'Runes'],
  ['poe2-technical-soul-core-identity-data-for-build-planner', 'Soul Cores'],
  ['poe2-technical-other-socketable-identity-data-for-build-planner', 'Idols'],
  ['poe2-technical-other-socketable-identity-data-for-build-planner', 'Abyssal Eyes'],
  ['poe2-technical-other-socketable-identity-data-for-build-planner', 'Congealed Mist'],
]

const blocked = [
  ['poe2-technical-rune-mod-data-for-build-planner', 'Runes'],
  ['poe2-technical-soul-core-mod-data-for-build-planner', 'Soul Cores'],
  ['poe2-technical-other-socketable-mod-data-for-build-planner', 'Idols'],
  ['poe2-technical-additional-corruption-mod-data-for-build-planner', 'Additional Corruption Mods'],
  ['poe2-technical-desecrated-mod-data-for-build-planner', 'Desecrated Mods'],
  ['poe2-technical-mutated-mod-data-for-build-planner', 'Mutated Mods'],
  ['poe2-technical-item-enchantment-data-for-build-planner', 'Enchantments'],
  ['poe2-technical-anointment-data-for-build-planner', 'Anointments'],
  ['poe2-technical-other-special-item-mod-data-for-build-planner', 'Other Special Item Mods'],
]

describe('5M.1B.0C Approval-Entscheidung', () => {
  it('validiert die Approval-Datei', () => expect(parseSourceApproval(approvalJson).ok).toBe(true))

  it.each(approved)('erlaubt ausschließlich den Identitätsscope %s/%s', (scope, itemCategory) => {
    expect(evaluateImportApproval(approvalJson, request(scope, itemCategory))).toMatchObject({ allowed: true, code: 'conditions-satisfied' })
  })

  it.each(blocked)('lässt den Mod-/Spezialscope %s blockiert', (scope, itemCategory) => {
    expect(evaluateImportApproval(approvalJson, request(scope, itemCategory))).toMatchObject({ allowed: false, code: 'category-blocked' })
  })

  it.each([
    ['falsche Quelle', { sourceId: 'poe2db' }, 'source-blocked'],
    ['falsches Release', { sourceVersion: '4.5.4.4.3' }, 'request-constraints-unmet'],
    ['latest', { sourceVersion: 'latest' }, 'request-constraints-unmet'],
    ['ungepinnter Commit', { exportCommit: 'main' }, 'request-constraints-unmet'],
    ['falscher Parser', { parserCommit: 'main' }, 'request-constraints-unmet'],
    ['falsche Kategorie', { itemCategory: 'Soul Cores' }, 'request-constraints-unmet'],
    ['falsche Datei', { sourceFile: 'data/mods.json' }, 'request-constraints-unmet'],
    ['nicht erlaubtes Feld', { requestedFields: ['statId'] }, 'request-constraints-unmet'],
    ['kein Hashmanifest', { sha256Manifest: false }, 'request-constraints-unmet'],
    ['nicht deterministisch', { deterministicNormalization: false }, 'request-constraints-unmet'],
    ['Rohspiegel', { rawMirror: true }, 'request-constraints-unmet'],
    ['Laufzeitabruf', { runtimeFetch: true }, 'request-constraints-unmet'],
    ['Hotlink', { hotlink: true }, 'request-constraints-unmet'],
    ['deutscher Name', { dataCategories: ['display-names'] }, 'request-constraints-unmet'],
    ['deutscher Stattext', { dataCategories: ['german-stat-texts'] }, 'request-constraints-unmet'],
    ['Unique-Daten', { dataCategories: ['unique-items'] }, 'request-constraints-unmet'],
    ['Skills', { dataCategories: ['skills'] }, 'request-constraints-unmet'],
    ['Supports', { dataCategories: ['supports'] }, 'request-constraints-unmet'],
    ['Medien', { dataCategories: ['media'] }, 'request-constraints-unmet'],
    ['Rune-Mods', { dataCategories: ['rune-mods'] }, 'request-constraints-unmet'],
    ['Bonded-Mods', { dataCategories: ['bonded-mods'] }, 'request-constraints-unmet'],
  ])('blockiert %s', (_label, override, code) => {
    expect(evaluateImportApproval(approvalJson, request(approved[0][0], approved[0][1], override))).toMatchObject({ allowed: false, code })
  })

  it('erlaubt keinen Doppelimport bestehender Corruption-Daten', () => {
    const scope = 'poe2-technical-additional-corruption-mod-data-for-build-planner'
    expect(evaluateImportApproval(approvalJson, request(scope, 'Additional Corruption Mods', { dataCategories: ['duplicate-corruption-implicits'] }))).toMatchObject({ allowed: false })
    expect(evaluateImportApproval(approvalJson, request(scope, 'Additional Corruption Mods', { dataCategories: ['duplicate-corruption-upgrades'] }))).toMatchObject({ allowed: false })
  })

  it('behält 5M.1B.0A- und Unique-Scopes unverändert vorhanden', () => {
    const ids = approvalJson.categoryAssignments.map(value => value.categoryId)
    expect(ids).toContain('poe2-technical-jewel-mod-data-for-build-planner')
    expect(ids).toContain('poe2-technical-charm-mod-data-for-build-planner')
    expect(ids).toContain('poe2-technical-flask-mod-data-for-build-planner')
    expect(ids).toContain('poe2-technical-unique-mod-data-for-build-planner')
  })
})

const immutableFiles = {
  '../../scripts/poe2-affix-import.mjs': '2014d442bce3f54c6f25d1b208ee19cc5d036a79f8059f1bb69ac801c144dd68',
  '../../src/affixes/registry.ts': '8fb686c14f5e69bb69067d143d030059ee079863bb54b2c59fbbd2ade0aa6ef0',
  // V1.3 authorizes the editor expansion; the later item-type correction keeps
  // defensive totals out of weapon and jewellery editors. The 2026-07-28
  // mobile correction only replaces the weapon-value controls; the follow-up
  // removes the unrequested range input. Source scopes and socketable product
  // boundaries remain unchanged.
  '../../src/components/AffixDialog.tsx': '8a2491d5edd3cbdd9d532e8a9d97a5083380421f87885093878b60b3d12a6630',
  '../../src/engine/common/types.ts': 'f9fa3c78b6ecac616061ffddce2d73a8a26250354682bcb2168289b68b5cad11',
  '../../src/runtime/real-passive-worker/contracts.ts': 'f48a7c3c51c6e2a60770696c147078c9d3b5ec8168181c4f18f7f18092c10365',
  '../../src/engine/equipment/analyzer.ts': 'b3187ad6592f11dfbd5ee9d3fa547a13781bcb84148598f81f5f9afc73847bd6',
  '../../src/engine/jewels/analyzer.ts': 'f0233feb4471f5798293e117ce8865b25a4edad50ea3d617aee5b4ee2a42e3c8',
  '../../src/engine/uniques/analyzer.ts': '552bdd987371735bc175e02824511cc5bf7bd0943e0ea3ef14b7cee2d756187b',
  '../../src/engine/orchestration/analyze-build.ts': '2dff76ed254fccbbf5d5244587ca6e08b3b914e7914013b6be47086224747b56',
  '../../src/tree-view/adapter.ts': '0a7199bdd6e8a59d251ed3e9de5926654afddb1c39fc2b6aa8336a2c44ddaaba',
  '../../src/tree-view/plan-visualization.ts': 'a5eb2d881e2b74d629668bb0fc9e35e83a48e1b8adee1416659e04f5c90d424c',
}

describe('5M.1B.0C Produktgrenzen', () => {
  it.each(Object.entries(immutableFiles))('hält %s bytegleich', async (path, hash) => {
    const bytes = await readFile(new URL(path, import.meta.url))
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(hash)
  })
})
