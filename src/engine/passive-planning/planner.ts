import { findPassivePath } from '../passive-pathfinding/pathfinder'
import type { PassivePathResult } from '../passive-pathfinding/types'
import { baseValueComponents, buildPassivePlanningCandidates } from './candidate-builder'
import { PASSIVE_PLANNER_VERSION, PASSIVE_PLANNING_CONFIG, PASSIVE_PLANNING_STRATEGY } from './config'
import type { PassivePlanCachedPath, PassivePlanCandidate, PassivePlanResult, PassivePlanSelectedTarget, PassivePlanningInput, PassivePlanningPathCache } from './types'
import { validatePassivePlanningInput } from './validator'

const compareId=(a:string,b:string)=>a.localeCompare(b,'en',{numeric:true})
const uniqueSorted=(values:Iterable<string>)=>[...new Set(values)].sort(compareId)
const round=(value:number)=>Math.round(value*10000)/10000
const confidenceNumber={low:1,medium:2,high:3} as const
export const createPassivePlanningPathCache=():PassivePlanningPathCache=>({entries:new Map()})

interface State { merged:Set<string>;connections:Set<string>;allocated:Set<string>;selected:Set<string>;used:number;pathSearches:number;cacheHits:number;safety:boolean }
interface Evaluation { candidate:PassivePlanCandidate;path:PassivePlanCachedPath;components:ReturnType<typeof baseValueComponents>;effectiveValue:number;valuePerPoint:number;score:number;redundancyCodes:string[];conflictCodes:string[] }

function empty(input:PassivePlanningInput,status:PassivePlanResult['status'],violations:string[],warnings:string[]=[]):PassivePlanResult {
 return {requestId:input.requestId,sourceVersion:input.sourceVersion,planningMode:input.planningMode,startNodeId:input.startNodeId,pointBudget:input.pointBudget,usedPointBudget:0,remainingPointBudget:Math.max(0,input.pointBudget),selectedTargetIds:[],requiredTargetIds:uniqueSorted(input.requiredTargetNodeIds??[]),skippedTargetIds:[],mergedNodeIds:input.passiveGraph.nodes.has(input.startNodeId)?[input.startNodeId]:[],mergedConnectionIds:[],newlyAllocatedNodeIds:[],reusedNodeIds:input.passiveGraph.nodes.has(input.startNodeId)?[input.startNodeId]:[],selectedTargets:[],selectionSteps:[],totalTargetValue:0,totalEffectiveValue:0,averageConfidence:0,totalPathLength:0,pathReuseRatio:0,redundancyWarnings:[],conflictWarnings:[],keystoneWarnings:[],unresolvedWarnings:[],violations,warnings,status,strategy:PASSIVE_PLANNING_STRATEGY,optimalityClaim:'heuristic',plannerVersion:PASSIVE_PLANNER_VERSION,candidateCount:0,planningIterationCount:0,pathSearchCount:0,pathCacheHitCount:0,safetyLimitReached:false}
}

function cacheKey(input:PassivePlanningInput,anchor:string,target:string,state:State):string {
 return JSON.stringify([input.passiveGraph.version,anchor,target,uniqueSorted(state.allocated),uniqueSorted(input.blockedNodeIds??[])])
}
function fromPath(value:PassivePathResult):PassivePlanCachedPath{return{reachable:value.reachable,withinBudget:value.withinBudget,pathNodeIds:[...value.orderedNodeIds],connectionIds:[...value.orderedConnectionIds],addedNodeIds:[...value.newlyAllocatedNodeIds],reusedNodeIds:[...value.reusedNodeIds],pointCost:value.totalPointCost,pathLength:value.pathLength}}
function comparePath(a:PassivePlanCachedPath,b:PassivePlanCachedPath){return a.pointCost-b.pointCost||a.addedNodeIds.length-b.addedNodeIds.length||a.pathLength-b.pathLength||a.pathNodeIds.join('\0').localeCompare(b.pathNodeIds.join('\0'))}

