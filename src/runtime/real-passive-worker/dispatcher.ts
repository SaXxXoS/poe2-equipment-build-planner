import { buildPassiveGraph } from '../../engine/passive-pathfinding/graph'
import { preparePassiveTargetingContext,passiveTargetingTreeIdentity,PASSIVE_TARGETING_CONTEXT_FORMAT_VERSION } from '../../engine/passive-targeting/prepared-context'
import { REAL_PASSIVE_PIPELINE_VERSION } from '../../engine/real-passive-pipeline/config'
import type { RealPassiveTree } from '../../engine/real-passive-pipeline/types'
import { analyzeBuild } from '../../engine/orchestration/analyze-build'
import type { BuildAnalysis } from '../../engine/common/types'
import type { ClientToWorkerMessage,RuntimeError,WorkerRuntimeState,WorkerToClientMessage } from './contracts'
import { REAL_PASSIVE_WORKER_PROTOCOL_VERSION,envelope } from './contracts'

export interface WorkerDispatcherDependencies {tree:RealPassiveTree;analyze?:typeof analyzeBuild;now?:()=>number}
export interface WorkerDispatcher {dispatch(message:ClientToWorkerMessage):Promise<void>;state():WorkerRuntimeState}
export function createRealPassiveWorkerDispatcher(dependencies:WorkerDispatcherDependencies,send:(message:WorkerToClientMessage)=>void):WorkerDispatcher{
 let state:WorkerRuntimeState='idle',graph:ReturnType<typeof buildPassiveGraph>|undefined,prepared:ReturnType<typeof preparePassiveTargetingContext>|undefined,identity:string|undefined,sourceVersion:string|undefined,activeRequestId:string|undefined,sequence=0,lastAnalysisKey:string|undefined,lastAnalysisResult:BuildAnalysis|undefined;const now=dependencies.now??(()=>performance.now()),analyze=dependencies.analyze??analyzeBuild
 const error=(requestId:string,code:string,stage:string,message:string,recoverable:boolean,details?:Record<string,string|number|boolean>):RuntimeError=>({code,severity:'error',source:code.startsWith('protocol')?'protocol':'worker',stage,requestId,message,recoverable,workerState:state,...(details?{details}:{})})
 const progress=(requestId:string,messageType:'initialization-progress'|'analysis-progress',stage:Parameters<typeof envelope>[2] extends never?never:string,started:number,summary?:Record<string,string|number|boolean>)=>send(envelope(requestId,messageType,{stage,sequence:++sequence,elapsedMs:now()-started,requestId,summary} as never))
 async function dispatch(message:ClientToWorkerMessage){
  if(message.protocolVersion!==REAL_PASSIVE_WORKER_PROTOCOL_VERSION){send(envelope(message.requestId,'error',error(message.requestId,'protocol-version-mismatch','protocol','Incompatible worker protocol version.',false)));return}
  if(state==='disposed'){send(envelope(message.requestId,'error',error(message.requestId,'worker-disposed','dispatch','Worker is disposed.',false)));return}
  if(message.messageType==='status'){send(envelope(message.requestId,'status',{state,activeRequestId}));return}
  if(message.messageType==='dispose'){state='disposed';graph=undefined;prepared=undefined;identity=undefined;sourceVersion=undefined;activeRequestId=undefined;lastAnalysisKey=undefined;lastAnalysisResult=undefined;send(envelope(message.requestId,'disposed',{state:'disposed'}));return}
  if(message.messageType==='cancel'){if(message.requestId!==activeRequestId){send(envelope(message.requestId,'error',error(message.requestId,'unknown-cancel-request','cancel','No matching active request.',true)));return}state='cancelling';send(envelope(message.requestId,'cancelled',{status:'cancelled',stage:'before-execution',reason:message.payload.reason,resultDiscarded:true,workerStillReady:Boolean(graph&&prepared),reinitializationRequired:false}));state='ready';activeRequestId=undefined;return}
  if(message.messageType==='initialize'){
   if(state==='initializing'||state==='analyzing'){send(envelope(message.requestId,'error',error(message.requestId,'worker-busy','initialize','Worker is busy.',true)));return}
   const started=now(),tree=dependencies.tree,nextIdentity=passiveTargetingTreeIdentity(tree.nodes)
   if(state==='ready'&&identity===nextIdentity&&sourceVersion===message.payload.sourceVersion){send(envelope(message.requestId,'ready',{state:'ready',reused:true,sourceVersion:sourceVersion!,treeIdentity:identity!,graphNodeCount:graph!.nodeCount,graphConnectionCount:graph!.connectionCount}));return}
   state='initializing';sequence=0
   try{progress(message.requestId,'initialization-progress','loading-tree',started,{nodeCount:tree.nodes.length});progress(message.requestId,'initialization-progress','validating-tree',started)
    if(tree.metadata.releaseTag!==message.payload.sourceVersion)throw new Error('source-version-mismatch');if(nextIdentity!==message.payload.expectedTreeIdentity)throw new Error('tree-identity-mismatch');if(message.payload.expectedPipelineVersion!==REAL_PASSIVE_PIPELINE_VERSION)throw new Error('pipeline-version-mismatch');if(message.payload.expectedContextFormatVersion!==PASSIVE_TARGETING_CONTEXT_FORMAT_VERSION)throw new Error('context-format-version-mismatch')
    progress(message.requestId,'initialization-progress','building-graph',started);const nextGraph=buildPassiveGraph(tree as never);progress(message.requestId,'initialization-progress','preparing-targeting-context',started);const nextPrepared=preparePassiveTargetingContext(tree.nodes,message.payload.sourceVersion)
    graph=nextGraph;prepared=nextPrepared;identity=nextIdentity;sourceVersion=message.payload.sourceVersion;lastAnalysisKey=undefined;lastAnalysisResult=undefined;state='ready';progress(message.requestId,'initialization-progress','ready',started);send(envelope(message.requestId,'ready',{state:'ready',reused:false,sourceVersion,treeIdentity:identity,graphNodeCount:graph.nodeCount,graphConnectionCount:graph.connectionCount}))
   }catch(value){state='failed';graph=undefined;prepared=undefined;const code=value instanceof Error?value.message:'initialization-failed';send(envelope(message.requestId,'error',error(message.requestId,code,'initialize','Worker initialization failed.',true,code==='tree-identity-mismatch'?{expectedTreeIdentity:message.payload.expectedTreeIdentity,actualTreeIdentity:nextIdentity}:undefined)))}return
  }
  if(message.messageType==='analyze'){
   if(state!=='ready'||!graph||!prepared||!sourceVersion){send(envelope(message.requestId,'error',error(message.requestId,'worker-not-ready','analyze','Worker must be ready before analysis.',true)));return}
   if(activeRequestId){send(envelope(message.requestId,'error',error(message.requestId,'analysis-already-active','analyze','Only one analysis may run at a time.',true)));return}
   const started=now();state='analyzing';activeRequestId=message.requestId;sequence=0
   try{progress(message.requestId,'analysis-progress','validating-request',started);if(message.payload.planning.pointBudget===undefined)throw new Error('missing-point-budget');progress(message.requestId,'analysis-progress','running-orchestrator',started)
    const analysisKey=JSON.stringify(message.payload);if(lastAnalysisKey===analysisKey&&lastAnalysisResult){state='ready';activeRequestId=undefined;progress(message.requestId,'analysis-progress','completed',started,{cacheHit:true,orchestratorCalls:0,graphBuildCount:0,targetingContextBuildCount:0});send(envelope(message.requestId,'result',{result:lastAnalysisResult,state:'ready'}));return}
    const result=analyze({...message.payload.request,realPassivePlanning:{...message.payload.planning,enabled:true,requestId:message.requestId,passiveTree:dependencies.tree,sourceVersion,passiveGraph:graph,passiveGraphSourceVersion:sourceVersion,preparedTargetingContext:prepared,resultDetailMode:'compact'}},{engineVersion:'5J-worker',fixtureMode:true},message.payload.modifiers??[])
    progress(message.requestId,'analysis-progress','validating-result',started);if(result.realPassivePlanning?.detailMode!=='compact'||result.realPassivePlanning.pipelineResult?.targetingResult)throw new Error('non-compact-worker-result');lastAnalysisKey=analysisKey;lastAnalysisResult=result;state='ready';activeRequestId=undefined;progress(message.requestId,'analysis-progress','completed',started);send(envelope(message.requestId,'result',{result,state:'ready'}))
   }catch(value){state='ready';activeRequestId=undefined;send(envelope(message.requestId,'error',error(message.requestId,value instanceof Error?value.message:'analysis-failed','analyze','Worker analysis failed.',true)))}return
  }
  const unknown=message as {requestId:string};send(envelope(unknown.requestId,'error',error(unknown.requestId,'unknown-message-type','protocol','Unknown worker message type.',true)))
 }
 return{dispatch,state:()=>state}
}
