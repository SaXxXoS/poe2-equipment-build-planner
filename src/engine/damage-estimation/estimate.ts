import reference from '../../../generated/pob2/damage-reference.json'
import type { EquipmentEntry, SkillGemDefinition, SkillSetup, SupportGemDefinition } from '../../domain'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'
import { applyConversions, applyDamageModifiers, applyGainAsExtra, applyRageMoreDamageModifiers, collectQuantitativeEffects, collectRageScaledDamageModifiers, collectSkillConversions } from './quantitative-effects'
import { applyQuantitativeSupports } from './quantitative-supports'
import { applyEnemyMitigation } from './enemy-mitigation'
import { applyBuildEnemyEffects } from './build-enemy-effects'
import { applyTemporalDamageWindow, collectTemporalOffensiveEffects } from './temporal-offensive-effects'
import { resolveNextSkillEffects } from './next-skill-effects'
import { collectDamageOverTime } from './damage-over-time'
import { collectDamagingAilments } from './damaging-ailments'
import { resolveConditionalAilmentEffects } from './conditional-ailment-effects'
import { resolveBleedingPassiveEffect } from './bleeding-passive-effects'
import { resolveAttackHitChance } from './attack-hit-chance'
import { expectedLuckyHitDamage, resolveLuckyHitEffectModel } from './lucky-hit-effects'
import { resolveMultipleDamageEffect } from './multiple-damage-effects'
import { projectileHitOutput, resolveProjectileHitModel } from './projectile-hit-model'
import { attachNormalizedTriggeredTargetDamage, resolveTriggerRepeatModel, supportedSkillCooldownFor, triggerRepeatOutput } from './trigger-repeat-model'
import { additionalCooldownUsesFor } from './additional-cooldown-uses'
import { minionCompanionOutput, resolveMinionCompanionModel } from './minion-companion-model'
import { resourceSpiritOutput, resolveResourceSpiritModel } from './resource-spirit-model'
import { applySkillQualityStats, gemLevelQualityOutput, resolveGemLevelQualityModel } from './gem-level-quality-model'
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
  if(entry.weaponStats&&entry.weaponStatsSource!=='pinned-base'){
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
  characterClassId?:string
  triggerDepth?:number
}):DamageEstimate {
  const setup=input.setups.find(value=>value.role==='main'&&value.skillId)||input.setups.find(value=>value.skillId)
  const skillId=setup?.skillId||input.fallbackSkillId
  const definition=input.skills.find(value=>value.id===skillId)
  const referenceName=definition?.nameEn??(skillId?curatedEnglishNames[skillId]:undefined)
  const skillReference=referenceName?skillsByName.get(referenceName.toLocaleLowerCase('en')):undefined
  let resourceSpiritModel=resolveResourceSpiritModel({equipment:input.equipment,setups:input.setups,skills:input.skills,supports:input.supports??[],characterLevel:input.characterLevel,passiveTree:input.passiveTree,realPassivePlanning:input.realPassivePlanning})
  const spiritWarnings=resourceSpiritModel.spiritCapacityByWeaponSet.flatMap(state=>{
    if(state.status==='blocked-incomplete-reservation-chain')return [`${state.weaponSet==='set-1'?'Waffenset 1':'Waffenset 2'}: Mindestens eine Geistreservierung besitzt keine exakte, lokal belegte Höhe.`]
    if(state.status==='fits-level-derived-quest-estimate')return [`${state.weaponSet==='set-1'?'Waffenset 1':'Waffenset 2'}: Die Reservierung passt nur unter der automatischen Quest-Geist-Schätzung. Das Charakterlevel beweist den Abschluss der zugehörigen Quests nicht.`]
    if(state.status==='exceeds-confirmed-minimum')return [`${state.weaponSet==='set-1'?'Waffenset 1':'Waffenset 2'}: ${state.effectiveReservedSpirit} Geist überschreiten die sicher belegte Mindestkapazität; ohne Level- oder Questangabe ist die dauerhafte Nutzbarkeit unbekannt.`]
    if(state.status==='exceeds-level-derived-quest-estimate')return [`${state.weaponSet==='set-1'?'Waffenset 1':'Waffenset 2'}: ${state.effectiveReservedSpirit} Geist werden nach belegter Effizienz reserviert; selbst die levelbasierte Planungskapazität von ${state.planningCapacity} Geist reicht nicht.`]
    return[]
  })
  const gemLevelQualityModel=resolveGemLevelQualityModel({setup,skill:definition,supports:input.supports??[]})
  const itemValueScopeModel=resolveItemValueScopeModel(input.equipment)
  const base:DamageEstimate={status:'unavailable',skillId,skillName:definition?.displayNameDe??definition?.nameEn,gemLevel:gemLevelQualityModel.appliedSkillLevel,weaponSet:setup?.weaponSet??'both',components:[],resourceSpiritModel:resourceSpiritOutput(resourceSpiritModel),gemLevelQualityModel:gemLevelQualityOutput(gemLevelQualityModel),itemValueScopeModel:itemValueScopeOutput(itemValueScopeModel),included:[],excluded:[],warnings:[],sourceCommit:reference.sourceCommit,calculatorVersion:'3.17.0'}
  if(!skillReference)return{...base,status:'unavailable',warnings:['Für diese Fertigkeit ist keine eindeutige numerische PoB2-Referenz vorhanden.']}
  if(!gemLevelQualityModel.productive)return{...base,status:'unavailable',warnings:[`Die angeforderte Gemmenstufe ${setup?.level??'Unbekannt'} besitzt keine exakte numerische Referenz. Vorhandene Stufen: ${gemLevelQualityModel.availableSkillLevels.join(', ')||'keine'}. Eine Skalierung wird nicht erfunden.`]}
  const selectedLevel=skillReference.levels.find(value=>value.level===gemLevelQualityModel.appliedSkillLevel)
  if(!selectedLevel)return{...base,status:'unavailable',warnings:['Die ausgewählte Gemmenstufe besitzt keine vollständige strukturierte Stufenzeile.']}
  const skill={...skillReference,...selectedLevel,numericStats:applySkillQualityStats(selectedLevel.numericStats,gemLevelQualityModel),gemLevel:selectedLevel.level} as unknown as NumericSkill
  let damageOverTime=collectDamageOverTime(skill,input.enemyProfile)
  const projectileHitModel=resolveProjectileHitModel(skill)
  let triggerRepeatModel=resolveTriggerRepeatModel({primarySkill:definition,setups:input.setups,skills:input.skills,supports:input.supports})
  const minionCompanionModel=resolveMinionCompanionModel({primarySkill:definition,setups:input.setups,skills:input.skills})
  const damageOverTimeOutput=()=>({modelVersion:damageOverTime.modelVersion,effects:damageOverTime.effects.map(value=>({sourceRecordId:value.sourceRecordId,sourceLabel:value.sourceLabel,damageType:value.damageType,kind:value.kind,status:value.status,damagePerSecond:value.damagePerSecond,damagePerSecondAfterMitigation:value.damagePerSecondAfterMitigation,durationMs:value.durationMs,totalDamagePerApplication:value.totalDamagePerApplication,totalDamagePerApplicationAfterMitigation:value.totalDamagePerApplicationAfterMitigation,stackCount:value.stackCount,detail:value.detail})),blockedEffects:damageOverTime.blockedEffects.map(value=>({sourceRecordId:value.sourceRecordId,sourceLabel:value.sourceLabel,kind:value.kind,status:value.status,detail:value.detail})),totalSingleApplicationDamagePerSecond:damageOverTime.totalSingleApplicationDamagePerSecond,totalSingleApplicationDamagePerSecondAfterMitigation:damageOverTime.totalSingleApplicationDamagePerSecondAfterMitigation,limitations:damageOverTime.limitations})
  if(minionCompanionModel.primarySkillMinion)return{...base,status:'unavailable',triggerRepeatModel:triggerRepeatOutput(triggerRepeatModel),minionCompanionModel:minionCompanionOutput(minionCompanionModel),warnings:['Diese Fertigkeit erzeugt oder steuert Minions beziehungsweise Begleiter. Ohne belegte Kreaturenbasis, aktive Anzahl, eigene Wirkfrequenz und Uptime wird weder Spieler- noch Minion-DPS erfunden.']}
  if(triggerRepeatModel.primarySkillTriggered)return{...base,status:'unavailable',triggerRepeatModel:triggerRepeatOutput(triggerRepeatModel),minionCompanionModel:minionCompanionOutput(minionCompanionModel),warnings:['Diese Fertigkeit wird ausgelöst. Ohne belegte Quelle, Bedingung, Ziel und Auslöseintervall wird keine normale Wirkfrequenz oder DPS erfunden.']}
  if(skill.kind==='other')return{...base,status:'unavailable',triggerRepeatModel:triggerRepeatOutput(triggerRepeatModel),minionCompanionModel:minionCompanionOutput(minionCompanionModel),warnings:['Diese Fertigkeitsart besitzt noch kein belastbares Trefferschadenmodell.']}
  let components:DamageComponent[]
  let actionsPerSecond=skill.castTime>0?1/skill.castTime:1
  const included=[`Fertigkeitsstufe ${gemLevelQualityModel.appliedSkillLevel}`,`Fertigkeitsqualität ${gemLevelQualityModel.appliedSkillQuality??0}%`,'strukturierte Basiswerte der Fertigkeit']
  const activeSet=setup?.weaponSet==='set-2'?'set-2':'set-1'
  if(skill.kind==='attack'){
    const weaponEntry=input.equipment.find(entry=>entry.slotId.includes(`weapon-${activeSet}`)&&Boolean(entry.baseDisplayName||entry.itemDefinitionId))
    const weaponName=weaponEntry?.baseDisplayName??weaponEntry?.itemDefinitionId
    const weapon=weaponName?weaponsByName.get(weaponName.toLocaleLowerCase('en')):undefined
    const weaponValueScope=weaponEntry?itemValueScopeModel.entries.find(entry=>entry.itemId===weaponEntry.id):undefined
    const hasObservedWeaponBasis=Boolean(weaponEntry?.weaponStatsSource!=='pinned-base'&&weaponEntry?.weaponStats?.attacksPerSecond&&[
      weaponEntry.weaponStats.physicalDamage,
      weaponEntry.weaponStats.fireDamage,
      weaponEntry.weaponStats.coldDamage,
      weaponEntry.weaponStats.lightningDamage,
      weaponEntry.weaponStats.chaosDamage,
    ].some(Boolean))
    if(!weaponEntry||!weapon&&!hasObservedWeaponBasis)return{...base,status:'unavailable',warnings:['Der gewählte Waffenbasistyp konnte keiner numerischen Waffenbasis am Pin zugeordnet werden und besitzt keine vollständigen eingegebenen Waffenwerte.']}
    if(weaponValueScope&&!weaponValueScope.productive)return{...base,status:'unavailable',warnings:[`${weaponValueScope.detail} Der Waffenschaden wird deshalb nicht unvollständig oder doppelt berechnet.`]}
    components=weaponComponents(weapon,weaponEntry).map(value=>component(value.type,value.minimum*(skill.baseMultiplier??1),value.maximum*(skill.baseMultiplier??1)))
    const hasObservedFinalWeaponStats=weaponEntry.weaponStatsSource!=='pinned-base'&&Boolean(weaponEntry.weaponStats)
    const localAttackSpeed=hasObservedFinalWeaponStats?0:valueFor(weaponEntry,/local_attack_speed_\+%|attack_speed_\+%_local/)
    actionsPerSecond=(hasObservedFinalWeaponStats?weaponEntry.weaponStats?.attacksPerSecond:weapon?.attacksPerSecond)!*(1+localAttackSpeed/100)*(1+skill.attackSpeedMultiplier/100)
    included.push(hasObservedFinalWeaponStats?'eingegebene endgültige Waffenschadenswerte einschließlich lokaler Wirkungen und Qualität':'Waffenbasis mit einmalig angewandten lokalen Affixen','Angriffsmultiplikator',hasObservedFinalWeaponStats?'eingegebene Angriffe pro Sekunde':'Basis-Angriffsgeschwindigkeit')
    if(weaponEntry.weaponStats?.unresolvedElementalDamage?.length)base.warnings.push('Elementare Waffenbereiche ohne sicher bestimmte Schadensart sind noch nicht im Teilwert enthalten.')
  }else{
    components=spellComponents(skill)
    included.push('Zauber-Basisschaden','Basis-Zauberzeit')
  }
  if(!components.length)return{...base,status:'unavailable',...(damageOverTime.effects.length||damageOverTime.blockedEffects.length?{damageOverTime:damageOverTimeOutput()}:{}),warnings:['Die primäre Schadenskomponente ist nicht eindeutig strukturiert verfügbar.']}
  const baseComponents=components.map(value=>({...value}))
  const quantitative=collectQuantitativeEffects({equipment:input.equipment,skill:definition,passiveTree:input.passiveTree,realPassivePlanning:input.realPassivePlanning,weaponSet:activeSet})
  const temporal=collectTemporalOffensiveEffects({setups:input.setups,skills:input.skills,mainSkill:definition,rotationAnalysis:input.rotationAnalysis,resourceSpiritModel})
  const archmageEffect=resourceSpiritModel.skillCostChains
    .find(value=>value.setupId===setup?.id)
    ?.intrinsicSkillCostEffects.find(value=>value.kind==='archmage-max-mana-cost'&&value.gainAsLightningPercent!=null)
  if(archmageEffect?.gainAsLightningPercent){
    quantitative.gainAsExtra.unshift({
      id:`skill:${archmageEffect.sourceSkillId??'archmage'}:maximum-mana-gain-as-lightning`,
      source:'skill',
      sourceId:archmageEffect.sourceSkillId??'archmage',
      from:'all',
      to:'lightning',
      percent:archmageEffect.gainAsLightningPercent,
    })
  }
  const manaTempestEffect=temporal.appliedEffects.find(value=>value.kind==='gain-as-lightning'&&value.percent!=null)
  quantitative.conversions.unshift(...collectSkillConversions(skill.sourceRecordId,skill.numericStats as Record<string, number>))
  const convertedComponents=applyConversions(baseComponents,quantitative.conversions)
  const gainedComponents=applyGainAsExtra(convertedComponents,quantitative.gainAsExtra,baseComponents)
  components=applyDamageModifiers(baseComponents,quantitative.conversions,quantitative.damageModifiers,quantitative.gainAsExtra).map(value=>component(value.type,value.minimum,value.maximum))
  const increasedComponents=components.map(value=>({...value}))
  const supportEffects=applyQuantitativeSupports({components,setup,supports:input.supports??[]})
  components=supportEffects.components.map(value=>component(value.type,value.minimum,value.maximum))
  const speedIncrease=quantitative.speedModifiers.reduce((sum,effect)=>sum+effect.percent,0)
  actionsPerSecond*=1+speedIncrease/100
  actionsPerSecond*=supportEffects.actionSpeedMultiplier
  const additionalCooldownUses=additionalCooldownUsesFor({
    skillTypes:skill.skillTypes,
    equipment:input.equipment,
    weaponSet:activeSet,
    passiveTree:input.passiveTree,
    planning:input.realPassivePlanning,
  })
  const supportedCooldown=supportedSkillCooldownFor(skill,setup,input.supports??[],additionalCooldownUses)
  if(supportedCooldown){
    actionsPerSecond=Math.min(actionsPerSecond,supportedCooldown.sustainedUseRatePerSecond)
    included.push(supportedCooldown.overrideCooldownSeconds==null
      ? 'nach Server-Takt begrenzte nachhaltige Cooldown-Nutzungsrate'
      : 'supportbedingter Cooldown-Override mit nachhaltiger Nutzungsrate')
    if(supportedCooldown.additionalStoredUses>0)included.push(`${supportedCooldown.additionalStoredUses} belegte zusätzliche Cooldown-Nutzung${supportedCooldown.additionalStoredUses===1?'':'en'} aus aktivem Waffenset und Passivplan`)
    if(additionalCooldownUses.recoveryPercent>0)included.push(`${additionalCooldownUses.recoveryPercent}% belegte Abklingzeiterholung aus aktivem Waffenset und Passivplan`)
  }
  const attackHitChance=skill.kind==='attack'?resolveAttackHitChance({
    characterLevel:input.characterLevel,
    characterClassId:input.characterClassId,
    equipment:input.equipment,
    activeSet,
    passiveTree:input.passiveTree,
    realPassivePlanning:input.realPassivePlanning,
    enemyLevel:input.enemyProfile?.level,
    enemyEvasion:input.enemyProfile?.evasion,
  }):undefined
  const hitChancePercent=skill.kind==='spell'?100:attackHitChance?.hitChancePercent
  if(setup&&skill.kind==='attack'&&hitChancePercent!=null){
    resourceSpiritModel=resolveResourceSpiritModel({
      equipment:input.equipment,
      setups:input.setups,
      skills:input.skills,
      supports:input.supports??[],
      characterLevel:input.characterLevel,
      passiveTree:input.passiveTree,
      realPassivePlanning:input.realPassivePlanning,
      resolvedActionFrequencyPerSecondBySetup:{[setup.id]:actionsPerSecond},
      resolvedSuccessfulHitFrequencyPerSecondBySetup:{[setup.id]:actionsPerSecond*hitChancePercent/100},
    })
    base.resourceSpiritModel=resourceSpiritOutput(resourceSpiritModel)
  }
  const nextSkill=resolveNextSkillEffects({components,setups:input.setups,skills:input.skills,mainSkill:definition,rotationAnalysis:input.rotationAnalysis})
  const temporalGainComponents=manaTempestEffect?.percent
    ? applyQuantitativeSupports({
        components:applyDamageModifiers(
          baseComponents,
          quantitative.conversions,
          quantitative.damageModifiers,
          [...quantitative.gainAsExtra, {
            id:`skill:${manaTempestEffect.sourceId}:active-window-gain-as-lightning`,
            source:'skill',
            sourceId:manaTempestEffect.sourceId,
            from:'all',
            to:'lightning',
            percent:manaTempestEffect.percent,
          }],
        ),
        setup,
        supports:input.supports??[],
      }).components
    : components
  const temporalComponents=applyTemporalDamageWindow(temporalGainComponents,temporal.damageMultiplier).map(value=>component(value.type,value.minimum,value.maximum))
  const temporalActionsPerSecond=actionsPerSecond*temporal.actionSpeedMultiplier
  if(quantitative.damageModifiers.length)included.push('passende globale Schadenssteigerungen je Schadenskomponente')
  if(speedIncrease)included.push(skill.kind==='attack'?'Angriffsgeschwindigkeit aus Ausrüstung und belegten Baumknoten':'Zaubergeschwindigkeit aus Ausrüstung und belegten Baumknoten')
  if(quantitative.conversions.length)included.push('bestätigte mehrstufig geordnete Schadensumwandlungen')
  if(quantitative.gainAsExtra.length)included.push('bestätigter zusätzlicher Schaden nach PoB-Modifikatorreihenfolge')
  if(archmageEffect)included.push(`Archmage: ${archmageEffect.gainAsLightningPercent}% des Schadens als zusätzlicher Blitzschaden bei ${archmageEffect.additionalBaseManaCost} zusätzlichen Mana-Grundkosten`)
  if(quantitative.damageModifiers.some(value=>value.source!=='equipment'))included.push('numerisch eindeutige Passive- und Aszendenzwerte')
  if(supportEffects.appliedEffects.length)included.push('strukturierte numerische Supporteffekte')
  if(nextSkill.appliedEffects.length)included.push('belegter einmalig vorbereiteter Folgeangriff')
  const minimum=components.reduce((sum,value)=>sum+value.minimum,0)
  const maximum=components.reduce((sum,value)=>sum+value.maximum,0)
  const average=(minimum+maximum)/2
  const luckyHitEffectModel=resolveLuckyHitEffectModel({
    passiveTree:input.passiveTree,
    planning:input.realPassivePlanning,
    weaponSet:activeSet,
    enemyProfile:input.enemyProfile,
  })
  const luckyHitEffects=luckyHitEffectModel.effects
  const rollExpectedAverage=expectedLuckyHitDamage(components,luckyHitEffects)
  if(luckyHitEffects.length)included.push('belegte Lucky-Trefferschadenswürfe mit bestätigtem Bedingungszustand')
  const activeWeapon=input.equipment.find(entry=>entry.slotId.includes(`weapon-${activeSet}`))
  const baseCriticalChance=skill.kind==='attack'?activeWeapon?.weaponStats?.criticalHitChance:skill.critChance
  const criticalChanceIncrease=quantitative.criticalChanceModifiers.reduce((sum,effect)=>sum+effect.percent,0)
  const effectiveCriticalChance=baseCriticalChance==null?undefined:Math.min(100,baseCriticalChance*(1+criticalChanceIncrease/100)*supportEffects.criticalChanceMultiplier)
  const additionalCriticalDamageBonus=quantitative.criticalMultiplierModifiers.reduce((sum,effect)=>sum+effect.percent,0)+supportEffects.criticalDamageBonus
  const totalCriticalDamageBonus=100+additionalCriticalDamageBonus
  const criticalExpectationMultiplier=effectiveCriticalChance==null?undefined:1+effectiveCriticalChance/100*totalCriticalDamageBonus/100
  const multipleDamageEffect=resolveMultipleDamageEffect({
    passiveTree:input.passiveTree,
    planning:input.realPassivePlanning,
    weaponSet:activeSet,
    skill:definition,
    criticalChancePercent:effectiveCriticalChance,
  })
  const multipleDamageMultiplier=multipleDamageEffect.expectedDamageMultiplier
  if(multipleDamageEffect.sources.length)included.push('exakt belegter Doppel- und Dreifachschaden mit PoB2-Überlappungsreihenfolge')
  const expectedCriticalHitDamage=criticalExpectationMultiplier==null?undefined:rollExpectedAverage*criticalExpectationMultiplier*multipleDamageMultiplier
  const expectedCriticalHitDamagePerSecond=expectedCriticalHitDamage==null?undefined:expectedCriticalHitDamage*actionsPerSecond
  const accuracyMultiplier=hitChancePercent==null?undefined:hitChancePercent/100
  const accuracyAdjustedCriticalChance=effectiveCriticalChance==null||accuracyMultiplier==null?undefined:effectiveCriticalChance*accuracyMultiplier
  if(effectiveCriticalChance!=null&&hitChancePercent!=null){
    const enemyLevel=input.enemyProfile?.level
    const enemyAilmentThreshold=enemyLevel==null
      ? undefined
      : reference.monsterAilmentThresholdTable[Math.max(0,Math.min(reference.monsterAilmentThresholdTable.length-1,Math.trunc(enemyLevel)-1))]
    triggerRepeatModel=resolveTriggerRepeatModel({
      primarySkill:definition,
      setups:input.setups,
      skills:input.skills,
      supports:input.supports,
      primaryActionContext:{
        actionsPerSecond,
        hitChancePercent,
        criticalHitChancePercent:effectiveCriticalChance,
        criticalHitDamageBeforeMitigation:rollExpectedAverage*(1+totalCriticalDamageBonus/100),
        monsterPower:input.enemyProfile?.monsterPower,
        enemyAilmentThreshold,
      },
    })
  }
  const accuracyAdjustedCriticalMultiplier=accuracyAdjustedCriticalChance==null?undefined:1+accuracyAdjustedCriticalChance/100*totalCriticalDamageBonus/100
  const accuracyAdjustedDamagePerSecond=accuracyMultiplier==null?undefined:rollExpectedAverage*actionsPerSecond*accuracyMultiplier*multipleDamageMultiplier
  const accuracyAdjustedExpectedCriticalDamagePerSecond=accuracyMultiplier==null
    ? undefined
    : rollExpectedAverage*actionsPerSecond*accuracyMultiplier*(accuracyAdjustedCriticalMultiplier??1)*multipleDamageMultiplier
  const temporalAverage=expectedLuckyHitDamage(temporalComponents,luckyHitEffects)
  const activeWindowDamagePerSecond=temporal.appliedEffects.length
    ? temporalAverage*(criticalExpectationMultiplier??1)*temporalActionsPerSecond*multipleDamageMultiplier
    : undefined
  const preparedNextHitAverage=nextSkill.appliedEffects.length
    ? expectedLuckyHitDamage(nextSkill.components,luckyHitEffects)*(criticalExpectationMultiplier??1)*multipleDamageMultiplier
    : undefined
  const resolvedEnemyProfile=input.enemyProfile?applyBuildEnemyEffects({
    profile:input.enemyProfile,setups:input.setups,skills:input.skills,
    activeDamageTypes:components.map(value=>value.type),weaponSet:activeSet,
    primarySkillId:skillId,primaryActionsPerSecond:actionsPerSecond,
    passiveTree:input.passiveTree,realPassivePlanning:input.realPassivePlanning,
  }):undefined
  damageOverTime=collectDamageOverTime(skill,resolvedEnemyProfile)
  const conditionalAilmentEffects=resolveConditionalAilmentEffects(input.equipment)
  const damagingAilments=collectDamagingAilments({
    skill,
    components,
    actionsPerSecond,
    hitChancePercent,
    setup,
    supports: input.supports??[],
    enemyLevel: resolvedEnemyProfile?.level,
    enemyProfile: resolvedEnemyProfile,
    bleedingPassiveEffect: resolveBleedingPassiveEffect({
      passiveTree: input.passiveTree,
      planning: input.realPassivePlanning,
      weaponSet: activeSet,
    }),
    criticalChancePercent: effectiveCriticalChance,
    criticalHitDamageMultiplier: 1 + totalCriticalDamageBonus / 100,
    bleedingChanceOnCriticalHitPercent: conditionalAilmentEffects.bleedingChanceOnCriticalHitPercent,
    poisonChanceOnCriticalHitPercent: conditionalAilmentEffects.poisonChanceOnCriticalHitPercent,
    conditionalAilmentSourceReferences: conditionalAilmentEffects.sourceReferences,
    aggravateBleedingOnCriticalAttack: conditionalAilmentEffects.aggravateBleedingOnCriticalAttack,
  })
  const enemyMitigation=resolvedEnemyProfile?applyEnemyMitigation(components,resolvedEnemyProfile):undefined
  const mitigatedRollAverage=enemyMitigation?expectedLuckyHitDamage(enemyMitigation.components,luckyHitEffects):undefined
  const expectedDamageAfterMitigation=mitigatedRollAverage==null?undefined:mitigatedRollAverage*(criticalExpectationMultiplier??1)*multipleDamageMultiplier
  const expectedDamagePerSecondAfterMitigation=expectedDamageAfterMitigation==null?undefined:expectedDamageAfterMitigation*actionsPerSecond
  const accuracyAdjustedDamagePerSecondAfterMitigation=enemyMitigation?.average==null||accuracyMultiplier==null
    ? undefined
    : mitigatedRollAverage!*actionsPerSecond*accuracyMultiplier*(accuracyAdjustedCriticalMultiplier??1)*multipleDamageMultiplier
  const temporalEnemyMitigation=resolvedEnemyProfile&&temporal.appliedEffects.length?applyEnemyMitigation(temporalComponents,resolvedEnemyProfile):undefined
  const activeWindowDamagePerSecondAfterMitigation=temporalEnemyMitigation
    ? expectedLuckyHitDamage(temporalEnemyMitigation.components,luckyHitEffects)*(criticalExpectationMultiplier??1)*temporalActionsPerSecond*multipleDamageMultiplier
    : undefined
  const nextSkillEnemyMitigation=resolvedEnemyProfile&&nextSkill.appliedEffects.length?applyEnemyMitigation(nextSkill.components,resolvedEnemyProfile):undefined
  const preparedNextHitDamageAfterMitigation=nextSkillEnemyMitigation
    ? expectedLuckyHitDamage(nextSkillEnemyMitigation.components,luckyHitEffects)*(criticalExpectationMultiplier??1)*multipleDamageMultiplier
    : undefined
  if((input.triggerDepth??0)===0){
    const targetDamage=new Map<string,{expectedHitDamage:number;expectedHitDamageAfterMitigation?:number}>()
    for(const source of triggerRepeatModel.sources){
      if(source.status!=='normalized-event-rate-only'||!source.targetSkillId||targetDamage.has(source.targetSkillId))continue
      const metaSetup=input.setups.find(value=>value.skillId===source.sourceSkillId)
      const targetDefinition=input.skills.find(value=>value.id===source.targetSkillId)
      if(!metaSetup||!targetDefinition)continue
      const targetEstimate=estimateHitDamage({
        ...input,
        setups:[{
          id:`${metaSetup.id}:trigger-target:${source.targetSkillId}`,
          skillId:source.targetSkillId,
          role:'main',
          weaponSet:metaSetup.weaponSet,
          supportGemIds:metaSetup.supportGemIds,
          origin:metaSetup.origin,
        }],
        fallbackSkillId:source.targetSkillId,
        triggerDepth:1,
      })
      const expectedHitDamage=targetEstimate.expectedCriticalHitDamage??targetEstimate.hitDamage?.average
      if(expectedHitDamage==null)continue
      targetDamage.set(source.targetSkillId,{
        expectedHitDamage,
        ...(targetEstimate.expectedDamageAfterMitigation==null?{}:{
          expectedHitDamageAfterMitigation:targetEstimate.expectedDamageAfterMitigation,
        }),
      })
    }
    triggerRepeatModel=attachNormalizedTriggeredTargetDamage(triggerRepeatModel,targetDamage)
  }
  const triggeredDamagePerSecond=triggerRepeatModel.sources.reduce((sum,source)=>sum+(source.triggeredDamagePerSecond??0),0)
  const triggeredDamagePerSecondAfterMitigation=triggerRepeatModel.sources.reduce((sum,source)=>sum+(source.triggeredDamagePerSecondAfterMitigation??0),0)
  const primaryComparableDamagePerSecond=accuracyAdjustedExpectedCriticalDamagePerSecond??expectedCriticalHitDamagePerSecond
  const primaryComparableDamagePerSecondAfterMitigation=accuracyAdjustedDamagePerSecondAfterMitigation??expectedDamagePerSecondAfterMitigation
  const combinedDamagePerSecond=primaryComparableDamagePerSecond==null
    ? undefined
    : primaryComparableDamagePerSecond+triggeredDamagePerSecond
  const combinedDamagePerSecondAfterMitigation=primaryComparableDamagePerSecondAfterMitigation==null
    ? undefined
    : primaryComparableDamagePerSecondAfterMitigation+triggeredDamagePerSecondAfterMitigation
  const rageChain=resourceSpiritModel.skillCostChains.find(value=>value.setupId===setup?.id)
  const hasConfirmedRageGain=Boolean(rageChain&&(
    rageChain.rageGenerationPerHit>0
    || (rageChain.rageGenerationPerSecond??0)>0
  ))
  const rageAppliesToSkill=Boolean(rageChain&&rageChain.rageDamageAppliesTo===skill.kind)
  const comparedRage=rageAppliesToSkill&&hasConfirmedRageGain
    ? rageChain!.confirmedMaximumRage
    : 0
  const effectiveRageEffect=comparedRage>0 ? rageChain!.confirmedRageEffectAtMaximum : 0
  const inherentMoreAttackDamagePerRagePercent=reference.rageDamageConstants.inherentMoreAttackDamagePerRagePercent
  const rageDamageMultiplier=1+effectiveRageEffect*inherentMoreAttackDamagePerRagePercent/100
  const rageScaledModifiers=collectRageScaledDamageModifiers({
    passiveTree:input.passiveTree,
    realPassivePlanning:input.realPassivePlanning,
    weaponSet:activeSet,
    skill:definition,
    effectiveRageEffect,
  })
  const rageIncreasedModifiers=rageScaledModifiers
    .filter(value=>value.kind==='increased')
    .map(value=>({
      id:value.id,
      source:value.source,
      sourceId:value.sourceId,
      label:value.label,
      percent:value.percent,
      appliesTo:value.appliesTo,
    }))
  const rageStateBeforeSupports=applyDamageModifiers(
    baseComponents,
    quantitative.conversions,
    [...quantitative.damageModifiers,...rageIncreasedModifiers],
    quantitative.gainAsExtra,
  )
  const rageStateAfterSupports=applyQuantitativeSupports({
    components:rageStateBeforeSupports,
    setup,
    supports:input.supports??[],
  }).components
  const rageStateComponents=applyRageMoreDamageModifiers(rageStateAfterSupports,rageScaledModifiers)
  const rageStateRollAverage=expectedLuckyHitDamage(rageStateComponents,luckyHitEffects)
  const rageStateExpectedHitDamage=rageStateRollAverage*(criticalExpectationMultiplier??1)*rageDamageMultiplier*multipleDamageMultiplier
  const rageStateExpectedDamagePerSecond=rageStateRollAverage*actionsPerSecond*(accuracyMultiplier??1)*(accuracyAdjustedCriticalMultiplier??criticalExpectationMultiplier??1)*rageDamageMultiplier*multipleDamageMultiplier
  const rageStateMitigation=resolvedEnemyProfile?applyEnemyMitigation(rageStateComponents,resolvedEnemyProfile):undefined
  const rageStateExpectedDamagePerSecondAfterMitigation=rageStateMitigation
    ? expectedLuckyHitDamage(rageStateMitigation.components,luckyHitEffects)*actionsPerSecond*(accuracyMultiplier??1)*(accuracyAdjustedCriticalMultiplier??criticalExpectationMultiplier??1)*rageDamageMultiplier*multipleDamageMultiplier
    : undefined
  const rageDamageComparison:NonNullable<DamageEstimate['rageDamageComparison']>=rageAppliesToSkill&&hasConfirmedRageGain
    ? {
        modelVersion:'2.1.0',
        status:rageChain?.fullRageCombatStatus==='maintainable-after-ramp'
          ? 'ramped-sustained-combat-comparison'
          : 'full-confirmed-pool-window',
        inherentMoreAttackDamagePerRagePercent,
        comparedRage,
        effectiveRageEffect,
        appliesTo:rageChain!.rageDamageAppliesTo,
        damageMultiplier:round(rageDamageMultiplier,4),
        expectedHitDamageAtComparedRage:round(rageStateExpectedHitDamage),
        expectedDamagePerSecondAtComparedRage:round(rageStateExpectedDamagePerSecond),
        ...(rageStateExpectedDamagePerSecondAfterMitigation==null?{}:{
          expectedDamagePerSecondAfterMitigationAtComparedRage:round(rageStateExpectedDamagePerSecondAfterMitigation),
        }),
        ...(rageChain?.noGainNoHitRageDurationSeconds==null?{}:{
          durationWithoutFurtherHitOrGainSeconds:rageChain.noGainNoHitRageDurationSeconds,
        }),
        ...(rageScaledModifiers.length===0?{}:{
          appliedRageScaledEffects:rageScaledModifiers.map(value=>({
            sourceId:value.sourceId,
            label:value.label,
            kind:value.kind,
            percent:value.percent,
            rageDivisor:value.rageDivisor,
          })),
        }),
        detail:rageChain?.fullRageCombatStatus==='maintainable-after-ramp'
          ? `Belegter Kampfreferenzwert nach ${rageChain.secondsToFullRage?.toLocaleString('de-DE')} s Anlaufzeit bei fortgesetzter gleicher Treffer- und Wutgewinnrate.${rageScaledModifiers.length?` ${rageScaledModifiers.length} zusätzliche belegte Wutskalierung${rageScaledModifiers.length===1?'':'en'} ist/sind eingerechnet.`:''}`
          : 'Explizites Vergleichsfenster bei vollem bestätigtem Wutvorrat. Der normale Dauerschadenswert setzt diesen Zustand nicht voraus.',
      }
    : {
        modelVersion:'2.1.0',
        status:'blocked-no-confirmed-rage-gain',
        inherentMoreAttackDamagePerRagePercent,
        comparedRage:0,
        effectiveRageEffect:0,
        appliesTo:rageChain?.rageDamageAppliesTo??'attack',
        damageMultiplier:1,
        detail:!rageAppliesToSkill
          ? `Die belegte Wutwirkung gilt für ${rageChain?.rageDamageAppliesTo==='spell'?'Zauber':'Angriffe'} und wird nicht auf diese Fertigkeit angewandt.`
          : 'Ohne belegte Wutgewinnkette wird kein positiver Wutstand und kein Schadensbonus angenommen.',
      }
  return{
    ...base,status:'partial',components,baseComponents,projectileHitModel:projectileHitOutput(projectileHitModel),triggerRepeatModel:triggerRepeatOutput(triggerRepeatModel),minionCompanionModel:minionCompanionOutput(minionCompanionModel),
    ...(attackHitChance?{attackHitChance}:{}),
    stages:[
      {id:'base',label:'Strukturierter Grundschaden',components:baseComponents},
      {id:'conversion',label:'Nach bestätigten Umwandlungen',components:convertedComponents},
      ...(quantitative.gainAsExtra.length?[{id:'gain-as-extra' as const,label:'Nach bestätigtem zusätzlichem Schaden',components:gainedComponents}]:[]),
      {id:'increased-damage',label:'Nach passenden Schadenserhöhungen',components:increasedComponents},
      {id:'support-more-damage',label:'Nach strukturierten Support-Multiplikatoren',components},
      ...(luckyHitEffects.length?[{id:'lucky-hit-expectation' as const,label:'Erwartungswert mit belegten Lucky-Schadenswürfen',components,value:round(rollExpectedAverage)}]:[]),
      ...(multipleDamageEffect.sources.length?[{id:'multiple-damage-expectation' as const,label:'Erwartungswert mit belegtem Doppel-/Dreifachschaden',components,value:round(rollExpectedAverage*multipleDamageMultiplier)}]:[]),
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
    ...(nextSkill.effects.length?{nextSkillEffects:{modelVersion:nextSkill.modelVersion,effects:nextSkill.effects.map(value=>({sourceId:value.sourceId,sourceLabel:value.sourceLabel,targetSkillId:value.targetSkillId,targetSkillLabel:value.targetSkillLabel,kind:value.kind,percent:value.percent,repeatCount:value.repeatCount,sequenceDamageMultiplier:value.sequenceDamageMultiplier,status:value.status,detail:value.detail}))}}:{}),
    ...((damageOverTime.effects.length||damageOverTime.blockedEffects.length)?{damageOverTime:damageOverTimeOutput()}:{}),
    ...((damagingAilments.effects.length||damagingAilments.blockedEffects.length)?{damagingAilments:{
      modelVersion:damagingAilments.modelVersion,
      effects:damagingAilments.effects.map(value=>({
        sourceRecordId:value.sourceRecordId,sourceLabel:value.sourceLabel,kind:value.kind,damageType:value.damageType,status:value.status,
        chancePercent:value.chancePercent,durationMs:value.durationMs,maximumStacks:value.maximumStacks,expectedActiveStacks:value.expectedActiveStacks,
        damagePerSecond:value.damagePerSecond,damagePerSecondAfterMitigation:value.damagePerSecondAfterMitigation,totalDamagePerApplication:value.totalDamagePerApplication,effectMultiplier:value.effectMultiplier,
        chanceOnHitPercent:value.chanceOnHitPercent,chanceOnCriticalHitPercent:value.chanceOnCriticalHitPercent,
        ailmentCriticalChancePercent:value.ailmentCriticalChancePercent,weightedSourceDamage:value.weightedSourceDamage,detail:value.detail,
      })),
      blockedEffects:damagingAilments.blockedEffects.map(value=>({sourceRecordId:value.sourceRecordId,sourceLabel:value.sourceLabel,kind:value.kind,status:value.status,detail:value.detail})),
      totalSustainedDamagePerSecond:damagingAilments.totalSustainedDamagePerSecond,
      totalSustainedDamagePerSecondAfterMitigation:damagingAilments.totalSustainedDamagePerSecondAfterMitigation,
      limitations:damagingAilments.limitations,
    }}:{}),
    ...(temporal.chargeState.relevant?{chargeState:{modelVersion:temporal.chargeState.modelVersion,productive:temporal.chargeState.productive,states:temporal.chargeState.states.map(value=>({type:value.type,label:value.label,availability:value.availability,count:value.count,detail:value.detail})),consumptions:temporal.chargeState.consumptions.map(value=>({sourceId:value.sourceId,label:value.label,chargeTypes:value.chargeTypes,intervalMs:value.intervalMs,detail:value.detail}))}}:{}),
    confirmedConversions:quantitative.conversions.map(value=>({from:value.from,to:value.to,percent:value.percent,source:value.source,sourceId:value.sourceId})),
    confirmedGainAsExtra:quantitative.gainAsExtra.map(value=>({from:value.from,to:value.to,percent:value.percent,source:value.source,sourceId:value.sourceId})),
    ...(luckyHitEffects.length||luckyHitEffectModel.blockedEffects.length?{luckyHitEffects:{modelVersion:'2.0.0' as const,expectedHitDamage:round(rollExpectedAverage),effects:luckyHitEffects,blockedEffects:luckyHitEffectModel.blockedEffects}}:{}),
    ...(multipleDamageEffect.sources.length?{multipleDamageEffect}:{}),
    ...(effectiveCriticalChance==null?{}:{criticalChance:{base:round(baseCriticalChance!),increasedPercent:round(criticalChanceIncrease),effective:round(effectiveCriticalChance)}}),
    ...(effectiveCriticalChance==null?{}:{criticalDamageBonus:round(totalCriticalDamageBonus),criticalExpectationMultiplier:round(criticalExpectationMultiplier!),expectedCriticalHitDamage:round(expectedCriticalHitDamage!),expectedCriticalHitDamagePerSecond:round(expectedCriticalHitDamagePerSecond!)}),
    ...(accuracyAdjustedDamagePerSecond==null?{}:{accuracyAdjustedDamagePerSecond:round(accuracyAdjustedDamagePerSecond)}),
    ...(accuracyAdjustedExpectedCriticalDamagePerSecond==null?{}:{accuracyAdjustedExpectedCriticalDamagePerSecond:round(accuracyAdjustedExpectedCriticalDamagePerSecond)}),
    ...(accuracyAdjustedDamagePerSecondAfterMitigation==null?{}:{accuracyAdjustedDamagePerSecondAfterMitigation:round(accuracyAdjustedDamagePerSecondAfterMitigation)}),
    ...(resolvedEnemyProfile&&enemyMitigation?{enemyProfile:resolvedEnemyProfile,mitigatedComponents:enemyMitigation.components,expectedDamageAfterMitigation:round(expectedDamageAfterMitigation!),expectedDamagePerSecondAfterMitigation:round(expectedDamagePerSecondAfterMitigation!)}:{}),
    ...(combinedDamagePerSecond==null?{}:{combinedDamagePerSecond:round(combinedDamagePerSecond)}),
    ...(combinedDamagePerSecondAfterMitigation==null?{}:{combinedDamagePerSecondAfterMitigation:round(combinedDamagePerSecondAfterMitigation)}),
    rageDamageComparison,
    ...(activeWindowDamagePerSecond==null?{}:{activeWindowDamagePerSecond:round(activeWindowDamagePerSecond)}),
    ...(activeWindowDamagePerSecondAfterMitigation==null?{}:{activeWindowDamagePerSecondAfterMitigation:round(activeWindowDamagePerSecondAfterMitigation)}),
    ...(preparedNextHitAverage==null?{}:{preparedNextHitDamage:round(preparedNextHitAverage)}),
    ...(preparedNextHitDamageAfterMitigation==null?{}:{preparedNextHitDamageAfterMitigation:round(preparedNextHitDamageAfterMitigation)}),
    hitDamage:{minimum:round(minimum),maximum:round(maximum),average:round(average)},
    actionsPerSecond:round(actionsPerSecond),
    hitDamagePerSecond:round(rollExpectedAverage*actionsPerSecond*multipleDamageMultiplier),
    included,
    excluded:[...(input.enemyProfile?[]:['Gegnerwiderstände und Rüstung']),...(luckyHitEffectModel.blockedEffects.length?['bedingte Lucky-Trefferschadenswürfe ohne bestätigten Gegnerzustand']:[]),'Exposition ohne eindeutigen strukturierten Betrag','Trigger und Wiederholungen ohne vollständige Quelle-Bedingung-Ziel-Intervall-Kette','Minions und Begleiter ohne Kreaturenbasis, aktive Anzahl, eigene Wirkfrequenz und Uptime','Supporteffekte ohne strukturierte Effektwerte','bedingte Passive- und Aszendenzeffekte',...(damagingAilments.effects.length?['nicht vollständig belegte Entzünden-, Gift- und Blutungs-Sonderfälle sowie gegnerische DoT-Abwehr']:['Entzünden, Gift und Blutung ohne vollständige Basis-, Dauer-, Auslöse- und Stapelkette']),'nicht belegte Projektilüberlappung, Fork- und Rückkehrtreffer'],
    warnings:['Vergleichbarer Teilwert, keine vollständige PoB-Gesamt-DPS. Nur identische Messgrenzen direkt vergleichen.',...(attackHitChance&&attackHitChance.status!=='exact'?['Die Angriffstrefferchance ist ohne belegtes Charakterlevel und bekannte Klasse blockiert; der rohe Aktionswert ist nicht trefferbereinigt.']:[]),...(input.enemyProfile?[]:['Es wurde kein Vergleichsgegner angegeben; der angezeigte Teilwert liegt vor Gegnerabwehr.']),...(supportEffects.unresolvedSupportIds.length?[`${supportEffects.unresolvedSupportIds.length} gewählte Supports besitzen noch keinen strukturierten numerischen Effekt und verändern den Schadenswert nicht.`]:[]),...spiritWarnings,...quantitative.warnings,...(enemyMitigation?.warnings??[])],
  }
}
