import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillGemDefinition,SkillSetup } from '../../domain'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'
import type { AppliedEnemyMitigationEffect,DamageComponent,EnemyMitigationProfile,EnemyResistanceType } from './types'

const elemental:EnemyResistanceType[]=['fire','cold','lightning']
const skillsByName=new Map(reference.skills.map(skill=>[skill.name.toLocaleLowerCase('en'),skill]))
const stripMarkup=(value:string)=>value.replace(/\[[^|\]]+\|([^\]]+)\]/g,'$1').replace(/\s+/g,' ').trim()
const unique=<T>(values:T[])=>[...new Set(values)]

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
    })
    const chaosCurse=numericStats['base_skill_buff_chaos_damage_resistance_%_to_apply']
    if(Number.isFinite(chaosCurse)&&chaosCurse<0)candidates.push({
      source:'skill',sourceId:setup.skillId,label:`${definition.displayNameDe}: Chaoswiderstand`,
      kind:'resistance-reduction',damageTypes:['chaos'],value:Math.abs(chaosCurse),
      evidence:'structured-exact',sourceReference:'base_skill_buff_chaos_damage_resistance_%_to_apply',conditional:true,
    })
    const armourBreak=numericStats.apply_X_armour_break_on_hit
    if(Number.isFinite(armourBreak)&&armourBreak>0)candidates.push({
      source:'skill',sourceId:setup.skillId,label:`${definition.displayNameDe}: Rüstungsbruch pro Treffer`,
      kind:'armour-break',damageTypes:['physical'],value:armourBreak,
      evidence:'structured-exact',sourceReference:'apply_X_armour_break_on_hit',conditional:true,
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
  passiveTree?:RealPassiveTree
  realPassivePlanning?:RealPassivePlanningIntegrationResult
}):EnemyMitigationProfile{
  const effects=[
    ...skillEffects(input.setups,input.skills,input.activeDamageTypes),
    ...passiveEffects(input.passiveTree,input.realPassivePlanning,input.weaponSet),
  ]
  const penetration={...(input.profile.penetration??{})}
  const resistanceReduction={...(input.profile.resistanceReduction??{})}
  for(const effect of effects){
    if(effect.kind==='penetration')for(const type of effect.damageTypes.filter((value):value is EnemyResistanceType=>value!=='physical'))penetration[type]=(penetration[type]??0)+effect.value
    if(effect.kind==='resistance-reduction')for(const type of effect.damageTypes.filter((value):value is EnemyResistanceType=>value!=='physical'))resistanceReduction[type]=Math.max(resistanceReduction[type]??0,effect.value)
  }
  const armourBreak=Math.max(input.profile.armourBreak??0,...effects.filter(value=>value.kind==='armour-break').map(value=>value.value))
  const limitations=[...(input.profile.limitations??[])]
  if(effects.some(value=>value.kind==='resistance-reduction'))limitations.push('Von gewählten Fertigkeiten stammt höchstens ein für den verursachten Schaden relevanter Fluch; Anwendung, Fluchlimit, Gegnerstufe und Wirkzeit werden vorausgesetzt.')
  if(effects.some(value=>value.kind==='armour-break'))limitations.push('Rüstungsbruch ist als belegter Betrag pro Treffer erfasst; Aufbau, Wirkzeit und vollständig gebrochene Rüstung werden noch nicht zeitlich simuliert.')
  return{
    ...input.profile,
    ...(Object.keys(penetration).length?{penetration}:{}),
    ...(Object.keys(resistanceReduction).length?{resistanceReduction}:{}),
    ...(armourBreak?{armourBreak}:{}),
    appliedEffects:effects,
    limitations:unique(limitations),
  }
}