function incrementalPath(input:PassivePlanningInput,target:string,state:State,cache:PassivePlanningPathCache):PassivePlanCachedPath|undefined {
 if(state.merged.has(target))return{reachable:true,withinBudget:true,pathNodeIds:[target],connectionIds:[],addedNodeIds:[],reusedNodeIds:[target],pointCost:0,pathLength:0}
 const found:PassivePlanCachedPath[]=[]
 for(const anchor of uniqueSorted(state.merged)){
  const key=cacheKey(input,anchor,target,state);let path=cache.entries.get(key)
  if(path){state.cacheHits++}else{
   if(state.pathSearches>=PASSIVE_PLANNING_CONFIG.limits.maximumPathSearches){state.safety=true;break}
   const result=findPassivePath(input.passiveGraph,{requestId:`${input.requestId}:${anchor}:${target}`,startNodeId:anchor,targetNodeIds:[target],allocatedNodeIds:uniqueSorted(state.allocated),blockedNodeIds:uniqueSorted(input.blockedNodeIds??[]),allowedNodeTypes:['normal','notable','keystone','class-start','jewel-socket'],searchMode:'lowest-cost-path'})
   state.pathSearches++;path=fromPath(result);cache.entries.set(key,path)
  }
  if(path.reachable)found.push(path)
 }
 return found.sort(comparePath)[0]
}

function redundancy(candidate:PassivePlanCandidate,selected:PassivePlanCandidate[]):{penalty:number;codes:string[]} {
 const codes:string[]=[]
 for(const other of selected){
  const explicit=candidate.recommendation.redundantWithNodeIds.includes(other.recommendation.nodeId)
  const sameSignature=Boolean(candidate.tagSignature)&&candidate.tagSignature===other.tagSignature
  const sameDominant=candidate.dominantCategory===other.dominantCategory
  if(explicit||sameSignature)codes.push(`redundant-target:${other.recommendation.nodeId}`)
  else if(sameDominant)codes.push(`similar-dominant-category:${other.recommendation.nodeId}`)
 }
 const strong=codes.filter(value=>value.startsWith('redundant-target')).length
 return {penalty:strong*PASSIVE_PLANNING_CONFIG.penalties.strongRedundancy+(codes.length-strong)*PASSIVE_PLANNING_CONFIG.penalties.redundancy,codes}
}
function evaluate(input:PassivePlanningInput,candidate:PassivePlanCandidate,path:PassivePlanCachedPath,selected:PassivePlanCandidate[]):Evaluation {
 const red=redundancy(candidate,selected),base=baseValueComponents(input,candidate.recommendation),components={...base,redundancyPenalty:red.penalty,effectiveValue:base.effectiveValue-red.penalty}
 const divisor=Math.max(path.pointCost,PASSIVE_PLANNING_CONFIG.zeroCostDivisor),valuePerPoint=components.effectiveValue/divisor,reuse=path.pathNodeIds.length?path.reusedNodeIds.length/path.pathNodeIds.length:0,w=PASSIVE_PLANNING_CONFIG.modeWeights[input.planningMode]
 const score=components.effectiveValue*w.value+valuePerPoint*w.efficiency+reuse*w.reuse-path.pointCost*w.cost
 return{candidate,path,components,effectiveValue:components.effectiveValue,valuePerPoint,score,redundancyCodes:red.codes,conflictCodes:[...candidate.recommendation.conflictingTags,...candidate.recommendation.conflictingProfileFields,...candidate.recommendation.conflictingNodeIds].map(String)}
}
function compareEvaluation(a:Evaluation,b:Evaluation){return b.score-a.score||b.candidate.recommendation.totalScore-a.candidate.recommendation.totalScore||confidenceNumber[b.candidate.recommendation.confidence]-confidenceNumber[a.candidate.recommendation.confidence]||a.path.pointCost-b.path.pointCost||a.path.pathLength-b.path.pathLength||compareId(a.candidate.recommendation.nodeId,b.candidate.recommendation.nodeId)}

