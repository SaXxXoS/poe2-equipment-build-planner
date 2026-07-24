import reference from '../../../generated/pob2/damage-reference.json'
import type { EquipmentEntry, SkillGemDefinition, SkillSetup } from '../../domain'
import type { DamageComponent, DamageEstimate } from './types'

type NumericSkill=(typeof reference.skills)[number]
type WeaponBase=(typeof reference.weaponBases)[number]
const skillsByName=new Map(reference.skills.map(value=>[value.name.toLocaleLowerCase('en'),value]))
const curatedEnglishNames:Record<string,string>={
  'skill-lightning-arrow':'Lightning Arrow',
  'skill-ball-lightning':'Ball Lightning',
  'skill-storm-caller':'Stormcaller Arrow',
  'skill-flame-wall':'Flame Wall',
  'skill-time-warp':'Temporal Rift',
  'skill-leap-slam':'Leap Slam',
}
const weaponsByName=new Map(reference.weaponBases.map(value=>[value.name.toLocaleLowerCase('en'),value]))
const types=['physical','fire','cold','lightning','chaos'] as const
const round=(value:number,digits=2)=>Number(value.toFixed(digits))
const valueFor=(entry:EquipmentEntry,pattern:RegExp)=>entry.modifierValues.flatMap(mod=>mod.statValues??[]).filter(stat=>pattern.test(stat.statId)).reduce((sum,stat)=>sum+stat.value,0)
const globalValue=(equipment:EquipmentEntry[],pattern:RegExp)=>equipment.flatMap(entry=>entry.modifierValues).flatMap(mod=>mod.statValues??[]).filter(stat=>pattern.test(stat.statId)).reduce((sum,stat)=>sum+stat.value,0)
const component=(type:DamageComponent['type'],minimum:number,maximum:number):DamageComponent=>({type,minimum:round(minimum),maximum:round(maximum)})

function spellComponents(skill:NumericSkill):DamageComponent[] {
  return types.flatMap(type=>{
    const minimum=skill.numericStats[`spell_minimum_base_${type}_damage` as keyof typeof skill.numericStats]
    const maximum=skill.numericStats[`spell_maximum_base_${type}_damage` as keyof typeof skill.numericStats]
    return Number.isFinite(minimum)&&Number.isFinite(maximum)?[component(type,Number(minimum),Number(maximum))]:[]
  })
}
function weaponComponents(weapon:WeaponBase,entry:EquipmentEntry):DamageComponent[] {
  return types.flatMap(type=>{
    const baseMin=Number(weapon[`${type}Min` as keyof WeaponBase]??0)
    const baseMax=Number(weapon[`${type}Max` as keyof WeaponBase]??0)
    const addedMin=valueFor(entry,new RegExp(`(?:attack|local)_minimum_added_${type}_damage`))
    const addedMax=valueFor(entry,new RegExp(`(?:attack|local)_maximum_added_${type}_damage`))
    const localIncrease=type==='physical'?valueFor(entry,/local_physical_damage_\+%|physical_damage_\+%_local/):0
    const minimum=(baseMin+addedMin)*(1+localIncrease/100)
    const maximum=(baseMax+addedMax)*(1+localIncrease/100)
    return minimum||maximum?[component(type,minimum,maximum)]:[]
  })
}
function componentIncrease(equipment:EquipmentEntry[],skillKind:NumericSkill['kind'],type:DamageComponent['type']){
  const generic=globalValue(equipment,/^(?:global_)?damage_\+%$/)
  const skillKindIncrease=globalValue(equipment,skillKind==='attack'?/^(?:global_)?attack_damage_\+%$/:/^(?:global_)?spell_damage_\+%$/)
  const typed=globalValue(equipment,new RegExp(`^(?:global_)?${type}_damage_\\+%$`))
  const elemental=type==='fire'||type==='cold'||type==='lightning'
    ?globalValue(equipment,/^(?:global_)?elemental_damage_\+%$/)
    :0
  return generic+skillKindIncrease+typed+elemental
}

