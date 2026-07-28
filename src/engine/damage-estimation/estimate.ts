import reference from '../../../generated/pob2/damage-reference.json'
import type { EquipmentEntry, SkillGemDefinition, SkillSetup, SupportGemDefinition } from '../../domain'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'
import { applyConversions, applyDamageModifiers, collectQuantitativeEffects } from './quantitative-effects'
import { applyQuantitativeSupports } from './quantitative-supports'
import { applyEnemyMitigation } from './enemy-mitigation'
import { applyBuildEnemyEffects } from './build-enemy-effects'
import { applyTemporalDamageWindow, collectTemporalOffensiveEffects } from './temporal-offensive-effects'
import { resolveNextSkillEffects } from './next-skill-effects'
import { collectDamageOverTime } from './damage-over-time'
import { projectileHitOutput, resolveProjectileHitModel } from './projectile-hit-model'
import { resolveTriggerRepeatModel, triggerRepeatOutput } from './trigger-repeat-model'
import { minionCompanionOutput, resolveMinionCompanionModel } from './minion-companion-model'
import { resourceSpiritOutput, resolveResourceSpiritModel } from './resource-spirit-model'
import { gemLevelQualityOutput, resolveGemLevelQualityModel } from './gem-level-quality-model'
import { itemValueScopeOutput, resolveItemValueScopeModel } from './item-value-scope-model'
import type { RotationAnalysis } from '../common/types'
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
  rotationAnalysis?:RotationAnalysis
  characterLevel?:number
}):DamageEstimate {
  const setup=input.setups.find(value=>value.role==='main'&&value.skillId)||input.setups.find(value=>value.skillId)
  const skillId=setup?.skillId||input.fallbackSkillId
  const definition=input.skills.find(value=>value.id===skillId)
  const referenceName=definition?.nameEn??(skillId?curatedEnglishNames[skillId]:undefined)
  const skill=referenceName?skillsByName.get(referenceName.toLocaleLowerCase('en')):undefined
  const resourceSpiritModel=resolveResourceSpiritModel({equipment:input.equipment,setups:input.setups,skills:input.skills,supports:input.supports??[],characterLevel:input.characterLevel,passiveTree:input.passiveTree,realPassivePlanning:input.realPassivePlanning})
  const spiritWarnings=resourceSpiritModel.spiritCapacityByWeaponSet.flatMap(state=>{
    if(state.status==='blocked-incomplete-reservation-chain')return [`${state.weaponSet==='set-1'?'Waffenset 1':'Waffenset 2'}: Mindestens eine Geistreservierung besitzt keine exakte, lokal belegte Höhe.`]
    if(state.status==='exceeds-confirmed-minimum')return [`${state.weaponSet==='set-1'?'Waffenset 1':'Waffenset 2'}: ${state.reservedSpirit} Geist sind reserviert, aber nur ${state.confirmedMinimumCapacity} Geist sind als Mindestkapazität bestätigt. Nicht transportierter Quest-Geist kann die Differenz decken; die Kombination wird deshalb nicht automatisch verworfen.`]
    return[]
  })
  const gemLevelQualityModel=resolveGemLevelQualityModel({setup,skill:definition,supports:input.supports??[]})
  const itemValueScopeModel=resolveItemValueScopeModel(input.equipment)
  const base:DamageEstimate={status:'unavailable',skillId,skillName:definition?.displayNameDe??definition?.nameEn,gemLevel:gemLevelQualityModel.appliedSkillLevel,weaponSet:setup?.weaponSet??'both',components:[],resourceSpiritModel:resourceSpiritOutput(resourceSpiritModel),gemLevelQualityModel:gemLevelQualityOutput(gemLevelQualityModel),itemValueScopeModel:itemValueScopeOutput(itemValueScopeModel),included:[],excluded:[],warnings:[],sourceCommit:reference.sourceCommit,calculatorVersion:'3.5.0'}
  if(!skill)return{...base,status:'unavailable',warnings:['Für diese Fertigkeit ist keine eindeutige numerische PoB2-Referenz vorhanden.']}
  if(!gemLevelQualityModel.productive)return{...base,status:'unavailable',warnings:[`Die angeforderte Gemmenstufe ${setup?.level??'Unbekannt'} besitzt keine exakte numerische Referenz. Verfügbar ist ausschließlich Stufe ${skill.gemLevel}; eine Skalierung wird nicht erfunden.`]}
  const damageOverTime=collectDamageOverTime(skill)
  const projectileHitModel=resolveProjectileHitModel(skill)
  const triggerRepeatModel=resolveTriggerRepeatModel({primarySkill:definition,setups:input.setups,skills:input.skills})
  const minionCompanionModel=resolveMinionCompanionModel({primarySkill:definition,setups:input.setups,skills:input.skills})
  const damageOverTimeOutput=()=>({modelVersion:damageOverTime.modelVersion,effects:damageOverTime.effects.map(value=>({sourceRecordId:value.sourceRecordId,sourceLabel:value.sourceLabel,damageType:value.damageType,kind:value.kind,status:value.status,damagePerSecond:value.damagePerSecond,durationMs:value.durationMs,totalDamagePerApplication:value.totalDamagePerApplication,stackCount:value.stackCount,detail:value.detail})),blockedEffects:damageOverTime.blockedEffects.map(value=>({sourceRecordId:value.sourceRecordId,sourceLabel:value.sourceLabel,kind:value.kind,status:value.status,detail:value.detail})),totalSingleApplicationDamagePerSecond:damageOverTime.totalSingleApplicationDamagePerSecond,limitations:damageOverTime.limitations})
  if(minionCompanionModel.primarySkillMinion)return{...base,status:'unavailable',triggerRepeatModel:triggerRepeatOutput(triggerRepeatModel),minionCompanionModel:minionCompanionOutput(minionCompanionModel),warnings:['Diese Fertigkeit erzeugt oder steuert Minions beziehungsweise Begleiter. Ohne belegte Kreaturenbasis, aktive Anzahl, eigene Wirkfrequenz und Uptime wird weder Spieler- noch Minion-DPS erfunden.']}
  if(triggerRepeatModel.primarySkillTriggered)return{...base,status:'unavailable',triggerRepeatModel:triggerRepeatOutput(triggerRepeatModel),minionCompanionModel:minionCompanionOutput(minionCompanionModel),warnings:['Diese Fertigkeit wird ausgelöst. Ohne belegte Quelle, Bedingung, Ziel und Auslöseintervall wird keine normale Wirkfrequenz oder DPS erfunden.']}
  if(skill.kind==='other')return{...base,status:'unavailable',triggerRepeatModel:triggerRepeatOutput(triggerRepeatModel),minionCompanionModel:minionCompanionOutput(minionCompanionModel),warnings:['Diese Fertigkeitsart besitzt noch kein belastbares Trefferschadenmodell.']}
  let components:DamageComponent[]
  let actionsPerSecond=skill.castTime>0?1/skill.castTime:1
  const included=[`Fertigkeitsstufe ${gemLevelQualityModel.appliedSkillLevel}`,'strukturierte Basiswerte der Fertigkeit']
  const activeSet=setup?.weaponSet==='set-2'?'set-2':'set-1'
  if(skill.kind==='attack'){
    const weaponEntry=input.equipment.find(entry=>entry.slotId.includes(`weapon-${activeSet}`)&&Boolean(entry.baseDisplayName||entry.itemDefinitionId))
    const weaponName=weaponEntry?.baseDisplayName??weaponEntry?.itemDefinitionId
    const weapon=weaponName?weaponsByName.get(weaponName.toLocaleLowerCase('en')):undefined
    const weaponValueScope=weaponEntry?itemValueScopeModel.entries.find(entry=>entry.itemId===weaponEntry.id):undefined
    const hasObservedWeaponBasis=Boolean(weaponEntry?.weaponStats?.attacksPerSecond&&[
      weaponEntry.weaponStats.physicalDamage,
      weaponEntry.weaponStats.fireDamage,
      weaponEntry.weaponStats.coldDamage,
      weaponEntry.weaponStats.lightningDamage,
      weaponEntry.weaponStats.chaosDamage,
    ].some(Boolean))
    if(!weaponEntry||!weapon&&!hasObservedWeaponBasis)return{...base,status:'unavailable',warnings:['Der gewählte Waffenbasistyp konnte keiner numerischen Waffenbasis am Pin zugeordnet werden und besitzt keine vollständigen eingegebenen Waffenwerte.']}
    if(weaponValueScope&&!weaponValueScope.productive)return{...base,status:'unavailable',warnings:[`${weaponValueScope.detail} Der Waffenschaden wird deshalb nicht unvollständig oder doppelt berechnet.`]}
    components=weaponComponents(weapon,weaponEntry).map(value=>component(value.type,value.minimum*(skill.baseMultiplier??1),value.maximum*(skill.baseMultiplier??1)))
    const localAttackSpeed=weaponEntry.weaponStats?0:valueFor(weaponEntry,/local_attack_speed_\+%|attack_speed_\+%_local/)
    actionsPerSecond=(weaponEntry.weaponStats?.attacksPerSecond??weapon!.attacksPerSecond)*(1+localAttackSpeed/100)*(1+skill.attackSpeedMultiplier/100)
    included.push(weaponEntry.weaponStats?'eingegebene endgültige Waffenschadenswerte einschließlich lokaler Wirkungen und Qualität':'Waffenbasis mit einmalig angewandten lokalen Affixen','Angriffsmultiplikator',weaponEntry.weaponStats?.attacksPerSecond?'eingegebene Angriffe pro Sekunde':'Basis-Angriffsgeschwindigkeit')
    if(weaponEntry.weaponStats?.unresolvedElementalDamage?.length)base.warnings.push('Elementare Waffenbereiche ohne sicher bestimmte Schadensart sind noch nicht im Teilwert enthalten.')
  }else{
    components=spellComponents(skill)
    included.push('Zauber-Basisschaden','Basis-Zauberzeit')
  }
  if(!components.length)return{...base,status:'unavailable',...(damageOverTime.effects.length||damageOverTime.blockedEffects.length?{damageOverTime:damageOverTimeOutput()}:{}),warnings:['Die primäre Schadenskomponente ist nicht eindeutig strukturiert verfügbar.']}
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
  const temporal=collectTemporalOffensiveEffects({setups:input.setups,skills:input.skills,mainSkill:definition,rotationAnalysis:input.rotationAnalysis})
  const nextSkill=resolveNextSkillEffects({components,setups:input.setups,skills:input.skills,mainSkill:definition,rotationAnalysis:input.rotationAnalysis})
  const temporalComponents=applyTemporalDamageWindow(components,temporal.damageMultiplier).map(value=>component(value.type,value.minimum,value.maximum))
  const temporalActionsPerSecond=actionsPerSecond*temporal.actionSpeedMultiplier
  if(quantitative.damageModifiers.length)included.push('passende globale Schadenssteigerungen je Schadenskomponente')
  if(speedIncrease)included.push(skill.kind==='attack'?'Angriffsgeschwindigkeit aus Ausrüstung und belegten Baumknoten':'Zaubergeschwindigkeit aus Ausrüstung und belegten Baumknoten')
  if(quantitative.conversions.length)included.push('bestätigte einstufige Schadensumwandlungen')
  if(quantitative.damageModifiers.some(value=>value.source!=='equipment'))included.push('numerisch eindeutige Passive- und Aszendenzwerte')
  if(supportEffects.appliedEffects.length)included.push('strukturierte numerische Supporteffekte')
  if(nextSkill.appliedEffects.length)included.push('belegter einmalig vorbereiteter Folgeangriff')
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
  const temporalMinimum=temporalComponents.reduce((sum,value)=>sum+value.minimum,0)
  const temporalMaximum=temporalComponents.reduce((sum,value)=>sum+value.maximum,0)
  const temporalAverage=(temporalMinimum+temporalMaximum)/2
  const activeWindowDamagePerSecond=temporal.appliedEffects.length
    ? temporalAverage*(criticalExpectationMultiplier??1)*temporalActionsPerSecond
    : undefined
  const preparedNextHitAverage=nextSkill.appliedEffects.length
    ? nextSkill.components.reduce((sum,value)=>sum+(value.minimum+value.maximum)/2,0)*(criticalExpectationMultiplier??1)
    : undefined
  const resolvedEnemyProfile=input.enemyProfile?applyBuildEnemyEffects({
    profile:input.enemyProfile,setups:input.setups,skills:input.skills,
    activeDamageTypes:components.map(value=>value.type),weaponSet:activeSet,
    primarySkillId:skillId,primaryActionsPerSecond:actionsPerSecond,
    passiveTree:input.passiveTree,realPassivePlanning:input.realPassivePlanning,
  }):undefined
  const enemyMitigation=resolvedEnemyProfile?applyEnemyMitigation(components,resolvedEnemyProfile):undefined
  const expectedDamageAfterMitigation=enemyMitigation?.average==null?undefined:enemyMitigation.average*(criticalExpectationMultiplier??1)
  const expectedDamagePerSecondAfterMitigation=expectedDamageAfterMitigation==null?undefined:expectedDamageAfterMitigation*actionsPerSecond
  const temporalEnemyMitigation=resolvedEnemyProfile&&temporal.appliedEffects.length?applyEnemyMitigation(temporalComponents,resolvedEnemyProfile):undefined
  const activeWindowDamagePerSecondAfterMitigation=temporalEnemyMitigation
    ? temporalEnemyMitigation.average*(criticalExpectationMultiplier??1)*temporalActionsPerSecond
    : undefined
  const nextSkillEnemyMitigation=resolvedEnemyProfile&&nextSkill.appliedEffects.length?applyEnemyMitigation(nextSkill.components,resolvedEnemyProfile):undefined
  const preparedNextHitDamageAfterMitigation=nextSkillEnemyMitigation
    ? nextSkillEnemyMitigation.average*(criticalExpectationMultiplier??1)
    : undefined
  return{
    ...base,status:'partial',components,baseComponents,projectileHitModel:projectileHitOutput(projectileHitModel),triggerRepeatModel:triggerRepeatOutput(triggerRepeatModel),minionCompanionModel:minionCompanionOutput(minionCompanionModel),
    stages:[
      {id:'base',label:'Strukturierter Grundschaden',components:baseComponents},
      {id:'conversion',label:'Nach bestätigten Umwandlungen',components:convertedComponents},
      {id:'increased-damage',label:'Nach passenden Schadenserhöhungen',components:increasedComponents},
      {id:'support-more-damage',label:'Nach strukturierten Support-Multiplikatoren',components},
      ...(preparedNextHitAverage==null?[]:[{id:'prepared-next-hit' as const,label:'Einmalig vorbereiteter nächster Treffer',components:nextSkill.components,value:round(preparedNextHitAverage)}]),
      ...(activeWindowDamagePerSecond==null?[]:[{id:'temporal-active-window' as const,label:'Im belegten aktiven Bufffenster',components:temporalComponents,value:round(activeWindowDamagePerSecond)}]),
      {id:'speed',label:'Aktionen pro Sekunde',components:[],value:round(actionsPerSecond)},
      ...(expectedCriticalHitDamagePerSecond==null?[]:[{id:'critical-expectation' as const,label:'Erwartungswert einschließlich kritischer Treffer',components:[],value:round(expectedCriticalHitDamagePerSecond)}]),
      ...(expectedDamagePerSecondAfterMitigation==null?[]:[{id:'enemy-mitigation' as const,label:`Nach Gegnerabwehr${resolvedEnemyProfile!.fullyBrokenArmour?' im aufrechterhaltbaren Vollzustand':''}: ${resolvedEnemyProfile!.label}`,components:enemyMitigation!.components,value:round(expectedDamagePerSecondAfterMitigation)}]),
    ],
    appliedDamageEffects:quantitative.damageModifiers.map(value=>({source:value.source,sourceId:value.sourceId,label:value.label,value:value.percent})),
    appliedSpeedEffects:quantitative.speedModifiers.map(value=>({source:value.source,sourceId:value.sourceId,label:value.label,value:value.percent})),
    appliedSupportEffects:supportEffects.appliedEffects,
    temporalOffensiveEffects:temporal.effects.map(value=>({sourceId:value.sourceId,label:value.label,kind:value.kind,percent:value.percent,activationTimeMs:value.activationTimeMs,durationMs:value.durationMs,status:value.status,detail:value.detail})),
    ...(nextSkill.effects.length?{nextSkillEffects:{modelVersion:nextSkill.modelVersion,effects:nextSkill.effects.map(value=>({sourceId:value.sourceId,sourceLabel:value.sourceLabel,targetSkillId:value.targetSkillId,targetSkillLabel:value.targetSkillLabel,kind:value.kind,percent:value.percent,status:value.status,detail:value.detail}))}}:{}),
    ...((damageOverTime.effects.length||damageOverTime.blockedEffects.length)?{damageOverTime:damageOverTimeOutput()}:{}),
    ...(temporal.chargeState.relevant?{chargeState:{modelVersion:temporal.chargeState.modelVersion,productive:temporal.chargeState.productive,states:temporal.chargeState.states.map(value=>({type:value.type,label:value.label,availability:value.availability,count:value.count,detail:value.detail})),consumptions:temporal.chargeState.consumptions.map(value=>({sourceId:value.sourceId,label:value.label,chargeTypes:value.chargeTypes,intervalMs:value.intervalMs,detail:value.detail}))}}:{}),
    confirmedConversions:quantitative.conversions.map(value=>({from:value.from,to:value.to,percent:value.percent,source:value.source,sourceId:value.sourceId})),
    ...(effectiveCriticalChance==null?{}:{criticalChance:{base:round(baseCriticalChance!),increasedPercent:round(criticalChanceIncrease),effective:round(effectiveCriticalChance)}}),
    ...(effectiveCriticalChance==null?{}:{criticalDamageBonus:round(totalCriticalDamageBonus),criticalExpectationMultiplier:round(criticalExpectationMultiplier!),expectedCriticalHitDamage:round(expectedCriticalHitDamage!),expectedCriticalHitDamagePerSecond:round(expectedCriticalHitDamagePerSecond!)}),
    ...(resolvedEnemyProfile&&enemyMitigation?{enemyProfile:resolvedEnemyProfile,mitigatedComponents:enemyMitigation.components,expectedDamageAfterMitigation:round(expectedDamageAfterMitigation!),expectedDamagePerSecondAfterMitigation:round(expectedDamagePerSecondAfterMitigation!)}:{}),
    ...(activeWindowDamagePerSecond==null?{}:{activeWindowDamagePerSecond:round(activeWindowDamagePerSecond)}),
    ...(activeWindowDamagePerSecondAfterMitigation==null?{}:{activeWindowDamagePerSecondAfterMitigation:round(activeWindowDamagePerSecondAfterMitigation)}),
    ...(preparedNextHitAverage==null?{}:{preparedNextHitDamage:round(preparedNextHitAverage)}),
    ...(preparedNextHitDamageAfterMitigation==null?{}:{preparedNextHitDamageAfterMitigation:round(preparedNextHitDamageAfterMitigation)}),
    hitDamage:{minimum:round(minimum),maximum:round(maximum),average:round(average)},
    actionsPerSecond:round(actionsPerSecond),
    hitDamagePerSecond:round(average*actionsPerSecond),
    included,
    excluded:[...(input.enemyProfile?[]:['Gegnerwiderstände und Rüstung']),'Exposition ohne eindeutigen strukturierten Betrag','Trigger und Wiederholungen ohne vollständige Quelle-Bedingung-Ziel-Intervall-Kette','Minions und Begleiter ohne Kreaturenbasis, aktive Anzahl, eigene Wirkfrequenz und Uptime','Supporteffekte ohne strukturierte Effektwerte','bedingte Passive- und Aszendenzeffekte',...(damageOverTime.effects.length?['nicht belegte Entzünden-, Gift- und Blutungs-DPS sowie DoT-Stapelung']:['Ailments und Schaden über Zeit ohne vollständige Basis-, Dauer-, Auslöse- und Stapelkette']),'nicht belegte Projektilüberlappung, Fork- und Rückkehrtreffer'],
    warnings:['Vergleichbarer Teilwert, keine vollständige PoB-Gesamt-DPS. Nur identische Messgrenzen direkt vergleichen.',...(input.enemyProfile?[]:['Es wurde kein Vergleichsgegner angegeben; der angezeigte Teilwert liegt vor Gegnerabwehr.']),...(supportEffects.unresolvedSupportIds.length?[`${supportEffects.unresolvedSupportIds.length} gewählte Supports besitzen noch keinen strukturierten numerischen Effekt und verändern den Schadenswert nicht.`]:[]),...spiritWarnings,...quantitative.warnings,...(enemyMitigation?.warnings??[])],
  }
}