export function planPassiveTargets(input:PassivePlanningInput):PassivePlanResult {
 const violations=validatePassivePlanningInput(input);if(violations.length)return empty(input,'invalid-input',violations)
 const requiredIds=uniqueSorted(input.requiredTargetNodeIds??[]),byId=new Map(input.targetingResult.allCandidates.map(value=>[value.nodeId,value])),missing=requiredIds.filter(id=>!byId.has(id)||!input.passiveGraph.nodes.has(id))
 if(missing.length)return empty(input,'blocked',missing.map(id=>`invalid-required-target:${id}`))
 const candidates=buildPassivePlanningCandidates(input),candidateById=new Map(candidates.map(value=>[value.recommendation.nodeId,value])),invalidRequired=requiredIds.filter(id=>!candidateById.has(id))
 if(invalidRequired.length)return empty(input,'blocked',invalidRequired.map(id=>`ineligible-required-target:${id}`))
 const limit=Math.min(input.maximumSelectedTargets,PASSIVE_PLANNING_CONFIG.limits.maximumSelectedTargets),cache=input.pathCache??createPassivePlanningPathCache()
 const allocated=new Set([input.startNodeId,...(input.alreadyAllocatedNodeIds??[])]),state:State={merged:new Set([input.startNodeId]),connections:new Set(),allocated,selected:new Set(),used:0,pathSearches:0,cacheHits:0,safety:false}
 const selectedTargets:PassivePlanSelectedTarget[]=[],steps:PassivePlanResult['selectionSteps']=[],selectedCandidates:PassivePlanCandidate[]=[],warnings:string[]=['heuristic-plan-no-global-optimality'],redundancyWarnings:string[]=[],conflictWarnings:string[]=[],keystoneWarnings:string[]=[],unresolvedWarnings:string[]=[]
 const add=(evaluation:Evaluation,evaluated:number)=>{
  const budgetBefore=input.pointBudget-state.used;state.used+=evaluation.path.pointCost;evaluation.path.pathNodeIds.forEach(id=>{state.merged.add(id);state.allocated.add(id)});evaluation.path.connectionIds.forEach(id=>state.connections.add(id));state.selected.add(evaluation.candidate.recommendation.nodeId);selectedCandidates.push(evaluation.candidate)
  const rec=evaluation.candidate.recommendation,targetWarnings=[...rec.warnings.map(value=>value.code),...evaluation.redundancyCodes,...evaluation.conflictCodes]
  if(rec.nodeType==='keystone'){targetWarnings.push('keystone-trade-off-review-required');keystoneWarnings.push(`keystone:${rec.nodeId}:${rec.tradeOffs.join('|')||'review-required'}`)}
  if(evaluation.redundancyCodes.length)redundancyWarnings.push(...evaluation.redundancyCodes.map(code=>`${rec.nodeId}:${code}`));if(evaluation.conflictCodes.length)conflictWarnings.push(`${rec.nodeId}:${evaluation.conflictCodes.join('|')}`);if(rec.unresolvedStatCount)unresolvedWarnings.push(`${rec.nodeId}:unresolved-stats:${rec.unresolvedStatCount}`)
  selectedTargets.push({nodeId:rec.nodeId,displayName:rec.displayName,nodeType:rec.nodeType,originalTargetScore:rec.totalScore,confidence:rec.confidence,effectiveValue:round(evaluation.effectiveValue),incrementalPointCost:evaluation.path.pointCost,valuePerPoint:round(evaluation.valuePerPoint),incrementalValuePerPoint:round(evaluation.valuePerPoint),addedNodeIds:uniqueSorted(evaluation.path.addedNodeIds),reusedNodeIds:uniqueSorted(evaluation.path.reusedNodeIds),pathNodeIds:[...evaluation.path.pathNodeIds],reasons:rec.reasons.map(value=>value.code),warnings:uniqueSorted(targetWarnings),valueComponents:{...evaluation.components,effectiveValue:round(evaluation.components.effectiveValue)},keystone:rec.nodeType==='keystone'})
  steps.push({stepIndex:steps.length+1,candidateNodeId:rec.nodeId,evaluatedCandidateCount:evaluated,selected:true,effectiveValue:round(evaluation.effectiveValue),incrementalPointCost:evaluation.path.pointCost,valuePerPoint:round(evaluation.valuePerPoint),budgetBefore,budgetAfter:input.pointBudget-state.used,addedNodeIds:uniqueSorted(evaluation.path.addedNodeIds),reusedNodeIds:uniqueSorted(evaluation.path.reusedNodeIds),rejectedReasonCodes:[]})
 }
 for(const id of requiredIds){const candidate=candidateById.get(id)!,path=incrementalPath(input,id,state,cache);if(!path||!path.reachable)return{...empty(input,'required-target-unreachable',[`required-target-unreachable:${id}`]),pathSearchCount:state.pathSearches,pathCacheHitCount:state.cacheHits,candidateCount:candidates.length};if(state.used+path.pointCost>input.pointBudget)return{...empty(input,'required-target-over-budget',[`required-target-over-budget:${id}`]),pathSearchCount:state.pathSearches,pathCacheHitCount:state.cacheHits,candidateCount:candidates.length};add(evaluate(input,candidate,path,selectedCandidates),1)}
 let iterations=0
 while(state.selected.size<limit&&state.used<input.pointBudget&&iterations<PASSIVE_PLANNING_CONFIG.limits.maximumIterations&&!state.safety){iterations++;const evaluations:Evaluation[]=[]
  for(const candidate of candidates){if(state.selected.has(candidate.recommendation.nodeId)||candidate.required)continue;const path=incrementalPath(input,candidate.recommendation.nodeId,state,cache);if(!path||!path.reachable||state.used+path.pointCost>input.pointBudget)continue;const value=evaluate(input,candidate,path,selectedCandidates);if(value.effectiveValue>0&&value.score>0)evaluations.push(value)}
  const chosen=evaluations.sort(compareEvaluation)[0];if(!chosen)break;add(chosen,evaluations.length)
 }
 if(iterations>=PASSIVE_PLANNING_CONFIG.limits.maximumIterations){state.safety=true;warnings.push('maximum-planning-iterations-reached')}if(state.safety)warnings.push('maximum-path-searches-reached')
 const selectedIds=selectedTargets.map(value=>value.nodeId),skipped=candidates.map(value=>value.recommendation.nodeId).filter(id=>!state.selected.has(id)),newly=uniqueSorted([...state.merged].filter(id=>!(input.alreadyAllocatedNodeIds??[]).includes(id)&&id!==input.startNodeId&&input.passiveGraph.nodes.get(id)!.traversalCost>0)),reused=uniqueSorted([...state.merged].filter(id=>!newly.includes(id)))
 const pathNodes=selectedTargets.flatMap(value=>value.pathNodeIds),reusedOccurrences=selectedTargets.reduce((sum,value)=>sum+value.reusedNodeIds.length,0)
 const status:PassivePlanResult['status']=selectedTargets.length===0?'no-eligible-targets':state.used>=input.pointBudget?'budget-exhausted':state.safety||skipped.length?'partial':'complete'
 return{requestId:input.requestId,sourceVersion:input.sourceVersion,planningMode:input.planningMode,startNodeId:input.startNodeId,pointBudget:input.pointBudget,usedPointBudget:state.used,remainingPointBudget:input.pointBudget-state.used,selectedTargetIds:selectedIds,requiredTargetIds:requiredIds,skippedTargetIds:skipped,mergedNodeIds:uniqueSorted(state.merged),mergedConnectionIds:uniqueSorted(state.connections),newlyAllocatedNodeIds:newly,reusedNodeIds:reused,selectedTargets,selectionSteps:steps,totalTargetValue:round(selectedTargets.reduce((sum,value)=>sum+value.originalTargetScore,0)),totalEffectiveValue:round(selectedTargets.reduce((sum,value)=>sum+value.effectiveValue,0)),averageConfidence:selectedTargets.length?round(selectedTargets.reduce((sum,value)=>sum+confidenceNumber[value.confidence],0)/selectedTargets.length):0,totalPathLength:selectedTargets.reduce((sum,value)=>sum+Math.max(0,value.pathNodeIds.length-1),0),pathReuseRatio:pathNodes.length?round(reusedOccurrences/pathNodes.length):0,redundancyWarnings:uniqueSorted(redundancyWarnings),conflictWarnings:uniqueSorted(conflictWarnings),keystoneWarnings:uniqueSorted(keystoneWarnings),unresolvedWarnings:uniqueSorted(unresolvedWarnings),violations:[],warnings:uniqueSorted(warnings),status,strategy:PASSIVE_PLANNING_STRATEGY,optimalityClaim:'heuristic',plannerVersion:PASSIVE_PLANNER_VERSION,candidateCount:candidates.length,planningIterationCount:iterations,pathSearchCount:state.pathSearches,pathCacheHitCount:state.cacheHits,safetyLimitReached:state.safety}
}
