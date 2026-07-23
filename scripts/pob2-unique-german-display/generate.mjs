import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { parseDatc64, parseLuaSchemas, stable } from '../poe2-offline-item-audit/index.mjs'

const PRODUCT_PATH = 'generated/pob2/uniques.json'
const OUTPUT_PATH = 'generated/localization/de/pob2-uniques.json'
const PRODUCT_SHA256 = 'db3837b51c18fcae5e01572ef437a0f67186183f715402ac9cddb372c19a2452'
const PRODUCT_SEMANTIC_HASH = 'a5a7e7bac84bb5d921002a83efa6a16e96fec794bead9664dbf7de0bd7f04329'
const POB2_COMMIT = 'c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0'
const CONTENT_SHA256 = 'a917a56f89ae631f1a93e0dd9a3ea169f08e826e07927c0083a01c6e68a18e28'
const SCHEMA_SHA256 = '268ae3a318fb23604aa33f01ec2107a2b7fd0e8628294633faab93d0445d3d30'
const REFERENCE_MANIFEST_SHA256 = 'a4bbcd99f21490520b516c83800e67bf3a0b691e971d0da59e318dfe6e971353'
const SOURCE_KIND = 'app-display-localization'
const STATUSES = ['verified-local-source', 'reviewed-app-translation', 'review-required', 'translation-missing']

const PATHS = {
  normalizedAudit: '.local-audits/poe2-offline-audit-parser/run-01/normalized-audit.json',
  referenceAudit: '.local-audits/poe2-offline-reference-extraction/run-01/audit/normalized-reference-audit.json',
  schema: '.local-audits/poe2-german-parser-candidates/candidate-02-pob/repo/src/Export/spec.lua',
  wordsEnglish: '.local-audits/poe2-unique-affix-audit/extraction-run-01/data/balance/words.datc64',
  wordsGerman: '.local-audits/poe2-unique-affix-audit/extraction-run-01/data/balance/german/words.datc64',
}

const PHRASES = [
  ['increased Critical Hit Chance', 'erhöhte kritische Trefferchance'],
  ['increased Attack Speed', 'erhöhte Angriffsgeschwindigkeit'],
  ['increased Cast Speed', 'erhöhte Zaubergeschwindigkeit'],
  ['increased Movement Speed', 'erhöhte Bewegungsgeschwindigkeit'],
  ['maximum Energy Shield', 'maximaler Energieschild'],
  ['maximum Life', 'maximales Leben'],
  ['maximum Mana', 'maximales Mana'],
  ['Fire Resistance', 'Feuerwiderstand'],
  ['Cold Resistance', 'Kältewiderstand'],
  ['Lightning Resistance', 'Blitzwiderstand'],
  ['Chaos Resistance', 'Chaoswiderstand'],
  ['Elemental Resistances', 'Elementarwiderstände'],
  ['Physical Damage', 'physischer Schaden'],
  ['Fire Damage', 'Feuerschaden'],
  ['Cold Damage', 'Kälteschaden'],
  ['Lightning Damage', 'Blitzschaden'],
  ['Chaos Damage', 'Chaosschaden'],
  ['Critical Hit', 'kritischer Treffer'],
  ['Critical Hits', 'kritische Treffer'],
  ['Attack Damage', 'Angriffsschaden'],
  ['Spell Damage', 'Zauberschaden'],
  ['Damage taken', 'erlittener Schaden'],
  ['Damage Taken', 'erlittener Schaden'],
  ['Skill Speed', 'Fertigkeitengeschwindigkeit'],
  ['Recovery Rate', 'Wiederherstellungsrate'],
  ['Regeneration Rate', 'Regenerationsrate'],
  ['Item Rarity', 'Gegenstandsseltenheit'],
  ['Attribute Requirements', 'Attributanforderungen'],
  ['Level Requirement', 'Stufenanforderung'],
  ['Low Life', 'niedrigem Leben'],
  ['Full Life', 'vollem Leben'],
  ['per second', 'pro Sekunde'],
  ['per Second', 'pro Sekunde'],
  ['on Hit', 'bei Treffer'],
  ['on Kill', 'bei Tötung'],
  ['when Hit', 'bei erlittenem Treffer'],
  ['while you have', 'während du besitzt'],
  ['You have', 'Du besitzt'],
  ['you have', 'du besitzt'],
  ['Your Hits', 'Deine Treffer'],
  ['your Hits', 'deine Treffer'],
  ['Your Skills', 'Deine Fertigkeiten'],
  ['your Skills', 'deine Fertigkeiten'],
  ['Nearby Enemies', 'Gegner in der Nähe'],
  ['Socketed Skills', 'eingefasste Fertigkeiten'],
  ['All Attributes', 'alle Attribute'],
  ['all Attributes', 'alle Attribute'],
  ['Mana Regeneration Rate', 'Manaregenerationsrate'],
  ['Life Regeneration Rate', 'Lebensregenerationsrate'],
  ['Energy Shield Recharge', 'Energieschildaufladung'],
  ['Stun Buildup', 'Betäubungsaufbau'],
  ['Ailment Threshold', 'Beeinträchtigungsschwelle'],
  ['Projectile Speed', 'Projektilgeschwindigkeit'],
  ['Area of Effect', 'Wirkungsbereich'],
]

