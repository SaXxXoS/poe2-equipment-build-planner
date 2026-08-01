import reference from '../../../generated/pob2/damage-reference.json'
import type { EquipmentEntry,SkillGemDefinition,SkillSetup,SupportGemDefinition } from '../../domain'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'
import type { AppliedEnemyMitigationEffect,DamageComponent,EnemyMitigationProfile,EnemyResistanceType,EnemyTargetRarity } from './types'
import { resolveBlockedFixedShockSources } from './fixed-shock-sources'

const elemental:EnemyResistanceType[]=['fire','cold','lightning']
const skillsByName=new Map(reference.skills.map(skill=>[skill.name.toLocaleLowerCase('en'),skill]))
const supportsByName=new Map(reference.supports.map(support=>[support.name.toLocaleLowerCase('en'),support]))
const stripMarkup=(value:string)=>value.replace(/\[[^|\]]+\|([^\]]+)\]/g,'$1').replace(/\[([A-Za-z][^\]]*)\]/g,'$1').replace(/\s+/g,' ').trim()
const unique=<T>(values:T[])=>[...new Set(values)]
const curseEffectMultiplier=(rarity:EnemyTargetRarity|undefined)=>rarity==='magic'?0.85:rarity==='rare'?0.7:rarity==='unique'?0.5:1
const armourBreakMultiplier=(rarity:EnemyTargetRarity|undefined)=>rarity==='normal'?3:rarity==='magic'?2:1
export const TEMPORAL_ENEMY_EFFECT_MODEL_VERSION='2.0.0'
export const SHOCK_ENEMY_EFFECT_MODEL_VERSION='1.4.0'
export const EXPOSURE_ENEMY_EFFECT_MODEL_VERSION='1.1.0'

export interface PrimaryShockContext{
  skillId:string
  enemyAilmentThreshold:number
  lightningHitAverage:number
  lightningCriticalHitAverage:number
  fireHitAverage?:number
  fireCriticalHitAverage?:number
  coldHitAverage?:number
  hitChancePercent:number
  criticalHitChancePercent:number
  actionsPerSecond:number
}

export interface ShockModifierSummary{
  chanceIncreasedPercent:number
  chanceMoreMultiplier:number
  magnitudeIncreasedPercent:number
  magnitudeMoreMultiplier:number
  durationIncreasedPercent:number
  maximumStacks:number
  sourceReferences:string[]
}

const emptyShockModifiers=():ShockModifierSummary=>({
  chanceIncreasedPercent:0,chanceMoreMultiplier:1,magnitudeIncreasedPercent:0,magnitudeMoreMultiplier:1,durationIncreasedPercent:0,maximumStacks:1,sourceReferences:[],
})

function allocatedNodeIds(planning:RealPassivePlanningIntegrationResult|undefined,weaponSet:'set-1'|'set-2'){
  const selected=planning?.weaponSetPlanning?.[weaponSet]??planning?.pipelineResult
  return unique([...(selected?.allocatedNodeIds??[]),...(planning?.ascendancyPlanning?.allocatedNodeIds??[])])
}

const setupActiveInSet=(setup:SkillSetup,weaponSet:'set-1'|'set-2')=>setup.weaponSet==='both'||setup.weaponSet===weaponSet

