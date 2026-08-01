import type { EquipmentEntry,SkillGemDefinition,SyntheticWeaponType } from '../../domain'
import { evaluateSkillWeaponCompatibility } from '../../features/skills/poe2-interaction-rules'

export const DUAL_WIELD_FINAL_DAMAGE_STAT='active_skill_damage_+%_final_while_dual_wielding' as const

export interface DualWieldWeaponReference { name:string;type:string;tags:readonly string[] }
export interface DualWieldAttackModel {
  modelVersion:'1.0.0'
  status:'not-applicable'|'single-weapon'|'applied'|'blocked-unresolved-weapon'|'blocked-not-two-one-hand-weapons'|'blocked-incompatible-weapon'
  finalDamagePercent:number|null
  damageMultiplier:number
  hitSequenceMultiplier:number
  mainHandItemId?:string
  offHandItemId?:string
  evidence:'structured-exact'|'blocked'
  sourceReference:string
  detail:string
}

const weaponType=(weapon:DualWieldWeaponReference):SyntheticWeaponType|undefined=>{
  const type=weapon.type.toLocaleLowerCase('en')
  if(type.includes('mace'))return'mace'
  if(type.includes('axe'))return'axe'
  if(type.includes('sword'))return'sword'
  if(type.includes('quarterstaff'))return'quarterstaff'
  if(type.includes('crossbow'))return'crossbow'
  if(type.includes('bow'))return'bow'
  if(type.includes('wand'))return'wand'
  if(type.includes('claw'))return'claw'
  if(type.includes('dagger'))return'dagger'
  if(type.includes('flail'))return'flail'
  if(type.includes('spear'))return'spear'
  return undefined
}
const occupied=(entry:EquipmentEntry|undefined)=>Boolean(entry&&(entry.baseDisplayName||entry.itemDefinitionId||entry.weaponStats))

export function resolveDualWieldAttackModel(input:{
  skill:SkillGemDefinition|undefined
  numericStats:Record<string,number>
  equipment:EquipmentEntry[]
  weaponSet:'set-1'|'set-2'
  resolveWeapon:(entry:EquipmentEntry)=>DualWieldWeaponReference|undefined
}):DualWieldAttackModel {
  const value=input.numericStats[DUAL_WIELD_FINAL_DAMAGE_STAT]
  const sourceReference=`PoB2:${DUAL_WIELD_FINAL_DAMAGE_STAT}`
  if(!Number.isFinite(value))return{modelVersion:'1.0.0',status:'not-applicable',finalDamagePercent:null,damageMultiplier:1,hitSequenceMultiplier:1,evidence:'structured-exact',sourceReference,detail:'Die Fertigkeit besitzt keinen strukturierten beidhändigen Schadensmodifikator.'}
  const main=input.equipment.find(entry=>entry.slotId===`slot-weapon-${input.weaponSet}-left`)
  const off=input.equipment.find(entry=>entry.slotId===`slot-weapon-${input.weaponSet}-right`)
  if(!occupied(main)||!occupied(off))return{modelVersion:'1.0.0',status:'single-weapon',finalDamagePercent:Number(value),damageMultiplier:1,hitSequenceMultiplier:1,mainHandItemId:main?.id,offHandItemId:off?.id,evidence:'structured-exact',sourceReference,detail:'Nur eine Waffenhand ist belegt; der Dual-Wield-Effekt ist nicht aktiv.'}
  const mainWeapon=main&&input.resolveWeapon(main)
  const offWeapon=off&&input.resolveWeapon(off)
  if(!mainWeapon||!offWeapon)return{modelVersion:'1.0.0',status:'blocked-unresolved-weapon',finalDamagePercent:Number(value),damageMultiplier:1,hitSequenceMultiplier:1,mainHandItemId:main?.id,offHandItemId:off?.id,evidence:'blocked',sourceReference,detail:'Beide Waffenplätze sind belegt, aber mindestens eine Waffenbasis ist nicht eindeutig aufgelöst.'}
  const bothOneHand=[mainWeapon,offWeapon].every(weapon=>weapon.tags.includes('one_hand_weapon')||weapon.tags.includes('onehand'))
  if(!bothOneHand)return{modelVersion:'1.0.0',status:'blocked-not-two-one-hand-weapons',finalDamagePercent:Number(value),damageMultiplier:1,hitSequenceMultiplier:1,mainHandItemId:main?.id,offHandItemId:off?.id,evidence:'blocked',sourceReference,detail:'Der Zustand besteht nicht aus zwei eindeutig belegten Einhandwaffen.'}
  const types=[weaponType(mainWeapon),weaponType(offWeapon)]
  const skill=input.skill
  if(!skill||types.some((type)=>!type||evaluateSkillWeaponCompatibility(skill,type).status!=='productive'))return{modelVersion:'1.0.0',status:'blocked-incompatible-weapon',finalDamagePercent:Number(value),damageMultiplier:1,hitSequenceMultiplier:1,mainHandItemId:main?.id,offHandItemId:off?.id,evidence:'blocked',sourceReference,detail:'Mindestens eine Hand erfüllt die belegte Waffenanforderung der Fertigkeit nicht.'}
  return{modelVersion:'1.0.0',status:'applied',finalDamagePercent:Number(value),damageMultiplier:1+Number(value)/100,hitSequenceMultiplier:2,mainHandItemId:main.id,offHandItemId:off.id,evidence:'structured-exact',sourceReference,detail:`Die Fertigkeit trifft einmal mit jeder kompatiblen Einhandwaffe; jede Hand verursacht ${Math.abs(Number(value))}% weniger Schaden.`}
}

export const harmonicMean=(left:number,right:number)=>left>0&&right>0?2/(1/left+1/right):0
