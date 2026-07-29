/* global process, console */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const root = process.cwd()
const repo = path.join(root, '.local-audits', 'poe2-german-parser-candidates', 'candidate-02-pob', 'repo')
const sourceCommit = 'c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0'
const skillFiles = ['act_str.lua', 'act_dex.lua', 'act_int.lua']
const supportFiles = ['sup_str.lua', 'sup_dex.lua', 'sup_int.lua']
const costsRelative = 'src/Data/Costs.lua'
const costsBytes = fs.readFileSync(path.join(repo, costsRelative))
const costsText = costsBytes.toString('utf8')
const miscRelative = 'src/Data/Misc.lua'
const miscBytes = fs.readFileSync(path.join(repo, miscRelative))
const miscText = miscBytes.toString('utf8')
const questRewardsRelative = 'src/Data/QuestRewards.lua'
const questRewardsBytes = fs.readFileSync(path.join(repo, questRewardsRelative))
const questRewardsText = questRewardsBytes.toString('utf8')
const reservationFormulaRelative = 'src/Modules/CalcDefence.lua'
const reservationFormulaBytes = fs.readFileSync(path.join(repo, reservationFormulaRelative))
const reservationFormulaText = reservationFormulaBytes.toString('utf8')
const expectedCostDivisors = { Mana: 1, ManaPerMinute: 60, ManaPercentPerMinute: 60, RagePerMinute: 60 }
const costDivisors = Object.fromEntries(Object.entries(expectedCostDivisors).map(([resource, expected]) => {
  const blockMatch = new RegExp(`Resource\\s*=\\s*"${resource}"[\\s\\S]*?Divisor\\s*=\\s*(\\d+)`).exec(costsText)
  const actual = blockMatch ? Number(blockMatch[1]) : undefined
  if (actual !== expected) throw new Error(`PoB2 cost divisor mismatch for ${resource}: expected ${expected}, received ${actual}`)
  return [resource, actual]
}))
const characterConstant = (name, expected) => {
  const match = new RegExp(`\\["${name}"\\]\\s*=\\s*(-?[\\d.]+)`).exec(miscText)
  const actual = match ? Number(match[1]) : undefined
  if (actual !== expected) throw new Error(`PoB2 character constant mismatch for ${name}: expected ${expected}, received ${actual}`)
  return actual
}
const resourceConstants = {
  lifePerLevel: characterConstant('life_per_level', 12),
  lifeLevelOffset: 16,
  manaPerLevel: characterConstant('mana_per_level', 4),
  manaLevelOffset: 30,
  inherentManaRegenerationPercentPerMinute: characterConstant('character_inherent_mana_regeneration_rate_per_minute_%', 240),
}
const gameConstant = (name, expected) => {
  const match = new RegExp(`\\["${name}"\\]\\s*=\\s*(-?[\\d.]+)`).exec(miscText)
  const actual = match ? Number(match[1]) : undefined
  if (actual !== expected) throw new Error(`PoB2 game constant mismatch for ${name}: expected ${expected}, received ${actual}`)
  return actual
}
const numericTable = name => {
  const match = new RegExp(`data\\.${name}\\s*=\\s*\\{([^}]+)\\}`).exec(miscText)
  if (!match) throw new Error(`PoB2 numeric table missing: ${name}`)
  return [...match[1].matchAll(/-?[\d.]+/g)].map(value => Number(value[0]))
}
const ailmentConstants = {
  bleedingHitDamagePercentPerMinute: gameConstant('BleedingHitDamagePercentPerMinute', 900),
  igniteChanceMultiplier: gameConstant('IgniteChanceMultiplier', 20),
  igniteHitDamagePercentPerMinute: gameConstant('IgniteHitDamagePercentPerMinute', 1200),
  poisonHitDamagePercentPerMinute: gameConstant('PoisonHitDamagePercentPerMinute', 1200),
  baseBleedingDurationSeconds: gameConstant('BaseBleedingDuration', 5),
  basePoisonDurationSeconds: gameConstant('BasePoisonDuration', 2),
  baseIgniteDurationSeconds: gameConstant('BaseIgniteDuration', 4),
  bloodstainedMultiplierWhenMovingOrBleedingAggravated: gameConstant('BloodstainedMultiplierWhenMovingOrBleedingAggravated', 2),
}
const monsterAilmentThresholdTable = numericTable('monsterAilmentThresholdTable')
if (monsterAilmentThresholdTable.length !== 100) {
  throw new Error(`PoB2 ailment threshold table length mismatch: expected 100, received ${monsterAilmentThresholdTable.length}`)
}
const questSpiritRewards = [...questRewardsText.matchAll(/\{\r?\n([\s\S]*?)\r?\n\t\},?/g)]
  .flatMap(([, body]) => {
    const spirit = /\["Stat"\]\s*=\s*"\+(\d+) to Spirit"/.exec(body)
    if (!spirit) return []
    const field = key => new RegExp(`\\["${key}"\\]\\s*=\\s*"([^"]+)"`).exec(body)?.[1]
    const numeric = key => Number(new RegExp(`\\["${key}"\\]\\s*=\\s*(\\d+)`).exec(body)?.[1])
    return [{
      act: numeric('Act'),
      area: field('Area'),
      info: field('Info'),
      amount: Number(spirit[1]),
      areaLevel: numeric('AreaLevel'),
    }]
  })
