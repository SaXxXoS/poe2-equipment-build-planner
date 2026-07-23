import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'

const OUT = resolve('docs/audits')
const ordered = value => {
  if (Array.isArray(value)) return value.map(ordered)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])]))
  }
  return value
}
const stable = value => `${JSON.stringify(ordered(value), null, 2)}\n`
const hash = value => createHash('sha256').update(value).digest('hex')

const pins = {
  auditDate: '2026-07-23',
  startingCommit: '7b90dd2375e4a32cf6d3ff1a5740c78788b33f7f',
  localContainer: 'a917a56f89ae631f1a93e0dd9a3ea169f08e826e07927c0083a01c6e68a18e28',
  productRePoEExport: 'b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c',
  productRePoEParser: '14e3edc89ed705bd4e4eda5c8135756431c76e81',
}

const requirements = {
  uniqueIdentity: 'stable technical key independent from display text',
  baseReference: 'Unique-ID → BaseItemType/metadata ID',
  itemClass: 'technical class reference',
  affix: 'Unique-ID → Mod-ID or direct Stat-ID definition',
  values: 'structured fixed/ranged/multi-value representation',
  variants: 'technical version/variant relation',
  localization: 'technical Stat-ID connection to pinned local CSD',
  forbiddenEvidence: ['display-name join', 'base-name join', 'numbers parsed from text', 'URL slug', 'stash position'],
}

