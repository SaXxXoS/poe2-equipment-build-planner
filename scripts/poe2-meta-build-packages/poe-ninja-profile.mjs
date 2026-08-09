/* global fetch, setTimeout, AbortSignal, TextDecoder */

const DEFAULT_TIMEOUT_MS = 12_000

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))

async function checkedFetch(url, {
  accept,
  fetchImplementation,
  timeoutMs,
  retries,
}) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const response = await fetchImplementation(url, {
      headers: {
        accept,
        'user-agent': 'PoE2-Buildplaner/1.0 local-meta-audit',
      },
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (response.ok) return response
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

export async function fetchJson(url, options = {}) {
  const response = await checkedFetch(url, {
    accept: 'application/json',
    fetchImplementation: options.fetchImplementation ?? fetch,
    timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    retries: options.retries ?? 4,
  })
  return response.json()
}

export function parseSseVersionText(text) {
  for (const line of text.split(/\r?\n/)) {
    if (!line.startsWith('data:')) continue
    try {
      const version = JSON.parse(line.slice(5).trim()).version
      if (Number.isInteger(version) || (typeof version === 'string' && version.length > 0)) {
        return version
      }
    } catch {
      // Ignore keep-alive and unrelated SSE messages.
    }
  }
  return null
}

async function fetchSseVersion(url, options = {}) {
  const response = await checkedFetch(url, {
    accept: 'text/event-stream',
    fetchImplementation: options.fetchImplementation ?? fetch,
    timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    retries: options.retries ?? 4,
  })
  const reader = response.body?.getReader()
  if (!reader) {
    const version = parseSseVersionText(await response.text())
    if (version === null) throw new Error('missing-profile-model-version')
    return version
  }

  const decoder = new TextDecoder()
  let text = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      text += decoder.decode(value, { stream: true })
      const version = parseSseVersionText(text)
      if (version !== null) return version
    }
  } finally {
    await reader.cancel().catch(() => {})
  }
  throw new Error('missing-profile-model-version')
}

export async function fetchCurrentCharacterModel({
  account,
  character,
  leagueUrl,
  fetchImplementation = fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  retries = 4,
}) {
  const encodedAccount = encodeURIComponent(account)
  const encodedCharacter = encodeURIComponent(character)
  const encodedLeague = encodeURIComponent(leagueUrl)
  const base = 'https://poe.ninja/poe2/api'
  const version = await fetchSseVersion(
    `${base}/events/character/${encodedAccount}/${encodedLeague}/${encodedCharacter}`,
    { fetchImplementation, timeoutMs, retries },
  )
  const payload = await fetchJson(
    `${base}/profile/characters/${encodedAccount}/${encodedLeague}/${encodedCharacter}/model/${version}`,
    { fetchImplementation, timeoutMs, retries },
  )
  const profile = payload?.charModel ?? payload
  if (!profile || typeof profile !== 'object') throw new Error('missing-character-model')
  return profile
}