function skillEffects(setups:SkillSetup[],skills:SkillGemDefinition[],supports:SupportGemDefinition[],activeDamageTypes:DamageComponent['type'][],weaponSet:'set-1'|'set-2',shockContexts:PrimaryShockContext[]=[],shockModifiersForSetup:(setup:SkillSetup)=>ShockModifierSummary=()=>emptyShockModifiers()){
  const candidates:AppliedEnemyMitigationEffect[]=[]
  const skillById=new Map(skills.map(skill=>[skill.id,skill]))
  const supportById=new Map(supports.map(support=>[support.id,support]))
  for(const setup of setups.filter(value=>Boolean(value.skillId)&&setupActiveInSet(value,weaponSet))){
    const definition=skillById.get(setup.skillId)
    const numeric=definition?.nameEn?skillsByName.get(definition.nameEn.toLocaleLowerCase('en')):undefined
    if(!definition||!numeric)continue
    const selectedLevel=setup.level==null?undefined:numeric.levels.find(level=>level.level===setup.level)
    const numericStats=(selectedLevel?.numericStats??numeric.numericStats) as Record<string,number>
    const elementalCurse=numericStats['base_skill_buff_all_elements_resistance_%_to_apply']
    if(Number.isFinite(elementalCurse)&&elementalCurse<0)candidates.push({
      source:'skill',sourceId:setup.skillId,label:`${definition.displayNameDe}: Elementarwiderstände`,
      kind:'resistance-reduction',effectGroup:'curse',damageTypes:elemental,value:Math.abs(elementalCurse),
      evidence:'structured-exact',sourceReference:'base_skill_buff_all_elements_resistance_%_to_apply',conditional:true,
      durationMs:Number(numericStats.base_skill_effect_duration)||undefined,
      activationTimeMs:numeric.castTime>0?numeric.castTime*1000:undefined,
      uptimeStatus:'windowed',state:'assumed-active',
    })
    const chaosCurse=numericStats['base_skill_buff_chaos_damage_resistance_%_to_apply']
    if(Number.isFinite(chaosCurse)&&chaosCurse<0)candidates.push({
      source:'skill',sourceId:setup.skillId,label:`${definition.displayNameDe}: Chaoswiderstand`,
      kind:'resistance-reduction',effectGroup:'curse',damageTypes:['chaos'],value:Math.abs(chaosCurse),
      evidence:'structured-exact',sourceReference:'base_skill_buff_chaos_damage_resistance_%_to_apply',conditional:true,
      durationMs:Number(numericStats.base_skill_effect_duration)||undefined,
      activationTimeMs:numeric.castTime>0?numeric.castTime*1000:undefined,
      uptimeStatus:'windowed',state:'assumed-active',
    })
    const armourBreak=numericStats.apply_X_armour_break_on_hit
    if(Number.isFinite(armourBreak)&&armourBreak>0)candidates.push({
      source:'skill',sourceId:setup.skillId,label:`${definition.displayNameDe}: Rüstungsbruch pro Treffer`,
      kind:'armour-break',damageTypes:['physical'],value:armourBreak,
      evidence:'structured-exact',sourceReference:'apply_X_armour_break_on_hit',conditional:true,
      durationMs:12000,uptimeStatus:'ramping',state:'building',
    })
    const witherPerStack=numericStats['chaos_damage_taken_+%']
    const witherDurationMs=numericStats.active_skill_withered_base_duration_ms
    const applicationTimeMs=numeric.castTime>0?numeric.castTime*1000:undefined
    if(
      activeDamageTypes.includes('chaos')
      && Number.isFinite(witherPerStack)&&witherPerStack>0
      && Number.isFinite(witherDurationMs)&&witherDurationMs>0
      && applicationTimeMs
    ){
      const maximumStacks=10
      const maintainableStacks=Math.min(maximumStacks,Math.max(1,Math.floor(witherDurationMs/applicationTimeMs)))
      candidates.push({
        source:'skill',sourceId:setup.skillId,label:`${definition.displayNameDe}: erhöhter erlittener Chaosschaden`,
        kind:'damage-taken-increased',damageTypes:['chaos'],value:witherPerStack*maintainableStacks,
        evidence:'structured-exact',sourceReference:'chaos_damage_taken_+% + active_skill_withered_base_duration_ms + castTime',conditional:true,
        durationMs:witherDurationMs,activationTimeMs:applicationTimeMs,applicationRatePerSecond:1000/applicationTimeMs,
        timeToFullEffectMs:maintainableStacks*applicationTimeMs,stackCount:maintainableStacks,maximumStacks,
        estimatedUptime:1,uptimeStatus:'maintainable',state:'fully-active',
        stateDetail:`${maintainableStacks} Stapel sind bei fortgesetztem Kanalisieren innerhalb der belegten Wirkzeit aufrechterhaltbar.`,
      })
    }
    const primaryShockContext=shockContexts.find(value=>value.skillId===setup.skillId)
    let maintainableShock:AppliedEnemyMitigationEffect|undefined
    if(primaryShockContext&&primaryShockContext.lightningHitAverage>0&&primaryShockContext.enemyAilmentThreshold>0){
      const shockModifiers=shockModifiersForSetup(setup)
      const chanceMore=(1+Number(numericStats['active_skill_shock_chance_+%_final']??0)/100)*(1+shockModifiers.chanceIncreasedPercent/100)*shockModifiers.chanceMoreMultiplier
      const magnitudeEffect=1+(Number(numericStats['shock_effect_+%']??0)+shockModifiers.magnitudeIncreasedPercent)/100
      const magnitudeMore=(1+Number(numericStats['active_skill_shock_effect_+%_final']??0)/100)*shockModifiers.magnitudeMoreMultiplier
      const hitShockChance=Math.min(100,primaryShockContext.lightningHitAverage/primaryShockContext.enemyAilmentThreshold*reference.ailmentConstants.shockChanceMultiplier*chanceMore)
      const criticalShockChance=Math.min(100,primaryShockContext.lightningCriticalHitAverage/primaryShockContext.enemyAilmentThreshold*reference.ailmentConstants.shockChanceMultiplier*chanceMore)
      const nonCriticalShare=Math.max(0,100-primaryShockContext.criticalHitChancePercent)/100
      const criticalShare=Math.max(0,primaryShockContext.criticalHitChancePercent)/100
      const connectedHitShare=Math.max(0,primaryShockContext.hitChancePercent)/100
      const weightedChance=(nonCriticalShare*hitShockChance+criticalShare*criticalShockChance)*connectedHitShare
      const chanceBeforeHit=nonCriticalShare*hitShockChance+criticalShare*criticalShockChance
      const weightedSourceDamage=chanceBeforeHit>0
        ?(nonCriticalShare*hitShockChance*primaryShockContext.lightningHitAverage+criticalShare*criticalShockChance*primaryShockContext.lightningCriticalHitAverage)/chanceBeforeHit
        :0
      const calculatedBaseMagnitude=reference.ailmentConstants.shockMagnitudeFormulaCoefficient*Math.pow(weightedSourceDamage/primaryShockContext.enemyAilmentThreshold,reference.ailmentConstants.shockMagnitudeFormulaExponent)
      const magnitude=Number(Math.min(
        reference.ailmentConstants.maximumShockMagnitudePercent,
        Math.max(reference.ailmentConstants.baseShockMagnitudePercent,calculatedBaseMagnitude)*magnitudeEffect*magnitudeMore,
      ).toFixed(2))
      const applicationRate=primaryShockContext.actionsPerSecond*weightedChance/100
      const durationSeconds=reference.ailmentConstants.baseShockDurationSeconds*(1+shockModifiers.durationIncreasedPercent/100)
      const durationMs=durationSeconds*1000
      const maintainable=applicationRate*durationSeconds>=1
      const shockEffect:AppliedEnemyMitigationEffect={
        source:'skill',sourceId:setup.skillId,label:`${definition.displayNameDe}: Schock`,
        kind:'damage-taken-increased',damageTypes:['physical','fire','cold','lightning','chaos'],value:magnitude,
        effectGroup:'shock',
        evidence:'structured-exact',sourceReference:`${SHOCK_ENEMY_EFFECT_MODEL_VERSION}: ShockChanceMultiplier + BaseShockMagnitude + BaseShockDuration + monsterAilmentThresholdTable${shockModifiers.sourceReferences.length?' + allocated shock modifiers':''}`,conditional:true,
        durationMs,applicationRatePerSecond:Number(applicationRate.toFixed(4)),estimatedUptime:maintainable?1:Number(Math.min(1,applicationRate*reference.ailmentConstants.baseShockDurationSeconds).toFixed(4)),
        uptimeStatus:maintainable?'maintainable':'unresolved',state:maintainable?'fully-active':'building',effectiveValue:maintainable?magnitude:0,
        stateDetail:maintainable
          ?`${Number(weightedChance.toFixed(2))}% erwartete Schockchance und ${magnitude}% erhöhter erlittener Schaden sind bei fortgesetzten Treffern aufrechterhaltbar.`
          :`${Number(weightedChance.toFixed(2))}% erwartete Schockchance reicht bei der belegten Aktionsrate nicht für einen dauerhaft aufrechterhaltbaren Schock.`,
      }
      candidates.push(shockEffect)
      if(maintainable)maintainableShock=shockEffect
    }
    const selectedSupportDefinitions=(setup.supportGemIds??[])
      .map(id=>supportById.get(id))
      .filter((value):value is SupportGemDefinition=>Boolean(value))
    const selectedSupportNumerics=selectedSupportDefinitions
      .map(value=>supportsByName.get((value.nameEn??'').toLocaleLowerCase('en'))?.numericStats as Record<string,number>|undefined)
      .filter((value):value is Record<string,number>=>Boolean(value))
    const selectedStat=(statId:string)=>Number(numericStats[statId]??0)+selectedSupportNumerics.reduce((sum,value)=>sum+Number(value[statId]??0),0)
    const potentExposure=selectedSupportDefinitions.find(value=>value.nameEn==='Potent Exposure')
    const potentNumeric=potentExposure?supportsByName.get('potent exposure'):undefined
    const exposureEffect=Number((potentNumeric?.numericStats as Record<string,number>|undefined)?.['exposure_effect_+%']??0)
    const exposureValue=Math.floor(20*(1+exposureEffect/100))
    const pushExposure=(supportDefinition:SupportGemDefinition,type:EnemyResistanceType,triggerStat:string,durationMs:number,applicationRatePerSecond:number,stateDetail:string)=>{
      if(!Number.isFinite(durationMs)||durationMs<=0||applicationRatePerSecond*durationMs/1000<1)return
      candidates.push({
        source:'support',sourceId:supportDefinition.id,label:`${supportDefinition.displayNameDe}: ${type==='fire'?'Feuer':type==='cold'?'Kälte':'Blitz'}-Exposition`,
        kind:'resistance-reduction',effectGroup:'exposure',damageTypes:[type],value:exposureValue,
        evidence:'structured-exact',conditional:true,durationMs,
        applicationRatePerSecond:Number(applicationRatePerSecond.toFixed(4)),estimatedUptime:1,
        uptimeStatus:'maintainable',state:'fully-active',
        sourceReference:`${EXPOSURE_ENEMY_EFFECT_MODEL_VERSION}: ${triggerStat} + PoB2 generic 20% exposure${potentExposure?' + exposure_effect_+%':''}`,
        stateDetail,
      })
    }
    const lightningExposure=selectedSupportDefinitions.find(value=>value.nameEn==='Lightning Exposure')
    if(lightningExposure&&maintainableShock&&activeDamageTypes.includes('lightning')){
      const exposureNumeric=supportsByName.get('lightning exposure')
      const exposureDurationMs=Number((exposureNumeric?.numericStats as Record<string,number>|undefined)?.inflict_exposure_for_x_ms_on_shock)
      pushExposure(lightningExposure,'lightning','inflict_exposure_for_x_ms_on_shock',exposureDurationMs,maintainableShock.applicationRatePerSecond??0,`Der aufrechterhaltbare Schock dieser Fertigkeit erneuert ${exposureValue}% Blitz-Exposition für ${exposureDurationMs/1000} Sekunden.`)
    }
    const fireExposure=selectedSupportDefinitions.find(value=>value.nameEn==='Fire Exposure')
    if(fireExposure&&primaryShockContext?.fireHitAverage&&primaryShockContext.fireCriticalHitAverage&&activeDamageTypes.includes('fire')){
      const exposureNumeric=supportsByName.get('fire exposure')
      const exposureDurationMs=Number((exposureNumeric?.numericStats as Record<string,number>|undefined)?.inflict_exposure_for_x_ms_on_ignite)
      const flatChance=selectedStat('base_chance_to_ignite_%')
      const chanceIncrease=selectedStat('active_skill_ignite_chance_+%_final')+selectedStat('support_ignition_chance_to_ignite_+%_final')
      const chanceOnHit=Math.min(100,Math.max(0,(primaryShockContext.fireHitAverage/primaryShockContext.enemyAilmentThreshold*reference.ailmentConstants.igniteChanceMultiplier+flatChance)*(1+chanceIncrease/100)))
      const chanceOnCriticalHit=Math.min(100,Math.max(0,(primaryShockContext.fireCriticalHitAverage/primaryShockContext.enemyAilmentThreshold*reference.ailmentConstants.igniteChanceMultiplier+flatChance)*(1+chanceIncrease/100)))
      const criticalShare=Math.max(0,Math.min(100,primaryShockContext.criticalHitChancePercent))/100
      const weightedChance=chanceOnHit*(1-criticalShare)+chanceOnCriticalHit*criticalShare
      const applicationRate=primaryShockContext.actionsPerSecond*primaryShockContext.hitChancePercent/100*weightedChance/100
      pushExposure(fireExposure,'fire','inflict_exposure_for_x_ms_on_ignite',exposureDurationMs,applicationRate,`${Number(weightedChance.toFixed(2))}% belegte Entzündungschance erneuert ${exposureValue}% Feuer-Exposition innerhalb des ${exposureDurationMs/1000}-Sekunden-Fensters.`)
    }
    const coldExposure=selectedSupportDefinitions.find(value=>value.nameEn==='Cold Exposure')
    if(coldExposure&&primaryShockContext?.coldHitAverage&&activeDamageTypes.includes('cold')){
      const exposureNumeric=supportsByName.get('cold exposure')
      const exposureDurationMs=Number((exposureNumeric?.numericStats as Record<string,number>|undefined)?.inflict_exposure_for_x_ms_on_cold_crit)
      const applicationRate=primaryShockContext.actionsPerSecond*primaryShockContext.hitChancePercent/100*primaryShockContext.criticalHitChancePercent/100
      pushExposure(coldExposure,'cold','inflict_exposure_for_x_ms_on_cold_crit',exposureDurationMs,applicationRate,`${Number(primaryShockContext.criticalHitChancePercent.toFixed(2))}% belegte Kritchance mit Kältetreffern erneuert ${exposureValue}% Kälte-Exposition innerhalb des ${exposureDurationMs/1000}-Sekunden-Fensters.`)
    }
  }
  const curses=candidates.filter(value=>value.effectGroup==='curse')
  const relevantCurses=curses.filter(value=>value.damageTypes.some(type=>activeDamageTypes.includes(type)))
  const selectedCurse=[...relevantCurses].sort((left,right)=>right.value-left.value||left.sourceId.localeCompare(right.sourceId))[0]
  return candidates.filter(value=>value.effectGroup!=='curse'||value===selectedCurse)
}

