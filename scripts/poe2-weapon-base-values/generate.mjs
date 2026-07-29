/* global console */
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const damagePath = resolve(root, 'generated/pob2/damage-reference.json')
const auditPath = resolve(root, '.local-audits/poe2-offline-reference-extraction/run-01/audit/normalized-reference-audit.json')
const outputPath = resolve(root, 'generated/poe2-items/weapon-base-values.json')

const damage = JSON.parse(await readFile(damagePath, 'utf8'))
const audit = JSON.parse(await readFile(auditPath, 'utf8'))
const englishRows = audit.tables.baseitemtypes.rows
const germanRows = audit.tables['baseitemtypes-german'].rows
const germanByEnglish = new Map(englishRows.map((row, index) => [row.values.Name, germanRows[index]?.values.Name]))
const classByType = {
  Bow: 'Bows', Claw: 'Claws', Crossbow: 'Crossbows', Dagger: 'Daggers', Flail: 'Flails',
  'One Hand Axe': 'One Hand Axes', 'One Hand Mace': 'One Hand Maces', 'One Hand Sword': 'One Hand Swords',
  Spear: 'Spears', 'Two Hand Axe': 'Two Hand Axes',
  'Two Hand Mace': 'Two Hand Maces', 'Two Hand Sword': 'Two Hand Swords',
}
const productiveClassForBase = base => base.type === 'Staff'
  ? base.tags?.includes('warstaff') ? 'Quarterstaves' : 'Staves'
  : classByType[base.type]
const defenceClassByType = {
  Helmet: 'Helmets',
  'Body Armour': 'Body Armours',
  Gloves: 'Gloves',
  Boots: 'Boots',
  Shield: 'Shields',
  Focus: 'Foci',
}
const items = damage.weaponBases
  .map((base, sourceIndex) => ({ base, sourceIndex }))
  .filter(({ base }) => productiveClassForBase(base))
  .map(({ base, sourceIndex }) => ({
    id: `pob2-weapon-base:${base.type}:${base.name}:${sourceIndex}`,
    itemClassId: productiveClassForBase(base),
    nameEn: base.name,
    displayNameDe: germanByEnglish.get(base.name) || null,
    physicalDamage: { minimum: base.physicalMin, maximum: base.physicalMax },
    fireDamage: base.fireMin || base.fireMax ? { minimum: base.fireMin, maximum: base.fireMax } : null,
    coldDamage: base.coldMin || base.coldMax ? { minimum: base.coldMin, maximum: base.coldMax } : null,
    lightningDamage: base.lightningMin || base.lightningMax ? { minimum: base.lightningMin, maximum: base.lightningMax } : null,
    chaosDamage: base.chaosMin || base.chaosMax ? { minimum: base.chaosMin, maximum: base.chaosMax } : null,
    criticalHitChance: base.critChance,
    attacksPerSecond: base.attacksPerSecond,
    implicit: base.implicit,
    socketLimit: base.socketLimit ?? null,
    requiredLevel: base.requirements?.level ?? null,
    requirements: {
      strength: base.requirements?.str ?? null,
      dexterity: base.requirements?.dex ?? null,
      intelligence: base.requirements?.int ?? null,
    },
    sourceReference: `generated/pob2/damage-reference.json#weaponBases/${sourceIndex}`,
    localizationSourceReference: germanByEnglish.has(base.name)
      ? 'local-pinned-client:baseitemtypes.datc64:exact-english-row'
      : null,
  }))
  .sort((left, right) => left.itemClassId.localeCompare(right.itemClassId, 'en') || left.nameEn.localeCompare(right.nameEn, 'en') || left.id.localeCompare(right.id, 'en'))
