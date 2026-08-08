/* global process, console, URL, URLSearchParams, fetch, setTimeout, AbortSignal */
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  selectMetaRefreshProfileIds,
  shouldPromoteMetaProduct,
} from './policy.mjs'

const ROOT = process.cwd()
const INPUT = path.join(ROOT, 'docs/audits/poe2-current-meta-reference-profiles.json')
const AUDIT_OUTPUT = path.join(ROOT, 'docs/audits/poe2-current-meta-build-profile-validation.json')
const CANDIDATE_AUDIT_OUTPUT = path.join(ROOT, 'docs/audits/poe2-current-meta-build-profile-validation-candidate.json')
const PRODUCT_OUTPUT = path.join(ROOT, 'generated/meta/poe2-build-packages.json')
const INDEX_URL = 'https://poe.ninja/poe2/api/data/index-state'
const LEAGUE_URL = 'runesofaldur'
const MIN_PRODUCTIVE_PROFILES = 2
const CONCURRENCY = 2
const REQUEST_DELAY_MS = 450
const FETCH_TIMEOUT_MS = 12_000
const parsedMaximumNewFetches = Number(process.env.POE2_META_MAX_NEW_FETCHES ?? 24)
const MAX_NEW_FETCHES = Number.isInteger(parsedMaximumNewFetches) && parsedMaximumNewFetches >= 0
  ? parsedMaximumNewFetches
  : 24

const ascendancyIds = {
  Infernalist: 'ascendancy-official-Witch1',
  'Blood Mage': 'ascendancy-official-Witch2',
  Lich: 'ascendancy-official-Witch3',
  'Abyssal Lich': 'ascendancy-official-Witch3b',
  Deadeye: 'ascendancy-official-Ranger1',
  Pathfinder: 'ascendancy-official-Ranger3',
  Titan: 'ascendancy-official-Warrior1',
  Warbringer: 'ascendancy-official-Warrior3',
  'Smith of Kitava': 'ascendancy-official-Warrior2',
  Stormweaver: 'ascendancy-official-Sorceress1',
  Chronomancer: 'ascendancy-official-Sorceress2',
  'Disciple of Varashta': 'ascendancy-official-Sorceress3',
  Amazon: 'ascendancy-official-Huntress1',
  'Spirit Walker': 'ascendancy-official-Huntress2',
  Ritualist: 'ascendancy-official-Huntress3',
  Tactician: 'ascendancy-official-Mercenary1',
  Witchhunter: 'ascendancy-official-Mercenary2',
  'Gemling Legionnaire': 'ascendancy-official-Mercenary3',
  'Martial Artist': 'ascendancy-official-Monk1',
  Invoker: 'ascendancy-official-Monk2',
  'Acolyte of Chayula': 'ascendancy-official-Monk3',
  Oracle: 'ascendancy-official-Druid1',
  Shaman: 'ascendancy-official-Druid2',
}

const weaponPatterns = [
  ['crossbow', /\bcrossbow\b/i],
  ['quarterstaff', /\bquarterstaff\b/i],
  ['wand', /\bwand\b/i],
  ['bow', /\bbow\b/i],
  ['claw', /\bclaw\b/i],
  ['dagger', /\bdagger\b/i],
  ['flail', /\bflail\b/i],
  ['mace', /\bmace\b/i],
  ['spear', /\bspear\b/i],
  ['sword', /\bsword\b/i],
  ['axe', /\baxe\b/i],
]

function hash(value) {
  return createHash('sha256').update(value).digest('hex')
}

function sortedUnique(values) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right))
}

function percentile(values, fraction) {
  if (!values.length) return null
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.floor((sorted.length - 1) * fraction)]
}

function parseProfileUrl(profileUrl) {
  const url = new URL(profileUrl)
  const parts = url.pathname.split('/').filter(Boolean)
  return {
    account: decodeURIComponent(parts.at(-2)),
    name: decodeURIComponent(parts.at(-1)),
  }
}

