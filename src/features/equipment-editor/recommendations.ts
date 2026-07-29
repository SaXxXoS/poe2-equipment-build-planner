import type { EquipmentEntry, EquipmentWeaponStats, SyntheticWeaponType } from '../../domain'
import type { UniqueRecommendation } from '../../engine'
import { weaponBaseDisplayName, weaponBaseValuesFor, weaponStatsFromBase } from './weapon-base-values'
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
  itemClassId?: string
  itemDefinitionId?: string
  baseDisplayName?: string
  weaponStats?: EquipmentWeaponStats
  reasons?: string[]
  tradeOffs?: string[]
}

const weaponItemClasses: Partial<Record<SyntheticWeaponType, string[]>> = {
  axe: ['One Hand Axes', 'Two Hand Axes'],
  bow: ['Bows'],
  claw: ['Claws'],
  crossbow: ['Crossbows'],
  dagger: ['Daggers'],
  flail: ['Flails'],
  mace: ['One Hand Maces', 'Two Hand Maces'],
  quarterstaff: ['Quarterstaves'],
  spear: ['Spears'],
  sword: ['One Hand Swords', 'Two Hand Swords'],
}

function rawWeaponOutput(stats: EquipmentWeaponStats): number {
  return [
    stats.physicalDamage, stats.fireDamage, stats.coldDamage,
    stats.lightningDamage, stats.chaosDamage,
  ].reduce((sum, range) => sum + (range ? (range.minimum + range.maximum) / 2 : 0), 0)
    * (stats.attacksPerSecond ?? 0)
}

function concreteWeaponSuggestion(weaponType:SyntheticWeaponType, characterLevel?:number) {
  const selected=(weaponItemClasses[weaponType]??[])
    .flatMap(itemClassId=>weaponBaseValuesFor(itemClassId))
    .filter(base=>base.requiredLevel===null||characterLevel===undefined||base.requiredLevel<=characterLevel)
    .map(base=>({base,stats:weaponStatsFromBase(base)}))
    .sort((left,right)=>rawWeaponOutput(right.stats)-rawWeaponOutput(left.stats)||left.base.id.localeCompare(right.base.id))[0]
  if(!selected)return null
  return {
    title:weaponBaseDisplayName(selected.base),
    itemClassId:selected.base.itemClassId,
    itemDefinitionId:selected.base.id,
    baseDisplayName:selected.base.nameEn,
    weaponStats:selected.stats,
  }
}

const mechanicText:Record<string,string>={
  fire:'Feuerschaden',cold:'Kälteschaden',lightning:'Blitzschaden',
  physical:'physischer Schaden',chaos:'Chaosschaden',attack:'Angriff',
  spell:'Zauber',projectile:'Projektil',melee:'Nahkampf',area:'Flächenschaden',
  critical:'kritische Treffer',defensive:'Verteidigung',resistance:'Widerstände',
}

function visibleReasons(recommendation:UniqueRecommendation):string[]{
  const matches=(recommendation.matchedSkillTags??[]).map(tag=>mechanicText[tag]??tag)
  const effects=(recommendation.gainedMechanics??[]).map(tag=>mechanicText[tag]??tag)
  return [
    ...(matches.length?[`Passt zu: ${matches.join(', ')}`]:[]),
    ...(effects.length?[`Belegte Wirkung: ${effects.join(', ')}`]:[]),
    ...(recommendation.buildEnabler?['Vom Analyzer als Build-Enabler bewertet.']:[]),
    ...(recommendation.preferredWeaponSet&&recommendation.preferredWeaponSet!=='none'?[`Bevorzugtes Waffenset: ${recommendation.preferredWeaponSet==='set-1'?'1':recommendation.preferredWeaponSet==='set-2'?'2':'beide'}`]:[]),
  ].slice(0,4)
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
  characterLevel?:number
}):EquipmentSlotSuggestion[]{
  const suggestions:EquipmentSlotSuggestion[]=[]
  const selected=input.optimization?.selected
  const mainSet=selected?.mainWeaponSet??'set-1'

  if(selected&&!input.optimization?.equipmentFirst){
    const slotId=firstEmptySlot([weaponSlot(mainSet)],input.equipment)
    const concrete=concreteWeaponSuggestion(selected.weaponType,input.characterLevel)
    if(slotId)suggestions.push({
      slotId,
      title:concrete?.title??selected.weaponLabel,
      detail:`Empfohlene Waffenart für ${selected.skillName}`,
      source:'weapon-optimizer',
      ...concrete,
    })
    if(selected.setupSkillId&&selected.setupWeaponType){
      const setupSet=mainSet==='set-1'?'set-2':'set-1'
      const setupSlot=firstEmptySlot([weaponSlot(setupSet)],input.equipment)
      const setupConcrete=concreteWeaponSuggestion(selected.setupWeaponType,input.characterLevel)
      if(setupSlot)suggestions.push({
        slotId:setupSlot,
        title:setupConcrete?.title??weaponLabelFor(selected.setupWeaponType),
        detail:`Setup-Waffe für ${selected.setupSkillId}`,
        source:'weapon-optimizer',
        ...setupConcrete,
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
      reasons:visibleReasons(recommendation),
      tradeOffs:(recommendation.tradeOffs??[]).slice(0,4),
    })
    occupied.add(slotId)
  }
  return suggestions
}