export function resolveAllocatedShockModifiers(tree:RealPassiveTree|undefined,planning:RealPassivePlanningIntegrationResult|undefined,weaponSet:'set-1'|'set-2'):ShockModifierSummary{
  const result=emptyShockModifiers()
  if(!tree||!planning)return result
  const nodes=new Map(tree.nodes.map(node=>[node.id,node]))
  for(const nodeId of allocatedNodeIds(planning,weaponSet)){
    const node=nodes.get(nodeId)
    if(!node)continue
    for(const stat of node.stats){
      const sourceText=stat.sourceText??''
      const text=stripMarkup(sourceText)
      const chance=text.match(/^(\d+(?:\.\d+)?)% increased chance to Shock$/i)
      const magnitude=text.match(/^(\d+(?:\.\d+)?)% increased (?:Magnitude of (?:Shock|Non-Damaging Ailments)|Shock Magnitude) you inflict$/i)
        ??text.match(/^(\d+(?:\.\d+)?)% increased Magnitude of Shock$/i)
      const lessMagnitude=text.match(/^(\d+(?:\.\d+)?)% less Magnitude of Shock you inflict$/i)
      const duration=text.match(/^(\d+(?:\.\d+)?)% increased (?:Shock Duration|Duration of Ignite, Shock and Chill on Enemies)$/i)
      const twoShocks=/^Targets can be affected by two of your Shocks at the same time$/i.test(text)
      if(chance)result.chanceIncreasedPercent+=Number(chance[1])
      else if(magnitude)result.magnitudeIncreasedPercent+=Number(magnitude[1])
      else if(lessMagnitude)result.magnitudeMoreMultiplier*=1-Number(lessMagnitude[1])/100
      else if(duration)result.durationIncreasedPercent+=Number(duration[1])
      else if(twoShocks)result.maximumStacks=Math.max(result.maximumStacks,2)
      else continue
      result.sourceReferences.push(`${nodeId}:${sourceText}`)
    }
  }
  result.magnitudeMoreMultiplier=Number(result.magnitudeMoreMultiplier.toFixed(8))
  result.sourceReferences.sort((a,b)=>a.localeCompare(b,'en'))
  return result
}

