import affixData from '../../generated/poe2-affixes/technical-affixes.json'
import itemClassData from '../../generated/poe2-affixes/item-classes.json'
import indexData from '../../generated/poe2-affixes/item-class-affix-index.json'
import jewelMods from '../../generated/poe2-items/jewel-mods.json'
import charmMods from '../../generated/poe2-items/charm-mods.json'
import lifeFlaskMods from '../../generated/poe2-items/life-flask-mods.json'
import manaFlaskMods from '../../generated/poe2-items/mana-flask-mods.json'
import jewelBases from '../../generated/poe2-items/jewel-base-items.json'
import charmBases from '../../generated/poe2-items/charm-base-items.json'
import lifeFlaskBases from '../../generated/poe2-items/life-flask-base-items.json'
import manaFlaskBases from '../../generated/poe2-items/mana-flask-base-items.json'
import additionalIndex from '../../generated/poe2-items/additional-item-class-index.json'
import type { TechnicalAffix, TechnicalBaseItem, TechnicalItemClass } from './model'

export const technicalAffixes = affixData as TechnicalAffix[]
export const additionalTechnicalAffixes = [...new Map(([...jewelMods,...charmMods,...lifeFlaskMods,...manaFlaskMods] as unknown as TechnicalAffix[]).map(value=>[value.affixId,value])).values()]
export const allTechnicalAffixes = [...technicalAffixes,...additionalTechnicalAffixes]
export const technicalBaseItems = [...jewelBases,...charmBases,...lifeFlaskBases,...manaFlaskBases] as unknown as TechnicalBaseItem[]
const additionalClasses:TechnicalItemClass[]=['Jewels','Charms','Life Flasks','Mana Flasks'].map(itemClassId=>({itemClassId,technicalName:itemClassId,slotType:'additional-item',weaponType:'not-applicable',handedness:'not-applicable',sourceVersion:'4.5.4.4.4',sourceReference:`data/item_classes.json#${itemClassId}`,uiSupported:true,engineSupported:itemClassId==='Jewels',dataStatus:itemClassId==='Jewels'?'partially-supported':'transport-only',localizationStatus:'translation-missing'}))
export const technicalItemClasses = [...itemClassData as TechnicalItemClass[],...additionalClasses]
export const technicalAffixById = new Map(allTechnicalAffixes.map(affix => [affix.affixId, affix]))
export const itemClassAffixIndex = {...indexData,...additionalIndex} as Record<string, Record<string, string[]>>

const classesBySlot: Record<string, string[]> = {
  'slot-helmet':['Helmets'],'slot-body-armour':['Body Armours'],'slot-gloves':['Gloves'],'slot-boots':['Boots'],'slot-belt':['Belts'],
  'slot-amulet':['Amulets'],'slot-ring-1':['Rings'],'slot-ring-2':['Rings'],
  'slot-jewel-1':['Jewels'],'slot-jewel-2':['Jewels'],'slot-charm-1':['Charms'],'slot-charm-2':['Charms'],'slot-charm-3':['Charms'],'slot-life-flask':['Life Flasks'],'slot-mana-flask':['Mana Flasks'],
}
export const baseItemsFor=(itemClassId:string)=>technicalBaseItems.filter(value=>value.itemClassId===itemClassId)
export function itemClassesForSlot(slotId: string): TechnicalItemClass[] {
  const allowed = classesBySlot[slotId] ?? (slotId.startsWith('slot-jewel-') ? ['Jewels'] : undefined)
  return technicalItemClasses.filter(value => allowed ? allowed.includes(value.itemClassId) : value.slotType === 'weapon' || value.slotType === 'offhand')
}
export function affixesFor(itemClassId: string, side: 'prefix'|'suffix'|'implicit', itemLevel?: number): TechnicalAffix[] {
  return (itemClassAffixIndex[itemClassId]?.[side] ?? []).map(id => technicalAffixById.get(id)).filter((value): value is TechnicalAffix => Boolean(value)).filter(value => itemLevel == null || value.requiredItemLevel == null || value.requiredItemLevel <= itemLevel)
}
