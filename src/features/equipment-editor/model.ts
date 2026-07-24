import type { AppliedModifier, EquipmentEntry, ItemRarity } from '../../domain'
import type { TechnicalAffix } from '../../affixes/model'

export const RARITY_LIMITS: Record<ItemRarity, { prefix: number; suffix: number }> = {
  normal: { prefix: 0, suffix: 0 },
  magic: { prefix: 1, suffix: 1 },
  rare: { prefix: 3, suffix: 3 },
  unique: { prefix: 0, suffix: 0 },
}

export function inferItemRarity(entry: EquipmentEntry): ItemRarity | undefined {
  if (entry.rarity) return entry.rarity
  if (entry.uniqueItemId) return 'unique'
  const explicit = entry.modifierValues.filter(value => value.affixSide === 'prefix' || value.affixSide === 'suffix').length
  if (entry.itemClassId || entry.itemDefinitionId || entry.modifierValues.length) return explicit > 2 ? 'rare' : explicit ? 'magic' : 'normal'
  return undefined
}

export function modifiersFor(entry: EquipmentEntry, side: AppliedModifier['affixSide']) {
  return entry.modifierValues.filter(value => value.affixSide === side)
}

export function appliedModifierId(entryId: string, side: string, index: number) {
  return `${entryId}:${side}:${index + 1}`
}

export function createAppliedModifier(entryId:string,affix:TechnicalAffix,side:'prefix'|'suffix'|'implicit',index:number,values:number[],itemClassId=affix.itemClassIds[0]):AppliedModifier{
  const statValues=affix.statLines.map((line,valueIndex)=>({statId:line.statId,value:line.valueType==='fixed'?line.minimum:values[valueIndex]??line.minimum}))
  return{id:appliedModifierId(entryId,side,index),modifierId:affix.affixId,value:statValues.length>1?{min:statValues[0].value,max:statValues[1].value}:statValues[0]?.value??0,sourceModId:affix.sourceModId,statValues,itemClassId,affixSide:side,tierId:affix.tierId,requiredItemLevel:affix.requiredItemLevel,isLocal:affix.isLocal,isHybrid:affix.isHybrid,sourceVersion:affix.sourceVersion,dataStatus:affix.dataStatus}
}

export function migrateEquipmentEntry(entry: EquipmentEntry): EquipmentEntry {
  const modifierValues = entry.modifierValues.map((modifier, index) => ({
    ...modifier,
    id: modifier.id || appliedModifierId(entry.id, modifier.affixSide ?? 'unknown', index),
  }))
  return { ...entry, modifierValues, rarity: inferItemRarity({ ...entry, modifierValues }) }
}

export function clearItem(entry: EquipmentEntry): EquipmentEntry {
  return { id: entry.id, slotId: entry.slotId, modifierValues: [] }
}