const expectedQuestSpiritRewards = [
  { act: 1, area: 'Freythorn', info: 'King In The Mists', amount: 30, areaLevel: 11 },
  { act: 3, area: 'Azak Bog', info: 'Ignagduk', amount: 30, areaLevel: 36 },
  { act: 5, area: 'Kriar Village', info: 'Lythara', amount: 40, areaLevel: 61 },
]
if (JSON.stringify(questSpiritRewards) !== JSON.stringify(expectedQuestSpiritRewards)) {
  throw new Error(`PoB2 quest Spirit rewards mismatch: ${JSON.stringify(questSpiritRewards)}`)
}
const reservationFormulaNeedle = 'values.reservedFlat = m_max(round(baseFlatVal * (100 + values.inc) / 100 * values.more / (1 + values.efficiency / 100) / values.efficiencyMore, 0), 0)'
if (!reservationFormulaText.includes(reservationFormulaNeedle)) {
  throw new Error('PoB2 Spirit reservation formula mismatch')
}
const baseDir = path.join(repo, 'src', 'Data', 'Bases')
const gitDir = path.join(repo, '.git')
const head = fs.readFileSync(path.join(gitDir, 'HEAD'), 'utf8').trim()
const actualCommit = head.startsWith('ref: ')
  ? fs.existsSync(path.join(gitDir, head.slice(5)))
    ? fs.readFileSync(path.join(gitDir, head.slice(5)), 'utf8').trim()
    : fs.readFileSync(path.join(gitDir, 'packed-refs'), 'utf8').split(/\r?\n/).find(line => line.endsWith(` ${head.slice(5)}`))?.split(' ')[0]
  : head
if (actualCommit !== sourceCommit) throw new Error(`PoB2 pin mismatch: expected ${sourceCommit}, received ${actualCommit}`)

function balanced(text, start) {
  let depth = 0
  let quote = null
  let escaped = false
  for (let i = start; i < text.length; i++) {
    const c = text[i]
    if (quote) {
      if (escaped) escaped = false
      else if (c === '\\') escaped = true
      else if (c === quote) quote = null
      continue
    }
    if (c === '"' || c === "'") quote = c
    else if (c === '{') depth++
    else if (c === '}' && --depth === 0) return text.slice(start, i + 1)
  }
  throw new Error(`Unclosed Lua table at ${start}`)
}

function blocks(text, prefix) {
  const out = []
  const pattern = new RegExp(`${prefix}\\["([^"]+)"\\]\\s*=\\s*\\{`, 'g')
  for (let match; (match = pattern.exec(text));) {
    const start = text.indexOf('{', match.index)
    const body = balanced(text, start)
    out.push({ key: match[1], body })
    pattern.lastIndex = start + body.length
  }
  return out
}

