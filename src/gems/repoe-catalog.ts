import catalog from '../../generated/poe2-gems/catalog.json'
import type { MechanicTag, SkillGemDefinition, SupportGemDefinition, SyntheticWeaponType } from '../domain'

const supportedTags = new Set<MechanicTag>([
  'attack', 'spell', 'projectile', 'melee', 'area', 'physical', 'fire', 'cold',
  'lightning', 'chaos', 'critical', 'damage-over-time', 'minion', 'movement',
  'buff', 'debuff', 'defensive', 'resistance', 'resource', 'strength',
  'dexterity', 'intelligence',
])

const exactTagMap: Record<string, MechanicTag> = {
  attack: 'attack',
  spell: 'spell',
  projectile: 'projectile',
  melee: 'melee',
  area: 'area',
  physical: 'physical',
  fire: 'fire',
  cold: 'cold',
  lightning: 'lightning',
  chaos: 'chaos',
  critical: 'critical',
  duration: 'damage-over-time',
  minion: 'minion',
  movement: 'movement',
  buff: 'buff',
  curse: 'debuff',
  debuff: 'debuff',
  defensive: 'defensive',
  strength: 'strength',
  dexterity: 'dexterity',
  intelligence: 'intelligence',
}

const mapTags = (values: string[]): MechanicTag[] =>
  [...new Set(values.map(value => exactTagMap[value.toLowerCase()]).filter((value): value is MechanicTag => Boolean(value) && supportedTags.has(value)))].sort()

const mapWeaponTypes = (values: string[]): SyntheticWeaponType[] | undefined => {
  const types = new Set<SyntheticWeaponType>()
  for (const value of values.map(item => item.toLowerCase())) {
    if (['bow', 'crossbow', 'wand'].includes(value)) types.add('ranged-weapon')
    if (['claw', 'dagger', 'flail', 'mace', 'quarterstaff', 'spear', 'sword', 'axe'].includes(value)) types.add('melee-weapon')
    if (value === 'focus') types.add('focus')
  }
  return types.size ? [...types].sort() : undefined
}

const provenance = (sourceRecordId: string) => ({
  sourceId: catalog.sourceScope,
  sourceRecordId,
  sourceLanguage: 'en' as const,
  sourceVersion: catalog.sourceVersion,
  contentHash: catalog.sourceSha256,
  verificationStatus: 'structure-validated' as const,
})

export const repoeSkillCatalog: SkillGemDefinition[] = catalog.skills.map(item => {
  const tags = mapTags(item.tags)
  return {
    id: item.id,
    displayNameDe: item.nameEn,
    nameEn: item.nameEn,
    dataVersion: catalog.sourceVersion,
    source: 'repoe-poe2',
    sourceReference: `${catalog.sourceFile}#${item.sourceRecordId}`,
    status: 'imported',
    tags,
    provenance: provenance(item.sourceRecordId),
    damageTypes: tags.filter(tag => ['physical', 'fire', 'cold', 'lightning', 'chaos'].includes(tag)) as SkillGemDefinition['damageTypes'],
    possibleRoles: tags.includes('movement') ? ['movement', 'utility'] : tags.includes('buff') ? ['utility'] : ['main', 'secondary'],
    requiredWeaponTypes: mapWeaponTypes(item.craftingTypes),
    attributeRequirements: item.requirements,
    recommendedSupportIds: item.recommendedSupportIds,
    enabled: true,
  }
})

export const repoeSupportCatalog: SupportGemDefinition[] = catalog.supports.map(item => {
  const tags = mapTags(item.tags)
  return {
    id: item.id,
    displayNameDe: item.nameEn,
    nameEn: item.nameEn,
    dataVersion: catalog.sourceVersion,
    source: 'repoe-poe2',
    sourceReference: `${catalog.sourceFile}#${item.sourceRecordId}`,
    status: 'imported',
    tags,
    provenance: provenance(item.sourceRecordId),
    requiredTags: [],
    excludedTags: [],
    ownTags: tags,
    supportedDamageTypes: tags.filter(tag => ['physical', 'fire', 'cold', 'lightning', 'chaos'].includes(tag)) as SupportGemDefinition['supportedDamageTypes'],
    enabled: true,
    experimental: true,
    selectionOnly: true,
  }
})

export const repoeGemCatalogCoverage = catalog.counts