function extractWeapons(items = []) {
  const result = []
  for (const item of items) {
    const searchable = [
      item?.itemData?.typeLine,
      item?.itemData?.baseType,
      ...(item?.itemData?.properties ?? []).map(property => property?.name),
    ].filter(Boolean).join(' ')
    const match = weaponPatterns.find(([, pattern]) => pattern.test(searchable))
    if (match) result.push(match[0])
  }
  return sortedUnique(result)
}

function extractMainGroup(skills = []) {
  const candidates = skills.map((group, index) => {
    const damaging = [...(group?.dps ?? [])]
      .filter(entry => Number.isFinite(entry?.dps))
      .sort((left, right) => right.dps - left.dps || String(left.name).localeCompare(String(right.name)))
    const mainName = damaging[0]?.name
      ?? group?.allGems?.find(gem => gem?.itemData?.support === false)?.name
    const mainGem = group?.allGems?.find(gem => gem?.name === mainName && gem?.itemData?.support === false)
      ?? group?.allGems?.find(gem => gem?.itemData?.support === false)
    return {
      index,
      name: mainGem?.name,
      dps: damaging[0]?.dps ?? 0,
      supports: sortedUnique((group?.allGems ?? [])
        .filter(gem => gem?.itemData?.support === true)
        .map(gem => gem.name)),
      activeSkills: sortedUnique((group?.allGems ?? [])
        .filter(gem => gem?.itemData?.support === false)
        .map(gem => gem.name)),
    }
  }).filter(candidate => candidate.name)
  return candidates.sort((left, right) =>
    right.dps - left.dps
    || right.supports.length - left.supports.length
    || left.index - right.index,
  )[0] ?? null
}

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))

async function fetchJson(url, retries = 4) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        accept: 'application/json',
        'user-agent': 'PoE2-Buildplaner/1.0 local-meta-audit',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (response.ok) return response.json()
    if (response.status !== 429 || attempt === retries) {
      throw new Error(`HTTP ${response.status}`)
    }
    const retryAfter = Number(response.headers.get('retry-after'))
    await wait(Number.isFinite(retryAfter) && retryAfter > 0
      ? Math.min(15_000, retryAfter * 1000)
      : Math.min(15_000, 1_500 * 2 ** attempt))
  }
  throw new Error('HTTP retry exhausted')
}

async function mapConcurrent(values, concurrency, mapper) {
  const results = new Array(values.length)
  let nextIndex = 0
  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex++
      results[index] = await mapper(values[index], index)
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()))
  return results
}

const reference = JSON.parse(await readFile(INPUT, 'utf8'))
const indexState = await fetchJson(INDEX_URL)
const snapshot = indexState.snapshotVersions.find(value => value.url === LEAGUE_URL)
if (!snapshot?.version || !snapshot?.snapshotName) {
  throw new Error(`Kein exakter Snapshot für ${LEAGUE_URL}`)
}

const requestedProfiles = reference.ascendancies.flatMap(entry =>
  entry.profiles.map(profile => ({
    expectedAscendancy: entry.ascendancy,
    rank: profile.rank,
    url: profile.url,
  })),
)

let previousObservations = new Map()
for (const previousAuditPath of [CANDIDATE_AUDIT_OUTPUT, AUDIT_OUTPUT]) {
  try {
    const previous = JSON.parse(await readFile(previousAuditPath, 'utf8'))
    if (previous.source?.version === snapshot.version) {
      previousObservations = new Map(previous.observations
        .map(value => [value.profileId, value]))
      break
    }
  } catch {
    // Der erste Lauf eines Snapshots besitzt noch keinen passenden Bericht.
  }
}

let previousProduct = null
try {
  previousProduct = JSON.parse(await readFile(PRODUCT_OUTPUT, 'utf8'))
} catch {
  // Vor dem ersten produktiven Snapshot existiert noch keine Vergleichsbasis.
}

const profileIdFor = requested => hash(requested.url).slice(0, 20)
const pendingProfiles = requestedProfiles.filter(requested => {
  const previous = previousObservations.get(profileIdFor(requested))
  return !previous || previous.validationStatus === 'fetch-failed'
})