const number = (body, key) => {
  const match = body.match(new RegExp(`\\b${key}\\s*=\\s*(-?[\\d.]+)`))
  return match ? Number(match[1]) : undefined
}
const string = (body, key) => body.match(new RegExp(`\\b${key}\\s*=\\s*"([^"]*)"`))?.[1]
const tableFor = (body, key) => {
  const match = new RegExp(`\\b${key}\\s*=\\s*\\{`).exec(body)
  return match ? balanced(body, body.indexOf('{', match.index)) : undefined
}
const levelRow = (body, level) => {
  const levels = tableFor(body, 'levels')
  if (!levels) return undefined
  const match = new RegExp(`\\[${level}\\]\\s*=\\s*\\{`).exec(levels)
  return match ? balanced(levels, levels.indexOf('{', match.index)) : undefined
}
const levelNumbers = body => {
  const levels = tableFor(body, 'levels')
  return levels
    ? [...levels.matchAll(/\[(\d+)\]\s*=\s*\{/g)].map(([, value]) => Number(value)).filter(Number.isFinite)
    : []
}
const positional = row => {
  if (!row) return []
  const head = row.slice(1, row.indexOf('statInterpolation') >= 0 ? row.indexOf('statInterpolation') : -1)
  return head.split(',').map(value => value.trim()).filter(value => /^-?\d+(?:\.\d+)?$/.test(value)).map(Number)
}
const uniqueSortedNumbers = values => [...new Set(values)].sort((a, b) => a - b)
const namedNumericTable = (body, key) => {
  const table = tableFor(body, key)
  if (!table) return {}
  return Object.fromEntries(
    [...table.matchAll(/\b([A-Za-z][A-Za-z0-9_]*)\s*=\s*(-?[\d.]+)/g)]
      .map(([, name, value]) => [name, Number(value)])
      .filter(([, value]) => Number.isFinite(value)),
  )
}
const skillTypesFor = (body, key) => {
  const table = tableFor(body, key)
  return table
    ? [...table.matchAll(/SkillType\.([A-Za-z0-9_]+)/g)].map(value => value[1])
    : []
}
const stringTable = (body, key) => {
  const table = tableFor(body, key)
  return table ? [...table.matchAll(/"([^"]+)"/g)].map(value => value[1]) : []
}
const constantNumericStats = body => {
  const table = tableFor(body, 'constantStats')
  if (!table) return {}
  return Object.fromEntries(
    [...table.matchAll(/\{\s*"([^"]+)"\s*,\s*(-?[\d.]+)\s*\}/g)]
      .map(([, name, value]) => [name, Number(value)])
      .filter(([, value]) => Number.isFinite(value)),
  )
}
const qualityStats = body => {
  const table = tableFor(body, 'qualityStats')
  if (!table) return []
  return [...table.matchAll(/\{\s*"([^"]+)"\s*,\s*(-?[\d.]+)\s*,\s*\{([^}]*)\}\s*\}/g)]
    .map(([, statId, perQuality, scope]) => ({
      statId,
      perQuality: Number(perQuality),
      statSetIndexes: [...scope.matchAll(/\[(\d+)\]\s*=\s*true/g)].map(([, value]) => Number(value)),
    }))
    .filter(entry => Number.isFinite(entry.perQuality))
}

const skills = []
const internalTriggerSupports = []
for (const file of skillFiles) {
  const relative = `src/Data/Skills/${file}`
  const text = fs.readFileSync(path.join(repo, relative), 'utf8')
  for (const { key, body } of blocks(text, 'skills')) {
    const name = string(body, 'name')
    if (
      name
      && /\bsupport\s*=\s*true\b/.test(body)
      && /\bhidden\s*=\s*true\b/.test(body)
      && /\bisTrigger\s*=\s*true\b/.test(body)
    ) {
      const statSets = tableFor(body, 'statSets')
      const firstSetMatch = statSets && /\[1\]\s*=\s*\{/.exec(statSets)
      const firstSet = firstSetMatch ? balanced(statSets, statSets.indexOf('{', firstSetMatch.index)) : undefined
      const statsTable = firstSet && tableFor(firstSet, 'stats')
      const statNames = statsTable ? [...statsTable.matchAll(/"([^"]+)"/g)].map(value => value[1]) : []
      const statValues = positional(firstSet && levelRow(firstSet, 1))
      internalTriggerSupports.push({
        sourceRecordId: key,
        name,
        requireSkillTypes: skillTypesFor(body, 'requireSkillTypes'),
        excludeSkillTypes: skillTypesFor(body, 'excludeSkillTypes'),
        addSkillTypes: skillTypesFor(body, 'addSkillTypes'),
        numericStats: {
          ...constantNumericStats(firstSet ?? ''),
          ...Object.fromEntries(statNames.map((stat, index) => [stat, statValues[index]]).filter(([, value]) => Number.isFinite(value))),
        },
        sourceFile: relative,
      })
    }
    if (!name || key.includes('Support')) continue
    const skillTypes = [...body.matchAll(/SkillType\.([A-Za-z0-9_]+)\]\s*=\s*true/g)].map(value => value[1])
    const gemLevel = 20
    const mainLevel = levelRow(body, gemLevel)
    const statSets = tableFor(body, 'statSets')
    const firstSetMatch = statSets && /\[1\]\s*=\s*\{/.exec(statSets)
    const firstSet = firstSetMatch ? balanced(statSets, statSets.indexOf('{', firstSetMatch.index)) : undefined
    const statsTable = firstSet && tableFor(firstSet, 'stats')
    const stats = statsTable ? [...statsTable.matchAll(/"([^"]+)"/g)].map(value => value[1]) : []
    const values = positional(firstSet && levelRow(firstSet, gemLevel))
    const constantStats = constantNumericStats(firstSet ?? '')
    const numericStats = {
      ...constantStats,
      ...Object.fromEntries(stats.map((stat, index) => [stat, values[index]]).filter(([, value]) => Number.isFinite(value))),
    }
    const availableLevels = uniqueSortedNumbers([
      ...levelNumbers(body),
      ...(firstSet ? levelNumbers(firstSet) : []),
    ])
    const levels = availableLevels.map(level => {
      const mainRow = levelRow(body, level)
      const statValues = positional(firstSet && levelRow(firstSet, level))
      return {
        level,
        cooldown: number(mainRow ?? '', 'cooldown'),
        storedUses: number(mainRow ?? '', 'storedUses'),
        attackSpeedMultiplier: number(mainRow ?? '', 'attackSpeedMultiplier') ?? 0,
        baseMultiplier: number(mainRow ?? '', 'baseMultiplier'),
        critChance: number(mainRow ?? '', 'critChance'),
        costs: namedNumericTable(mainRow ?? '', 'cost'),
        numericStats: {
          ...constantStats,
          ...Object.fromEntries(stats.map((stat, index) => [stat, statValues[index]]).filter(([, value]) => Number.isFinite(value))),
        },
      }
    })
    skills.push({
      sourceRecordId: key, name, gemLevel,
      kind: skillTypes.includes('Attack') ? 'attack' : skillTypes.includes('Spell') ? 'spell' : 'other',
      skillTypes,
      castTime: number(body, 'castTime') ?? 1,
      cooldown: number(mainLevel ?? '', 'cooldown'),
      storedUses: number(mainLevel ?? '', 'storedUses'),
      attackSpeedMultiplier: number(mainLevel ?? '', 'attackSpeedMultiplier') ?? 0,
      baseMultiplier: number(mainLevel ?? '', 'baseMultiplier'),
      critChance: number(mainLevel ?? '', 'critChance'),
      costs: namedNumericTable(mainLevel ?? '', 'cost'),
      statSetLabel: firstSet ? string(firstSet, 'label') : undefined,
      numericStats,
      qualityStats: qualityStats(body),
      levels,
      sourceFile: relative,
    })
  }
}

const supports = []
for (const file of supportFiles) {
  const relative = `src/Data/Skills/${file}`
  const text = fs.readFileSync(path.join(repo, relative), 'utf8')
  for (const { key, body } of blocks(text, 'skills')) {
    if (!/\bsupport\s*=\s*true\b/.test(body)) continue
    const name = string(body, 'name')
    if (!name || /\bhidden\s*=\s*true\b/.test(body)) continue
    const mainLevel = levelRow(body, 1)
    const statSets = tableFor(body, 'statSets')
    const firstSetMatch = statSets && /\[1\]\s*=\s*\{/.exec(statSets)
    const firstSet = firstSetMatch ? balanced(statSets, statSets.indexOf('{', firstSetMatch.index)) : undefined
    const statsTable = firstSet && tableFor(firstSet, 'stats')
    const statNames = statsTable ? [...statsTable.matchAll(/"([^"]+)"/g)].map(value => value[1]) : []
    const values = positional(firstSet && levelRow(firstSet, 1))
    const levelStats = Object.fromEntries(statNames.map((stat, index) => [stat, values[index]]).filter(([, value]) => Number.isFinite(value)))
    const availableLevels = uniqueSortedNumbers([
      ...levelNumbers(body),
      ...(firstSet ? levelNumbers(firstSet) : []),
    ])
    const levels = availableLevels.map(level => {
      const mainRow = levelRow(body, level)
      const statValues = positional(firstSet && levelRow(firstSet, level))
      return {
        level,
        manaMultiplierPercent: number(mainRow ?? '', 'manaMultiplier') ?? 0,
        numericStats: {
          ...constantNumericStats(firstSet ?? ''),
          ...Object.fromEntries(statNames.map((stat, index) => [stat, statValues[index]]).filter(([, value]) => Number.isFinite(value))),
        },
      }
    })
    supports.push({
      sourceRecordId: key,
      name,
      gemFamily: stringTable(body, 'gemFamily'),
      requireSkillTypes: skillTypesFor(body, 'requireSkillTypes'),
      excludeSkillTypes: skillTypesFor(body, 'excludeSkillTypes'),
      addSkillTypes: skillTypesFor(body, 'addSkillTypes'),
      manaMultiplierPercent: number(mainLevel ?? '', 'manaMultiplier') ?? 0,
      numericStats: { ...constantNumericStats(firstSet ?? ''), ...levelStats },
      qualityStats: qualityStats(body),
      levels,
      sourceFile: relative,
    })
  }
}

const bases = []
const equipmentBases = []
const itemBases = []
for (const file of fs.readdirSync(baseDir).filter(value => value.endsWith('.lua')).sort()) {
  const relative = `src/Data/Bases/${file}`
  const text = fs.readFileSync(path.join(repo, relative), 'utf8')
  for (const { key, body } of blocks(text, 'itemBases')) {
    const weapon = tableFor(body, 'weapon')
    const armour = tableFor(body, 'armour')
    const requirements = tableFor(body, 'req')
    const tagsTable = tableFor(body, 'tags') ?? ''
    const tags = [...tagsTable.matchAll(/([A-Za-z0-9_]+)\s*=\s*true/g)].map(match => match[1]).sort()
    const sharedBaseFields = {
      name: key,
      type: string(body, 'type'),
      implicit: string(body, 'implicit') || null,
      spirit: number(body, 'spirit'),
      socketLimit: number(body, 'socketLimit'),
      requirements: requirements ? namedNumericTable(body, 'req') : {},
      tags,
      sourceFile: relative,
    }
    itemBases.push({
      ...sharedBaseFields,
    })
    if (weapon) {
      bases.push({
        ...sharedBaseFields,
        physicalMin: number(weapon, 'PhysicalMin') ?? 0,
        physicalMax: number(weapon, 'PhysicalMax') ?? 0,
        fireMin: number(weapon, 'FireMin') ?? 0,
        fireMax: number(weapon, 'FireMax') ?? 0,
        coldMin: number(weapon, 'ColdMin') ?? 0,
        coldMax: number(weapon, 'ColdMax') ?? 0,
        lightningMin: number(weapon, 'LightningMin') ?? 0,
        lightningMax: number(weapon, 'LightningMax') ?? 0,
        chaosMin: number(weapon, 'ChaosMin') ?? 0,
        chaosMax: number(weapon, 'ChaosMax') ?? 0,
        critChance: number(weapon, 'CritChanceBase') ?? 5,
        attacksPerSecond: number(weapon, 'AttackRateBase') ?? 1,
      })
    }
    if (armour) {
      equipmentBases.push({
        name: key,
        type: string(body, 'type'),
        armour: number(armour, 'Armour') ?? 0,
        evasion: number(armour, 'Evasion') ?? 0,
        energyShield: number(armour, 'EnergyShield') ?? 0,
        ward: number(armour, 'Ward') ?? 0,
        movementPenalty: number(armour, 'MovementPenalty') ?? 0,
        socketLimit: number(body, 'socketLimit'),
        requirements: requirements ? namedNumericTable(body, 'req') : {},
        sourceFile: relative,
      })
    }
  }
}

const payload = {
  schemaVersion: 11,
  scope: 'poe2-pob2-damage-calculation-reference',
  sourceRepository: 'PathOfBuildingCommunity/PathOfBuilding-PoE2',
  sourceCommit,
  costsSourceFile: costsRelative,
  costsSourceSha256: crypto.createHash('sha256').update(costsBytes).digest('hex'),
  costDivisors,
  resourceConstantsSourceFile: miscRelative,
  resourceConstantsSourceSha256: crypto.createHash('sha256').update(miscBytes).digest('hex'),
  resourceConstants,
  ailmentConstants,
  monsterAilmentThresholdTable,
  questSpiritRewardsSourceFile: questRewardsRelative,
  questSpiritRewardsSourceSha256: crypto.createHash('sha256').update(questRewardsBytes).digest('hex'),
  questSpiritRewards,
  reservationFormulaSourceFile: reservationFormulaRelative,
  reservationFormulaSourceSha256: crypto.createHash('sha256').update(reservationFormulaBytes).digest('hex'),
  reservationFormula: {
    description: 'rounded(base reservation / (1 + increased reservation efficiency / 100) / more reservation efficiency)',
    rounding: 'nearest-integer',
  },
  limitations: [
    'Bounded hit estimate; not Path of Building parity.',
    'Multi-hit frequency, ailment Sonderfälle, minion damage and conditional mechanics are not completely included.',
    'PoB2 calculation reference is not represented as a technical GGG identity chain.',
    'Skill and support level rows are retained exactly where the pinned PoB2 source provides them; missing levels and resources remain unresolved.',
    'Support records retain exact structured compatibility types and numeric stats; conditional stats are not automatically treated as unconditional effects.',
    'Quest Spirit rewards are exact, but character level only provides a planning upper bound and does not prove quest completion.',
  ],
  skills: skills.sort((a, b) => a.sourceRecordId.localeCompare(b.sourceRecordId)),
  internalTriggerSupports: internalTriggerSupports.sort((a, b) => a.sourceRecordId.localeCompare(b.sourceRecordId)),
  supports: supports.sort((a, b) => a.sourceRecordId.localeCompare(b.sourceRecordId)),
  weaponBases: bases.sort((a, b) => a.name.localeCompare(b.name)),
  equipmentBases: equipmentBases.sort((a, b) => a.name.localeCompare(b.name)),
  itemBases: itemBases.sort((a, b) => a.name.localeCompare(b.name) || a.sourceFile.localeCompare(b.sourceFile)),
}
const canonical = JSON.stringify(payload)
const output = { ...payload, contentHash: crypto.createHash('sha256').update(canonical).digest('hex') }
const target = path.join(root, 'generated', 'pob2', 'damage-reference.json')
fs.mkdirSync(path.dirname(target), { recursive: true })
fs.writeFileSync(target, `${JSON.stringify(output, null, 2)}\n`)
console.log(JSON.stringify({ target, skills: skills.length, supports: supports.length, weaponBases: bases.length, equipmentBases: equipmentBases.length, itemBases: itemBases.length, contentHash: output.contentHash }))
