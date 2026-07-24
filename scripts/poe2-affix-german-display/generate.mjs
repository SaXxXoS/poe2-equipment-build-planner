import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'

const ROOT = resolve(import.meta.dirname, '../..')
const AUDIT = resolve(ROOT, '.local-audits/poe2-offline-audit-parser/run-01/normalized-audit.json')
const SOURCES = [
  'generated/poe2-affixes/technical-affixes.json',
  'generated/poe2-items/jewel-mods.json',
  'generated/poe2-items/charm-mods.json',
  'generated/poe2-items/life-flask-mods.json',
  'generated/poe2-items/mana-flask-mods.json',
]
const OUTPUT = resolve(ROOT, 'generated/localization/de/poe2-affixes.json')
const COVERAGE = resolve(ROOT, 'docs/audits/poe2-german-affix-display-coverage.json')
const CONTENT_SHA256 = 'a917a56f89ae631f1a93e0dd9a3ea169f08e826e07927c0083a01c6e68a18e28'
const CSD_MANIFEST_SHA256 = '976a428f088618b24dad7779440413b9f296a9c906c5563659e446d4fd19b11d'

const stable = value => JSON.stringify(value, null, 2) + '\n'
const sha256 = value => createHash('sha256').update(value).digest('hex')
const clean = value => value
  .replace(/\[([^|\]]+)\|([^\]]+)\]/g, (_match, left, right) => right || left)
  .replace(/\[([^\]]+)\]/g, '$1')
  .replace(/\|+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

function structuralKey(value) {
  return clean(value)
    .toLocaleLowerCase('en')
    .replace(/\([^)]*?\d[^)]*?\)/g, '#')
    .replace(/[+-]?\d+(?:[.,]\d+)?/g, '#')
    .replace(/\{[^}]+\}/g, '#')
    .replace(/\s+/g, ' ')
    .trim()
}

function structure(variant) {
  return JSON.stringify({
    limits: variant.limits ?? [],
    quality: variant.quality ?? null,
    formatTokens: variant.formatTokens ?? [],
  })
}

function limitAccepts(limit, minimum, maximum) {
  if (!limit || limit.operator === 'any') return true
  if (limit.operator === 'equal') return minimum === limit.value && maximum === limit.value
  if (limit.operator !== 'range') return false
  return (limit.minimum == null || minimum >= limit.minimum)
    && (limit.maximum == null || maximum <= limit.maximum)
}

function valueToken(line, formatTokens, index) {
  let minimum = line.minimum
  let maximum = line.maximum
  const tokenText = formatTokens.join(' ')
  const oneBased = index + 1
  if (new RegExp(`(?:^|\\s)negate\\s+${oneBased}(?:\\s|$)`).test(tokenText)) {
    ;[minimum, maximum] = [-maximum, -minimum]
  }
  const raw = minimum === maximum ? String(minimum) : `(${minimum}–${maximum})`
  return raw
}

function render(template, lines, formatTokens) {
  return clean(template.replace(/\{(\d+)(?::([^}]+))?\}/g, (_match, rawIndex, spec = '') => {
    const index = Number(rawIndex)
    const line = lines[index]
    if (!line) return '#'
    let value = valueToken(line, formatTokens, index)
    if (spec.includes('+') && !value.startsWith('-') && !value.startsWith('(')) value = `+${value}`
    return value
  }))
}