// Ein kompletter Snapshot besitzt mehrere hundert Profile. Die öffentliche
// Quelle begrenzt Abrufe; ein Alles-oder-nichts-Lauf verlor deshalb bei einem
// Timeout den gesamten Fortschritt. Die feste Rang-Runde nimmt pro Aszendenz
// zunächst Rang 1, dann Rang 2 usw. und lässt sich in kleinen, deterministischen
// Batches wiederholen. Bereits validierte Beobachtungen bleiben unverändert.
const fetchProfileIds = selectMetaRefreshProfileIds({
  pendingProfiles,
  previousObservations,
  ascendancyOrder: reference.ascendancies.map(value => value.ascendancy),
  maximumNewFetches: MAX_NEW_FETCHES,
  profileIdFor,
})

function pendingObservation(requested, profileId) {
  return {
    profileId,
    rank: requested.rank,
    expectedAscendancy: requested.expectedAscendancy,
    observedAscendancy: null,
    ascendancyId: ascendancyIds[requested.expectedAscendancy] ?? null,
    level: null,
    mainSkill: null,
    mainSkillModeledDps: null,
    supports: [],
    linkedActiveSkills: [],
    weapons: [],
    passiveCounts: { normal: null, ascendancy: null, weaponSet1: null, weaponSet2: null },
    validationStatus: 'fetch-failed',
    blockReasons: ['not-attempted-in-current-batch'],
    attemptCount: 0,
  }
}

const observations = await mapConcurrent(requestedProfiles, CONCURRENCY, async requested => {
  const profileId = profileIdFor(requested)
  const previous = previousObservations.get(profileId)
  if (previous && previous.validationStatus !== 'fetch-failed') return previous
  if (!fetchProfileIds.has(profileId)) return previous ?? pendingObservation(requested, profileId)
  try {
    await wait(REQUEST_DELAY_MS)
    const { account, name } = parseProfileUrl(requested.url)
    const query = new URLSearchParams({
      account,
      name,
      overview: snapshot.snapshotName,
      timeMachine: '',
    })
    const profile = await fetchJson(
      `https://poe.ninja/poe2/api/builds/${snapshot.version}/character?${query}`,
    )
    const ascendancyId = ascendancyIds[requested.expectedAscendancy]
    const mainGroup = extractMainGroup(profile.skills)
    const weapons = extractWeapons(profile.items)
    const valid = Boolean(
      ascendancyId
      && profile.class === requested.expectedAscendancy
      && mainGroup?.name
      && weapons.length,
    )
    return {
      profileId,
      rank: requested.rank,
      expectedAscendancy: requested.expectedAscendancy,
      observedAscendancy: profile.class ?? null,
      ascendancyId: ascendancyId ?? null,
      level: Number.isFinite(profile.level) ? profile.level : null,
      mainSkill: mainGroup?.name ?? null,
      mainSkillModeledDps: mainGroup?.dps ?? null,
      supports: mainGroup?.supports ?? [],
      linkedActiveSkills: mainGroup?.activeSkills ?? [],
      weapons,
      passiveCounts: {
        normal: profile.passiveCounts?.passives ?? null,
        ascendancy: profile.passiveCounts?.ascendancy ?? null,
        weaponSet1: Array.isArray(profile.passiveSelectionSet1) ? profile.passiveSelectionSet1.length : null,
        weaponSet2: Array.isArray(profile.passiveSelectionSet2) ? profile.passiveSelectionSet2.length : null,
      },
      validationStatus: valid ? 'validated-correlated-profile' : 'blocked-incomplete-correlation',
      blockReasons: [
        ...(!ascendancyId ? ['unknown-ascendancy-mapping'] : []),
        ...(profile.class !== requested.expectedAscendancy ? ['ascendancy-mismatch'] : []),
        ...(!mainGroup?.name ? ['missing-main-skill'] : []),
        ...(!weapons.length ? ['missing-supported-weapon-class'] : []),
      ],
      attemptCount: (previous?.attemptCount ?? 0) + 1,
    }
  } catch (error) {
    return {
      profileId,
      rank: requested.rank,
      expectedAscendancy: requested.expectedAscendancy,
      observedAscendancy: null,
      ascendancyId: ascendancyIds[requested.expectedAscendancy] ?? null,
      level: null,
      mainSkill: null,
      mainSkillModeledDps: null,
      supports: [],
      linkedActiveSkills: [],
      weapons: [],
      passiveCounts: { normal: null, ascendancy: null, weaponSet1: null, weaponSet2: null },
      validationStatus: 'fetch-failed',
      blockReasons: [String(error?.message ?? error)],
      attemptCount: (previous?.attemptCount ?? 0) + 1,
    }
  }
})

