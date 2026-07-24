/* global process */
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseDatc64, parseLuaSchemas } from '../poe2-offline-item-audit/index.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const catalogPath = resolve(root, 'generated/poe2-gems/catalog.json')
const outputPath = resolve(root, 'generated/localization/de/poe2-gems.json')
const schemaPath = resolve(root, '.local-audits/poe2-german-parser-candidates/candidate-02-pob/repo/src/Export/spec.lua')
const rawRoot = resolve(root, '.local-audits/poe2-gem-german-localization/raw/data/balance')

const sourceFiles = {
  baseItemsEnglish: { path: resolve(rawRoot, 'baseitemtypes.datc64'), sha256: 'a5b0ce5427e2f2592b84a830386005640585798bfe79d1e935d0ed2a7076d510' },
  baseItemsGerman: { path: resolve(rawRoot, 'german/baseitemtypes.datc64'), sha256: '9c1b2ae1ae3a37066533255bbbd15c3b5bdc24769b1ccd89f99c9f35c4e63a78' },
  skillGems: { path: resolve(rawRoot, 'skillgems.datc64'), sha256: '501b9ea4afd9cc1dfa815c2e32d6288bbf044591fb7354615f7d47ebd2447c63' },
  gemEffectsEnglish: { path: resolve(rawRoot, 'gemeffects.datc64'), sha256: '9101c1f37ab8341026dfbdcd97c243ee16f4e2dc25a40b96eed0322b6ebdcf3b' },
  gemEffectsGerman: { path: resolve(rawRoot, 'german/gemeffects.datc64'), sha256: 'aa3b822dee4c5909e631aa9f90af511ff84f1756a730e9e1e8125b25f53cb50a' },
}

const sha256 = value => createHash('sha256').update(value).digest('hex')
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}
const readPinned = async source => {
  const bytes = await readFile(source.path)
  assert(sha256(bytes) === source.sha256, `source-hash-mismatch:${source.path}`)
  return bytes
}

const catalog = JSON.parse(await readFile(catalogPath, 'utf8'))
const schemas = parseLuaSchemas(await readFile(schemaPath, 'utf8'), ['baseitemtypes', 'skillgems', 'gemeffects'])
const baseItemsEnglish = parseDatc64(await readPinned(sourceFiles.baseItemsEnglish), schemas.baseitemtypes, 'baseitemtypes')
const baseItemsGerman = parseDatc64(await readPinned(sourceFiles.baseItemsGerman), schemas.baseitemtypes, 'baseitemtypes-german')
const skillGems = parseDatc64(await readPinned(sourceFiles.skillGems), schemas.skillgems, 'skillgems')
const gemEffectsEnglish = parseDatc64(await readPinned(sourceFiles.gemEffectsEnglish), schemas.gemeffects, 'gemeffects')
const gemEffectsGerman = parseDatc64(await readPinned(sourceFiles.gemEffectsGerman), schemas.gemeffects, 'gemeffects-german')

for (const table of [baseItemsEnglish, baseItemsGerman, skillGems, gemEffectsEnglish, gemEffectsGerman]) {
  assert(table.rows.length === table.rowCount, `schema-not-exact:${table.tableName}`)
  assert(table.unknownTrailingBytes === 0, `schema-trailing-bytes:${table.tableName}`)
}
assert(baseItemsEnglish.rowCount === baseItemsGerman.rowCount, 'base-item-locale-row-mismatch')
assert(gemEffectsEnglish.rowCount === gemEffectsGerman.rowCount, 'gem-effect-locale-row-mismatch')

const baseById = new Map(baseItemsEnglish.rows.map(row => [row.values.Id, row]))
const skillByBaseRow = new Map(skillGems.rows.map(row => [row.values.BaseItemType, row]))
const catalogEntries = [...catalog.skills, ...catalog.supports]
const items = catalogEntries.map(item => {
  const base = baseById.get(item.sourceRecordId)
  assert(base, `base-item-not-found:${item.sourceRecordId}`)
  const germanBase = baseItemsGerman.rows[base.rowIndex]
  const skill = skillByBaseRow.get(base.rowIndex)
  assert(skill, `skill-gem-not-found:${item.sourceRecordId}`)
  const effectIndex = skill.values.GemEffects[0]
  const englishEffect = gemEffectsEnglish.rows[effectIndex]
  const germanEffect = gemEffectsGerman.rows[effectIndex]
  assert(englishEffect && germanEffect, `gem-effect-not-found:${item.sourceRecordId}`)
  assert(englishEffect.values.Id === germanEffect.values.Id, `gem-effect-locale-id-mismatch:${item.sourceRecordId}`)
  assert(germanBase?.values.Id === item.sourceRecordId, `base-item-locale-id-mismatch:${item.sourceRecordId}`)
  const nameDe = germanBase.values.Name?.trim()
  assert(nameDe, `german-name-missing:${item.sourceRecordId}`)
  return {
    id: item.id,
    nameDe,
    status: 'verified-local-source',
    sourceRecordId: item.sourceRecordId,
    sourceReferences: [`BaseItemTypes#${base.rowIndex}`, `SkillGems#${skill.rowIndex}`, `GemEffects#${effectIndex}:${germanEffect.values.Id}`],
  }
}).sort((left, right) => left.id.localeCompare(right.id))

assert(items.length === catalogEntries.length, 'catalog-localization-count-mismatch')
assert(new Set(items.map(item => item.id)).size === items.length, 'duplicate-localization-id')

const content = {
  schemaVersion: 1,
  locale: 'de',
  sourceScope: catalog.sourceScope,
  displayLayerKind: 'verified-local-german-names',
  sourceProductScope: catalog.sourceScope,
  sourceProductSha256: sha256(await readFile(catalogPath)),
  sourceClientVersion: '4.5.4.53018',
  sourceContainerSha256: 'a917a56f89ae631f1a93e0dd9a3ea169f08e826e07927c0083a01c6e68a18e28',
  schemaRepository: 'PathOfBuildingCommunity/PathOfBuilding-PoE2',
  schemaCommit: 'c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0',
  resolutionMethod: 'exact-base-item-id-and-table-row-chain',
  counts: { total: items.length, skills: catalog.skills.length, supports: catalog.supports.length, verifiedLocalSource: items.length, fallbackEnglish: 0 },
  sourceFiles: Object.fromEntries(Object.entries(sourceFiles).map(([key, value]) => [key, {
    relativePath: value.path.slice(rawRoot.length + 1).replaceAll('\\', '/'),
    sha256: value.sha256,
  }])),
  limitations: [
    'This file contains display names only and does not add or change skill mechanics.',
    'Names are joined by exact technical BaseItemTypes identity and table-row references; no text matching or translation is used.',
    'The project decision does not claim an external license grant or legal clearance for extracted game text.',
  ],
  items,
}

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(content, null, 2)}\n`, 'utf8')
process.stdout.write(`${JSON.stringify({ outputPath, counts: content.counts, sha256: sha256(await readFile(outputPath)) })}\n`)