const sources = [
  {
    id: 'ggg-developer-api',
    operator: 'Grinding Gear Games',
    type: 'official-api',
    url: 'https://www.pathofexile.com/developer/docs',
    pin: 'documentation reviewed 2026-07-23',
    deepAudit: false,
    status: ['technically-unsuitable', 'requires-runtime-network'],
    finding: 'Published PoE2 API resources expose account/item instances, not a versioned offline Unique definition → technical Mod/Stat dataset. Undocumented endpoints are expressly out of scope.',
  },
  {
    id: 'ggg-trade',
    operator: 'Grinding Gear Games',
    type: 'official-website-api-candidate',
    url: 'https://www.pathofexile.com/developer/docs',
    pin: 'not called; documentation reviewed 2026-07-23',
    deepAudit: false,
    status: ['technically-unsuitable', 'requires-runtime-network', 'audit-only'],
    finding: 'Not used. Listing/item text is neither an offline definition corpus nor a stable item-to-Mod-ID chain; separate API approval would be required.',
  },
  {
    id: 'ggg-poe2-skilltree-export',
    operator: 'Grinding Gear Games',
    type: 'official-static-export',
    url: 'https://github.com/grindinggear/poe2-skilltree-export',
    pin: '1e9eb2d8c1946398c3aaaacfbaead5c75c0d1fa6 (existing project pin)',
    deepAudit: false,
    status: ['technically-unsuitable'],
    finding: 'Official and reproducible, but scoped to the passive tree and contains no Unique item definition chain.',
  },
  {
    id: 'local-client',
    operator: 'Grinding Gear Games',
    type: 'official-local-material',
    url: '<LOCAL_INSTALLATION>/Content.ggpk',
    pin: pins.localContainer,
    deepAudit: false,
    status: ['technically-partial', 'audit-only', 'distribution-pending'],
    finding: '5M.2.6 proved deterministic fragments and technical Mods/CSD, but no stable item Unique-ID → base → affix relation is materialized in the audited client sources.',
  },
  {
    id: 'repoe-current-export',
    operator: 'repoe-fork',
    type: 'community-generated-export',
    repository: 'https://github.com/repoe-fork/poe2',
    commit: '1a6066ec60d24af274cb7a87d00b6ab1c0975ebd',
    version: '4.5.4.4.4',
    archiveSha256: 'b0d631c987ce3ba388dd6e06fd82162eb02bd6f452b3a8c40f3c8df16f65f21a',
    deepAudit: true,
    status: ['technically-partial', 'license-pending', 'distribution-pending', 'audit-only'],
    format: 'JSON',
    counts: { uniqueRows: 449, baseItems: 5246, mods: 16678, itemClasses: 117 },
    uniqueFields: ['id', 'inventory_height', 'inventory_width', 'is_alternate_art', 'item_class', 'name', 'visual_identity', 'renamed_version', 'base_version'],
    fileHashes: {
      uniques: '5c303e991763d4f89c7e41306561c1eb02bb55d79ebe0c26f43520906f9c059b',
      mods: 'e4cfac6ebb1f1a86ea3e6465bab79b6e8a2bb39a317bd9ffe8ba5cc99befa2b1',
      baseItems: 'acb63728684a57d61e99ac2e919833fcf3199e9ca185770d57a0df568e60266c',
      itemClasses: 'eec6f2a4c3b53a26f6979a26e57c9ab7644f26b914e57c4d3a9f9768a1aed723',
    },
    technical: { stableUniqueId: false, baseId: false, itemClassId: false, modIdLink: false, directStats: false, statIds: false, structuredValues: false, variants: false, grantedSkills: false, grantedSupports: false, localCsdLink: false },
    finding: 'The updated export changed file hashes but not the decisive Unique schema or counts. Its id remains the visible Words key; base_version/renamed_version do not provide the required base/mod/variant chain.',
  },
  {
    id: 'path-of-building-poe2',
    operator: 'PathOfBuildingCommunity',
    type: 'community-planner-data',
    repository: 'https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2',
    commit: 'c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0',
    version: 'dev; remote HEAD verified 2026-07-23',
    deepAudit: true,
    status: ['technically-partial', 'requires-text-matching', 'license-pending', 'distribution-pending', 'audit-only'],
    format: 'Lua item blocks plus generated runtime definitions',
    counts: { uniqueSourceFiles: 33, priorStaticBlocks: 435, priorVariantDeclarations: 579, priorVisibleModLines: 2704 },
    technical: { stableUniqueId: false, baseId: false, itemClassId: false, modIdLink: false, directStats: false, statIds: false, structuredValues: 'text-encoded', variants: 'PoB-local declarations', grantedSkills: 'visible names/PoB semantics', grantedSupports: 'PoB semantics', localCsdLink: false },
    finding: 'Richest visible Unique/variant control corpus, but it parses display lines into PoB-internal semantics. Generated and test variants are not game IDs; exact local Mod/Stat/CSD joins are impossible without forbidden text matching.',
  },
  {
    id: 'poe2-mcp-local-pipeline',
    operator: 'HivemindOverlord',
    type: 'community-local-extractor',
    repository: 'https://github.com/HivemindOverlord/poe2-mcp',
    commit: '163c30a9fd45f815d330cc54e6ab51a797693d31',
    version: 'data-v0.5.0-r12',
    deepAudit: true,
    status: ['technically-unsuitable', 'license-pending', 'distribution-pending', 'audit-only'],
    format: 'JSON and schema fingerprints',
    counts: { mods: 16788, schemaFingerprints: 1019 },
    technical: { stableUniqueId: false, baseId: false, itemClassId: false, modIdLink: false, directStats: false, statIds: 'available for general Mods only', structuredValues: 'available for general Mods only', variants: false, grantedSkills: false, grantedSupports: false, localCsdLink: false },
    finding: 'Useful Mod/schema control source but contains no Unique-item definition table and no item Unique-ID → base/mod relation.',
  },
  {
    id: 'pobr',
    operator: 'ackness',
    type: 'community-derived-export',
    repository: 'https://github.com/ackness/pobr',
    commit: 'ff1d07da2a2b38959e34eea077d842d222f631b4',
    version: 'data 4.5.4.3',
    deepAudit: false,
    status: ['technically-partial', 'requires-text-matching', 'outdated', 'audit-only'],
    finding: 'Reproducible derivative of PoB visible item blocks, not an independent ID source; no technical Unique/Mod/Stat IDs.',
  },
  {
    id: 'poe2-tools-build-planner',
    operator: 'poe2-tools',
    type: 'community-build-planner',
    repository: 'https://github.com/poe2-tools/poe2-build-planner',
    commit: 'a173f7b0d398951693fee83ee5ee40f327d4a749',
    deepAudit: false,
    status: ['technically-unsuitable', 'requires-text-matching'],
    finding: 'Free-text item plans and derivative sources; no complete technical Unique chain.',
  },
  {
    id: 'poe2-community-wiki',
    operator: 'community',
    type: 'wiki-candidate',
    url: 'https://www.poe2wiki.net/',
    pin: 'not downloaded; candidate classification 2026-07-23',
    deepAudit: false,
    status: ['technically-unsuitable', 'requires-runtime-network', 'source-origin-unknown'],
    finding: 'Human-readable pages may enumerate items but no reviewed offline export with stable game Unique/Mod/Stat IDs and structured provenance was found. No scraping was performed.',
  },
  {
    id: 'poe2db',
    operator: 'third party',
    type: 'website-candidate',
    url: 'https://poe2db.tw/',
    pin: 'not accessed for data',
    deepAudit: false,
    status: ['technically-unsuitable', 'requires-runtime-network', 'source-origin-unknown'],
    finding: 'Blocked by project rules. No scraping, API discovery, HTML extraction or data use occurred.',
  },
]