const equipmentActiveInSet=(entry:EquipmentEntry,weaponSet:'set-1'|'set-2')=>!entry.slotId.includes('weapon-set-')||entry.slotId.includes(`weapon-${weaponSet}`)

function resolveSelectedShockModifiers(input:{setup?:SkillSetup;supports?:SupportGemDefinition[];equipment?:EquipmentEntry[];weaponSet:'set-1'|'set-2'}):ShockModifierSummary{
  const result=emptyShockModifiers()
  const selectedSupports=new Set(input.setup?.supportGemIds??[])
  for(const support of (input.supports??[]).filter(value=>selectedSupports.has(value.id))){
    const numeric=support.nameEn?supportsByName.get(support.nameEn.toLocaleLowerCase('en')):undefined
    if(!numeric)continue
    const stats=numeric.numericStats as Record<string,number>
    const duration=Number(stats['shock_duration_+%']??0)
    const magnitude=Number(stats['shock_effect_+%']??0)
    const chanceFinal=Number(stats['support_lasting_shock_chance_to_shock_+%_final']??0)+Number(stats['support_conduction_chance_to_shock_+%_final']??0)
    if(duration){result.durationIncreasedPercent+=duration;result.sourceReferences.push(`support:${support.id}:shock_duration_+%`)}
    if(magnitude){result.magnitudeIncreasedPercent+=magnitude;result.sourceReferences.push(`support:${support.id}:shock_effect_+%`)}
    if(chanceFinal){result.chanceMoreMultiplier*=1+chanceFinal/100;result.sourceReferences.push(`support:${support.id}:shock_chance_final`)}
  }
  for(const entry of (input.equipment??[]).filter(value=>equipmentActiveInSet(value,input.weaponSet))){
    for(const modifier of entry.modifierValues){
      if(modifier.isLocal===true)continue
      for(const stat of modifier.statValues??[]){
        if(!Number.isFinite(stat.value))continue
        if(stat.statId==='shock_chance_+%'){
          result.chanceIncreasedPercent+=stat.value
          result.sourceReferences.push(`equipment:${entry.id}:${stat.statId}`)
        }else if(stat.statId==='shock_effect_+%'){
          result.magnitudeIncreasedPercent+=stat.value
          result.sourceReferences.push(`equipment:${entry.id}:${stat.statId}`)
        }
      }
    }
  }
  result.chanceMoreMultiplier=Number(result.chanceMoreMultiplier.toFixed(8))
  result.sourceReferences.sort((a,b)=>a.localeCompare(b,'en'))
  return result
}

