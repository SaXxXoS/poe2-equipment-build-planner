import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillGemDefinition,SkillSetup } from '../../domain'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'
import type { AppliedEnemyMitigationEffect,DamageComponent,EnemyMitigationProfile,EnemyResistanceType,EnemyTargetRarity } from './types'

const elemental:EnemyResistanceType[]=['fire','cold','lightning']
const skillsByName=new Map(reference.skills.map(skill=>[skill.name.toLocaleLowerCase('en'),skill]))
const stripMarkup=(value:string)=>value.replace(/\[[^|\]]+\|([^\]]+)\]/g,'$1').replace(/\s+/g,' ').trim()
const unique=<T>(values:T[])=>[...new Set(values)]
const curseEffectMultiplier=(rarity:EnemyTargetRarity|undefined)=>rarity==='magic'?0.85:rarity==='rare'?0.7:rarity==='unique'?0.5:1
const armourBreakMultiplier=(rarity:EnemyTargetRarity|undefined)=>rarity==='normal'?3:rarity==='magic'?2:1
export const TEMPORAL_ENEMY_EFFECT_MODEL_VERSION='1.0.0'

function allocatedNodeIds(planning:RealPassivePlanningIntegrationResult|undefined,weaponSet:'set-1'|'set-2'){
  const selected=planning?.weaponSetPlanning?.[weaponSet]??planning?.pipelineResult
  return unique([...(selected?.allocatedNodeIds??[]),...(planning?.ascendancyPlanning?.allocatedNodeIds??[])])
}

function skillEffects(setups:SkillSetup[],skills:SkillGemDefinition[],activeDamageTypes:DamageComponent['type'][]){
  const candidates:AppliedEnemyMitigationEffect[]=[]
  const skillById=new Map(skills.map(skill=>[skill.id,skill]))
  for(const setup of setups.filter(value=>Boolean(value.skillId))){
    const definition=skillById.get(setup.skillId)
    const numeric=definition?.nameEn?skillsByName.get(definition.nameEn.toLocaleLowerCase('en')):undefined
    if(!definition||!numeric)continue
    const numericStats=numeric.numericStats as Record<string,number>
    const elementalCurse=numericStats['base_skill_buff_all_elements_resistance_%_to_apply']
    if(Number.isFinite(elementalCurse)&&elementalCurse<0)candidates.push({
      source:'skill',sourceId:setup.skillId,label:`${definition.displayNameDe}: Elementarwiderstände`,
      kind:'resistance-reduction',damageTypes:elemental,value:Math.abs(elementalCurse),
      evidence:'structured-exact',sourceReference:'base_skill_buff_all_elements_resistance_%_to_apply',conditional:true,
      durationMs:Number(numericStats.base_skill_effect_duration)||undefined,
      activationTimeMs:numeric.castTime>0?numeric.castTime*1000:undefined,
      uptimeStatus:'windowed',state:'assumed-active',
    })
    const chaosCurse=numericStats['base_skill_buff_chaos_damage_resistance_%_to_apply']
    if(Number.isFinite(chaosCurse)&&chaosCurse<0)candidates.push({
      source:'skill',sourceId:setup.skillId,label:`${definition.displayNameDe}: Chaoswiderstand`,
      kind:'resistance-reduction',damageTypes:['chaos'],value:Math.abs(chaosCurse),
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
  }
  const curses=candidates.filter(value=>value.kind==='resistance-reduction')
  const relevantCurses=curses.filter(value=>value.damageTypes.some(type=>activeDamageTypes.includes(type)))
  const selectedCurse=[...relevantCurses].sort((left,right)=>right.value-left.value||left.sourceId.localeCompare(right.sourceId))[0]
  return candidates.filter(value=>value.kind!=='resistance-reduction'||value===selectedCurse)
}

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
  passiveTree?:RealPassiveTree
  realPassivePlanning?:RealPassivePlanningIntegrationResult
}):EnemyMitigationProfile{
  const effects=[
    ...skillEffects(input.setups,input.skills,input.activeDamageTypes),
    ...passiveEffects(input.passiveTree,input.realPassivePlanning,input.weaponSet),
  ]
  const rarity=input.profile.targetRarity
  for(const effect of effects){
    if(effect.kind==='resistance-reduction'){
      effect.effectiveValue=Number((effect.value*curseEffectMultiplier(rarity)).toFixed(2))
      effect.stateDetail=rarity&&rarity!=='normal'?`Auf ${rarity} Gegner angewandte verringerte Fluchwirkung.`:'Volle Fluchwirkung.'
    }else if(effect.kind==='armour-break'){
      effect.effectiveValue=effect.value*armourBreakMultiplier(rarity)
      effect.stateDetail='Der Betrag wird mit weiteren Treffern innerhalb der Wirkzeit aufgebaut.'
    }else effect.effectiveValue=effect.value
  }
  const penetration={...(input.profile.penetration??{})}
  const resistanceReduction={...(input.profile.resistanceReduction??{})}
  for(const effect of effects){
    if(effect.kind==='penetration')for(const type of effect.damageTypes.filter((value):value is EnemyResistanceType=>value!=='physical'))penetration[type]=(penetration[type]??0)+(effect.effectiveValue??effect.value)
    if(effect.kind==='resistance-reduction')for(const type of effect.damageTypes.filter((value):value is EnemyResistanceType=>value!=='physical'))resistanceReduction[type]=Math.max(resistanceReduction[type]??0,effect.effectiveValue??effect.value)
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
  if(effects.some(value=>value.kind==='resistance-reduction'))limitations.push('Von gewählten Fertigkeiten stammt höchstens ein relevanter Fluch; seine strukturierte Wirkzeit ist bekannt, die tatsächliche Wiederholungsfrequenz ohne Rotationsbeleg jedoch nicht.')
  if(effects.some(value=>value.kind==='armour-break')&&!input.profile.armour)limitations.push('Rüstungsbruch besitzt 12 Sekunden Wirkzeit; ohne belegte Zielrüstung sind benötigte Treffer und vollständig gebrochene Rüstung unbekannt.')
  if(primaryBreakEffect&&timeToFullyBreakArmourMs&&primaryBreakEffect.durationMs&&timeToFullyBreakArmourMs>primaryBreakEffect.durationMs)limitations.push('Die belegte Trefferfrequenz reicht nicht aus, um die Zielrüstung innerhalb des 12-Sekunden-Fensters vollständig zu brechen.')
  return{
    ...input.profile,
    ...(Object.keys(penetration).length?{penetration}:{}),
    ...(Object.keys(resistanceReduction).length?{resistanceReduction}:{}),
    ...(armourBreak?{armourBreak}:{}),
    appliedEffects:effects,
    ...(hitsToFullyBreakArmour?{hitsToFullyBreakArmour}:{}),
    ...(timeToFullyBreakArmourMs?{timeToFullyBreakArmourMs}:{}),
    ...(fullyBrokenArmour?{fullyBrokenArmour:true}:{}),
    temporalModelVersion:TEMPORAL_ENEMY_EFFECT_MODEL_VERSION,
    limitations:unique(limitations),
  }
}