export function estimateHitDamage(input:{
  equipment:EquipmentEntry[]
  setups:SkillSetup[]
  skills:SkillGemDefinition[]
  fallbackSkillId?:string
}):DamageEstimate {
  const setup=input.setups.find(value=>value.role==='main'&&value.skillId)||input.setups.find(value=>value.skillId)
  const skillId=setup?.skillId||input.fallbackSkillId
  const definition=input.skills.find(value=>value.id===skillId)
  const referenceName=definition?.nameEn??(skillId?curatedEnglishNames[skillId]:undefined)
  const skill=referenceName?skillsByName.get(referenceName.toLocaleLowerCase('en')):undefined
  const base:DamageEstimate={status:'unavailable',skillId,skillName:definition?.displayNameDe??definition?.nameEn,gemLevel:skill?.gemLevel,weaponSet:setup?.weaponSet??'both',components:[],included:[],excluded:[],warnings:[],sourceCommit:reference.sourceCommit,calculatorVersion:'1.0.0'}
  if(!skill)return{...base,status:'unavailable',warnings:['Für diese Fertigkeit ist keine eindeutige numerische PoB2-Referenz vorhanden.']}
  if(skill.kind==='other')return{...base,status:'unavailable',warnings:['Diese Fertigkeitsart besitzt noch kein belastbares Trefferschadenmodell.']}
  let components:DamageComponent[]
  let actionsPerSecond=skill.castTime>0?1/skill.castTime:1
  const included=['Fertigkeitsstufe 20','strukturierte Basiswerte der Fertigkeit']
  const activeSet=setup?.weaponSet==='set-2'?'set-2':'set-1'
  if(skill.kind==='attack'){
    const weaponEntry=input.equipment.find(entry=>entry.slotId.includes(`weapon-${activeSet}`)&&Boolean(entry.baseDisplayName||entry.itemDefinitionId))
    const weaponName=weaponEntry?.baseDisplayName??weaponEntry?.itemDefinitionId
    const weapon=weaponName?weaponsByName.get(weaponName.toLocaleLowerCase('en')):undefined
    if(!weaponEntry||!weapon)return{...base,status:'unavailable',warnings:['Der gewählte Waffenbasistyp konnte keiner numerischen Waffenbasis am Pin zugeordnet werden.']}
    components=weaponComponents(weapon,weaponEntry).map(value=>component(value.type,value.minimum*(skill.baseMultiplier??1),value.maximum*(skill.baseMultiplier??1)))
    actionsPerSecond=weapon.attacksPerSecond*(1+skill.attackSpeedMultiplier/100)
    included.push('Waffenbasis','lokaler Waffenschaden','Angriffsmultiplikator','Basis-Angriffsgeschwindigkeit')
  }else{
    components=spellComponents(skill)
    included.push('Zauber-Basisschaden','Basis-Zauberzeit')
  }
  if(!components.length)return{...base,status:'unavailable',warnings:['Die primäre Schadenskomponente ist nicht eindeutig strukturiert verfügbar.']}
  const speedIncrease=globalValue(input.equipment,skill.kind==='attack'?/attack_speed_\+%/:/cast_speed_\+%/)
  const increases=components.map(value=>componentIncrease(input.equipment,skill.kind,value.type))
  components=components.map((value,index)=>{
    const multiplier=1+increases[index]/100
    return component(value.type,value.minimum*multiplier,value.maximum*multiplier)
  })
  actionsPerSecond*=1+speedIncrease/100
  if(increases.some(Boolean))included.push('passende globale Schadenssteigerungen je Schadenskomponente')
  if(speedIncrease)included.push(skill.kind==='attack'?'Angriffsgeschwindigkeit':'Zaubergeschwindigkeit')
  const minimum=components.reduce((sum,value)=>sum+value.minimum,0)
  const maximum=components.reduce((sum,value)=>sum+value.maximum,0)
  const average=(minimum+maximum)/2
  return{
    ...base,status:'partial',components,
    hitDamage:{minimum:round(minimum),maximum:round(maximum),average:round(average)},
    actionsPerSecond:round(actionsPerSecond),
    hitDamagePerSecond:round(average*actionsPerSecond),
    included,
    excluded:['kritische Treffer','Gegnerwiderstände und Rüstung','Supports','Passive und Aszendenzwerte','Ailments und Schaden über Zeit','Mehrfachtreffer, Projektile und situationsabhängige Effekte'],
    warnings:['Vergleichbarer Teilwert, keine vollständige PoB-Gesamt-DPS. Nur identische Messgrenzen direkt vergleichen.'],
  }
}
