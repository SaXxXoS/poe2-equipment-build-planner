import type { AnalyzerContext,BuildProfile,Confidence } from '../common/types'
import type { PassiveGraph } from '../passive-pathfinding/types'
import type { PassivePlanningMode } from '../passive-planning/types'
import type { PassiveTargetNodeType } from '../passive-targeting/types'
import type { PreparedPassiveTargetingContext } from '../passive-targeting/types'
import { runRealPassivePipeline } from '../real-passive-pipeline/pipeline'
import type { PipelineIssue,RealPassivePipelineInput,RealPassivePipelineResult,RealPassiveTree } from '../real-passive-pipeline/types'
import { projectRealPassivePipelineResult,type ProjectedRealPassivePipelineResult,type RealPassiveProjectionDiagnostics,type RealPassiveResultDetailMode } from './real-passive-result-projection'

export type RealPassiveIntegrationStatus='disabled'|'completed'|'completed-with-issues'|'partial'|'blocked'|'invalid-input'|'failed'
export interface RealPassiveCharacterContext { classId:string;ascendancyId?:string;characterLevel:number }
export interface RealPassivePlanningConfiguration {
  enabled:boolean
  requestId?:string
  passiveTree?:RealPassiveTree
  sourceVersion?:string
  pointBudget?:number
  weaponSetPointBudget?:number
  characterContext?:RealPassiveCharacterContext
  startNodeId?:string
  passiveGraph?:PassiveGraph
  passiveGraphSourceVersion?:string
  preparedTargetingContext?:PreparedPassiveTargetingContext
  resultDetailMode?:RealPassiveResultDetailMode
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
export interface WeaponSetPassivePlanningResult {
  specializationPointLimit:number
  sharedPointBudget:number
  shared:ProjectedRealPassivePipelineResult
  set1:ProjectedRealPassivePipelineResult
  set2:ProjectedRealPassivePipelineResult
}
export interface RealPassiveIntegrationPerformance { integrationDurationMs:number;pipelineDurationMs:number;orchestratorDurationMs?:number;inputValidationMs:number;graphPreparationMs:number;targetingMs:number;planningMs:number;outputValidationMs:number;projectionMs:number;serializationMs:number;resultSizeBytes:number;graphReused:boolean;graphBuildCount:number;targetingContextReused:boolean;targetingContextBuildCount:number;evaluatedTargetCount:number;pathSearchCount:number }
export interface RealPassivePlanningIntegrationResult { enabled:boolean;status:RealPassiveIntegrationStatus;detailMode:RealPassiveResultDetailMode;pipelineResult:ProjectedRealPassivePipelineResult|null;weaponSetPlanning?:WeaponSetPassivePlanningResult;issues:PipelineIssue[];projection:RealPassiveProjectionDiagnostics|null;performance:RealPassiveIntegrationPerformance|null }

const issue=(code:string):PipelineIssue=>({code,sourceModule:'pipeline',stageId:'validate-input'})
const statusOf=(result:RealPassivePipelineResult):RealPassiveIntegrationStatus=>{
  if(result.status==='complete')return result.warnings.length?'completed-with-issues':'completed'
  if(result.status==='partial'||result.status==='budget-exhausted'||result.status==='no-eligible-targets')return'partial'
  if(result.status==='invalid-input'||result.status==='source-version-mismatch'||result.status==='start-node-unresolved')return'invalid-input'
  if(result.status==='blocked'||result.status==='required-target-failed')return'blocked'
  return'failed'
}
const invalid=(codes:string[],detailMode:RealPassiveResultDetailMode):RealPassivePlanningIntegrationResult=>({enabled:true,status:'invalid-input',detailMode,pipelineResult:null,issues:[...new Set(codes)].sort().map(issue),projection:null,performance:null})

export function runRealPassivePlanningIntegration(configuration:RealPassivePlanningConfiguration|undefined,buildProfile:BuildProfile,context:AnalyzerContext,runner:typeof runRealPassivePipeline=runRealPassivePipeline,weaponSetProfiles?:Record<'set-1'|'set-2',BuildProfile>):RealPassivePlanningIntegrationResult|undefined{
  if(!configuration)return undefined
  const detailMode=configuration.resultDetailMode??'compact'
  if(!configuration.enabled)return{enabled:false,status:'disabled',detailMode,pipelineResult:null,issues:[],projection:null,performance:null}
  const errors:string[]=[]
  if(!configuration.requestId?.trim())errors.push('missing-request-id')
  if(!configuration.passiveTree)errors.push('missing-passive-tree')
  if(!configuration.sourceVersion)errors.push('missing-source-version')
  if(!Number.isInteger(configuration.pointBudget))errors.push(configuration.pointBudget===undefined?'missing-point-budget':'invalid-point-budget')
  if(!configuration.characterContext)errors.push('missing-character-context')
  if(!configuration.planningMode)errors.push('missing-planning-mode')
  if(!configuration.targetProfile)errors.push('missing-target-profile')
  if(configuration.passiveGraph&&configuration.passiveGraphSourceVersion!==configuration.sourceVersion)errors.push('prepared-graph-source-version-mismatch')
  if(!['compact','full'].includes(detailMode))errors.push('invalid-result-detail-mode')
  if(errors.length)return invalid(errors,detailMode)
  const baseInput:RealPassivePipelineInput={requestId:configuration.requestId!,sourceVersion:configuration.sourceVersion!,buildProfile,characterClassId:configuration.characterContext!.classId,ascendancyId:configuration.characterContext!.ascendancyId,characterLevel:configuration.characterContext!.characterLevel,startNodeId:configuration.startNodeId,pointBudget:configuration.pointBudget!,targetProfile:configuration.targetProfile!,planningMode:configuration.planningMode!,passiveTree:configuration.passiveTree!,passiveGraph:configuration.passiveGraph,preparedTargetingContext:configuration.preparedTargetingContext,alreadyAllocatedNodeIds:configuration.alreadyAllocatedNodeIds,blockedNodeIds:configuration.blockedNodeIds,requiredTargetNodeIds:configuration.requiredTargetNodeIds,excludedTargetNodeIds:configuration.excludedTargetNodeIds,requiredNodeTypes:configuration.requiredNodeTypes,maximumTargetingResults:configuration.maximumTargetingResults,candidatePoolLimit:configuration.candidatePoolLimit??50,maximumSelectedTargets:configuration.maximumSelectedTargets??20,minimumTargetScore:configuration.minimumTargetScore??0,minimumConfidence:configuration.minimumConfidence??'low',allowKeystoneReoptimization:configuration.allowKeystoneReoptimization??false,analyzerContext:context}
  const specializationPointLimit=Math.max(0,Math.min(configuration.pointBudget!,Math.trunc(configuration.weaponSetPointBudget??0)))
  const input={...baseInput,pointBudget:specializationPointLimit&&weaponSetProfiles?configuration.pointBudget!-specializationPointLimit:configuration.pointBudget!}
  const started=performance.now(),pipelineStarted=performance.now(),fullResult=runner(input),pipelineDurationMs=performance.now()-pipelineStarted,projection=projectRealPassivePipelineResult(fullResult,detailMode),pipelineResult=projection.result,integrationDurationMs=performance.now()-started
  const stage=(id:string)=>fullResult.pipelineStages.find(value=>value.stageId===id)?.durationMs??0
  let weaponSetPlanning:WeaponSetPassivePlanningResult|undefined
  if(specializationPointLimit&&weaponSetProfiles&&pipelineResult){
    const sharedNodeIds=[...fullResult.allocatedNodeIds]
    const combine=(setResult:RealPassivePipelineResult):RealPassivePipelineResult=>({
      ...setResult,
      pointBudget:configuration.pointBudget!,
      selectedTargetIds:[...new Set([...fullResult.selectedTargetIds,...setResult.selectedTargetIds])],
      allocatedNodeIds:[...new Set([...fullResult.allocatedNodeIds,...setResult.allocatedNodeIds])].sort(),
      allocatedConnectionIds:[...new Set([...fullResult.allocatedConnectionIds,...setResult.allocatedConnectionIds])].sort(),
      usedPointBudget:fullResult.usedPointBudget+setResult.usedPointBudget,
      remainingPointBudget:Math.max(0,configuration.pointBudget!-fullResult.usedPointBudget-setResult.usedPointBudget)
    })
    const set1Full=combine(runner({...baseInput,requestId:`${baseInput.requestId}-set-1`,pointBudget:specializationPointLimit,buildProfile:weaponSetProfiles['set-1'],alreadyAllocatedNodeIds:sharedNodeIds}))
    const set2Full=combine(runner({...baseInput,requestId:`${baseInput.requestId}-set-2`,pointBudget:specializationPointLimit,buildProfile:weaponSetProfiles['set-2'],alreadyAllocatedNodeIds:sharedNodeIds}))
    weaponSetPlanning={specializationPointLimit,sharedPointBudget:input.pointBudget,shared:pipelineResult,set1:projectRealPassivePipelineResult(set1Full,detailMode).result,set2:projectRealPassivePipelineResult(set2Full,detailMode).result}
  }
  return{enabled:true,status:statusOf(fullResult),detailMode,pipelineResult,weaponSetPlanning,issues:[...fullResult.violations],projection:projection.diagnostics,performance:{integrationDurationMs,pipelineDurationMs,inputValidationMs:stage('validate-input'),graphPreparationMs:stage('prepare-graph'),targetingMs:stage('evaluate-targets'),planningMs:stage('create-passive-plan'),outputValidationMs:stage('validate-output'),projectionMs:projection.diagnostics.projectionDurationMs,serializationMs:projection.diagnostics.serializationDurationMs,resultSizeBytes:projection.diagnostics.projectedSizeBytes,graphReused:fullResult.graphDiagnostics.graphReused,graphBuildCount:fullResult.graphDiagnostics.graphBuildCount,targetingContextReused:fullResult.targetingDiagnostics.preparedContextReused,targetingContextBuildCount:fullResult.targetingDiagnostics.preparedContextBuildCount,evaluatedTargetCount:fullResult.targetingDiagnostics.evaluatedNodeCount,pathSearchCount:fullResult.planningDiagnostics.pathSearchCount}}
}
