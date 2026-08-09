import jewelModData from '../../../generated/poe2-items/jewel-mods.json'
import type { AnyJewelDefinition, MechanicTag, ModifierCategory, ModifierDefinition } from '../../domain'
import type { TechnicalAffix } from '../../affixes/model'
import { classifyTechnicalAffix } from '../../affixes/analyzer-semantics'
import { affixDisplayName } from '../equipment-editor/affix-display'

// JSON imports widen string literals. The generated artifact is validated by
// its import tests before it reaches this build-only adapter.
const technicalJewelAffixes = jewelModData as unknown as TechnicalAffix[]

function modifierCategory(tags: MechanicTag[]): ModifierCategory {
  if (tags.includes('defensive')) return 'defence'
  if (tags.includes('resistance')) return 'resistance'
  if (tags.some(tag => ['strength', 'dexterity', 'intelligence'].includes(tag))) return 'attribute'
  if (tags.includes('critical')) return 'critical'
  if (tags.includes('resource')) return 'resource'
  if (tags.includes('movement')) return 'speed'
  if (tags.some(tag => ['physical', 'fire', 'cold', 'lightning', 'chaos', 'attack', 'spell', 'projectile', 'melee', 'area', 'damage-over-time', 'minion'].includes(tag))) return 'damage'
  return 'utility'
}

function technicalModifiers(affix: TechnicalAffix, tags: MechanicTag[]): ModifierDefinition[] {
  return affix.statLines.map((line, index) => ({
    id: `${affix.affixId}:stat:${line.statOrder ?? index}`,
    displayNameDe: affixDisplayName(affix),
    nameEn: affix.technicalText || affix.technicalName,
    dataVersion: affix.sourceVersion,
    source: 'repoe-poe2',
    sourceReference: line.sourceReference,
    status: 'imported',
    tags,
    provenance: {
      sourceId: 'repoe-poe2-jewel-mods',
      sourceRecordId: `${affix.affixId}:${line.statId}`,
      sourceVersion: affix.sourceVersion,
      sourceLanguage: 'en',
      verificationStatus: 'source-verified',
    },
    category: modifierCategory(tags),
    valueType: line.valueType === 'range' ? 'range' : 'number',
    unit: line.isPercent ? 'percent' : line.valueType === 'range' ? 'range' : 'flat',
    minValue: line.minimum,
    maxValue: line.maximum,
    scope: line.isLocal ? 'local' : 'global',
    relevantTags: tags,
    allowedEquipmentSlotIds: ['slot-jewel-1', 'slot-jewel-2'],
  }))
}

/** Produktive Juwel-Kandidaten aus den gepinnten technischen RePoE-Daten. */
export const technicalJewelCandidates: AnyJewelDefinition[] = technicalJewelAffixes
  .map(affix => ({ affix, semantics: classifyTechnicalAffix(affix) }))
  .filter(({ affix, semantics }) => affix.dataStatus === 'available' && semantics.evidence !== 'unresolved' && semantics.tags.length > 0)
  .map(({ affix, semantics }): AnyJewelDefinition => ({
    id: `repoe-jewel-affix:${affix.affixId}`,
    displayNameDe: affixDisplayName(affix),
    nameEn: affix.technicalText || affix.technicalName,
    dataVersion: affix.sourceVersion,
    source: 'repoe-poe2',
    sourceReference: affix.sourceReference,
    status: 'imported',
    tags: semantics.tags,
    provenance: {
      sourceId: 'repoe-poe2-jewel-mods',
      sourceRecordId: affix.affixId,
      sourceVersion: affix.sourceVersion,
      sourceLanguage: 'en',
      verificationStatus: 'source-verified',
    },
    jewelType: 'normal',
    description: affixDisplayName(affix),
    modifiers: technicalModifiers(affix, semantics.tags),
    socketPointCost: 1,
    requiredSocketType: 'jewel-socket',
    levelRequirement: affix.requiredItemLevel ?? undefined,
    enabled: true,
  }))
  .sort((left, right) => left.id.localeCompare(right.id))