const deep = sources.filter(source => source.deepAudit)
if (deep.length > 3) throw new Error('more-than-three-deep-candidates')
if (deep.some(source => !source.commit)) throw new Error('unpinned-deep-candidate')

const coverage = deep.map(source => ({
  id: source.id,
  pin: source.commit,
  ...source.technical,
  fixedValues: source.id === 'path-of-building-poe2' ? 'text-encoded-only' : false,
  variableValues: source.id === 'path-of-building-poe2' ? 'text-encoded-only' : false,
  versions: source.id === 'path-of-building-poe2' ? 'PoB-local declarations only' : false,
  implicits: source.id === 'path-of-building-poe2' ? 'visible lines only' : false,
  specialEffects: source.id === 'path-of-building-poe2' ? 'PoB-engine semantics only' : false,
  deterministicAtPin: true,
  runtimeNetwork: false,
  technicallySuitable: false,
}))

const parity = {
  localPins: { container: pins.localContainer, uniqueAuditHash: 'fd9a0418e4c20c8dc1e3138712839ddefb1dd361ec99ebe74ab5731668759283' },
  localConfirmed: { uniqueIdentityFragments: 449, confirmedItemIdentities: 0, nonItemModReferences: 311, distinctMods: 265, structuredStatLines: 278, germanCsdLines: 261, englishCsdLines: 261 },
  candidates: [
    { id: 'repoe-current-export', baseItemParity: 'not joinable from Unique rows', modParity: 'general Mod IDs available but not Unique-linked', statIdParity: 'not joinable from Unique rows', valueParity: 'not joinable from Unique rows', germanCsd: 'not joinable' },
    { id: 'path-of-building-poe2', baseItemParity: 'name-only; rejected', modParity: 'PoB-internal text parser; not game IDs', statIdParity: 'absent', valueParity: 'text-encoded; rejected', germanCsd: 'no technical join' },
    { id: 'poe2-mcp-local-pipeline', baseItemParity: 'no Unique rows', modParity: 'general IDs only', statIdParity: 'general Mods only', valueParity: 'general Mods only', germanCsd: 'no Unique join' },
  ],
  conflicts: 0,
  ambiguities: 'not countable without a shared technical Unique key',
  prohibitedJoinsUsed: false,
}

const legal = sources.map(source => ({
  id: source.id,
  codeLicense: source.id === 'path-of-building-poe2' || source.id === 'poe2-mcp-local-pipeline' || source.id === 'pobr' ? 'MIT' : source.id.startsWith('repoe-') ? 'MIT parser; export data separate' : 'not-applicable-or-unknown',
  dataOrigin: source.operator === 'Grinding Gear Games' ? 'GGG official material/service' : source.id === 'poe2db' ? 'unknown third-party derivation' : 'GGG-derived and/or community-maintained; field-level origin not fully separable',
  localAudit: source.id === 'poe2db' ? 'not-used' : 'reviewed or audit-only',
  repositoryStorage: false,
  webAppDistribution: 'legal-status-unknown',
  runtimeLoading: false,
  attributionRequired: source.operator !== 'Grinding Gear Games',
  status: source.status.includes('license-pending') || source.status.includes('distribution-pending') ? 'license-and/or-distribution-pending' : 'not-approved',
}))