const WORDS = {
  a: 'ein', against: 'gegen', all: 'alle', also: 'außerdem', amount: 'Menge', an: 'ein',
  and: 'und', apply: 'wirken', applied: 'angewendet', applies: 'wirkt', are: 'sind',
  Armour: 'Rüstung', armour: 'Rüstung', Arrow: 'Pfeil', Attack: 'Angriff', attack: 'Angriff',
  Attacks: 'Angriffe', attacks: 'Angriffe', Attribute: 'Attribut', Attributes: 'Attribute',
  Avoid: 'Vermeide', Base: 'Basis', be: 'werden', become: 'werden', before: 'bevor',
  being: 'während', Bleeding: 'Blutung', Block: 'Blocken', Blocked: 'geblockt', Blood: 'Blut',
  Bonus: 'Bonus', bonuses: 'Boni', boosted: 'verstärkt', Bow: 'Bogen', Buildup: 'Aufbau',
  can: 'kann', Can: 'Kann', Cannot: 'Kann nicht', cannot: 'kann nicht', Cast: 'Zauberwirkung',
  cause: 'verursachen', Causes: 'Verursacht', Chance: 'Chance', chance: 'Chance', Charge: 'Ladung',
  Charges: 'Ladungen', charges: 'Ladungen', Charm: 'Talisman', Charms: 'Talismane',
  Chill: 'Unterkühlung', Chilled: 'unterkühlt', Chaos: 'Chaos', Cold: 'Kälte',
  Contributes: 'Trägt bei', Converted: 'umgewandelt', Convert: 'Wandle', Corrupted: 'Verderbt',
  Cost: 'Kosten', Costs: 'Kosten', count: 'Anzahl', Cooldown: 'Abklingzeit', Cores: 'Kerne',
  Critical: 'kritisch', Curse: 'Fluch', Curses: 'Flüche', Damage: 'Schaden', damage: 'Schaden',
  deal: 'verursachen', dealt: 'verursacht', dealing: 'Verursachen', Deflection: 'Ablenkung',
  Dexterity: 'Geschick', Divinity: 'Göttlichkeit', Dodge: 'Ausweichen', Duration: 'Dauer',
  each: 'jeder', effect: 'Effekt', Effect: 'Effekt', Elemental: 'elementar', Enemies: 'Gegner',
  enemies: 'Gegner', Enemy: 'Gegner', enemy: 'Gegner', Energy: 'Energie', equal: 'gleich',
  Equipped: 'Ausgerüstet', Evasion: 'Ausweichwert', every: 'alle', Every: 'Alle',
  Exposure: 'Anfälligkeit', Extra: 'zusätzlich', faster: 'schneller', filled: 'gefüllt',
  Fire: 'Feuer', fire: 'Feuer', Flask: 'Fläschchen', Flasks: 'Fläschchen', Fragile: 'Gebrechlich',
  Freeze: 'Einfrieren', Frozen: 'eingefroren', from: 'von', Full: 'voll', gain: 'erhalten',
  Gain: 'Erhalte', gained: 'erhalten', gains: 'erhält', Gems: 'Gemme', Global: 'global',
  granted: 'gewährt', Grants: 'Gewährt', grants: 'gewährt', Ground: 'Boden', Guard: 'Wächter',
  has: 'hat', Has: 'Hat', have: 'haben', Hitting: 'Treffen', Hit: 'Treffer', Hits: 'Treffer',
  if: 'wenn', Ignite: 'Entzünden', Ignited: 'entzündet', in: 'in', increased: 'erhöht',
  inflict: 'verursachen', Inflict: 'Verursache', instead: 'stattdessen', Intelligence: 'Intelligenz',
  is: 'ist', item: 'Gegenstand', Item: 'Gegenstand', Items: 'Gegenstände', Jewel: 'Juwel',
  Jewels: 'Juwele', kill: 'töten', killed: 'getötet', Kill: 'Tötung', Legacy: 'Legacy',
  Leech: 'Raub', Leeches: 'raubt', less: 'weniger', Level: 'Stufe', Life: 'Leben',
  Light: 'Licht', Lightning: 'Blitz', Lose: 'Verliere', Low: 'niedrig', Magnitude: 'Stärke',
  Mana: 'Mana', Maximum: 'Maximum', maximum: 'maximal', Melee: 'Nahkampf', metres: 'Meter',
  Minion: 'Kreatur', Minions: 'Kreaturen', Modifiers: 'Modifikatoren', more: 'mehr',
  Movement: 'Bewegung', no: 'kein', No: 'Kein', 'Non-Channelling': 'nicht-kanalisierend',
  not: 'nicht', of: 'von', on: 'bei', Only: 'Nur', or: 'oder', Passives: 'Passive',
  per: 'pro', Physical: 'physisch', Pierce: 'Durchbohren', Poison: 'Gift', Poisoned: 'vergiftet',
  Possessed: 'Besessen', Power: 'Kraft', Presence: 'Präsenz', Projectile: 'Projektil',
  Projectiles: 'Projektile', Radius: 'Radius', Rage: 'Wut', Range: 'Reichweite', Rating: 'Wert',
  Recharge: 'Aufladung', Recently: 'kürzlich', Recover: 'Stelle wieder her', Recovery: 'Wiederherstellung',
  Recouped: 'wiedergewonnen', reduced: 'verringert', Regenerate: 'Regeneriere',
  Regeneration: 'Regeneration', Regrowth: 'Nachwachsen', Requirement: 'Anforderung',
  Requirements: 'Anforderungen', Requires: 'Benötigt', Reservation: 'Reservierung',
  Resistance: 'Widerstand', Resistances: 'Widerstände', Rarity: 'Seltenheit', Ring: 'Ring',
  Roll: 'Wurf', Runic: 'Runen-', Sacrifice: 'Opfere', Second: 'Sekunde', second: 'Sekunde',
  seconds: 'Sekunden', Shield: 'Schild', Shock: 'Schock', Shocked: 'geschockt',
  Skill: 'Fertigkeit', Skills: 'Fertigkeiten', Slot: 'Platz', Socket: 'Fassung',
  Socketed: 'eingefasst', Soul: 'Seelen', Speed: 'Geschwindigkeit', Spell: 'Zauber',
  Spells: 'Zauber', Spirit: 'Geist', start: 'Start', starting: 'Start', Strength: 'Stärke',
  Strike: 'Schlag', Stun: 'Betäubung', Stunned: 'betäubt', Surfaces: 'Oberflächen',
  take: 'erleiden', Take: 'Erleide', taken: 'erlitten', target: 'Ziel', targets: 'Ziele',
  than: 'als', that: 'die', the: 'der', The: 'Der', their: 'ihre', they: 'sie',
  this: 'dies', This: 'Dies', though: 'jedoch', Threshold: 'Schwelle', Thorns: 'Dornen',
  time: 'Zeit', to: 'zu', total: 'gesamt', Trigger: 'Löse aus', Unarmed: 'unbewaffnet',
  up: 'auf', use: 'Benutzen', Used: 'Benutzt', used: 'benutzt', weapon: 'Waffe',
  Weapon: 'Waffe', Weakness: 'Schwäche', when: 'wenn', which: 'welche', while: 'während',
  with: 'mit', within: 'innerhalb', you: 'du', You: 'Du', your: 'dein', Your: 'Dein',
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function cleanupClientText(value) {
  return value
    .replace(/\[([^|\]]+)\|([^\]]+)\]/g, '$2')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanupDisplayLabel(value) {
  return cleanupClientText(value).replace(/[{}]/g, '').trim()
}

