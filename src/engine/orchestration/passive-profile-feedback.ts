import type { BuildProfile } from '../common/types'
import { classifyPassiveNode } from '../passive-targeting/classifier'
import { PASSIVE_TARGET_RULES } from '../passive-targeting/rules'
import type { RealPassiveTree } from '../real-passive-pipeline/types'

export type PassiveFeedbackSource = 'ascendancy' | 'shared-passive'
export interface PassiveProfileFieldDelta { field:string;delta:number;sourceNodeIds:string[] }
export interface PassiveProfileFeedback {
  source:PassiveFeedbackSource
  appliedNodeIds:string[]
  unresolvedNodeIds:string[]
  fieldDeltas:PassiveProfileFieldDelta[]
}
export interface PassiveProfileFeedbackResult { profile:BuildProfile;feedback:PassiveProfileFeedback }

const clamp=(value:number)=>Math.max(0,Math.min(100,Math.round(value*100)/100))
const ruleById=new Map(PASSIVE_TARGET_RULES.map(rule=>[rule.ruleId,rule]))
const compareId=(a:string,b:string)=>a.localeCompare(b,'en',{numeric:true})
const isNeedField=(field:string)=>field.endsWith('Need')

function updateField(profile:BuildProfile,field:string,delta:number):number|null {
  const [section,key]=field.split('.')
  const group=profile[section as keyof BuildProfile]
  if(!group||typeof group!=='object'||Array.isArray(group))return null
  const record=group as unknown as Record<string,unknown>
  if(typeof record[key]!=='number')return null
  const before=Number(record[key]),after=clamp(before+delta)
  record[key]=after
  return after-before
}

export function applyPassiveProfileFeedback(profile:BuildProfile,tree:RealPassiveTree,nodeIds:readonly string[],source:PassiveFeedbackSource):PassiveProfileFeedbackResult {
  const result=structuredClone(profile),nodes=new Map(tree.nodes.map(node=>[node.id,node])),deltas=new Map<string,{delta:number;nodes:Set<string>}>(),applied=new Set<string>(),unresolved=new Set<string>()
  for(const nodeId of [...new Set(nodeIds)].sort(compareId)){
    const node=nodes.get(nodeId)
    if(!node||node.isClassStart||node.isAscendancyStart)continue
    const classification=classifyPassiveNode(node)
    let nodeApplied=false
    for(const stat of classification.stats){
      if(stat.unresolved){unresolved.add(nodeId);continue}
      const perField=new Map<string,number>()
      for(const ruleId of stat.matchedRuleIds){
        const rule=ruleById.get(ruleId)
        if(!rule)continue
        for(const field of rule.affectedProfileFields)perField.set(field,Math.max(perField.get(field)??0,rule.weight))
      }
      const negative=stat.negativeEffects.length>0
      for(const [field,weight] of perField){
        const direction=(negative?-1:1)*(isNeedField(field)?-1:1)
        const delta=direction*weight
        const appliedDelta=updateField(result,field,delta)
        if(appliedDelta===null||appliedDelta===0)continue
        const current=deltas.get(field)??{delta:0,nodes:new Set<string>()}
        current.delta+=appliedDelta;current.nodes.add(nodeId);deltas.set(field,current);nodeApplied=true
      }
    }
    if(nodeApplied)applied.add(nodeId)
  }
  return{profile:result,feedback:{source,appliedNodeIds:[...applied].sort(compareId),unresolvedNodeIds:[...unresolved].sort(compareId),fieldDeltas:[...deltas].sort(([a],[b])=>a.localeCompare(b)).map(([field,value])=>({field,delta:value.delta,sourceNodeIds:[...value.nodes].sort(compareId)}))}}
}
