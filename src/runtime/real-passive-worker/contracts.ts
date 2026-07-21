import type { ModifierDefinition } from '../../domain'
import type { BuildAnalysis,EngineRequest } from '../../engine/common/types'
import type { RealPassivePlanningConfiguration } from '../../engine/orchestration/real-passive-integration'

export const REAL_PASSIVE_WORKER_PROTOCOL_VERSION='1.0.0' as const
export type WorkerRuntimeState='idle'|'initializing'|'ready'|'analyzing'|'cancelling'|'failed'|'disposed'
export type ClientRuntimeState='uninitialized'|'initializing'|'ready'|'analyzing'|'cancelling'|'completed'|'cancelled'|'failed'|'disposed'
export type InitializationStage='loading-tree'|'validating-tree'|'building-graph'|'preparing-targeting-context'|'ready'
export type AnalysisStage='validating-request'|'running-orchestrator'|'validating-result'|'completed'
export interface RuntimeError {code:string;severity:'warning'|'error';source:'client'|'worker'|'protocol'|'engine';stage:string;requestId?:string;nodeId?:string;message:string;details?:Record<string,string|number|boolean>;recoverable:boolean;workerState:WorkerRuntimeState}
export interface InitializePayload {sourceVersion:string;expectedTreeIdentity:string;expectedPipelineVersion:string;expectedContextFormatVersion:string}
export type WorkerPlanningConfiguration=Omit<RealPassivePlanningConfiguration,'enabled'|'passiveTree'|'passiveGraph'|'passiveGraphSourceVersion'|'preparedTargetingContext'|'resultDetailMode'>
export interface AnalyzePayload {request:EngineRequest;planning:WorkerPlanningConfiguration;modifiers?:ModifierDefinition[]}
export interface WorkerEnvelope<T extends string,P>{protocolVersion:string;requestId:string;messageType:T;payload:P}
export type ClientToWorkerMessage=WorkerEnvelope<'initialize',InitializePayload>|WorkerEnvelope<'analyze',AnalyzePayload>|WorkerEnvelope<'cancel',{reason?:string}>|WorkerEnvelope<'dispose',Record<string,never>>|WorkerEnvelope<'status',Record<string,never>>
export type WorkerProgress={stage:InitializationStage|AnalysisStage;sequence:number;elapsedMs:number;requestId:string;summary?:Record<string,string|number|boolean>}
export type WorkerToClientMessage=WorkerEnvelope<'initialization-progress',WorkerProgress>|WorkerEnvelope<'ready',{state:'ready';reused:boolean;sourceVersion:string;treeIdentity:string;graphNodeCount:number;graphConnectionCount:number}>|WorkerEnvelope<'analysis-progress',WorkerProgress>|WorkerEnvelope<'result',{result:BuildAnalysis;state:'ready'}>|WorkerEnvelope<'cancelled',{status:'cancelled';stage:string;reason?:string;resultDiscarded:true;workerStillReady:boolean;reinitializationRequired:boolean}>|WorkerEnvelope<'error',RuntimeError>|WorkerEnvelope<'disposed',{state:'disposed'}>|WorkerEnvelope<'status',{state:WorkerRuntimeState;activeRequestId?:string}>
export interface RealPassiveWorkerClientState {status:ClientRuntimeState;progress?:WorkerProgress;currentRequestId?:string;initialization?:Extract<WorkerToClientMessage,{messageType:'ready'}>['payload'];result?:BuildAnalysis;error?:RuntimeError;reusable:boolean}
export const envelope=<T extends WorkerToClientMessage['messageType']>(requestId:string,messageType:T,payload:Extract<WorkerToClientMessage,{messageType:T}>['payload']):WorkerToClientMessage=>({protocolVersion:REAL_PASSIVE_WORKER_PROTOCOL_VERSION,requestId,messageType,payload} as WorkerToClientMessage)
