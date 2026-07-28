import type { EquipmentEntry } from '../../domain'
import type { UniqueRecommendation } from '../../engine'
import {
  weaponLabelFor,
  type BuildVariantOptimization,
} from '../skills/build-variant-optimizer'

export interface EquipmentSlotSuggestion {
  slotId: string
  title: string
  detail: string
  source: 'weapon-optimizer' | 'unique-analyzer'
  uniqueItemId?: string
  reasons?: string[]
  tradeOffs?: string[]
}

const weaponSlot = (set:'set-1'|'set-2') => `slot-weapon-${set}-left`
const offhandSlot = (set:'set-1'|'set-2') => `slot-weapon-${set}-right`

function firstEmptySlot(slotIds:string[], equipment:EquipmentEntry[]) {
  return slotIds.find(slotId => {
    const entry=equipment.find(item=>item.slotId===slotId)
    return entry && !entry.itemClassId && !entry.itemDefinitionId && !entry.uniqueItemId
  })
}

function uniqueTargetSlots(itemSlot:string, mainSet:'set-1'|'set-2'):string[] {
  if(itemSlot==='weapon')return[weaponSlot(mainSet)]
  if(itemSlot==='offhand')return[offhandSlot(mainSet)]
  if(itemSlot==='helmet')return['slot-helmet']
  if(itemSlot==='body-armour')return['slot-body-armour']
  if(itemSlot==='gloves')return['slot-gloves']
  if(itemSlot==='boots')return['slot-boots']
  if(itemSlot==='amulet')return['slot-amulet']
  if(itemSlot==='belt')return['slot-belt']
  if(itemSlot==='ring')return['slot-ring-1','slot-ring-2']
  return[]
}

export function createEquipmentSlotSuggestions(input:{
  equipment:EquipmentEntry[]
  optimization?:BuildVariantOptimization|null
  uniqueRecommendations:UniqueRecommendation[]
  uniqueNames:Map<string,string>
}):EquipmentSlotSuggestion[]{
  const suggestions:EquipmentSlotSuggestion[]=[]
  const selected=input.optimization?.selected
  const mainSet=selected?.mainWeaponSet??'set-1'

  if(selected&&!input.optimization?.equipmentFirst){
    const slotId=firstEmptySlot([weaponSlot(mainSet)],input.equipment)
    if(slotId)suggestions.push({
      slotId,
      title:selected.weaponLabel,
      detail:`Empfohlene Waffenart für ${selected.skillId}`,
      source:'weapon-optimizer',
    })
    if(selected.setupSkillId&&selected.setupWeaponType){
      const setupSet=mainSet==='set-1'?'set-2':'set-1'
      const setupSlot=firstEmptySlot([weaponSlot(setupSet)],input.equipment)
      if(setupSlot)suggestions.push({
        slotId:setupSlot,
        title:weaponLabelFor(selected.setupWeaponType),
        detail:`Setup-Waffe für ${selected.setupSkillId}`,
        source:'weapon-optimizer',
      })
    }
  }

  const occupied=new Set(suggestions.map(item=>item.slotId))
  const seenUniqueIds=new Set<string>()
  for(const recommendation of input.uniqueRecommendations){
    if(!recommendation.valid||recommendation.totalScore<=0||seenUniqueIds.has(recommendation.uniqueId))continue
    seenUniqueIds.add(recommendation.uniqueId)
    const slotId=firstEmptySlot(
      uniqueTargetSlots(recommendation.itemSlot,mainSet).filter(value=>!occupied.has(value)),
      input.equipment,
    )
    if(!slotId)continue
    suggestions.push({
      slotId,
      title:input.uniqueNames.get(recommendation.uniqueId)??recommendation.uniqueId,
      detail:recommendation.buildEnabler?'Build-Enabler':'Passender Unique-Kandidat',
      source:'unique-analyzer',
      uniqueItemId:recommendation.uniqueId,
      reasons:(recommendation.reasons??[]).slice(0,4).map(reason=>reason.messageKey),
      tradeOffs:(recommendation.tradeOffs??[]).slice(0,4),
    })
    occupied.add(slotId)
  }
  return suggestions
}
