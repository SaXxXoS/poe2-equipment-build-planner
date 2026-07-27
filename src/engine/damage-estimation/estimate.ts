import reference from '../../../generated/pob2/damage-reference.json'
import type { EquipmentEntry, SkillGemDefinition, SkillSetup, SupportGemDefinition } from '../../domain'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'
import { applyConversions, applyDamageModifiers, collectQuantitativeEffects } from './quantitative-effects'
import { applyQuantitativeSupports } from './quantitative-supports'
import { applyEnemyMitigation } from './enemy-mitigation'
import { applyBuildEnemyEffects } from './build-enemy-effects'
import type { DamageComponent, DamageEstimate, EnemyMitigationProfile } from './types'

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
const component=(type:DamageComponent['type'],minimum:number,maximum:number):DamageComponent=>({type,minimum:round(minimum),maximum:round(maximum)})

function spellComponents(skill:NumericSkill):DamageComponent[] {
  return types.flatMap(type=>{
    const minimum=skill.numericStats[`spell_minimum_base_${type}_damage` as keyof typeof skill.numericStats]
    const maximum=skill.numericStats[`spell_maximum_base_${type}_damage` as keyof typeof skill.numericStats]
    return Number.isFinite(minimum)&&Number.isFinite(maximum)?[component(type,Number(minimum),Number(maximum))]:[]
  })
}
function weaponComponents(weapon:WeaponBase|undefined,entry:EquipmentEntry):DamageComponent[] {
  if(entry.weaponStats){
    const observed=[
      ['physical',entry.weaponStats.physicalDamage],
      ['fire',entry.weaponStats.fireDamage],
      ['cold',entry.weaponStats.coldDamage],
      ['lightning',entry.weaponStats.lightningDamage],
      ['chaos',entry.weaponStats.chaosDamage],
    ] as const
    const resolved=observed.flatMap(([type,range])=>range?[component(type,range.minimum,range.maximum)]:[])
    if(resolved.length)return resolved
  }
  if(!weapon)return[]
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
export function estimateHitDamage(input:{
  equipment:EquipmentEntry[]
  setups:SkillSetup[]
  skills:SkillGemDefinition[]
  supports?:SupportGemDefinition[]
  fallbackSkillId?:string
  passiveTree?:RealPassiveTree
  realPassivePlanning?:RealPassivePlanningIntegrationResult
  enemyProfile?:EnemyMitigationProfile
}):DamageEstimate {
  const setup=input.setups.find(value=>value.role==='main'&&value.skillId)||input.setups.find(value=>value.skillId)
  const skillId=setup?.skillId||input.fallbackSkillId
  const definition=input.skills.find(value=>value.id===skillId)
  const referenceName=definition?.nameEn??(skillId?curatedEnglishNames[skillId]:undefined)
  const skill=referenceName?skillsByName.get(referenceName.toLocaleLowerCase('en')):undefined
  const base:DamageEstimate={status:'unavailable',skillId,skillName:definition?.displayNameDe??definition?.nameEn,gemLevel:skill?.gemLevel,weaponSet:setup?.weaponSet??'both',components:[],included:[],excluded:[],warnings:[],sourceCommit:reference.sourceCommit,calculatorVersion:'2.2.0'}
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
    const hasObservedWeaponBasis=Boolean(weaponEntry?.weaponStats?.attacksPerSecond&&[
      weaponEntry.weaponStats.physicalDamage,
      weaponEntry.weaponStats.fireDamage,
      weaponEntry.weaponStats.coldDamage,
      weaponEntry.weaponStats.lightningDamage,
      weaponEntry.weaponStats.chaosDamage,
    ].some(Boolean))
    if(!weaponEntry||!weapon&&!hasObservedWeaponBasis)return{...base,status:'unavailable',warnings:['Der gewählte Waffenbasistyp konnte keiner numerischen Waffenbasis am Pin zugeordnet werden und besitzt keine vollständigen eingegebenen Waffenwerte.']}
    components=weaponComponents(weapon,weaponEntry).map(value=>component(value.type,value.minimum*(skill.baseMultiplier??1),value.maximum*(skill.baseMultiplier??1)))
    const localAttackSpeed=weaponEntry.weaponStats?0:valueFor(weaponEntry,/local_attack_speed_\+%|attack_speed_\+%_local/)
    actionsPerSecond=(weaponEntry.weaponStats?.attacksPerSecond??weapon!.attacksPerSecond)*(1+localAttackSpeed/100)*(1+skill.attackSpeedMultiplier/100)
    included.push(weaponEntry.weaponStats?'eingegebene endgültige Waffenschadenswerte':'Waffenbasis','Angriffsmultiplikator',weaponEntry.weaponStats?.attacksPerSecond?'eingegebene Angriffe pro Sekunde':'Basis-Angriffsgeschwindigkeit')
    if(weaponEntry.weaponStats?.unresolvedElementalDamage?.length)base.warnings.push('Elementare Waffenbereiche ohne sicher bestimmte Schadensart sind noch nicht im Teilwert enthalten.')
  }else{
    components=spellComponents(skill)
    included.push('Zauber-Basisschaden','Basis-Zauberzeit')
  }
  if(!components.length)return{...base,status:'unavailable',warnings:['Die primäre Schadenskomponente ist nicht eindeutig strukturiert verfügbar.']}
  const baseComponents=components.map(value=>({...value}))
  const quantitative=collectQuantitativeEffects({equipment:input.equipment,skill:definition,passiveTree:input.passiveTree,realPassivePlanning:input.realPassivePlanning,weaponSet:activeSet})
  const convertedComponents=applyConversions(baseComponents,quantitative.conversions)
  components=applyDamageModifiers(baseComponents,quantitative.conversions,quantitative.damageModifiers).map(value=>component(value.type,value.minimum,value.maximum))
  const increasedComponents=components.map(value=>({...value}))
  const supportEffects=applyQuantitativeSupports({components,setup,supports:input.supports??[]})
  components=supportEffects.components.map(value=>component(value.type,value.minimum,value.maximum))
  const speedIncrease=quantitative.speedModifiers.reduce((sum,effect)=>sum+effect.percent,0)
  actionsPerSecond*=1+speedIncrease/100
  actionsPerSecond*=supportEffects.actionSpeedMultiplier
  if(quantitative.damageModifiers.length)included.push('passende globale Schadenssteigerungen je Schadenskomponente')
  if(speedIncrease)included.push(skill.kind==='attack'?'Angriffsgeschwindigkeit aus Ausrüstung und belegten Baumknoten':'Zaubergeschwindigkeit aus Ausrüstung und belegten Baumknoten')
  if(quantitative.conversions.length)included.push('bestätigte einstufige Schadensumwandlungen')
  if(quantitative.damageModifiers.some(value=>value.source!=='equipment'))included.push('numerisch eindeutige Passive- und Aszendenzwerte')
  if(supportEffects.appliedEffects.length)included.push('strukturierte numerische Supporteffekte')
  const minimum=components.reduce((sum,value)=>sum+value.minimum,0)
  const maximum=components.reduce((sum,value)=>sum+value.maximum,0)
  const average=(minimum+maximum)/2
  const activeWeapon=input.equipment.find(entry=>entry.slotId.includes(`weapon-${activeSet}`))
  const baseCriticalChance=skill.kind==='attack'?activeWeapon?.weaponStats?.criticalHitChance:skill.critChance
  const criticalChanceIncrease=quantitative.criticalChanceModifiers.reduce((sum,effect)=>sum+effect.percent,0)
  const effectiveCriticalChance=baseCriticalChance==null?undefined:Math.min(100,baseCriticalChance*(1+criticalChanceIncrease/100)*supportEffects.criticalChanceMultiplier)
  const additionalCriticalDamageBonus=quantitative.criticalMultiplierModifiers.reduce((sum,effect)=>sum+effect.percent,0)+supportEffects.criticalDamageBonus
  const totalCriticalDamageBonus=100+additionalCriticalDamageBonus
  const criticalExpectationMultiplier=effectiveCriticalChance==null?undefined:1+effectiveCriticalChance/100*totalCriticalDamageBonus/100
  const expectedCriticalHitDamage=criticalExpectationMultiplier==null?undefined:average*criticalExpectationMultiplier
  const expectedCriticalHitDamagePerSecond=expectedCriticalHitDamage==null?undefined:expectedCriticalHitDamage*actionsPerSecond
  const resolvedEnemyProfile=input.enemyProfile?applyBuildEnemyEffects({
    profile:input.enemyProfile,setups:input.setups,skills:input.skills,
    activeDamageTypes:components.map(value=>value.type),weaponSet:activeSet,
    primarySkillId:skillId,primaryActionsPerSecond:actionsPerSecond,
    passiveTree:input.passiveTree,realPassivePlanning:input.realPassivePlanning,
  }):undefined
  const enemyMitigation=resolvedEnemyProfile?applyEnemyMitigation(components,resolvedEnemyProfile):undefined
  const expectedDamageAfterMitigation=enemyMitigation?.average==null?undefined:enemyMitigation.average*(criticalExpectationMultiplier??1)
  const expectedDamagePerSecondAfterMitigation=expectedDamageAfterMitigation==null?undefined:expectedDamageAfterMitigation*actionsPerSecond
  return{
    ...base,status:'partial',components,baseComponents,
    stages:[
      {id:'base',label:'Strukturierter Grundschaden',components:baseComponents},
      {id:'conversion',label:'Nach bestätigten Umwandlungen',components:convertedComponents},
      {id:'increased-damage',label:'Nach passenden Schadenserhöhungen',components:increasedComponents},
      {id:'support-more-damage',label:'Nach strukturierten Support-Multiplikatoren',components},
      {id:'speed',label:'Aktionen pro Sekunde',components:[],value:round(actionsPerSecond)},
      ...(expectedCriticalHitDamagePerSecond==null?[]:[{id:'critical-expectation' as const,label:'Erwartungswert einschließlich kritischer Treffer',components:[],value:round(expectedCriticalHitDamagePerSecond)}]),
      ...(expectedDamagePerSecondAfterMitigation==null?[]:[{id:'enemy-mitigation' as const,label:`Nach Gegnerabwehr${resolvedEnemyProfile!.fullyBrokenArmour?' im aufrechterhaltbaren Vollzustand':''}: ${resolvedEnemyProfile!.label}`,components:enemyMitigation!.components,value:round(expectedDamagePerSecondAfterMitigation)}]),
    ],
    appliedDamageEffects:quantitative.damageModifiers.map(value=>({source:value.source,sourceId:value.sourceId,label:value.label,value:value.percent})),
    appliedSpeedEffects:quantitative.speedModifiers.map(value=>({source:value.source,sourceId:value.sourceId,label:value.label,value:value.percent})),
    appliedSupportEffects:supportEffects.appliedEffects,
    confirmedConversions:quantitative.conversions.map(value=>({from:value.from,to:value.to,percent:value.percent,source:value.source,sourceId:value.sourceId})),
    ...(effectiveCriticalChance==null?{}:{criticalChance:{base:round(baseCriticalChance!),increasedPercent:round(criticalChanceIncrease),effective:round(effectiveCriticalChance)}}),
    ...(effectiveCriticalChance==null?{}:{criticalDamageBonus:round(totalCriticalDamageBonus),criticalExpectationMultiplier:round(criticalExpectationMultiplier!),expectedCriticalHitDamage:round(expectedCriticalHitDamage!),expectedCriticalHitDamagePerSecond:round(expectedCriticalHitDamagePerSecond!)}),
    ...(resolvedEnemyProfile&&enemyMitigation?{enemyProfile:resolvedEnemyProfile,mitigatedComponents:enemyMitigation.components,expectedDamageAfterMitigation:round(expectedDamageAfterMitigation!),expectedDamagePerSecondAfterMitigation:round(expectedDamagePerSecondAfterMitigation!)}:{}),
    hitDamage:{minimum:round(minimum),maximum:round(maximum),average:round(average)},
    actionsPerSecond:round(actionsPerSecond),
    hitDamagePerSecond:round(average*actionsPerSecond),
    included,
    excluded:[...(input.enemyProfile?[]:['Gegnerwiderstände und Rüstung']),'Exposition ohne eindeutigen strukturierten Betrag','tatsächliche Fluch-Wiederholungsfrequenz ohne Rotationsbeleg','Supporteffekte ohne strukturierte Effektwerte','bedingte Passive- und Aszendenzeffekte','Ailments und Schaden über Zeit','Mehrfachtreffer, Projektile und situationsabhängige Effekte'],
    warnings:['Vergleichbarer Teilwert, keine vollständige PoB-Gesamt-DPS. Nur identische Messgrenzen direkt vergleichen.',...(input.enemyProfile?[]:['Es wurde kein Vergleichsgegner angegeben; der angezeigte Teilwert liegt vor Gegnerabwehr.']),...(supportEffects.unresolvedSupportIds.length?[`${supportEffects.unresolvedSupportIds.length} gewählte Supports besitzen noch keinen strukturierten numerischen Effekt und verändern den Schadenswert nicht.`]:[]),...quantitative.warnings,...(enemyMitigation?.warnings??[])],
  }
}
