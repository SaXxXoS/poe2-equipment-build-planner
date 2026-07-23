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
  '../../src/affixes/registry.ts': '268760739aa233052060962bfd9a034d4cd351e13078964df92b9962e73f7d1d',
  // V1.3 explicitly authorizes the backwards-compatible equipment editor expansion.
  '../../src/components/AffixDialog.tsx': '45bcda48ae138661f0b3239a73a720f2032d027aae31b249d8f6dbce86d0723b',
  '../../src/engine/common/types.ts': '95f7ac64646c6322a0eb43cffd8550b69d706dc0757e13c311934ae465912971',
  '../../src/runtime/real-passive-worker/contracts.ts': 'f48a7c3c51c6e2a60770696c147078c9d3b5ec8168181c4f18f7f18092c10365',
  '../../src/engine/equipment/analyzer.ts': 'b2cdfa2a4b521d7c8bbc59df73837d6b8ae991572895fd359bd399110c2a4fca',
  '../../src/engine/jewels/analyzer.ts': 'f0233feb4471f5798293e117ce8865b25a4edad50ea3d617aee5b4ee2a42e3c8',
  '../../src/engine/uniques/analyzer.ts': 'b4e9071fbf1a44f1763aed9c8a4db27268ae6c2b837af2a87a1bcf1be19247ac',
  '../../src/engine/orchestration/analyze-build.ts': '1a01596e5fd4535bcddc2c473771acbc4d0507b3b9c6e2829279f3c52e30ba59',
  '../../src/tree-view/adapter.ts': '0a7199bdd6e8a59d251ed3e9de5926654afddb1c39fc2b6aa8336a2c44ddaaba',
  '../../src/tree-view/plan-visualization.ts': 'b8bc73e99da77878d092162281335b70b0be104f1fb4db34e1fe65b324eab04d',
}

describe('5M.1B.0C Produktgrenzen', () => {
  it.each(Object.entries(immutableFiles))('hält %s bytegleich', async (path, hash) => {
    const bytes = await readFile(new URL(path, import.meta.url))
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(hash)
  })
})