const combination = {
  evaluated: true,
  options: [
    { id: 'repoe-identity-plus-local-mods', identity: 'RePoE Words/stash key', base: 'missing', mod: 'local', result: 'rejected', reason: 'no exact Unique-ID → BaseItemType/Mod foreign key' },
    { id: 'pob-identity-plus-local-csd', identity: 'visible PoB name/block', base: 'visible base name', stats: 'absent', result: 'rejected', reason: 'requires name/text/value matching' },
    { id: 'mcp-mods-plus-local-client', identity: 'missing', stats: 'general Mod IDs', result: 'rejected', reason: 'neither side supplies the missing Unique item relation' },
  ],
  provenanceModel: ['sourceIdentity', 'sourceBaseReference', 'sourceModReference', 'sourceStats', 'sourceValues', 'sourceVariant', 'sourceLocalization'],
  technicallyValidOptions: 0,
  conclusion: 'No combination preserves exact IDs and field provenance without prohibited name/text matching.',
}

const decision = {
  audit: '5M.2.7',
  status: 'completed-source-decision-only',
  pins,
  decision: 'no-technically-sufficient-candidate',
  technicallySuitableUniqueSourceFound: false,
  exactStatement: 'Kein Kandidat liefert die vollständige Unique-ID → Base-ID → Mod/Stat-ID → strukturierte Werte → Varianten-Kette.',
  bestTechnicalCandidate: 'none',
  nextOptions: [
    'GGG-published versioned Unique definition export with stable technical IDs',
    'a reproducible parser/export that proves the missing server-side item relation without text matching',
    'GGG or source-maintainer clarification covering data origin and redistribution before any approval',
  ],
  approvalTaskRecommended: false,
  approvalUnchanged: true,
  productPinUnchanged: true,
  productDataChanged: false,
  uniqueDataImported: false,
  fullTextsCommitted: false,
  runtimeChanged: false,
  task5M2Started: false,
  task5NStarted: false,
  network: { research: true, productRuntime: false, hotlinks: false, scraping: false, tradeApiCalls: false, poe2dbCalls: false },
  updateContract: { fixedSourcePin: true, fixedParserPin: true, deterministicSort: true, hashManifest: true, coverageDiff: true, abortOnIdentityLoss: true, abortOnVariantConflict: true, silentFallback: false },
}

const reports = {
  'poe2-unique-source-candidates.json': { audit: '5M.2.7', pins, requirements, sourceCount: sources.length, deepCandidateCount: deep.length, sources },
  'poe2-unique-source-technical-coverage.json': { audit: '5M.2.7', pins, requirements, candidates: coverage, candidateMatrixStatus: 'no-technically-suitable-candidate' },
  'poe2-unique-source-local-data-parity.json': { audit: '5M.2.7', pins, ...parity },
  'poe2-unique-source-license-and-distribution.json': { audit: '5M.2.7', reviewedNotLegalAdvice: true, codeAndDataLicensesSeparated: true, candidates: legal, finalDistributionStatus: 'pending' },
  'poe2-unique-source-combination-options.json': { audit: '5M.2.7', pins, ...combination },
  'poe2-unique-source-final-decision.json': decision,
}

await mkdir(OUT, { recursive: true })
for (const [name, value] of Object.entries(reports)) await writeFile(resolve(OUT, name), stable(value))
const manifestInput = Object.entries(reports).map(([name, value]) => ({ name, sha256: hash(stable(value)) }))
process.stdout.write(`${JSON.stringify({ status: 'ok', reports: manifestInput }, null, 2)}\n`)
