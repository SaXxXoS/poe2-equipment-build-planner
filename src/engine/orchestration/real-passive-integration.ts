import type { AnalyzerContext,BuildProfile,Confidence } from '../common/types'
import type { PassiveGraph } from '../passive-pathfinding/types'
import type { PassivePlanningMode } from '../passive-planning/types'
import type { PassiveTargetNodeType } from '../passive-targeting/types'
import { runRealPassivePipeline } from '../real-passive-pipeline/pipeline'
import type { PipelineIssue,RealPassivePipelineInput,RealPassivePipelineResult,RealPassiveTree } from '../real-passive-pipeline/types'

export type RealPassiveIntegrationStatus='disabled'|'completed'|'completed-with-issues'|'partial'|'blocked'|'invalid-input'|'failed'
export interface RealPassiveCharacterContext { classId:string;ascendancyId?:string;characterLevel:number }
export interface RealPassivePlanningConfiguration {
  enabled:boolean
  requestId?:string
  passiveTree?:RealPassiveTree
  sourceVersion?:string
  pointBudget?:number
  characterContext?:RealPassiveCharacterContext
  startNodeId?:string
  passiveGraph?:PassiveGraph
  passiveGraphSourceVersion?:string
  planningMode?:PassivePlanningMode
  targetProfile?:'mapping'|'boss'|'balanced'
  alreadyAllocatedNodeIds?:string[]
  blockedNodeIds?:string[]
  requiredTargetNodeIds?:string[]
  excludedTargetNodeIds?:string[]
  requiredNodeTypes?:PassiveTargetNodeType[]
  maximumTargetingResults?:number
  candidatePoolLimit?:number
  maximumSelectedTargets?:number
  minimumTargetScore?:number
  minimumConfidence?:Confidence
  allowKeystoneReoptimization?:boolean
}
export interface RealPassiveIntegrationPerformance { integrationDurationMs:number;pipelineDurationMs:number;orchestratorDurationMs?:number;inputValidationMs:number;graphPreparationMs:number;targetingMs:number;planningMs:number;outputValidationMs:number;resultSizeBytes:number;graphReused:boolean;graphBuildCount:number;evaluatedTargetCount:number;pathSearchCount:number }
export interface RealPassivePlanningIntegrationResult { enabled:boolean;status:RealPassiveIntegrationStatus;pipelineResult:RealPassivePipelineResult|null;issues:PipelineIssue[];performance:RealPassiveIntegrationPerformance|null }

const issue=(code:string):PipelineIssue=>({code,sourceModule:'pipeline',stageId:'validate-input'})
const statusOf=(result:RealPassivePipelineResult):RealPassiveIntegrationStatus=>{
  if(result.status==='complete')return result.warnings.length?'completed-with-issues':'completed'
  if(result.status==='partial'||result.status==='budget-exhausted'||result.status==='no-eligible-targets')return'partial'
  if(result.status==='invalid-input'||result.status==='source-version-mismatch'||result.status==='start-node-unresolved')return'invalid-input'
  if(result.status==='blocked'||result.status==='required-target-failed')return'blocked'
  return'failed'
}
const invalid=(codes:string[]):RealPassivePlanningIntegrationResult=>({enabled:true,status:'invalid-input',pipelineResult:null,issues:[...new Set(codes)].sort().map(issue),performance:null})

export function runRealPassivePlanningIntegration(configuration:RealPassivePlanningConfiguration|undefined,buildProfile:BuildProfile,context:AnalyzerContext,runner:typeof runRealPassivePipeline=runRealPassivePipeline):RealPassivePlanningIntegrationResult|undefined{
  if(!configuration)return undefined
  if(!configuration.enabled)return{enabled:false,status:'disabled',pipelineResult:null,issues:[],performance:null}
  const errors:string[]=[]
  if(!configuration.requestId?.trim())errors.push('missing-request-id')
  if(!configuration.passiveTree)errors.push('missing-passive-tree')
  if(!configuration.sourceVersion)errors.push('missing-source-version')
  if(!Number.isInteger(configuration.pointBudget))errors.push(configuration.pointBudget===undefined?'missing-point-budget':'invalid-point-budget')
  if(!configuration.characterContext)errors.push('missing-character-context')
  if(!configuration.planningMode)errors.push('missing-planning-mode')
  if(!configuration.targetProfile)errors.push('missing-target-profile')
  if(configuration.passiveGraph&&configuration.passiveGraphSourceVersion!==configuration.sourceVersion)errors.push('prepared-graph-source-version-mismatch')
  if(errors.length)return invalid(errors)
  const input:RealPassivePipelineInput={requestId:configuration.requestId!,sourceVersion:configuration.sourceVersion!,buildProfile,characterClassId:configuration.characterContext!.classId,ascendancyId:configuration.characterContext!.ascendancyId,characterLevel:configuration.characterContext!.characterLevel,startNodeId:configuration.startNodeId,pointBudget:configuration.pointBudget!,targetProfile:configuration.targetProfile!,planningMode:configuration.planningMode!,passiveTree:configuration.passiveTree!,passiveGraph:configuration.passiveGraph,alreadyAllocatedNodeIds:configuration.alreadyAllocatedNodeIds,blockedNodeIds:configuration.blockedNodeIds,requiredTargetNodeIds:configuration.requiredTargetNodeIds,excludedTargetNodeIds:configuration.excludedTargetNodeIds,requiredNodeTypes:configuration.requiredNodeTypes,maximumTargetingResults:configuration.maximumTargetingResults,candidatePoolLimit:configuration.candidatePoolLimit??50,maximumSelectedTargets:configuration.maximumSelectedTargets??20,minimumTargetScore:configuration.minimumTargetScore??0,minimumConfidence:configuration.minimumConfidence??'low',allowKeystoneReoptimization:configuration.allowKeystoneReoptimization??false,analyzerContext:context}
  const started=performance.now(),pipelineStarted=performance.now(),pipelineResult=runner(input),pipelineDurationMs=performance.now()-pipelineStarted,integrationDurationMs=performance.now()-started
  const stage=(id:string)=>pipelineResult.pipelineStages.find(value=>value.stageId===id)?.durationMs??0
  return{enabled:true,status:statusOf(pipelineResult),pipelineResult,issues:[...pipelineResult.violations],performance:{integrationDurationMs,pipelineDurationMs,inputValidationMs:stage('validate-input'),graphPreparationMs:stage('prepare-graph'),targetingMs:stage('evaluate-targets'),planningMs:stage('create-passive-plan'),outputValidationMs:stage('validate-output'),resultSizeBytes:new TextEncoder().encode(JSON.stringify(pipelineResult)).length,graphReused:pipelineResult.graphDiagnostics.graphReused,graphBuildCount:pipelineResult.graphDiagnostics.graphBuildCount,evaluatedTargetCount:pipelineResult.targetingDiagnostics.evaluatedNodeCount,pathSearchCount:pipelineResult.planningDiagnostics.pathSearchCount}}
}