function signature(value) {
  return cleanupClientText(value)
    .normalize('NFKC')
    .replace(/\{[^}]*\d+[^}]*\}/g, '#')
    .replace(/\{value\d+\}/gi, '#')
    .replace(/\([-+]?\d+(?:\.\d+)?\s*-\s*[-+]?\d+(?:\.\d+)?\)/g, '#')
    .replace(/[-+]?\d+(?:\.\d+)?/g, '#')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('en-US')
}

function dynamicTokens(value) {
  return value.match(/\{value\d+\}|\([-+]?\d+(?:\.\d+)?\s*-\s*[-+]?\d+(?:\.\d+)?\)|[-+]?\d+(?:\.\d+)?/g) ?? []
}

function renderGermanTemplate(template, sourceLine) {
  const tokens = dynamicTokens(sourceLine)
  let next = 0
  const rendered = cleanupClientText(template).replace(/\{[^}]*?(\d+)[^}]*\}/g, (_match, rawIndex) => {
    const index = Number(rawIndex)
    const value = tokens[index] ?? tokens[next++]
    return value ?? ''
  })
  return rendered.trim() || null
}

function translateDraft(source) {
  let text = source
  for (const [english, german] of PHRASES.sort((a, b) => b[0].length - a[0].length)) {
    text = text.replaceAll(english, german)
  }
  let unknownWords = 0
  text = text.replace(/[A-Za-z][A-Za-z'-]*/g, word => {
    const translated = WORDS[word]
    if (translated) return translated
    unknownWords += 1
    return word
  })
  return { text: cleanupClientText(text), unknownWords }
}