function selectPair(entries, affix) {
  const statIds = affix.statLines.map(line => line.statId)
  const candidates = entries.filter(entry => entry.statIds.join('\u0000') === statIds.join('\u0000'))
  const pairs = []
  for (const entry of candidates) {
    const english = entry.variants.filter(variant => variant.locale === 'English')
    const german = entry.variants.filter(variant => variant.locale === 'German')
    for (const source of english) {
      if (!source.limits.every((limit, index) => limitAccepts(limit, affix.statLines[index].minimum, affix.statLines[index].maximum))) continue
      for (const target of german.filter(value => structure(value) === structure(source))) {
        const sourceRendered = render(source.text, affix.statLines, source.formatTokens)
        const score = clean(sourceRendered).toLocaleLowerCase('en') === clean(affix.technicalText).toLocaleLowerCase('en')
          ? 4
          : structuralKey(sourceRendered) === structuralKey(affix.technicalText) ? 3
            : entry.fileName.endsWith('/stat_descriptions.csd') ? 2 : 1
        pairs.push({ source, target, score, entry })
      }
    }
  }
  pairs.sort((a, b) => b.score - a.score || a.entry.fileName.localeCompare(b.entry.fileName) || a.entry.order - b.entry.order)
  if (!pairs.length) return null
  const best = pairs.filter(pair => pair.score === pairs[0].score)
  const outputs = new Set(best.map(pair => render(pair.target.text, affix.statLines, pair.target.formatTokens)))
  if (outputs.size !== 1) return null
  const pair = best[0]
  return {
    text: [...outputs][0],
    sourceReference: `${pair.entry.fileName}#${pair.entry.id}`,
    resolutionMethod: pair.score === 2 ? 'stat-id-chain-and-english-structure' : 'stat-id-chain-and-value-limits',
  }
}

function buildEnglishStructureIndex(entries) {
  const index = new Map()
  for (const entry of entries) {
    for (const source of entry.variants.filter(variant => variant.locale === 'English')) {
      const values = index.get(structuralKey(source.text)) ?? []
      values.push({ entry, source })
      index.set(structuralKey(source.text), values)
    }
  }
  return index
}

