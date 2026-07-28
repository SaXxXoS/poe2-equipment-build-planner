import catalog from '../../generated/poe2-gems/catalog.json'
import germanDisplay from '../../generated/localization/de/poe2-gems.json'
import type { MechanicTag, SkillGemDefinition, SupportGemDefinition, SyntheticWeaponType } from '../domain'
import { metaSocketRuleFor } from '../features/skills/meta-skills'

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
    if (['bow', 'crossbow', 'wand', 'claw', 'dagger', 'flail', 'mace', 'quarterstaff', 'spear', 'sword', 'axe'].includes(value)) types.add(value as SyntheticWeaponType)
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

const germanNameById = new Map(germanDisplay.items.map(item => [item.id, item.nameDe]))
const supportFamilyId = (sourceRecordId: string) =>
  `repoe-support-family:${sourceRecordId.replace(/(?:Two|Three|Four|Five)$/, '')}`

const masterySupportRecords = new Set([
  'Metadata/Items/Gems/SupportGemChaosMastery',
  'Metadata/Items/Gems/SupportGemColdMastery',
  'Metadata/Items/Gems/SupportGemFireMastery',
  'Metadata/Items/Gems/SupportGemLightningMastery',
  'Metadata/Items/Gems/SupportGemMinionMastery',
  'Metadata/Items/Gems/SupportGemPhysicalMastery',
])

const supportCategoryIds = (sourceRecordId: string) =>
  masterySupportRecords.has(sourceRecordId) ? ['poe2-support-category:mastery'] : undefined

export const repoeSkillCatalog: SkillGemDefinition[] = catalog.skills.map(item => {
  const tags = mapTags(item.tags)
  return {
    id: item.id,
    displayNameDe: germanNameById.get(item.id) ?? item.nameEn,
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
    metaSocketRule: metaSocketRuleFor(item.nameEn, item.tags),
    maxEmbeddedSkillCount: item.tags.includes('meta') ? 2 : undefined,
    spiritReservation: item.spiritReservationStatus === 'structured-exact' && item.spiritReservation != null
      ? item.spiritReservation
      : undefined,
    enabled: true,
  }
})

export const repoeSupportCatalog: SupportGemDefinition[] = catalog.supports.map(item => {
  const tags = mapTags(item.tags)
  return {
    id: item.id,
    displayNameDe: germanNameById.get(item.id) ?? item.nameEn,
    nameEn: item.nameEn,
    dataVersion: catalog.sourceVersion,
    source: 'repoe-poe2',
    sourceReference: `${catalog.sourceFile}#${item.sourceRecordId}`,
    status: 'imported',
    tags,
    provenance: provenance(item.sourceRecordId),
    supportFamilyId: supportFamilyId(item.sourceRecordId),
    supportCategoryIds: supportCategoryIds(item.sourceRecordId),
    requiredTags: [],
    excludedTags: [],
    ownTags: tags,
    supportedDamageTypes: tags.filter(tag => ['physical', 'fire', 'cold', 'lightning', 'chaos'].includes(tag)) as SupportGemDefinition['supportedDamageTypes'],
    costMultiplierPercent: item.costMultiplierStatus === 'structured-exact' && item.costMultiplierPercent != null
      ? item.costMultiplierPercent
      : undefined,
    enabled: true,
    experimental: true,
    selectionOnly: true,
  }
})

export const repoeGemCatalogCoverage = catalog.counts
