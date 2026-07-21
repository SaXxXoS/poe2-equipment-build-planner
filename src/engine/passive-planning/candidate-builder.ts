import { PASSIVE_PLANNING_CONFIG } from './config'
import type { PassivePlanCandidate, PassivePlanningInput } from './types'
import type { PassiveTargetRecommendation } from '../passive-targeting/types'

const compareId = (a:string,b:string) => a.localeCompare(b,'en',{numeric:true})
const confidence = (value:PassiveTargetRecommendation['confidence']) => PASSIVE_PLANNING_CONFIG.confidenceRank[value]
const allowed = new Set(['normal','notable','keystone'])

function dominantCategory(value:PassiveTargetRecommendation):string {
  const scores: Array<[string,number]> = [['damage',value.damageScore],['defence',value.defenceScore],['mapping',value.mappingScore],['boss',value.bossScore],['speed',value.speedScore],['utility',value.utilityScore],['resource',value.resourceScore],['attribute',value.attributeScore]]
  return scores.sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0][0]
}

export function baseValueComponents(input:PassivePlanningInput,value:PassiveTargetRecommendation) {
  const targetValue=value.totalScore, profileValue=value.profileSynergyScore
  const modeValue=input.targetProfile==='mapping'?value.mappingScore:input.targetProfile==='boss'?value.bossScore:(value.mappingScore+value.bossScore)/2
  const weighted=targetValue*PASSIVE_PLANNING_CONFIG.valueWeights.target+profileValue*PASSIVE_PLANNING_CONFIG.valueWeights.profile+modeValue*PASSIVE_PLANNING_CONFIG.valueWeights.mode
  const confidenceAdjustedValue=weighted*PASSIVE_PLANNING_CONFIG.confidenceMultiplier[value.confidence]
  const conflictPenalty=(value.conflictingTags.length+value.conflictingProfileFields.length+value.conflictingNodeIds.length)*PASSIVE_PLANNING_CONFIG.penalties.conflict
  const unresolvedPenalty=value.unresolvedStatCount*PASSIVE_PLANNING_CONFIG.penalties.unresolved
  const reoptimizationPenalty=value.requiresReoptimization?PASSIVE_PLANNING_CONFIG.penalties.reoptimization:0
  return {targetValue,profileValue,modeValue,confidenceAdjustedValue,conflictPenalty,unresolvedPenalty,reoptimizationPenalty,redundancyPenalty:0,effectiveValue:confidenceAdjustedValue-conflictPenalty-unresolvedPenalty-reoptimizationPenalty}
}

function isCandidate(input:PassivePlanningInput,value:PassiveTargetRecommendation,required:Set<string>):boolean {
  const graphNode=input.passiveGraph.nodes.get(value.nodeId)
  if(!graphNode||!graphNode.enabled||value.eligibility==='blocked'||value.nodeId===input.startNodeId) return false
  if(['class-start','ascendancy-start','ascendancy','unknown'].includes(graphNode.nodeType)) return false
  if(graphNode.nodeType==='jewel-socket'&&!required.has(value.nodeId)) return false
  if(!allowed.has(graphNode.nodeType)&&!(required.has(value.nodeId)&&graphNode.nodeType==='jewel-socket')) return false
  if((input.excludedTargetNodeIds??[]).includes(value.nodeId)||value.totalScore<input.minimumTargetScore||confidence(value.confidence)<confidence(input.minimumConfidence)) return false
  return !value.requiresReoptimization||input.allowReoptimizationTargets===true
}

export function buildPassivePlanningCandidates(input:PassivePlanningInput):PassivePlanCandidate[] {
  const required=new Set(input.requiredTargetNodeIds??[]), seen=new Set<string>()
  const values=input.targetingResult.allCandidates.filter(value=>{if(seen.has(value.nodeId))return false;seen.add(value.nodeId);return isCandidate(input,value,required)}).map(recommendation=>({recommendation,required:required.has(recommendation.nodeId),dominantCategory:dominantCategory(recommendation),tagSignature:[...recommendation.matchedTags].sort().join('|'),...baseValueComponents(input,recommendation)}))
  const modeValue=(value:PassivePlanCandidate)=>input.planningMode==='value-first'?value.effectiveValue:input.planningMode==='efficiency-first'?value.modeValue+value.profileValue:value.effectiveValue+value.modeValue
  return values.sort((a,b)=>Number(b.required)-Number(a.required)||modeValue(b)-modeValue(a)||b.targetValue-a.targetValue||confidence(b.recommendation.confidence)-confidence(a.recommendation.confidence)||compareId(a.recommendation.nodeId,b.recommendation.nodeId)).slice(0,Math.min(input.candidatePoolLimit,PASSIVE_PLANNING_CONFIG.limits.maximumCandidates))
}