const mergeShockModifiers=(...values:ShockModifierSummary[]):ShockModifierSummary=>({
  chanceIncreasedPercent:values.reduce((sum,value)=>sum+value.chanceIncreasedPercent,0),
  chanceMoreMultiplier:Number(values.reduce((product,value)=>product*value.chanceMoreMultiplier,1).toFixed(8)),
  magnitudeIncreasedPercent:values.reduce((sum,value)=>sum+value.magnitudeIncreasedPercent,0),
  magnitudeMoreMultiplier:Number(values.reduce((product,value)=>product*value.magnitudeMoreMultiplier,1).toFixed(8)),
  durationIncreasedPercent:values.reduce((sum,value)=>sum+value.durationIncreasedPercent,0),
  maximumStacks:Math.max(...values.map(value=>value.maximumStacks)),
  sourceReferences:unique(values.flatMap(value=>value.sourceReferences)).sort((a,b)=>a.localeCompare(b,'en')),
})

function passiveEffects(tree:RealPassiveTree|undefined,planning:RealPassivePlanningIntegrationResult|undefined,weaponSet:'set-1'|'set-2'){
  if(!tree||!planning)return[] as AppliedEnemyMitigationEffect[]
  const nodes=new Map(tree.nodes.map(node=>[node.id,node]))
  const effects:AppliedEnemyMitigationEffect[]=[]
  for(const nodeId of allocatedNodeIds(planning,weaponSet)){
    const node=nodes.get(nodeId)
    if(!node)continue
    const source=node.ascendancyId?'ascendancy':'passive'
    for(const stat of node.stats){
      const text=stripMarkup(stat.sourceText??'')
      const elementalPenetration=text.match(/^Damage Penetrates (\d+(?:\.\d+)?)% (?:of Enemy )?Elemental Resistances$/i)
      const typedPenetration=text.match(/^Damage Penetrates (\d+(?:\.\d+)?)% (?:of Enemy )?(Fire|Cold|Lightning|Chaos) Resistance$/i)
      const match=elementalPenetration??typedPenetration
      if(!match)continue
      const damageTypes:EnemyResistanceType[]=elementalPenetration?elemental:[typedPenetration![2].toLocaleLowerCase('en') as EnemyResistanceType]
      effects.push({
        source,sourceId:nodeId,label:text,kind:'penetration',damageTypes,value:Number(match[1]),
        evidence:'text-pattern-exact',sourceReference:stat.sourceText??text,conditional:false,
        estimatedUptime:1,uptimeStatus:'permanent',state:'permanent',
      })
    }
  }
  return effects
}