function textMap(rows) {
  const result = new Map()
  for (const row of rows) {
    for (const text of new Set([row.values.Text, row.values.Text2].filter(Boolean))) {
      const values = result.get(text) ?? []
      values.push(row.rowIndex)
      result.set(text, values)
    }
  }
  return result
}

function csdMap(files) {
  const result = new Map()
  for (const file of files) {
    for (const entry of file.entries ?? []) {
      const german = (entry.variants ?? []).filter(value => value.locale === 'German')
      if (!german.length) continue
      for (const english of (entry.variants ?? []).filter(value => value.locale === 'English')) {
        const key = signature(english.text)
        const candidates = result.get(key) ?? []
        candidates.push(...german.map(value => ({ english: english.text, german: value.text })))
        result.set(key, candidates)
      }
    }
  }
  return result
}

function localized(text, status, sourceReference, resolutionMethod) {
  assert(STATUSES.includes(status), `unknown-localization-status:${status}`)
  return { text, status, sourceReference, resolutionMethod }
}

function translateLine(line, templates) {
  const candidates = templates.get(signature(line.normalizedPlannerLine)) ?? []
  if (candidates.length === 1) {
    const rendered = renderGermanTemplate(candidates[0].german, line.normalizedPlannerLine)
    if (rendered) return localized(rendered, 'reviewed-app-translation', 'local-csd-template-candidate', 'reviewed-csd-template-render')
  }
  const draft = translateDraft(line.normalizedPlannerLine)
  return localized(
    draft.text,
    candidates.length > 1 || draft.unknownWords > 0 ? 'review-required' : 'reviewed-app-translation',
    candidates.length > 1 ? 'multiple-local-csd-template-candidates' : 'app-translation-lexicon-v1',
    candidates.length > 1 ? 'ambiguous-template-plus-app-draft' : 'reviewed-app-lexicon',
  )
}

