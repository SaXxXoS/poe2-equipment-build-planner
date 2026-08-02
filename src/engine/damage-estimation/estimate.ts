import reference from '../../../generated/pob2/damage-reference.json'
import type { EquipmentEntry, SkillGemDefinition, SkillSetup, SupportGemDefinition } from '../../domain'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'
import { applyConversions, applyDamageModifiers, applyGainAsExtra, applyRageMoreDamageModifiers, collectQuantitativeEffects, collectRageScaledDamageModifiers, collectSkillConversions, quantitativePercentMultiplier } from './quantitative-effects'
import { applyQuantitativeSupports } from './quantitative-supports'
import { applyEnemyMitigation } from './enemy-mitigation'
import { applyBuildEnemyEffects, resolveSelectedTargetCriticalDamageBonus } from './build-enemy-effects'
import { applyTemporalDamageWindow, collectTemporalOffensiveEffects } from './temporal-offensive-effects'
import { resolveNextSkillEffects } from './next-skill-effects'
import { collectDamageOverTime } from './damage-over-time'
import { resolveSkillEffectDurationSupports } from './skill-effect-duration-supports'
import { applyMaximumPhysicalDamageSupports } from './maximum-physical-damage-supports'
import { applyAreaDamageMultiplier, resolveAreaDamageSupports } from './area-damage-supports'
import { applySpellCascadeDamageMultiplier, resolveSpellCascadeSupports } from './spell-cascade-supports'
import { applyChainHitDamageMultiplier, resolveChainSupports } from './chain-supports'
import { applyMultishotDamageMultiplier, resolveMultishotSupports } from './multishot-supports'
import { resolveCrossbowAmmunitionSupports } from './crossbow-ammunition-supports'
import { resolvePierceSupports } from './pierce-supports'
import { resolveForkSupports } from './fork-supports'
import { collectDamagingAilments } from './damaging-ailments'
import { resolveConditionalAilmentEffects } from './conditional-ailment-effects'
import { resolveBleedingPassiveEffect } from './bleeding-passive-effects'
import { resolveDamagingAilmentRateEffects } from './ailment-rate-effects'
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
import { resolveCharacterDefenceModel } from './character-defence-model'
import { resolveCharacterSurvivabilityModel } from './character-survivability-model'
import { resolveConditionalHitEffects } from './conditional-hit-effects'
import { harmonicMean,resolveDualWieldAttackModel } from './dual-wield-effects'
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
const weaponSpeed=(weapon:WeaponBase|undefined,entry:EquipmentEntry)=>{
  const observed=entry.weaponStatsSource!=='pinned-base'&&entry.weaponStats?.attacksPerSecond
  const localIncrease=observed?0:valueFor(entry,/local_attack_speed_\+%|attack_speed_\+%_local/)
  return Number(observed??weapon?.attacksPerSecond??0)*(1+localIncrease/100)
}
const averageHandComponents=(left:DamageComponent[],right:DamageComponent[],multiplier:number)=>types.flatMap(type=>{
  const first=left.find(value=>value.type===type)
  const second=right.find(value=>value.type===type)
  const minimum=((first?.minimum??0)+(second?.minimum??0))/2*multiplier
  const maximum=((first?.maximum??0)+(second?.maximum??0))/2*multiplier
  return minimum||maximum?[component(type,minimum,maximum)]:[]
})

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
  const activeDefenceSet=setup?.weaponSet==='set-2'?'set-2':'set-1'
  const characterDefenceModel=resolveCharacterDefenceModel({equipment:input.equipment,passiveTree:input.passiveTree,realPassivePlanning:input.realPassivePlanning,weaponSet:activeDefenceSet,characterClassId:input.characterClassId})
  const effectiveManaPool=resourceSpiritModel.skillCostChains.find(value=>value.setupId===setup?.id)?.effectiveManaPool??resourceSpiritModel.confirmedMinimumPools?.mana
  const maximumEnergyShield=characterDefenceModel.contributions.find(value=>value.type==='energyShield')?.calculatedContribution
  const totalArmour=characterDefenceModel.contributions.find(value=>value.type==='armour')?.calculatedContribution
  const totalEvasion=characterDefenceModel.contributions.find(value=>value.type==='evasion')?.calculatedContribution
  const characterSurvivabilityModel=resolveCharacterSurvivabilityModel({classId:input.characterClassId,characterLevel:input.characterLevel,equipment:input.equipment,passiveTree:input.passiveTree,realPassivePlanning:input.realPassivePlanning,weaponSet:activeDefenceSet,maximumEnergyShield,maximumMana:effectiveManaPool??undefined,totalArmour,totalEvasion})
  const base:DamageEstimate={status:'unavailable',skillId,skillName:definition?.displayNameDe??definition?.nameEn,gemLevel:gemLevelQualityModel.appliedSkillLevel,weaponSet:setup?.weaponSet??'both',components:[],resourceSpiritModel:resourceSpiritOutput(resourceSpiritModel),gemLevelQualityModel:gemLevelQualityOutput(gemLevelQualityModel),itemValueScopeModel:itemValueScopeOutput(itemValueScopeModel),characterDefenceModel,characterSurvivabilityModel,included:[],excluded:[],warnings:[],sourceCommit:reference.sourceCommit,calculatorVersion:'3.69.0'}
  if(!skillReference)return{...base,status:'unavailable',warnings:['Für diese Fertigkeit ist keine eindeutige numerische PoB2-Referenz vorhanden.']}
  if(!gemLevelQualityModel.productive)return{...base,status:'unavailable',warnings:[`Die angeforderte Gemmenstufe ${setup?.level??'Unbekannt'} besitzt keine exakte numerische Referenz. Vorhandene Stufen: ${gemLevelQualityModel.availableSkillLevels.join(', ')||'keine'}. Eine Skalierung wird nicht erfunden.`]}
  const selectedLevel=skillReference.levels.find(value=>value.level===gemLevelQualityModel.appliedSkillLevel)
  if(!selectedLevel)return{...base,status:'unavailable',warnings:['Die ausgewählte Gemmenstufe besitzt keine vollständige strukturierte Stufenzeile.']}
  const skill={...skillReference,...selectedLevel,numericStats:applySkillQualityStats(selectedLevel.numericStats,gemLevelQualityModel),gemLevel:selectedLevel.level} as unknown as NumericSkill
  const skillEffectDurationSupportModel=resolveSkillEffectDurationSupports({skill,setup,supports:input.supports??[]})
  const areaDamageSupportModel=resolveAreaDamageSupports({skill,setup,supports:input.supports??[]})
  const spellCascadeSupportModel=resolveSpellCascadeSupports({skill,setup,supports:input.supports??[]})
  const chainSupportModel=resolveChainSupports({skill,setup,supports:input.supports??[]})
  const multishotSupportModel=resolveMultishotSupports({skill,setup,supports:input.supports??[]})
  const crossbowAmmunitionSupportModel=resolveCrossbowAmmunitionSupports({skill,setup,supports:input.supports??[]})
  const pierceSupportModel=resolvePierceSupports({skill,setup,supports:input.supports??[]})
  const forkSupportModel=resolveForkSupports({skill,setup,supports:input.supports??[]})
  const durationInput=skillEffectDurationSupportModel.status==='applied'
    ? {multiplier:skillEffectDurationSupportModel.durationMultiplier,sourceReferences:skillEffectDurationSupportModel.sourceReferences}
    : undefined
  const nativeDotDamageMultiplier=(areaDamageSupportModel.status==='applied'?areaDamageSupportModel.damageMultiplier:1)*(spellCascadeSupportModel.status==='applied'?spellCascadeSupportModel.damageMultiplier:1)
  const areaDamageInput=nativeDotDamageMultiplier!==1
    ? {multiplier:nativeDotDamageMultiplier,sourceReferences:[...(areaDamageSupportModel.status==='applied'?areaDamageSupportModel.sourceReferences:[]),...(spellCascadeSupportModel.status==='applied'?spellCascadeSupportModel.sourceReferences:[])]}
    : undefined
  const resolvedBase:DamageEstimate={...base,skillEffectDurationSupportModel,areaDamageSupportModel,spellCascadeSupportModel,chainSupportModel,multishotSupportModel,crossbowAmmunitionSupportModel,pierceSupportModel,forkSupportModel}
  let damageOverTime=collectDamageOverTime(skill,input.enemyProfile,durationInput,areaDamageInput)
  const projectileHitModel=resolveProjectileHitModel(skill, {
    ...(chainSupportModel.status==='applied'?{additionalChains:chainSupportModel.additionalChains,chainSourceReference:chainSupportModel.sourceReferences.find(value=>value.endsWith(':number_of_chains'))}:{}),
    ...(multishotSupportModel.status==='applied'?{additionalProjectiles:multishotSupportModel.additionalProjectiles,projectileSourceReference:multishotSupportModel.sourceReferences.find(value=>value.endsWith(':number_of_additional_projectiles'))}:{}),
    ...(pierceSupportModel.status==='applied'?{pierceChancePercent:pierceSupportModel.chanceToPiercePercent,pierceSourceReference:pierceSupportModel.sourceReferences.find(value=>value.endsWith(':base_chance_to_pierce_%')),postPierceDamageMultiplier:pierceSupportModel.postPierceDamageMultiplier}:{}),
    ...(forkSupportModel.status==='applied-coverage-only'?{forkEnabled:true,forkSourceReference:forkSupportModel.sourceReferences[0],forkedProjectileDamageMultiplier:forkSupportModel.forkedProjectileDamageMultiplier}:{}),
  })
  let triggerRepeatModel=resolveTriggerRepeatModel({primarySkill:definition,setups:input.setups,skills:input.skills,supports:input.supports})
  const minionCompanionModel=resolveMinionCompanionModel({primarySkill:definition,setups:input.setups,skills:input.skills})
  const damageOverTimeOutput=()=>({modelVersion:damageOverTime.modelVersion,effects:damageOverTime.effects.map(value=>({sourceRecordId:value.sourceRecordId,sourceLabel:value.sourceLabel,damageType:value.damageType,kind:value.kind,status:value.status,damagePerSecond:value.damagePerSecond,damagePerSecondAfterMitigation:value.damagePerSecondAfterMitigation,durationMs:value.durationMs,totalDamagePerApplication:value.totalDamagePerApplication,totalDamagePerApplicationAfterMitigation:value.totalDamagePerApplicationAfterMitigation,stackCount:value.stackCount,detail:value.detail})),blockedEffects:damageOverTime.blockedEffects.map(value=>({sourceRecordId:value.sourceRecordId,sourceLabel:value.sourceLabel,kind:value.kind,status:value.status,detail:value.detail})),totalSingleApplicationDamagePerSecond:damageOverTime.totalSingleApplicationDamagePerSecond,totalSingleApplicationDamagePerSecondAfterMitigation:damageOverTime.totalSingleApplicationDamagePerSecondAfterMitigation,limitations:damageOverTime.limitations})
  if(minionCompanionModel.primarySkillMinion)return{...resolvedBase,status:'unavailable',triggerRepeatModel:triggerRepeatOutput(triggerRepeatModel),minionCompanionModel:minionCompanionOutput(minionCompanionModel),warnings:['Diese Fertigkeit erzeugt oder steuert Minions beziehungsweise Begleiter. Ohne belegte Kreaturenbasis, aktive Anzahl, eigene Wirkfrequenz und Uptime wird weder Spieler- noch Minion-DPS erfunden.']}
  if(triggerRepeatModel.primarySkillTriggered)return{...resolvedBase,status:'unavailable',triggerRepeatModel:triggerRepeatOutput(triggerRepeatModel),minionCompanionModel:minionCompanionOutput(minionCompanionModel),warnings:['Diese Fertigkeit wird ausgelöst. Ohne belegte Quelle, Bedingung, Ziel und Auslöseintervall wird keine normale Wirkfrequenz oder DPS erfunden.']}
  if(skill.kind==='other')return{...resolvedBase,status:'unavailable',triggerRepeatModel:triggerRepeatOutput(triggerRepeatModel),minionCompanionModel:minionCompanionOutput(minionCompanionModel),warnings:['Diese Fertigkeitsart besitzt noch kein belastbares Trefferschadenmodell.']}
  let components:DamageComponent[]
  let actionsPerSecond=skill.castTime>0?1/skill.castTime:1
  const included=[`Fertigkeitsstufe ${gemLevelQualityModel.appliedSkillLevel}`,`Fertigkeitsqualität ${gemLevelQualityModel.appliedSkillQuality??0}%`,'strukturierte Basiswerte der Fertigkeit']
  const activeSet=setup?.weaponSet==='set-2'?'set-2':'set-1'
  let dualWieldAttackModel:DamageEstimate['dualWieldAttackModel']
  if(skill.kind==='attack'){
    const weaponEntry=input.equipment.find(entry=>entry.slotId===`slot-weapon-${activeSet}-left`&&Boolean(entry.baseDisplayName||entry.itemDefinitionId))
      ??input.equipment.find(entry=>entry.slotId===`slot-weapon-${activeSet}-right`&&Boolean(entry.baseDisplayName||entry.itemDefinitionId))
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
    if(!weaponEntry||!weapon&&!hasObservedWeaponBasis)return{...resolvedBase,status:'unavailable',warnings:['Der gewählte Waffenbasistyp konnte keiner numerischen Waffenbasis am Pin zugeordnet werden und besitzt keine vollständigen eingegebenen Waffenwerte.']}
    if(weaponValueScope&&!weaponValueScope.productive)return{...resolvedBase,status:'unavailable',warnings:[`${weaponValueScope.detail} Der Waffenschaden wird deshalb nicht unvollständig oder doppelt berechnet.`]}
    components=weaponComponents(weapon,weaponEntry).map(value=>component(value.type,value.minimum*(skill.baseMultiplier??1),value.maximum*(skill.baseMultiplier??1)))
    const hasObservedFinalWeaponStats=weaponEntry.weaponStatsSource!=='pinned-base'&&Boolean(weaponEntry.weaponStats)
    actionsPerSecond=weaponSpeed(weapon,weaponEntry)*(1+skill.attackSpeedMultiplier/100)
    included.push(hasObservedFinalWeaponStats?'eingegebene endgültige Waffenschadenswerte einschließlich lokaler Wirkungen und Qualität':'Waffenbasis mit einmalig angewandten lokalen Affixen','Angriffsmultiplikator',hasObservedFinalWeaponStats?'eingegebene Angriffe pro Sekunde':'Basis-Angriffsgeschwindigkeit')
    if(weaponEntry.weaponStats?.unresolvedElementalDamage?.length)base.warnings.push('Elementare Waffenbereiche ohne sicher bestimmte Schadensart sind noch nicht im Teilwert enthalten.')
    const resolvedDualWield=resolveDualWieldAttackModel({
      skill:definition,numericStats:skill.numericStats as Record<string,number>,equipment:input.equipment,weaponSet:activeSet,
      resolveWeapon:entry=>{
        const name=entry.baseDisplayName??entry.itemDefinitionId
        return name?weaponsByName.get(name.toLocaleLowerCase('en')):undefined
      },
    })
    dualWieldAttackModel=resolvedDualWield
    if(resolvedDualWield.status==='applied'){
      const offEntry=input.equipment.find(entry=>entry.id===resolvedDualWield.offHandItemId)!
      const offName=offEntry.baseDisplayName??offEntry.itemDefinitionId
      const offWeapon=offName?weaponsByName.get(offName.toLocaleLowerCase('en')):undefined
      const offValueScope=itemValueScopeModel.entries.find(entry=>entry.itemId===offEntry.id)
      if(offValueScope&&!offValueScope.productive)return{...resolvedBase,dualWieldAttackModel:resolvedDualWield,status:'unavailable',warnings:[`${offValueScope.detail} Der Nebenhandschaden wird deshalb nicht unvollständig oder doppelt berechnet.`]}
      const offComponents=weaponComponents(offWeapon,offEntry).map(value=>component(value.type,value.minimum*(skill.baseMultiplier??1),value.maximum*(skill.baseMultiplier??1)))
      components=averageHandComponents(components,offComponents,resolvedDualWield.damageMultiplier)
      actionsPerSecond=harmonicMean(weaponSpeed(weapon,weaponEntry),weaponSpeed(offWeapon,offEntry))*(1+skill.attackSpeedMultiplier/100)*resolvedDualWield.attackSpeedMultiplier*resolvedDualWield.hitSequenceMultiplier
      included.push(`PoB2-Dual-Wield: beide kompatiblen Einhandwaffen${resolvedDualWield.finalDamagePercent===null?' abwechselnd':`, ${Math.abs(resolvedDualWield.finalDamagePercent)}% weniger Schaden je Hand und ein Treffer je Hand`}${resolvedDualWield.finalAttackSpeedPercent===null?'':`, ${resolvedDualWield.finalAttackSpeedPercent}% finale Angriffsgeschwindigkeit`}`)
      if(offEntry.weaponStats?.unresolvedElementalDamage?.length)base.warnings.push('Elementare Nebenhandbereiche ohne sicher bestimmte Schadensart sind noch nicht im Teilwert enthalten.')
    }else if(resolvedDualWield.evidence==='blocked')base.warnings.push(resolvedDualWield.detail)
  }else{
    components=spellComponents(skill)
    included.push('Zauber-Basisschaden','Basis-Zauberzeit')
  }
  if(!components.length){
    const dotEnemyProfile=input.enemyProfile?applyBuildEnemyEffects({
      profile:input.enemyProfile,setups:input.setups,skills:input.skills,
      activeDamageTypes:[...new Set(damageOverTime.effects.map(value=>value.damageType))],weaponSet:activeSet,
      primaryHitDamageTypes:[],
      primarySkillId:skillId,primaryActionsPerSecond:actionsPerSecond,
      supports:input.supports,equipment:input.equipment,
      passiveTree:input.passiveTree,realPassivePlanning:input.realPassivePlanning,
    }):undefined
    damageOverTime=collectDamageOverTime(skill,dotEnemyProfile,durationInput,areaDamageInput)
    return{
      ...resolvedBase,status:'unavailable',
      ...(dotEnemyProfile?{enemyProfile:dotEnemyProfile}:{}),
      ...(damageOverTime.effects.length||damageOverTime.blockedEffects.length?{damageOverTime:damageOverTimeOutput()}:{}),
      warnings:['Die primäre Trefferschadenskomponente ist nicht eindeutig strukturiert verfügbar; ein vollständig belegter eigenständiger DoT bleibt separat auswertbar.'],
    }
  }
  const maximumPhysicalDamageSupportModel=applyMaximumPhysicalDamageSupports({components,skill,setup,supports:input.supports??[]})
  const baseComponents=maximumPhysicalDamageSupportModel.components.map(value=>({...value}))
  const quantitative=collectQuantitativeEffects({equipment:input.equipment,skill:definition,passiveTree:input.passiveTree,realPassivePlanning:input.realPassivePlanning,weaponSet:activeSet,characterClassId:input.characterClassId})
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
  components=applyAreaDamageMultiplier(components,areaDamageSupportModel).map(value=>component(value.type,value.minimum,value.maximum))
  components=applySpellCascadeDamageMultiplier(components,spellCascadeSupportModel).map(value=>component(value.type,value.minimum,value.maximum))
  components=applyChainHitDamageMultiplier(components,chainSupportModel).map(value=>component(value.type,value.minimum,value.maximum))
  components=applyMultishotDamageMultiplier(components,multishotSupportModel).map(value=>component(value.type,value.minimum,value.maximum))
  const supportEffects=applyQuantitativeSupports({components,setup,supports:input.supports??[]})
  const externallyResolvedSupportIds=new Set([
    ...maximumPhysicalDamageSupportModel.appliedSupports.map(value=>value.supportId),
    ...maximumPhysicalDamageSupportModel.blockedSupportIds,
    ...areaDamageSupportModel.appliedSupports.map(value=>value.supportId),
    ...areaDamageSupportModel.blockedSupportIds,
    ...spellCascadeSupportModel.appliedSupports.map(value=>value.supportId),
    ...spellCascadeSupportModel.blockedSupportIds,
    ...chainSupportModel.appliedSupports.map(value=>value.supportId),
    ...chainSupportModel.blockedSupportIds,
    ...multishotSupportModel.appliedSupports.map(value=>value.supportId),
    ...multishotSupportModel.blockedSupportIds,
    ...crossbowAmmunitionSupportModel.appliedSupports.map(value=>value.supportId),
    ...crossbowAmmunitionSupportModel.appliedAmmunitionConservationSupports.map(value=>value.supportId),
    ...crossbowAmmunitionSupportModel.blockedSupportIds,
    ...pierceSupportModel.appliedSupports.map(value=>value.supportId),
    ...pierceSupportModel.blockedSupportIds,
    ...forkSupportModel.appliedSupports.map(value=>value.supportId),
    ...forkSupportModel.blockedSupportIds,
  ])
  const unresolvedSupportIds=supportEffects.unresolvedSupportIds.filter(value=>!externallyResolvedSupportIds.has(value))
  components=supportEffects.components.map(value=>component(value.type,value.minimum,value.maximum))
  const speedMultiplier=quantitativePercentMultiplier([...quantitative.speedModifiers,...supportEffects.increasedSpeedModifiers])
  actionsPerSecond*=speedMultiplier
  actionsPerSecond*=multishotSupportModel.skillSpeedMultiplier
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
    resolvedBase.resourceSpiritModel=base.resourceSpiritModel
  }
  const nextSkill=resolveNextSkillEffects({components,setups:input.setups,skills:input.skills,mainSkill:definition,rotationAnalysis:input.rotationAnalysis})
  const temporalGainComponents=manaTempestEffect?.percent
    ? applyQuantitativeSupports({
        components:applyAreaDamageMultiplier(applyDamageModifiers(
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
        ),areaDamageSupportModel),
        setup,
        supports:input.supports??[],
      }).components
    : components
  const temporalComponents=applyTemporalDamageWindow(temporalGainComponents,temporal.damageMultiplier).map(value=>component(value.type,value.minimum,value.maximum))
  const temporalActionsPerSecond=actionsPerSecond*temporal.actionSpeedMultiplier
  if(quantitative.damageModifiers.length)included.push('passende globale Schadenssteigerungen je Schadenskomponente')
  if(speedMultiplier!==1)included.push(skill.kind==='attack'?'Angriffsgeschwindigkeit aus Ausrüstung und belegten Baumknoten':'Zaubergeschwindigkeit aus Ausrüstung und belegten Baumknoten')
  if(quantitative.conversions.length)included.push('bestätigte mehrstufig geordnete Schadensumwandlungen')
  if(quantitative.gainAsExtra.length)included.push('bestätigter zusätzlicher Schaden nach PoB-Modifikatorreihenfolge')
  if(archmageEffect)included.push(`Archmage: ${archmageEffect.gainAsLightningPercent}% des Schadens als zusätzlicher Blitzschaden bei ${archmageEffect.additionalBaseManaCost} zusätzlichen Mana-Grundkosten`)
  if(quantitative.damageModifiers.some(value=>value.source!=='equipment'))included.push('numerisch eindeutige Passive- und Aszendenzwerte')
  if(supportEffects.appliedEffects.length)included.push('strukturierte numerische Supporteffekte')
  if(maximumPhysicalDamageSupportModel.status==='applied')included.push('Muskelkraft: strukturierter finaler Bonus ausschließlich auf den maximalen physischen Ausgangsschaden')
  if(areaDamageSupportModel.status==='applied')included.push('Konzentrierte Wirkung: strukturierter finaler Flächenschadensbonus mit verringerter Wirkungsfläche')
  if(spellCascadeSupportModel.status==='applied')included.push('Zauberkaskade: strukturierter finaler Schadens- und Flächenfaktor; zusätzliche Flächen ohne erfundenen Einzelziel-Überlappungsbonus')
  if(chainSupportModel.status==='applied')included.push('Verkettung: strukturierter finaler Trefferschadensfaktor und zusätzliche Zielkontakte ohne erfundenen Einzelziel-Mehrfachtreffer')
  if(multishotSupportModel.status==='applied')included.push('Mehrfachprojektil: strukturierte Zusatzprojektile sowie finaler Schadens- und Fertigkeitsgeschwindigkeitsfaktor ohne erfundenen Einzelziel-Mehrfachtreffer')
  if(crossbowAmmunitionSupportModel.status==='applied-burst-only')included.push(`Armbrustmunition: ${crossbowAmmunitionSupportModel.loadedBolts} belegte geladene Bolzen, ${crossbowAmmunitionSupportModel.ammunitionConservationChancePercent}% Nichtverbrauchschance, ${crossbowAmmunitionSupportModel.expectedShotsPerLoad} erwartete Schüsse pro Ladung und ${crossbowAmmunitionSupportModel.reloadSpeedMultiplier*100}% relative finale Nachladegeschwindigkeit; mangels absoluter Nachladezeit kein erfundener Dauer-DPS-Multiplikator`)
  if(pierceSupportModel.status==='applied')included.push(`${pierceSupportModel.chanceToPiercePercent}% strukturierte Durchbohrungswahrscheinlichkeit; der Faktor ${pierceSupportModel.postPierceDamageMultiplier} gilt nur nach erfolgreichem Durchbohren und wird nicht als Boss-DPS verwendet`)
  if(forkSupportModel.status==='applied-coverage-only')included.push(`Gabelung ist strukturiert belegt; Folgeprojektile verwenden den Faktor ${forkSupportModel.forkedProjectileDamageMultiplier}, ohne erfundene Kontaktzahl oder Boss-DPS-Erhöhung`)
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
  const criticalChanceIncrease=quantitative.criticalChanceModifiers.filter(effect=>(effect.kind??'increased')==='increased').reduce((sum,effect)=>sum+effect.percent,0)
  const criticalChanceMultiplier=quantitativePercentMultiplier(quantitative.criticalChanceModifiers)
  const effectiveCriticalChance=baseCriticalChance==null?undefined:Math.min(100,baseCriticalChance*criticalChanceMultiplier*supportEffects.criticalChanceMultiplier)
  const targetCriticalDamageBonus=resolveSelectedTargetCriticalDamageBonus({setups:input.setups,skills:input.skills,weaponSet:activeSet})
  const additionalCriticalDamageBonus=quantitative.criticalMultiplierModifiers.reduce((sum,effect)=>sum+effect.percent,0)+supportEffects.criticalDamageBonus+targetCriticalDamageBonus
  const totalCriticalDamageBonus=100+additionalCriticalDamageBonus
  const criticalExpectationMultiplier=effectiveCriticalChance==null?undefined:1+effectiveCriticalChance/100*totalCriticalDamageBonus/100
  if(targetCriticalDamageBonus>0)included.push('Scharfsch\u00fctzenmal: strukturierter kritischer Schadensbonus gegen das markierte Ziel')
  const multipleDamageEffect=resolveMultipleDamageEffect({
    passiveTree:input.passiveTree,
    planning:input.realPassivePlanning,
    weaponSet:activeSet,
    skill:definition,
    criticalChancePercent:effectiveCriticalChance,
  })
  const multipleDamageMultiplier=multipleDamageEffect.expectedDamageMultiplier
  if(multipleDamageEffect.sources.length)included.push('exakt belegter Doppel- und Dreifachschaden mit PoB2-Überlappungsreihenfolge')
  const primaryChannelledStage=temporal.channelledStageState.skills.find(value=>value.skillId===skillId)
  const maximumChannelledHitDamage=primaryChannelledStage
    ? rollExpectedAverage*(criticalExpectationMultiplier??1)*multipleDamageMultiplier*primaryChannelledStage.fullStageDamageMultiplier
    : undefined
  const primaryChargedSkill=temporal.chargedSkillState.skills.find(value=>value.skillId===skillId)
  const chargedScenarioComponents=primaryChargedSkill?.fullStageGainAsFirePercent
    ? applyGainAsExtra(components,[{id:`skill:${skillId}:full-stages`,source:'skill',sourceId:skillId!,from:'all',to:'fire',percent:primaryChargedSkill.fullStageGainAsFirePercent}],components)
    : components
  const maximumChargedHitDamage=primaryChargedSkill
    ? expectedLuckyHitDamage(chargedScenarioComponents,luckyHitEffects)*(criticalExpectationMultiplier??1)*multipleDamageMultiplier*(primaryChargedSkill.fullStageDamageMultiplier??1)
    : undefined
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
  const enemyAilmentThreshold=input.enemyProfile?.level==null
    ? undefined
    : reference.monsterAilmentThresholdTable[Math.max(0,Math.min(reference.monsterAilmentThresholdTable.length-1,Math.trunc(input.enemyProfile.level)-1))]
  const primaryShockContext=enemyAilmentThreshold!=null&&hitChancePercent!=null&&effectiveCriticalChance!=null&&components.length>0?{
    skillId:skillId!,enemyAilmentThreshold,
    lightningHitAverage:components.filter(value=>value.type==='lightning').reduce((sum,value)=>sum+(value.minimum+value.maximum)/2,0),
    lightningCriticalHitAverage:components.filter(value=>value.type==='lightning').reduce((sum,value)=>sum+(value.minimum+value.maximum)/2,0)*(1+totalCriticalDamageBonus/100),
    fireHitAverage:components.filter(value=>value.type==='fire').reduce((sum,value)=>sum+(value.minimum+value.maximum)/2,0),
    fireCriticalHitAverage:components.filter(value=>value.type==='fire').reduce((sum,value)=>sum+(value.minimum+value.maximum)/2,0)*(1+totalCriticalDamageBonus/100),
    coldHitAverage:components.filter(value=>value.type==='cold').reduce((sum,value)=>sum+(value.minimum+value.maximum)/2,0),
    physicalHitAverage:components.filter(value=>value.type==='physical').reduce((sum,value)=>sum+(value.minimum+value.maximum)/2,0),
    hitChancePercent,criticalHitChancePercent:effectiveCriticalChance,actionsPerSecond,
  }:undefined
  const secondaryShockContexts=enemyAilmentThreshold==null?[]:input.setups
    .filter(candidate=>candidate.skillId&&candidate.skillId!==skillId&&(candidate.weaponSet==='both'||candidate.weaponSet===activeSet))
    .flatMap(candidate=>{
      const candidateEstimate=estimateHitDamage({
        ...input,
        setups:[{...candidate,role:'main'}],
        fallbackSkillId:candidate.skillId,
        enemyProfile:undefined,
        triggerDepth:1,
      })
      const lightningHitAverage=candidateEstimate.components
        .filter(value=>value.type==='lightning')
        .reduce((sum,value)=>sum+(value.minimum+value.maximum)/2,0)
      const fireHitAverage=candidateEstimate.components.filter(value=>value.type==='fire').reduce((sum,value)=>sum+(value.minimum+value.maximum)/2,0)
      const coldHitAverage=candidateEstimate.components.filter(value=>value.type==='cold').reduce((sum,value)=>sum+(value.minimum+value.maximum)/2,0)
      const physicalHitAverage=candidateEstimate.components.filter(value=>value.type==='physical').reduce((sum,value)=>sum+(value.minimum+value.maximum)/2,0)
      const candidateHitChance=candidateEstimate.attackHitChance?.hitChancePercent??100
      const candidateCriticalChance=candidateEstimate.criticalChance?.effective
      const candidateActions=candidateEstimate.actionsPerSecond
      if(!(lightningHitAverage||fireHitAverage||coldHitAverage||physicalHitAverage)||candidateCriticalChance==null||candidateActions==null)return[]
      return[{
        skillId:candidate.skillId!,enemyAilmentThreshold,lightningHitAverage,
        lightningCriticalHitAverage:lightningHitAverage*(1+(candidateEstimate.criticalDamageBonus??100)/100),
        fireHitAverage,fireCriticalHitAverage:fireHitAverage*(1+(candidateEstimate.criticalDamageBonus??100)/100),coldHitAverage,physicalHitAverage,
        hitChancePercent:candidateHitChance,criticalHitChancePercent:candidateCriticalChance,actionsPerSecond:candidateActions,
      }]
    })
  const resolvedEnemyProfile=input.enemyProfile?applyBuildEnemyEffects({
    profile:input.enemyProfile,setups:input.setups,skills:input.skills,
    activeDamageTypes:[...new Set([
      ...components.map(value=>value.type),
      ...damageOverTime.effects.map(value=>value.damageType),
    ])],weaponSet:activeSet,
    primaryHitDamageTypes:[...new Set(components.map(value=>value.type))],
    primarySkillId:skillId,primaryActionsPerSecond:actionsPerSecond,
    supports:input.supports,equipment:input.equipment,
    primaryShockContext,
    shockSourceContexts:secondaryShockContexts,
    passiveTree:input.passiveTree,realPassivePlanning:input.realPassivePlanning,
  }):undefined
  const conditionalHitEffects=resolveConditionalHitEffects({
    sourceRecordId:skill.sourceRecordId,
    skillName:skill.name,
    numericStats:skill.numericStats as Record<string,number>,
    enemyProfile:resolvedEnemyProfile,
  })
  if(conditionalHitEffects.effects.length)included.push('strukturierter fertigkeitseigener Trefferschadensbonus aus der belegten Schockwirkung auf dem Ziel')
  damageOverTime=collectDamageOverTime(skill,resolvedEnemyProfile,durationInput,areaDamageInput)
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
    rateEffects: resolveDamagingAilmentRateEffects({
      passiveTree: input.passiveTree,
      planning: input.realPassivePlanning,
      weaponSet: activeSet,
    }),
  })
  const enemyMitigation=resolvedEnemyProfile?applyEnemyMitigation(components,resolvedEnemyProfile):undefined
  const mitigatedRollAverage=enemyMitigation?expectedLuckyHitDamage(enemyMitigation.components,luckyHitEffects):undefined
  const expectedDamageAfterMitigation=mitigatedRollAverage==null?undefined:mitigatedRollAverage*(criticalExpectationMultiplier??1)*multipleDamageMultiplier*conditionalHitEffects.damageMultiplier
  const maximumChannelledHitDamageAfterMitigation=primaryChannelledStage&&mitigatedRollAverage!=null
    ? mitigatedRollAverage*(criticalExpectationMultiplier??1)*multipleDamageMultiplier*conditionalHitEffects.damageMultiplier*primaryChannelledStage.fullStageDamageMultiplier
    : undefined
  const chargedEnemyMitigation=primaryChargedSkill&&resolvedEnemyProfile?applyEnemyMitigation(chargedScenarioComponents,resolvedEnemyProfile):undefined
  const maximumChargedHitDamageAfterMitigation=chargedEnemyMitigation
    ? expectedLuckyHitDamage(chargedEnemyMitigation.components,luckyHitEffects)*(criticalExpectationMultiplier??1)*multipleDamageMultiplier*conditionalHitEffects.damageMultiplier*(primaryChargedSkill?.fullStageDamageMultiplier??1)
    : undefined
  const expectedDamagePerSecondAfterMitigation=expectedDamageAfterMitigation==null?undefined:expectedDamageAfterMitigation*actionsPerSecond
  const accuracyAdjustedDamagePerSecondAfterMitigation=enemyMitigation?.average==null||accuracyMultiplier==null
    ? undefined
    : mitigatedRollAverage!*actionsPerSecond*accuracyMultiplier*(accuracyAdjustedCriticalMultiplier??1)*multipleDamageMultiplier*conditionalHitEffects.damageMultiplier
  const temporalEnemyMitigation=resolvedEnemyProfile&&temporal.appliedEffects.length?applyEnemyMitigation(temporalComponents,resolvedEnemyProfile):undefined
  const activeWindowDamagePerSecondAfterMitigation=temporalEnemyMitigation
    ? expectedLuckyHitDamage(temporalEnemyMitigation.components,luckyHitEffects)*(criticalExpectationMultiplier??1)*temporalActionsPerSecond*multipleDamageMultiplier*conditionalHitEffects.damageMultiplier
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
    ...resolvedBase,status:'partial',components,baseComponents,maximumPhysicalDamageSupportModel,...(dualWieldAttackModel?{dualWieldAttackModel}:{}),projectileHitModel:projectileHitOutput(projectileHitModel),triggerRepeatModel:triggerRepeatOutput(triggerRepeatModel),minionCompanionModel:minionCompanionOutput(minionCompanionModel),
    ...(attackHitChance?{attackHitChance}:{}),
    stages:[
      {id:'base',label:'Strukturierter Grundschaden',components:baseComponents},
      {id:'conversion',label:'Nach bestätigten Umwandlungen',components:convertedComponents},
      ...(quantitative.gainAsExtra.length?[{id:'gain-as-extra' as const,label:'Nach bestätigtem zusätzlichem Schaden',components:gainedComponents}]:[]),
      {id:'increased-damage',label:'Nach passenden Schadenserhöhungen',components:increasedComponents},
      {id:'support-more-damage',label:'Nach strukturierten Support-Multiplikatoren',components},
      ...(luckyHitEffects.length?[{id:'lucky-hit-expectation' as const,label:'Erwartungswert mit belegten Lucky-Schadenswürfen',components,value:round(rollExpectedAverage)}]:[]),
      ...(multipleDamageEffect.sources.length?[{id:'multiple-damage-expectation' as const,label:'Erwartungswert mit belegtem Doppel-/Dreifachschaden',components,value:round(rollExpectedAverage*multipleDamageMultiplier)}]:[]),
      ...(maximumChannelledHitDamage==null?[]:[{id:'maximum-channelled-hit' as const,label:'Voll aufgeladener vorbereiteter Treffer',components,value:round(maximumChannelledHitDamage)}]),
      ...(maximumChargedHitDamage==null?[]:[{id:'maximum-charged-hit' as const,label:'Vollstufiges Fertigkeitsszenario',components:chargedScenarioComponents,value:round(maximumChargedHitDamage)}]),
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
        ailmentCriticalChancePercent:value.ailmentCriticalChancePercent,weightedSourceDamage:value.weightedSourceDamage,rateMultiplier:value.rateMultiplier,detail:value.detail,
      })),
      blockedEffects:damagingAilments.blockedEffects.map(value=>({sourceRecordId:value.sourceRecordId,sourceLabel:value.sourceLabel,kind:value.kind,status:value.status,detail:value.detail})),
      totalSustainedDamagePerSecond:damagingAilments.totalSustainedDamagePerSecond,
      totalSustainedDamagePerSecondAfterMitigation:damagingAilments.totalSustainedDamagePerSecondAfterMitigation,
      limitations:damagingAilments.limitations,
    }}:{}),
    ...(temporal.chargeState.relevant?{chargeState:{modelVersion:temporal.chargeState.modelVersion,productive:temporal.chargeState.productive,states:temporal.chargeState.states.map(value=>({type:value.type,label:value.label,availability:value.availability,count:value.count,detail:value.detail})),consumptions:temporal.chargeState.consumptions.map(value=>({sourceId:value.sourceId,label:value.label,chargeTypes:value.chargeTypes,intervalMs:value.intervalMs,detail:value.detail})),buffScenarios:temporal.chargeState.buffScenarios.map(value=>({sourceId:value.sourceId,label:value.label,chargeType:value.chargeType,appliedSkillLevel:value.appliedSkillLevel,skillLevelStatus:value.skillLevelStatus,requiredCharges:value.requiredCharges,minimumAddedDamagePerCharge:value.minimumAddedDamagePerCharge,maximumAddedDamagePerCharge:value.maximumAddedDamagePerCharge,damageType:value.damageType,durationPerChargeMs:value.durationPerChargeMs,status:value.status,detail:value.detail})),regulationScenarios:temporal.chargeState.regulationScenarios.map(value=>({sourceId:value.sourceId,label:value.label,appliedSkillLevel:value.appliedSkillLevel,skillLevelStatus:value.skillLevelStatus,frenzySkillSpeedPercent:value.frenzySkillSpeedPercent,powerFinalCriticalChancePercent:value.powerFinalCriticalChancePercent,enduranceFinalDefencePercent:value.enduranceFinalDefencePercent,consumptionIntervalMs:value.consumptionIntervalMs,currentChargeState:value.currentChargeState,status:value.status,detail:value.detail}))}}:{}),
    ...(temporal.sealState.relevant?{sealState:{modelVersion:temporal.sealState.modelVersion,productive:temporal.sealState.productive,skills:temporal.sealState.skills.map(value=>({skillId:value.skillId,label:value.label,maximumSeals:value.maximumSeals,repeatsPerBrokenSeal:value.repeatsPerBrokenSeal,sealGainIntervalMs:value.sealGainIntervalMs,fullPreparationTimeMs:value.fullPreparationTimeMs,appliedSkillLevel:value.appliedSkillLevel,skillLevelStatus:value.skillLevelStatus,status:value.status,detail:value.detail}))}}:{}),
    ...(temporal.projectileAccumulationState.relevant?{projectileAccumulationState:{modelVersion:temporal.projectileAccumulationState.modelVersion,productive:temporal.projectileAccumulationState.productive,skills:temporal.projectileAccumulationState.skills.map(value=>({skillId:value.skillId,label:value.label,maximumProjectiles:value.maximumProjectiles,releaseIntervalMs:value.releaseIntervalMs,effectDurationMs:value.effectDurationMs,finalDamagePerReleasedProjectilePercent:value.finalDamagePerReleasedProjectilePercent,maximumReleaseWindowMs:value.maximumReleaseWindowMs,appliedSkillLevel:value.appliedSkillLevel,skillLevelStatus:value.skillLevelStatus,status:value.status,detail:value.detail}))}}:{}),
    ...(temporal.channelledStageState.relevant?{channelledStageState:{modelVersion:temporal.channelledStageState.modelVersion,productive:temporal.channelledStageState.productive,skills:temporal.channelledStageState.skills.map(value=>({skillId:value.skillId,label:value.label,appliedSkillLevel:value.appliedSkillLevel,skillLevelStatus:value.skillLevelStatus,maximumStages:value.maximumStages,finalDamagePerStagePercent:value.finalDamagePerStagePercent,fullStageMoreDamagePercent:value.fullStageMoreDamagePercent,fullStageDamageMultiplier:value.fullStageDamageMultiplier,minimumChannelTimeMs:value.minimumChannelTimeMs,status:value.status,detail:value.detail}))}}:{}),
    ...(temporal.chargedSkillState.relevant?{chargedSkillState:{modelVersion:temporal.chargedSkillState.modelVersion,productive:temporal.chargedSkillState.productive,skills:temporal.chargedSkillState.skills.map(value=>({skillId:value.skillId,label:value.label,appliedSkillLevel:value.appliedSkillLevel,skillLevelStatus:value.skillLevelStatus,maximumStages:value.maximumStages,additionalStages:value.additionalStages,fullStageDamageMultiplier:value.fullStageDamageMultiplier,gainAsFirePerStagePercent:value.gainAsFirePerStagePercent,fullStageGainAsFirePercent:value.fullStageGainAsFirePercent,additionalProjectilesPerAdditionalStage:value.additionalProjectilesPerAdditionalStage,fullStageAdditionalProjectiles:value.fullStageAdditionalProjectiles,status:value.status,detail:value.detail}))}}:{}),
    ...(temporal.persistentStageState.relevant?{persistentStageState:{modelVersion:temporal.persistentStageState.modelVersion,productive:temporal.persistentStageState.productive,skills:temporal.persistentStageState.skills.map(value=>({skillId:value.skillId,label:value.label,kind:value.kind,appliedSkillLevel:value.appliedSkillLevel,skillLevelStatus:value.skillLevelStatus,maximumStages:value.maximumStages,stageGainIntervalMs:value.stageGainIntervalMs,fullPreparationTimeMs:value.fullPreparationTimeMs,minimumAddedColdDamagePerStage:value.minimumAddedColdDamagePerStage,maximumAddedColdDamagePerStage:value.maximumAddedColdDamagePerStage,fullStageMinimumAddedColdDamage:value.fullStageMinimumAddedColdDamage,fullStageMaximumAddedColdDamage:value.fullStageMaximumAddedColdDamage,finalSpellDamagePerStagePercent:value.finalSpellDamagePerStagePercent,fullStageMoreSpellDamagePercent:value.fullStageMoreSpellDamagePercent,fullStageSpellDamageMultiplier:value.fullStageSpellDamageMultiplier,manaPercentSpendPerUpgrade:value.manaPercentSpendPerUpgrade,effectDurationMs:value.effectDurationMs,monsterPowerStep:value.monsterPowerStep,monsterPowerCap:value.monsterPowerCap,minimumColdDamagePerPowerStep:value.minimumColdDamagePerPowerStep,maximumColdDamagePerPowerStep:value.maximumColdDamagePerPowerStep,empoweredAttackMinimumColdDamagePerPowerStep:value.empoweredAttackMinimumColdDamagePerPowerStep,empoweredAttackMaximumColdDamagePerPowerStep:value.empoweredAttackMaximumColdDamagePerPowerStep,fullPowerMinimumColdDamage:value.fullPowerMinimumColdDamage,fullPowerMaximumColdDamage:value.fullPowerMaximumColdDamage,fullPowerEmpoweredAttackMinimumColdDamage:value.fullPowerEmpoweredAttackMinimumColdDamage,fullPowerEmpoweredAttackMaximumColdDamage:value.fullPowerEmpoweredAttackMaximumColdDamage,gainAsColdPercent:value.gainAsColdPercent,durationExtensionPerRageMs:value.durationExtensionPerRageMs,status:value.status,detail:value.detail}))}}:{}),
    ...(temporal.elementalState.relevant?{elementalState:{modelVersion:temporal.elementalState.modelVersion,productive:temporal.elementalState.productive,scenarios:temporal.elementalState.scenarios.map(value=>({sourceId:value.sourceId,label:value.label,kind:value.kind,appliedSkillLevel:value.appliedSkillLevel,skillLevelStatus:value.skillLevelStatus,finalDamagePercent:value.finalDamagePercent,effectDurationMs:value.effectDurationMs,resonanceGrantedPerHit:value.resonanceGrantedPerHit,finalDamagePercentPer50Resonance:value.finalDamagePercentPer50Resonance,resonanceDecayDelayMs:value.resonanceDecayDelayMs,resonanceLossPerSecond:value.resonanceLossPerSecond,resonanceLossPerHit:value.resonanceLossPerHit,activeElement:value.activeElement,currentResonance:value.currentResonance,status:value.status,detail:value.detail}))}}:{}),
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
    ...((conditionalHitEffects.effects.length||conditionalHitEffects.blockedEffects.length)?{conditionalHitEffects}:{}),
    ...(combinedDamagePerSecond==null?{}:{combinedDamagePerSecond:round(combinedDamagePerSecond)}),
    ...(combinedDamagePerSecondAfterMitigation==null?{}:{combinedDamagePerSecondAfterMitigation:round(combinedDamagePerSecondAfterMitigation)}),
    rageDamageComparison,
    ...(activeWindowDamagePerSecond==null?{}:{activeWindowDamagePerSecond:round(activeWindowDamagePerSecond)}),
    ...(activeWindowDamagePerSecondAfterMitigation==null?{}:{activeWindowDamagePerSecondAfterMitigation:round(activeWindowDamagePerSecondAfterMitigation)}),
    ...(preparedNextHitAverage==null?{}:{preparedNextHitDamage:round(preparedNextHitAverage)}),
    ...(preparedNextHitDamageAfterMitigation==null?{}:{preparedNextHitDamageAfterMitigation:round(preparedNextHitDamageAfterMitigation)}),
    ...(maximumChannelledHitDamage==null?{}:{maximumChannelledHitDamage:round(maximumChannelledHitDamage)}),
    ...(maximumChannelledHitDamageAfterMitigation==null?{}:{maximumChannelledHitDamageAfterMitigation:round(maximumChannelledHitDamageAfterMitigation)}),
    ...(maximumChargedHitDamage==null?{}:{maximumChargedHitDamage:round(maximumChargedHitDamage)}),
    ...(maximumChargedHitDamageAfterMitigation==null?{}:{maximumChargedHitDamageAfterMitigation:round(maximumChargedHitDamageAfterMitigation)}),
    hitDamage:{minimum:round(minimum),maximum:round(maximum),average:round(average)},
    actionsPerSecond:round(actionsPerSecond),
    hitDamagePerSecond:round(rollExpectedAverage*actionsPerSecond*multipleDamageMultiplier),
    included,
    excluded:[...(input.enemyProfile?[]:['Gegnerwiderstände und Rüstung']),...(luckyHitEffectModel.blockedEffects.length?['bedingte Lucky-Trefferschadenswürfe ohne bestätigten Gegnerzustand']:[]),'Exposition ohne eindeutigen strukturierten Betrag','Trigger und Wiederholungen ohne vollständige Quelle-Bedingung-Ziel-Intervall-Kette','Minions und Begleiter ohne Kreaturenbasis, aktive Anzahl, eigene Wirkfrequenz und Uptime','Supporteffekte ohne strukturierte Effektwerte','bedingte Passive- und Aszendenzeffekte',...(damagingAilments.effects.length?['nicht vollständig belegte Entzünden-, Gift- und Blutungs-Sonderfälle sowie gegnerische DoT-Abwehr']:['Entzünden, Gift und Blutung ohne vollständige Basis-, Dauer-, Auslöse- und Stapelkette']),'nicht belegte Projektilüberlappung, Fork- und Rückkehrtreffer'],
    warnings:['Vergleichbarer Teilwert, keine vollständige PoB-Gesamt-DPS. Nur identische Messgrenzen direkt vergleichen.',...(attackHitChance&&attackHitChance.status!=='exact'?['Die Angriffstrefferchance ist ohne belegtes Charakterlevel und bekannte Klasse blockiert; der rohe Aktionswert ist nicht trefferbereinigt.']:[]),...(input.enemyProfile?[]:['Es wurde kein Vergleichsgegner angegeben; der angezeigte Teilwert liegt vor Gegnerabwehr.']),...(unresolvedSupportIds.length?[`${unresolvedSupportIds.length} gewählte Supports besitzen noch keinen strukturierten numerischen Effekt und verändern den Schadenswert nicht.`]:[]),...spiritWarnings,...quantitative.warnings,...(enemyMitigation?.warnings??[])],
  }
}
