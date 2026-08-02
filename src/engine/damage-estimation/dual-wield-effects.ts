import type { EquipmentEntry,SkillGemDefinition,SyntheticWeaponType } from '../../domain'
import { evaluateSkillWeaponCompatibility } from '../../features/skills/poe2-interaction-rules'

export const DUAL_WIELD_FINAL_DAMAGE_STAT='active_skill_damage_+%_final_while_dual_wielding' as const
export const DUAL_WIELD_FINAL_ATTACK_SPEED_STAT='active_skill_attack_speed_+%_final_while_dual_wielding' as const

export interface DualWieldWeaponReference { name:string;type:string;tags:readonly string[] }
export interface DualWieldAttackModel {
  modelVersion:'1.1.0'
  status:'not-applicable'|'single-weapon'|'applied'|'blocked-unresolved-weapon'|'blocked-not-two-one-hand-weapons'|'blocked-incompatible-weapon'
  finalDamagePercent:number|null
  finalAttackSpeedPercent:number|null
  damageMultiplier:number
  attackSpeedMultiplier:number
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
  const damageValue=input.numericStats[DUAL_WIELD_FINAL_DAMAGE_STAT]
  const speedValue=input.numericStats[DUAL_WIELD_FINAL_ATTACK_SPEED_STAT]
  const hasDamage=Number.isFinite(damageValue)
  const hasSpeed=Number.isFinite(speedValue)
  const sourceReference=`PoB2:${[hasDamage?DUAL_WIELD_FINAL_DAMAGE_STAT:null,hasSpeed?DUAL_WIELD_FINAL_ATTACK_SPEED_STAT:null].filter(Boolean).join('+')}`
  const common={modelVersion:'1.1.0' as const,finalDamagePercent:hasDamage?Number(damageValue):null,finalAttackSpeedPercent:hasSpeed?Number(speedValue):null,damageMultiplier:1,attackSpeedMultiplier:1,hitSequenceMultiplier:1,sourceReference}
  if(!hasDamage&&!hasSpeed)return{...common,status:'not-applicable',evidence:'structured-exact',detail:'Die Fertigkeit besitzt keinen strukturierten beidhändigen Schadens- oder Angriffsgeschwindigkeitsmodifikator.'}
  const main=input.equipment.find(entry=>entry.slotId===`slot-weapon-${input.weaponSet}-left`)
  const off=input.equipment.find(entry=>entry.slotId===`slot-weapon-${input.weaponSet}-right`)
  if(!occupied(main)||!occupied(off))return{...common,status:'single-weapon',mainHandItemId:main?.id,offHandItemId:off?.id,evidence:'structured-exact',detail:'Nur eine Waffenhand ist belegt; der Dual-Wield-Effekt ist nicht aktiv.'}
  const mainWeapon=main&&input.resolveWeapon(main)
  const offWeapon=off&&input.resolveWeapon(off)
  if(!mainWeapon||!offWeapon)return{...common,status:'blocked-unresolved-weapon',mainHandItemId:main?.id,offHandItemId:off?.id,evidence:'blocked',detail:'Beide Waffenplätze sind belegt, aber mindestens eine Waffenbasis ist nicht eindeutig aufgelöst.'}
  const bothOneHand=[mainWeapon,offWeapon].every(weapon=>weapon.tags.includes('one_hand_weapon')||weapon.tags.includes('onehand'))
  if(!bothOneHand)return{...common,status:'blocked-not-two-one-hand-weapons',mainHandItemId:main?.id,offHandItemId:off?.id,evidence:'blocked',detail:'Der Zustand besteht nicht aus zwei eindeutig belegten Einhandwaffen.'}
  const types=[weaponType(mainWeapon),weaponType(offWeapon)]
  const skill=input.skill
  if(!skill||types.some(type=>!type||evaluateSkillWeaponCompatibility(skill,type).status!=='productive'))return{...common,status:'blocked-incompatible-weapon',mainHandItemId:main?.id,offHandItemId:off?.id,evidence:'blocked',detail:'Mindestens eine Hand erfüllt die belegte Waffenanforderung der Fertigkeit nicht.'}
  const damageMultiplier=hasDamage?1+Number(damageValue)/100:1
  const attackSpeedMultiplier=hasSpeed?1+Number(speedValue)/100:1
  const hitSequenceMultiplier=hasDamage?2:1
  const hitDetail=hasDamage?`Die Fertigkeit trifft einmal mit jeder kompatiblen Einhandwaffe; jede Hand verursacht ${Math.abs(Number(damageValue))}% weniger Schaden.`:'Die Fertigkeit verwendet beide kompatiblen Einhandwaffen abwechselnd.'
  const speedDetail=hasSpeed?` Die Aktionsgeschwindigkeit wird dabei mit ${attackSpeedMultiplier.toFixed(2)} multipliziert.`:''
  return{...common,status:'applied',damageMultiplier,attackSpeedMultiplier,hitSequenceMultiplier,mainHandItemId:main.id,offHandItemId:off.id,evidence:'structured-exact',detail:`${hitDetail}${speedDetail}`}
}

export const harmonicMean=(left:number,right:number)=>left>0&&right>0?2/(1/left+1/right):0
