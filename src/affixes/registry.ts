import affixData from '../../generated/poe2-affixes/technical-affixes.json'
import itemClassData from '../../generated/poe2-affixes/item-classes.json'
import indexData from '../../generated/poe2-affixes/item-class-affix-index.json'
import type { TechnicalAffix, TechnicalItemClass } from './model'

export const technicalAffixes = affixData as TechnicalAffix[]
export const technicalItemClasses = itemClassData as TechnicalItemClass[]
export const technicalAffixById = new Map(technicalAffixes.map(affix => [affix.affixId, affix]))
export const itemClassAffixIndex = indexData as Record<string, Record<string, string[]>>

const classesBySlot: Record<string, string[]> = {
  'slot-helmet':['Helmets'],'slot-body-armour':['Body Armours'],'slot-gloves':['Gloves'],'slot-boots':['Boots'],'slot-belt':['Belts'],
  'slot-amulet':['Amulets'],'slot-ring-1':['Rings'],'slot-ring-2':['Rings'],
}
export function itemClassesForSlot(slotId: string): TechnicalItemClass[] {
  const allowed = classesBySlot[slotId]
  return technicalItemClasses.filter(value => allowed ? allowed.includes(value.itemClassId) : value.slotType === 'weapon' || value.slotType === 'offhand')
}
export function affixesFor(itemClassId: string, side: 'prefix'|'suffix', itemLevel?: number): TechnicalAffix[] {
  return (itemClassAffixIndex[itemClassId]?.[side] ?? []).map(id => technicalAffixById.get(id)).filter((value): value is TechnicalAffix => Boolean(value)).filter(value => itemLevel == null || value.requiredItemLevel == null || value.requiredItemLevel <= itemLevel)
}