const packageMap = new Map()
for (const observation of observations.filter(value =>
  value.validationStatus === 'validated-correlated-profile',
)) {
  for (const weapon of observation.weapons) {
    const key = `${observation.ascendancyId}\u0000${observation.mainSkill}\u0000${weapon}`
    const current = packageMap.get(key) ?? {
      ascendancyId: observation.ascendancyId,
      ascendancy: observation.expectedAscendancy,
      mainSkill: observation.mainSkill,
      weapon,
      profileIds: [],
      supports: new Map(),
      linkedActiveSkills: new Map(),
      modeledDps: [],
      passiveNormal: [],
      passiveAscendancy: [],
      weaponSet1Counts: [],
      weaponSet2Counts: [],
    }
    current.profileIds.push(observation.profileId)
    current.modeledDps.push(observation.mainSkillModeledDps)
    current.passiveNormal.push(observation.passiveCounts.normal)
    current.passiveAscendancy.push(observation.passiveCounts.ascendancy)
    current.weaponSet1Counts.push(observation.passiveCounts.weaponSet1)
    current.weaponSet2Counts.push(observation.passiveCounts.weaponSet2)
    for (const support of observation.supports) {
      current.supports.set(support, (current.supports.get(support) ?? 0) + 1)
    }
    for (const skill of observation.linkedActiveSkills.filter(value => value !== observation.mainSkill)) {
      current.linkedActiveSkills.set(skill, (current.linkedActiveSkills.get(skill) ?? 0) + 1)
    }
    packageMap.set(key, current)
  }
}

