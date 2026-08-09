/* global fetch, process, console, URLSearchParams, setTimeout */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { decodeSearchResponse } from './poe-ninja-search-protobuf.mjs'
import { fetchJson } from './poe-ninja-profile.mjs'

const ROOT = process.cwd()
const OUTPUT = path.join(ROOT, 'docs/audits/poe2-current-meta-reference-profiles.json')
const LEAGUE_URL = 'runesofaldur'
const INDEX_URL = 'https://poe.ninja/poe2/api/data/index-state'
const PROFILE_LIMIT = 20

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))

async function fetchSearch(url, retries = 4) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        accept: 'application/x-protobuf,application/octet-stream',
        'user-agent': 'PoE2-Buildplaner/1.0 local-meta-audit',
      },
    })
    if (response.ok) return decodeSearchResponse(await response.arrayBuffer())
    if (response.status !== 429 || attempt === retries) throw new Error(`HTTP ${response.status}`)
    const retryAfter = Number(response.headers.get('retry-after'))
    await wait(Number.isFinite(retryAfter) && retryAfter > 0
      ? Math.min(20_000, retryAfter * 1000)
      : 2_000 * 2 ** attempt)
  }
  throw new Error('search retry exhausted')
}

export function profileRowsToReferences(rows, ascendancy) {
  return rows
    .filter(row => typeof row.name === 'string' && row.name.length > 0
      && typeof row.account === 'string' && row.account.length > 0)
    .slice(0, PROFILE_LIMIT)
    .map((row, index) => ({
      rank: index + 1,
      characterName: row.name,
      url: `https://poe.ninja/poe2/builds/${LEAGUE_URL}/character/${encodeURIComponent(row.account)}/${encodeURIComponent(row.name)}?i=${index}&search=class%3D${encodeURIComponent(ascendancy)}%26sort%3Ddps`,
      validationStatus: 'unvalidated-correlated-profile',
    }))
}

function snapshotDate(version) {
  const match = String(version).match(/-(\d{4})(\d{2})(\d{2})-/)
  return match ? `${match[1]}-${match[2]}-${match[3]}` : 'unknown'
}

const previous = JSON.parse(await readFile(OUTPUT, 'utf8'))
const index = await fetchJson(INDEX_URL)
const snapshot = index.snapshotVersions.find(value => value.url === LEAGUE_URL)
if (!snapshot?.version || !snapshot?.snapshotName) throw new Error('current snapshot missing')

const ascendancies = []
for (const entry of previous.ascendancies) {
  const params = new URLSearchParams({
    overview: snapshot.snapshotName,
    class: entry.ascendancy,
    sort: 'dps',
  })
  const decoded = await fetchSearch(
    `https://poe.ninja/poe2/api/builds/${encodeURIComponent(snapshot.version)}/search?${params}`,
  )
  const profiles = profileRowsToReferences(decoded.rows, entry.ascendancy)
  if (profiles.length < PROFILE_LIMIT) {
    throw new Error(`${entry.ascendancy}: only ${profiles.length} named profiles`)
  }
  ascendancies.push({ ascendancy: entry.ascendancy, profiles })
  await wait(750)
}

const output = {
  schemaVersion: previous.schemaVersion ?? '1.0.0',
  source: {
    provider: 'poe.ninja',
    league: snapshot.name,
    leagueUrl: snapshot.url,
    version: snapshot.version,
    snapshotName: snapshot.snapshotName,
    passiveTree: snapshot.passiveTree,
    patchFamily: '0.5.x',
    snapshotDate: snapshotDate(snapshot.version),
    sort: 'dps',
    caveat: 'poe.ninja DPS is modeled and is not treated as ground truth',
  },
  ascendancyCount: ascendancies.length,
  profilesPerAscendancy: PROFILE_LIMIT,
  totalProfileReferences: ascendancies.reduce((total, entry) => total + entry.profiles.length, 0),
  usageStatus: 'audit-reference-not-direct-ranking-input',
  ascendancies,
}
await writeFile(OUTPUT, `${JSON.stringify(output, null, 2)}\n`)
console.log(JSON.stringify({
  source: output.source,
  ascendancies: ascendancies.length,
  profiles: ascendancies.reduce((total, entry) => total + entry.profiles.length, 0),
}, null, 2))