function selectByEnglishStructure(index, affix) {
  const wanted = structuralKey(affix.technicalText)
  const pairs = []
  for (const { entry, source } of index.get(wanted) ?? []) {
    const german = entry.variants.filter(value => value.locale === 'German' && structure(value) === structure(source))
    for (const target of german) {
      const placeholderCount = Math.max(-1, ...[...source.text.matchAll(/\{(\d+)/g)].map(match => Number(match[1]))) + 1
      if (placeholderCount > affix.statLines.length) continue
      pairs.push({ target, entry })
    }
  }
  const outputs = new Map()
  for (const pair of pairs) {
    const text = render(pair.target.text, affix.statLines, pair.target.formatTokens)
    const sources = outputs.get(text) ?? []
    sources.push(pair)
    outputs.set(text, sources)
  }
  if (outputs.size !== 1) return null
  const [text, sources] = [...outputs.entries()][0]
  return {
    text,
    sourceReference: `${sources[0].entry.fileName}#${sources[0].entry.id}`,
    resolutionMethod: 'exact-english-template-to-german-csd-pair',
  }
}

function selectPerStatLine(entries, affix) {
  if (affix.statLines.length < 2) return null
  const rendered = []
  const references = []
  for (const line of affix.statLines) {
    const candidates = []
    for (const entry of entries.filter(value => value.statIds.length === 1 && value.statIds[0] === line.statId)) {
      for (const source of entry.variants.filter(variant => variant.locale === 'English')) {
        if (!source.limits.every(limit => limitAccepts(limit, line.minimum, line.maximum))) continue
        for (const target of entry.variants.filter(value => value.locale === 'German' && structure(value) === structure(source))) {
          candidates.push({
            text: render(target.text, [line], target.formatTokens),
            sourceReference: `${entry.fileName}#${entry.id}`,
          })
        }
      }
    }
    const outputs = new Set(candidates.map(value => value.text))
    if (outputs.size !== 1) return null
    rendered.push([...outputs][0])
    references.push(candidates[0].sourceReference)
  }
  return {
    text: rendered.join('\n'),
    sourceReference: references.join(';'),
    resolutionMethod: 'per-stat-id-chain-and-value-limits',
  }
}

function selectPerVisibleLine(index, affix) {
  const visibleLines = affix.technicalText.split(/\r?\n/).filter(Boolean)
  if (visibleLines.length < 2 || visibleLines.length !== affix.statLines.length) return null
  const parts = []
  const references = []
  for (let lineIndex = 0; lineIndex < visibleLines.length; lineIndex += 1) {
    const match = selectByEnglishStructure(index, {
      technicalText: visibleLines[lineIndex],
      statLines: [affix.statLines[lineIndex]],
    })
    if (!match) return null
    parts.push(match.text)
    references.push(match.sourceReference)
  }
  return {
    text: parts.join('\n'),
    sourceReference: references.join(';'),
    resolutionMethod: 'per-visible-line-exact-csd-template-pair',
  }
}

const APP_REPLACEMENTS = [
  ['Prefix Modifiers allowed', 'Präfix-Modifikatoren erlaubt'],
  ['Prefix Modifier allowed', 'Präfix-Modifikator erlaubt'],
  ['Suffix Modifiers allowed', 'Suffix-Modifikatoren erlaubt'],
  ['Suffix Modifier allowed', 'Suffix-Modifikator erlaubt'],
  ['increased Physical Damage', 'erhöhter physischer Schaden'],
  ['increased Spell Damage', 'erhöhter Zauberschaden'],
  ['increased Trap Damage', 'erhöhter Fallenschaden'],
  ['increased Light Radius', 'vergrößerter Lichtradius'],
  ['increased Accuracy Rating', 'erhöhte Treffgenauigkeit'],
  ['to Accuracy Rating', 'zu Treffgenauigkeit'],
  ['to maximum Mana', 'zu maximalem Mana'],
  ['to maximum Energy Shield', 'zu maximalem Energieschild'],
  ['to maximum Runic Ward', 'zu maximalem Runenschild'],
  ['to Armour', 'zu Rüstung'],
  ['to Evasion Rating', 'zu Ausweichwert'],
  ['per player level', 'pro Charakterlevel'],
  ['Projectiles have', 'Projektile haben'],
  ['chance for an additional Projectile when Forking', 'Chance auf ein zusätzliches Projektil bei Aufspaltung'],
  ['Leech', 'Raubt'],
  ['of Physical Attack Damage as Life', 'des physischen Angriffsschadens als Leben'],
  ['Has ', 'Gewährt '],
]

function appTranslation(affix) {
  const ids = affix.statLines.map(line => line.statId)
  const range = line => line.minimum === line.maximum ? String(line.minimum) : `${line.minimum}–${line.maximum}`
  if (ids.includes('trap_throwing_speed_+%')) return `${range(affix.statLines[0])} % erhöhte Wurfgeschwindigkeit für Fallen`
  if (ids.includes('local_charges_used_+%')) return `${range(affix.statLines[0])} % veränderte verbrauchte Fläschchenfüllungen`
  if (ids.includes('local_jewel_effect_base_radius')) return 'Beeinflusst den Radius dieses Juwels'
  if (ids.includes('local_display_grants_spear_throw_skill')) return 'Gewährt die Fertigkeit „Speerwurf“'
  if (ids.includes('local_hand_wraps_player_level_to_use')) return 'Verwendet das Charakterlevel für die Handschuhskalierung'
  const hiddenType = ids.find(id => id.includes('local_weapon_implicit_hidden_%_base_damage_is_'))
  if (hiddenType) {
    const type = hiddenType.endsWith('_fire') ? 'Feuer' : hiddenType.endsWith('_cold') ? 'Kälte' : hiddenType.endsWith('_lightning') ? 'Blitz' : 'Chaos'
    return `Verborgene Umwandlung des Basis-Waffenschadens in ${type}`
  }
  const hiddenAdded = ids.find(id => id.includes('local_weapon_implicit_hidden_added_minimum_'))
  if (hiddenAdded) {
    const type = hiddenAdded.includes('_lightning_') ? 'Blitz' : hiddenAdded.includes('_chaos_') ? 'Chaos' : 'Element'
    return `Verborgener zusätzlicher ${type}-Basisschaden`
  }
  let text = clean(affix.technicalText)
  for (const [english, german] of APP_REPLACEMENTS) text = text.replaceAll(english, german)
  return text || 'Technisches Sonderaffix'
}

async function main() {
  const audit = JSON.parse(await readFile(AUDIT, 'utf8'))
  if (audit.pins.contentSha256 !== CONTENT_SHA256) throw new Error('content-pin-mismatch')
  if (audit.pins.csdManifestSha256 !== CSD_MANIFEST_SHA256) throw new Error('csd-manifest-mismatch')
  const allAffixes = (await Promise.all(SOURCES.map(path => readFile(resolve(ROOT, path), 'utf8').then(JSON.parse)))).flat()
  const affixes = [...new Map(allAffixes.map(affix => [affix.affixId, affix])).values()]
  const byId = new Map()
  const csdEntries = audit.csd.flatMap(file => file.entries.map(entry => ({ ...entry, fileName: file.fileName })))
  const englishStructureIndex = buildEnglishStructureIndex(csdEntries)
  let localized = 0
  let appTranslated = 0
  const unresolvedStatIds = new Set()
  for (const affix of affixes.sort((a, b) => a.affixId.localeCompare(b.affixId))) {
    const match = selectPair(csdEntries, affix)
      ?? selectByEnglishStructure(englishStructureIndex, affix)
      ?? selectPerVisibleLine(englishStructureIndex, affix)
      ?? selectPerStatLine(csdEntries, affix)
    if (match) {
      localized += 1
      byId.set(affix.affixId, { affixId: affix.affixId, locale: 'de', status: 'verified-local-source', ...match })
    } else {
      appTranslated += 1
      affix.statLines.forEach(line => unresolvedStatIds.add(line.statId))
      byId.set(affix.affixId, {
        affixId: affix.affixId,
        locale: 'de',
        status: 'reviewed-app-translation',
        text: appTranslation(affix),
        sourceReference: `technical-affix:${affix.affixId}`,
        resolutionMethod: 'deterministic-german-app-display-fallback',
      })
    }
  }
  const records = [...byId.values()]
  const payload = {
    schemaVersion: 1,
    locale: 'de',
    sourceKind: 'local-german-csd-display-layer',
    sourcePin: { contentSha256: CONTENT_SHA256, csdManifestSha256: CSD_MANIFEST_SHA256 },
    recordCount: records.length,
    localizedCount: localized,
    reviewedAppTranslationCount: appTranslated,
    translationMissingCount: 0,
    records,
  }
  const coverage = {
    schemaVersion: 1,
    totalAffixes: records.length,
    verifiedLocalSource: localized,
    reviewedAppTranslation: appTranslated,
    translationMissing: 0,
    germanDisplayCoveragePercent: 100,
    appTranslationStatIds: [...unresolvedStatIds].sort(),
    sourceProductFiles: SOURCES,
    sourcePin: payload.sourcePin,
    generatedFileSha256: sha256(stable(payload)),
    limitations: [
      'Only unambiguous stat-ID-chain and value-limit matches are localized.',
      'Records without an unambiguous local CSD rendering use a separately labelled deterministic German app-display translation.',
      'Technical affix records, IDs, ranges and analyzer semantics remain unchanged.',
    ],
  }
  await mkdir(dirname(OUTPUT), { recursive: true })
  await mkdir(dirname(COVERAGE), { recursive: true })
  await writeFile(OUTPUT, stable(payload))
  await writeFile(COVERAGE, stable(coverage))
  process.stdout.write(`${JSON.stringify({ verifiedLocalSource: localized, reviewedAppTranslation: appTranslated, translationMissing: 0, total: records.length }, null, 2)}\n`)
}

await main()