export function applyBuildEnemyEffects(input:{
  profile:EnemyMitigationProfile
  setups:SkillSetup[]
  skills:SkillGemDefinition[]
  activeDamageTypes:DamageComponent['type'][]
  weaponSet:'set-1'|'set-2'
  primarySkillId?:string
  primaryActionsPerSecond?:number
  primaryShockContext?:PrimaryShockContext
  shockSourceContexts?:PrimaryShockContext[]
  supports?:SupportGemDefinition[]
  equipment?:EquipmentEntry[]
  passiveTree?:RealPassiveTree
  realPassivePlanning?:RealPassivePlanningIntegrationResult
}):EnemyMitigationProfile{
  const blockedFixedShockSources=resolveBlockedFixedShockSources(input.equipment??[])
  const commonShockModifiers=mergeShockModifiers(
    resolveAllocatedShockModifiers(input.passiveTree,input.realPassivePlanning,input.weaponSet),
    resolveSelectedShockModifiers({supports:input.supports,equipment:input.equipment,weaponSet:input.weaponSet}),
  )
  const shockContexts=unique([...(input.shockSourceContexts??[]),...(input.primaryShockContext?[input.primaryShockContext]:[])])
  const effects=[
    ...skillEffects(input.setups,input.skills,input.supports??[],input.activeDamageTypes,input.weaponSet,shockContexts,setup=>mergeShockModifiers(
      commonShockModifiers,
      resolveSelectedShockModifiers({setup,supports:input.supports,weaponSet:input.weaponSet}),
    )),
    ...passiveEffects(input.passiveTree,input.realPassivePlanning,input.weaponSet),
  ]
  const rarity=input.profile.targetRarity
  for(const effect of effects){
    if(effect.kind==='resistance-reduction'&&effect.effectGroup==='curse'){
      effect.effectiveValue=Number((effect.value*curseEffectMultiplier(rarity)).toFixed(2))
      effect.stateDetail=rarity&&rarity!=='normal'?`Auf ${rarity} Gegner angewandte verringerte Fluchwirkung.`:'Volle Fluchwirkung.'
    }else if(effect.kind==='armour-break'){
      effect.effectiveValue=effect.value*armourBreakMultiplier(rarity)
      effect.stateDetail='Der Betrag wird mit weiteren Treffern innerhalb der Wirkzeit aufgebaut.'
    }else if(effect.effectiveValue==null)effect.effectiveValue=effect.value
  }
  const shockEffects=effects.filter(value=>value.effectGroup==='shock')
  const shockStackLimit=commonShockModifiers.maximumStacks
  let remainingShockSlots=shockStackLimit
  for(const effect of [...shockEffects].sort((left,right)=>right.value-left.value||left.sourceId.localeCompare(right.sourceId,'en'))){
    const maintainableApplications=Math.max(0,Math.floor((effect.applicationRatePerSecond??0)*(effect.durationMs??0)/1000+1e-9))
    const selectedStacks=Math.min(remainingShockSlots,maintainableApplications)
    effect.maximumStacks=shockStackLimit
    if(selectedStacks>0){
      effect.stackCount=selectedStacks
      effect.effectiveValue=Number((effect.value*selectedStacks).toFixed(2))
      effect.selectionStatus=shockStackLimit>1?'selected-stacked':'selected-strongest'
      remainingShockSlots-=selectedStacks
      effect.stateDetail=`${effect.stateDetail??''} ${shockStackLimit>1
        ?`${selectedStacks} von ${shockStackLimit} gleichzeitig erlaubten Schocks werden mit dieser belegten Quelle dauerhaft belegt.`
        :'Von allen belegten Schockquellen ist dies der stärkste zuverlässig aufrechterhaltbare Schock.'}`.trim()
    }else if((effect.effectiveValue??0)>0){
      effect.selectionStatus='superseded-by-stronger'
      effect.effectiveValue=0
      effect.stackCount=0
      effect.stateDetail=`${effect.stateDetail??''} ${shockStackLimit>1?'Alle belegten Schockplätze werden von stärkeren Quellen belegt.':'Ein stärkerer belegter Schock ersetzt diesen Effekt; normale Schocks werden nicht addiert.'}`.trim()
    }
  }
  const penetration={...(input.profile.penetration??{})}
  const resistanceReduction={...(input.profile.resistanceReduction??{})}
  const resistanceReductionGroups=new Map<string,Partial<Record<EnemyResistanceType,number>>>()
  const damageTakenIncreased={...(input.profile.damageTakenIncreased??{})}
  for(const effect of effects){
    if((effect.effectiveValue??effect.value)<=0)continue
    if(effect.kind==='penetration')for(const type of effect.damageTypes.filter((value):value is EnemyResistanceType=>value!=='physical'))penetration[type]=(penetration[type]??0)+(effect.effectiveValue??effect.value)
    if(effect.kind==='resistance-reduction'){
      const group=effect.effectGroup??`independent:${effect.source}:${effect.sourceId}`
      const grouped=resistanceReductionGroups.get(group)??{}
      for(const type of effect.damageTypes.filter((value):value is EnemyResistanceType=>value!=='physical'))grouped[type]=Math.max(grouped[type]??0,effect.effectiveValue??effect.value)
      resistanceReductionGroups.set(group,grouped)
    }
    if(effect.kind==='damage-taken-increased')for(const type of effect.damageTypes)damageTakenIncreased[type]=(damageTakenIncreased[type]??0)+(effect.effectiveValue??effect.value)
  }
  for(const grouped of resistanceReductionGroups.values())for(const type of elemental.concat('chaos')){
    const value=grouped[type]
    if(value)resistanceReduction[type]=(resistanceReduction[type]??0)+value
  }
  const armourBreak=Math.max(input.profile.armourBreak??0,...effects.filter(value=>value.kind==='armour-break').map(value=>value.effectiveValue??value.value))
  const hitsToFullyBreakArmour=input.profile.armour&&armourBreak?Math.ceil(input.profile.armour/armourBreak):undefined
  const primaryBreakEffect=effects.find(value=>value.kind==='armour-break'&&value.sourceId===input.primarySkillId)
  const applicationRate=input.primaryActionsPerSecond&&input.primaryActionsPerSecond>0?input.primaryActionsPerSecond:undefined
  const timeToFullyBreakArmourMs=primaryBreakEffect&&hitsToFullyBreakArmour&&applicationRate
    ?Number((hitsToFullyBreakArmour/applicationRate*1000).toFixed(2))
    :undefined
  if(primaryBreakEffect&&applicationRate){
    primaryBreakEffect.applicationRatePerSecond=applicationRate
    primaryBreakEffect.timeToFullEffectMs=timeToFullyBreakArmourMs
  }
  const sustainedFullBreak=Boolean(
    primaryBreakEffect&&timeToFullyBreakArmourMs&&primaryBreakEffect.durationMs
    &&timeToFullyBreakArmourMs<primaryBreakEffect.durationMs
  )
  const fullyBrokenArmour=Boolean(hitsToFullyBreakArmour===1||sustainedFullBreak)
  if(fullyBrokenArmour)for(const effect of effects.filter(value=>value.kind==='armour-break')){
    effect.state='fully-active'
    if(effect===primaryBreakEffect&&sustainedFullBreak){
      effect.uptimeStatus='maintainable'
      effect.estimatedUptime=1
      effect.stateDetail=`Der Hauptskill erreicht den vollständigen Bruch nach ${Number((timeToFullyBreakArmourMs!/1000).toFixed(2))} Sekunden und hält ihn bei fortgesetzten Treffern aufrecht.`
    }else{
      effect.uptimeStatus='windowed'
      effect.stateDetail='Ein belegter Treffer reicht für vollständig gebrochene Rüstung; die tatsächliche Wiederholungsfrequenz ist unbekannt.'
    }
  }
  if(primaryBreakEffect&&timeToFullyBreakArmourMs&&primaryBreakEffect.durationMs&&timeToFullyBreakArmourMs>primaryBreakEffect.durationMs){
    primaryBreakEffect.stateDetail=`Bei ${Number(applicationRate!.toFixed(2))} Treffern pro Sekunde verfällt der Aufbau vor dem vollständigen Bruch.`
    primaryBreakEffect.uptimeStatus='unresolved'
  }
  const limitations=[...(input.profile.limitations??[])]
  if(effects.some(value=>value.effectGroup==='curse'))limitations.push('Von gewählten Fertigkeiten stammt höchstens ein relevanter Fluch; seine strukturierte Wirkzeit ist bekannt, die tatsächliche Wiederholungsfrequenz ohne Rotationsbeleg jedoch nicht.')
  if(effects.some(value=>value.effectGroup==='exposure'))limitations.push('Exposition wird nur durch dieselbe Fertigkeit produktiv angewandt, wenn deren belegte Schock-, Entzündungs- oder kritische Kältetrefferrate die strukturierte Expositionsdauer zuverlässig erneuern kann; gleichartige Expositionen addieren sich nicht.')
  if(effects.some(value=>value.kind==='armour-break')&&!input.profile.armour)limitations.push('Rüstungsbruch besitzt 12 Sekunden Wirkzeit; ohne belegte Zielrüstung sind benötigte Treffer und vollständig gebrochene Rüstung unbekannt.')
  if(effects.some(value=>value.kind==='damage-taken-increased'&&value.damageTypes.length===1))limitations.push('Withered wird nur für eine im aktiven Waffenset gewählte Fertigkeit mit strukturierter Stapelwirkung berechnet; unterbrochenes Kanalisieren verringert die tatsächliche Wirkung.')
  if(shockEffects.length)limitations.push(shockStackLimit>1
    ?`Jede belegte Trefferfertigkeit wird als eigene Schockquelle bewertet. Der zugewiesene Aszendenzknoten erlaubt ${shockStackLimit} gleichzeitige Schocks; die stärksten anhand von Anwendungsrate und Wirkzeit dauerhaft belegbaren Schockplätze wirken.`
    :'Jede belegte Trefferfertigkeit wird als eigene Schockquelle bewertet. Normale konkurrierende Schocks addieren sich nicht; nur der stärkste zuverlässig aufrechterhaltbare Effekt wirkt.')
  if(blockedFixedShockSources.length)limitations.push('Eine feste Schockquelle auf geschocktem Boden ist aus der Ausrüstung belegt, bleibt aber ohne bestätigten Standort des Gegners schadensneutral.')
  if(primaryBreakEffect&&timeToFullyBreakArmourMs&&primaryBreakEffect.durationMs&&timeToFullyBreakArmourMs>primaryBreakEffect.durationMs)limitations.push('Die belegte Trefferfrequenz reicht nicht aus, um die Zielrüstung innerhalb des 12-Sekunden-Fensters vollständig zu brechen.')
  return{
    ...input.profile,
    ...(Object.keys(penetration).length?{penetration}:{}),
    ...(Object.keys(resistanceReduction).length?{resistanceReduction}:{}),
    ...(Object.keys(damageTakenIncreased).length?{damageTakenIncreased}:{}),
    ...(armourBreak?{armourBreak}:{}),
    appliedEffects:effects,
    ...((input.profile.blockedEnemyEffects?.length||blockedFixedShockSources.length)
      ?{blockedEnemyEffects:[...(input.profile.blockedEnemyEffects??[]),...blockedFixedShockSources]}
      :{}),
    ...(hitsToFullyBreakArmour?{hitsToFullyBreakArmour}:{}),
    ...(timeToFullyBreakArmourMs?{timeToFullyBreakArmourMs}:{}),
    ...(fullyBrokenArmour?{fullyBrokenArmour:true}:{}),
    temporalModelVersion:TEMPORAL_ENEMY_EFFECT_MODEL_VERSION,
    limitations:unique(limitations),
  }
}