const defenceItems = damage.equipmentBases
  .map((base, sourceIndex) => ({ base, sourceIndex }))
  .filter(({ base }) => defenceClassByType[base.type])
  .map(({ base, sourceIndex }) => ({
    id: `pob2-equipment-base:${base.type}:${base.name}:${sourceIndex}`,
    itemClassId: defenceClassByType[base.type],
    nameEn: base.name,
    displayNameDe: germanByEnglish.get(base.name) || null,
    defences: {
      armour: base.armour || null,
      evasion: base.evasion || null,
      energyShield: base.energyShield || null,
    },
    socketLimit: base.socketLimit ?? null,
    requiredLevel: base.requirements?.level ?? null,
    requirements: {
      strength: base.requirements?.str ?? null,
      dexterity: base.requirements?.dex ?? null,
      intelligence: base.requirements?.int ?? null,
    },
    sourceReference: `generated/pob2/damage-reference.json#equipmentBases/${sourceIndex}`,
    localizationSourceReference: germanByEnglish.has(base.name)
      ? 'local-pinned-client:baseitemtypes.datc64:exact-english-row'
      : null,
  }))
  .sort((left, right) => left.itemClassId.localeCompare(right.itemClassId, 'en') || left.nameEn.localeCompare(right.nameEn, 'en') || left.id.localeCompare(right.id, 'en'))
const utilityClassByType = {
  Wand: 'Wands',
  Sceptre: 'Sceptres',
  Staff: 'Staves',
  Focus: 'Foci',
  Shield: 'Shields',
  Quiver: 'Quivers',
  Amulet: 'Amulets',
  Ring: 'Rings',
  Belt: 'Belts',
  Charm: 'Charms',
  Jewel: 'Jewels',
}
const utilityItems = damage.itemBases
  .map((base, sourceIndex) => ({ base, sourceIndex }))
  .filter(({ base }) => utilityClassByType[base.type] && !base.tags?.includes('warstaff'))
  .map(({ base, sourceIndex }) => ({
    id: `pob2-item-base:${base.type}:${base.name}:${sourceIndex}`,
    itemClassId: utilityClassByType[base.type],
    nameEn: base.name,
    displayNameDe: germanByEnglish.get(base.name) || null,
    implicit: base.implicit,
    spirit: base.spirit ?? null,
    socketLimit: base.socketLimit ?? null,
    requiredLevel: base.requirements?.level ?? null,
    requirements: {
      strength: base.requirements?.str ?? null,
      dexterity: base.requirements?.dex ?? null,
      intelligence: base.requirements?.int ?? null,
    },
    sourceReference: `generated/pob2/damage-reference.json#itemBases/${sourceIndex}`,
    localizationSourceReference: germanByEnglish.has(base.name)
      ? 'local-pinned-client:baseitemtypes.datc64:exact-english-row'
      : null,
  }))
  .sort((left, right) => left.itemClassId.localeCompare(right.itemClassId, 'en') || left.nameEn.localeCompare(right.nameEn, 'en') || left.id.localeCompare(right.id, 'en'))
const content = {
  schemaVersion: 3,
  sourceRepository: damage.sourceRepository,
  sourceCommit: damage.sourceCommit,
  localizationPin: audit.summary.pins.contentSha256,
  recordCount: items.length,
  localizedRecordCount: items.filter(item => item.displayNameDe).length,
  defenceRecordCount: defenceItems.length,
  localizedDefenceRecordCount: defenceItems.filter(item => item.displayNameDe).length,
  utilityRecordCount: utilityItems.length,
  localizedUtilityRecordCount: utilityItems.filter(item => item.displayNameDe).length,
  limitations: [
    'Only weapon types with an existing productive item-class mapping are included.',
    'German display names use an exact English BaseItemTypes row join; missing joins retain the English fallback.',
    'These are unmodified base weapon values. Observed tooltip end values remain authoritative when entered.',
    'Defence bases contain only pinned unmodified armour, evasion and energy-shield base values.',
    'Utility bases retain only identity, requirements, socket limit, Spirit and the visible implicit; no technical effect is inferred from the implicit text.',
  ],
  items,
  defenceItems,
  utilityItems,
}
content.contentHash = createHash('sha256').update(JSON.stringify(content)).digest('hex')
await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(content, null, 2)}\n`)
console.log(JSON.stringify({ outputPath, recordCount: items.length, localizedRecordCount: content.localizedRecordCount, defenceRecordCount: defenceItems.length, utilityRecordCount: utilityItems.length, contentHash: content.contentHash }))