const packages = [...packageMap.values()].map(value => {
  const profileCount = value.profileIds.length
  const counted = map => [...map.entries()]
    .map(([name, count]) => ({ name, count, share: Math.round(count / profileCount * 100) }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
  return {
    packageId: hash(`${value.ascendancyId}|${value.mainSkill}|${value.weapon}`).slice(0, 20),
    ascendancyId: value.ascendancyId,
    ascendancy: value.ascendancy,
    mainSkill: value.mainSkill,
    weapon: value.weapon,
    profileCount,
    evidenceClass: profileCount >= MIN_PRODUCTIVE_PROFILES
      ? 'multi-profile-correlated-exact'
      : 'single-profile-audit-only',
    productive: profileCount >= MIN_PRODUCTIVE_PROFILES,
    supports: counted(value.supports),
    linkedActiveSkills: counted(value.linkedActiveSkills),
    modeledDpsSummary: {
      caveat: 'poe.ninja/PoB-Modellwert; nicht als App-DPS oder Spielgarantie verwenden',
      median: percentile(value.modeledDps.filter(Number.isFinite), 0.5),
      maximum: percentile(value.modeledDps.filter(Number.isFinite), 1),
    },
    passiveSummary: {
      normalMedian: percentile(value.passiveNormal.filter(Number.isFinite), 0.5),
      ascendancyMedian: percentile(value.passiveAscendancy.filter(Number.isFinite), 0.5),
      profilesWithWeaponSet1: value.weaponSet1Counts.filter(count => count > 0).length,
      profilesWithWeaponSet2: value.weaponSet2Counts.filter(count => count > 0).length,
    },
    profileEvidenceIds: value.profileIds.sort(),
  }
}).sort((left, right) =>
  left.ascendancyId.localeCompare(right.ascendancyId)
  || right.profileCount - left.profileCount
  || left.mainSkill.localeCompare(right.mainSkill)
  || left.weapon.localeCompare(right.weapon),
)

const validated = observations.filter(value => value.validationStatus === 'validated-correlated-profile')
const audit = {
  schemaVersion: '1.0.0',
  source: {
    provider: 'poe.ninja',
    league: snapshot.name,
    leagueUrl: snapshot.url,
    version: snapshot.version,
    snapshotName: snapshot.snapshotName,
    passiveTree: snapshot.passiveTree,
      snapshotDate: reference.source.snapshotDate,
    profileListHash: hash(JSON.stringify(requestedProfiles.map(value => value.url))),
  },
  policy: {
    runtimeNetwork: false,
    rawProfilesStored: false,
    accountNamesStored: false,
    characterNamesStored: false,
    pathOfBuildingExportsStored: false,
    directDpsRanking: false,
    minimumProductiveProfiles: MIN_PRODUCTIVE_PROFILES,
    productiveUse: 'bounded-secondary-evidence-after-hard-compatibility',
  },
  refreshBatch: {
    maximumNewFetches: MAX_NEW_FETCHES,
    selectedProfiles: fetchProfileIds.size,
    reusableProfiles: observations.filter(value => {
      const previous = previousObservations.get(value.profileId)
      return previous && previous.validationStatus !== 'fetch-failed'
    }).length,
    remainingProfiles: observations.filter(value => value.validationStatus === 'fetch-failed').length,
    order: 'fewest-attempts-then-profile-rank-then-ascendancy',
  },
  requestedProfiles: requestedProfiles.length,
  validatedProfiles: validated.length,
  blockedProfiles: observations.length - validated.length,
  productivePackageCount: packages.filter(value => value.productive).length,
  auditOnlyPackageCount: packages.filter(value => !value.productive).length,
  observations,
  limitations: [
    'Die Stichprobe besteht aus nach poe.ninja-Modell-DPS sortierten öffentlichen Profilen und ist keine Zufallsstichprobe.',
    'PoB-/poe.ninja-DPS ist ein Modellwert und wird nicht als garantierter Spielschaden übernommen.',
    'Waffen werden aus sichtbaren, strukturierten Itemeigenschaften abgeleitet; nicht unterstützte Klassen bleiben blockiert.',
    'Support- und Skillbezüge stammen nur aus derselben Gemmengruppe desselben Profils.',
    'Passive Einzelknoten werden in diesem Schritt nicht als Spielregel importiert.',
  ],
}

const product = {
  schemaVersion: '1.0.0',
  source: audit.source,
  policy: audit.policy,
  profileCount: validated.length,
  packageCount: packages.filter(value => value.productive).length,
  packages: packages.filter(value => value.productive),
}

const productPromoted = shouldPromoteMetaProduct(previousProduct, product)
audit.productPromotion = {
  promoted: productPromoted,
  candidateVersion: snapshot.version,
  candidateValidatedProfiles: product.profileCount,
  candidatePackageCount: product.packageCount,
  activeVersionBeforeRun: previousProduct?.source?.version ?? null,
  activeValidatedProfilesBeforeRun: previousProduct?.profileCount ?? null,
  activePackageCountBeforeRun: previousProduct?.packageCount ?? null,
  rule: 'same snapshot or at least previous validated-profile and productive-package coverage',
}
const selectedAuditOutput = productPromoted ? AUDIT_OUTPUT : CANDIDATE_AUDIT_OUTPUT
audit.productPromotion.auditOutput = path.relative(ROOT, selectedAuditOutput).replaceAll('\\', '/')

await mkdir(path.dirname(selectedAuditOutput), { recursive: true })
await mkdir(path.dirname(PRODUCT_OUTPUT), { recursive: true })
await writeFile(selectedAuditOutput, `${JSON.stringify(audit, null, 2)}\n`)
if (productPromoted) {
  await writeFile(PRODUCT_OUTPUT, `${JSON.stringify(product, null, 2)}\n`)
}
console.log(JSON.stringify({
  version: snapshot.version,
  requestedProfiles: requestedProfiles.length,
  validatedProfiles: audit.validatedProfiles,
  blockedProfiles: audit.blockedProfiles,
  productivePackageCount: product.packageCount,
  refreshBatch: audit.refreshBatch,
  productPromotion: audit.productPromotion,
}, null, 2))