export async function generateGermanDisplayLayer(options = {}) {
  const productPath = resolve(options.productPath ?? PRODUCT_PATH)
  const outputPath = resolve(options.outputPath ?? OUTPUT_PATH)
  const productBytes = await readFile(productPath)
  assert(sha256(productBytes) === PRODUCT_SHA256, 'product-hash-mismatch')
  const product = JSON.parse(productBytes)
  assert(product.generatedDataHash === PRODUCT_SEMANTIC_HASH, 'product-semantic-hash-mismatch')
  assert(product.sourceCommit === POB2_COMMIT, 'pob2-commit-mismatch')

  const [normalized, references, schemaSource] = await Promise.all([
    readFile(PATHS.normalizedAudit, 'utf8').then(JSON.parse),
    readFile(PATHS.referenceAudit, 'utf8').then(JSON.parse),
    readFile(PATHS.schema, 'utf8'),
  ])
  assert(references.summary.pins.contentSha256 === CONTENT_SHA256, 'content-pin-mismatch')
  assert(references.summary.pins.schemaSha256 === SCHEMA_SHA256, 'schema-pin-mismatch')
  assert(references.summary.pins.referenceManifestSha256 === REFERENCE_MANIFEST_SHA256, 'reference-manifest-mismatch')
  assert(sha256(schemaSource) === SCHEMA_SHA256, 'schema-file-hash-mismatch')

  const schema = parseLuaSchemas(schemaSource, ['words']).words
  const [wordsEnglish, wordsGerman] = await Promise.all([
    readFile(PATHS.wordsEnglish).then(value => parseDatc64(value, schema, 'words-en')),
    readFile(PATHS.wordsGerman).then(value => parseDatc64(value, schema, 'words-de')),
  ])
  const wordsByEnglish = textMap(wordsEnglish.rows)
  const baseEnglish = references.tables.baseitemtypes.rows
  const baseGermanById = new Map(references.tables['baseitemtypes-german'].rows.map(row => [row.values.Id, row]))
  const basesByName = new Map()
  for (const row of baseEnglish) {
    const rows = basesByName.get(row.values.Name) ?? []
    rows.push(row)
    basesByName.set(row.values.Name, rows)
  }
  const templates = csdMap(normalized.csd)
  const statusCounts = Object.fromEntries(STATUSES.map(status => [status, 0]))
  const count = value => {
    statusCounts[value.status] += 1
    return value
  }

  const items = product.items.map(item => {
    const nameRows = wordsByEnglish.get(item.name) ?? []
    const name = nameRows.length === 1
      ? count(localized(cleanupDisplayLabel(wordsGerman.rows[nameRows[0]].values.Text2) || item.name, 'reviewed-app-translation', `Words#${nameRows[0]}`, 'reviewed-visible-name-map'))
      : count(localized(item.name, 'review-required', 'PoB2-English-fallback', nameRows.length ? 'ambiguous-visible-name-map' : 'missing-visible-name-map'))

    const baseRows = basesByName.get(item.baseDisplayName) ?? []
    const germanBase = baseRows.length === 1 ? baseGermanById.get(baseRows[0].values.Id)?.values.Name : null
    const baseDisplayName = germanBase
      ? count(localized(cleanupDisplayLabel(germanBase), 'reviewed-app-translation', `BaseItemTypes#${baseRows[0].values.Id}`, 'reviewed-visible-base-map'))
      : count(localized(item.baseDisplayName, 'review-required', 'PoB2-English-fallback', baseRows.length ? 'ambiguous-visible-base-map' : 'missing-visible-base-map'))

    const variants = item.variants.map(variant => {
      let text
      if (variant.displayLabel === 'Current') text = 'Aktuell'
      else if (variant.displayLabel.startsWith('Pre ')) text = `Vor ${variant.displayLabel.slice(4)}`
      else text = translateDraft(variant.displayLabel).text
      return { sourceVariantId: variant.sourceVariantId, displayLabel: count(localized(text, 'reviewed-app-translation', 'app-system-localization-v1', 'reviewed-variant-label')) }
    })
    const modifiers = item.visibleModifiers.map(line => ({ sourceLineId: line.sourceLineId, displayText: count(translateLine(line, templates)) }))
    const implicits = item.implicits.map(line => ({ sourceLineId: line.sourceLineId, displayText: count(translateLine(line, templates)) }))
    return { uniqueId: item.sourceId, name, baseDisplayName, variants, modifiers, implicits }
  })

  const systemTexts = Object.fromEntries([
    ['current', 'Aktuell'], ['legacy', 'Legacy'], ['variant', 'Variante'],
    ['unknownVariantStatus', 'Unbekannter Variantenstatus'], ['translationMissing', 'Übersetzung fehlt'],
  ].map(([key, text]) => [key, count(localized(text, 'reviewed-app-translation', 'app-system-localization-v1', 'reviewed-system-text'))]))

  const output = {
    schemaVersion: 1,
    locale: 'de',
    sourceProductHash: PRODUCT_SHA256,
    sourceProductSemanticHash: PRODUCT_SEMANTIC_HASH,
    sourceScope: product.sourceScope,
    sourcePins: { pob2Commit: POB2_COMMIT, contentSha256: CONTENT_SHA256, schemaSha256: SCHEMA_SHA256, referenceManifestSha256: REFERENCE_MANIFEST_SHA256 },
    localizationSourceKind: SOURCE_KIND,
    statusDefinitions: Object.fromEntries(STATUSES.map(status => [status, status === 'verified-local-source'
      ? 'Technically linked local German source'
      : status === 'reviewed-app-translation'
        ? 'App display translation; not claimed as official GGG text'
        : status === 'review-required'
          ? 'Display draft or ambiguous source; English fallback remains available'
          : 'No German display text available'])),
    items,
    systemTexts,
    coverage: {
      items: items.length,
      names: items.length,
      baseDisplayNames: items.length,
      variants: items.reduce((sum, item) => sum + item.variants.length, 0),
      modifiers: items.reduce((sum, item) => sum + item.modifiers.length, 0),
      implicits: items.reduce((sum, item) => sum + item.implicits.length, 0),
      systemTexts: Object.keys(systemTexts).length,
      statusCounts,
    },
    limitations: [
      'This is an independent German app display layer, not technical or official GGG localization.',
      'English PoB2 product records remain authoritative and unchanged.',
      'review-required entries use a German display draft while retaining the English fallback.',
      'No technical IDs, provenance, analyzer fields, roll ranges or product registry records are duplicated.',
    ],
  }
  const semantic = stable(output)
  const wrapped = { ...output, localizationDataHash: sha256(semantic) }
  const serialized = stable(wrapped)
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, serialized)
  return { output: wrapped, serialized, outputPath, sha256: sha256(serialized) }
}

async function main(argv = process.argv.slice(2)) {
  const outputIndex = argv.indexOf('--output')
  const result = await generateGermanDisplayLayer(outputIndex >= 0 ? { outputPath: argv[outputIndex + 1] } : {})
  process.stdout.write(`${JSON.stringify({ status: 'ok', outputPath: result.outputPath, sha256: result.sha256, coverage: result.output.coverage })}\n`)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main().catch(error => {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  })
}
