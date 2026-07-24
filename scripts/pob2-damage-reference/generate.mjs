/* global process, console */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const root = process.cwd()
const repo = path.join(root, '.local-audits', 'poe2-german-parser-candidates', 'candidate-02-pob', 'repo')
const sourceCommit = 'c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0'
const skillFiles = ['act_str.lua', 'act_dex.lua', 'act_int.lua']
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
const positional = row => {
  if (!row) return []
  const head = row.slice(1, row.indexOf('statInterpolation') >= 0 ? row.indexOf('statInterpolation') : -1)
  return head.split(',').map(value => value.trim()).filter(value => /^-?\d+(?:\.\d+)?$/.test(value)).map(Number)
}

const skills = []
for (const file of skillFiles) {
  const relative = `src/Data/Skills/${file}`
  const text = fs.readFileSync(path.join(repo, relative), 'utf8')
  for (const { key, body } of blocks(text, 'skills')) {
    const name = string(body, 'name')
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
    const numericStats = Object.fromEntries(stats.map((stat, index) => [stat, values[index]]).filter(([, value]) => Number.isFinite(value)))
    skills.push({
      sourceRecordId: key, name, gemLevel,
      kind: skillTypes.includes('Attack') ? 'attack' : skillTypes.includes('Spell') ? 'spell' : 'other',
      skillTypes,
      castTime: number(body, 'castTime') ?? 1,
      attackSpeedMultiplier: number(mainLevel ?? '', 'attackSpeedMultiplier') ?? 0,
      baseMultiplier: number(mainLevel ?? '', 'baseMultiplier'),
      critChance: number(mainLevel ?? '', 'critChance'),
      statSetLabel: firstSet ? string(firstSet, 'label') : undefined,
      numericStats,
      sourceFile: relative,
    })
  }
}

const bases = []
for (const file of fs.readdirSync(baseDir).filter(value => value.endsWith('.lua')).sort()) {
  const relative = `src/Data/Bases/${file}`
  const text = fs.readFileSync(path.join(repo, relative), 'utf8')
  for (const { key, body } of blocks(text, 'itemBases')) {
    const weapon = tableFor(body, 'weapon')
    if (!weapon) continue
    bases.push({
      name: key,
      type: string(body, 'type'),
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
      sourceFile: relative,
    })
  }
}

const payload = {
  schemaVersion: 1,
  scope: 'poe2-pob2-damage-calculation-reference',
  sourceRepository: 'PathOfBuildingCommunity/PathOfBuilding-PoE2',
  sourceCommit,
  limitations: [
    'Bounded hit estimate; not Path of Building parity.',
    'Multi-hit frequency, ailments, damage over time, minions and conditional mechanics are not included.',
    'PoB2 calculation reference is not represented as a technical GGG identity chain.',
  ],
  skills: skills.sort((a, b) => a.sourceRecordId.localeCompare(b.sourceRecordId)),
  weaponBases: bases.sort((a, b) => a.name.localeCompare(b.name)),
}
const canonical = JSON.stringify(payload)
const output = { ...payload, contentHash: crypto.createHash('sha256').update(canonical).digest('hex') }
const target = path.join(root, 'generated', 'pob2', 'damage-reference.json')
fs.mkdirSync(path.dirname(target), { recursive: true })
fs.writeFileSync(target, `${JSON.stringify(output, null, 2)}\n`)
console.log(JSON.stringify({ target, skills: skills.length, weaponBases: bases.length, contentHash: output.contentHash }))
