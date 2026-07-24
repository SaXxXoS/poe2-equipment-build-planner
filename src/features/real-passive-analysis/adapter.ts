import type { CharacterConfiguration,EquipmentEntry,SkillSetup } from '../../domain'
import type { EngineRequest } from '../../engine/common/types'
import type { AnalyzePayload,InitializePayload } from '../../runtime/real-passive-worker'
import { clusterJewelDefinitions,jewelDefinitions,modifierDefinitions as allModifierDefinitions,skillDefinitions,supportDefinitions,treeClassRegistry,uniqueClusterJewelDefinitions } from '../../data'

export const REAL_PASSIVE_UI_SOURCE_VERSION='0.5.2'
export const REAL_PASSIVE_UI_TREE_IDENTITY='fnv1a32-bedf8404'
export const REAL_PASSIVE_UI_MAXIMUM_POINT_BUDGET=123
export type PassivePlanningMode='value-first'|'efficiency-first'|'balanced'
export interface PassiveAnalysisUiInput {character:CharacterConfiguration;equipment:EquipmentEntry[];setups:SkillSetup[];pointBudget:number;weaponSetPointBudget?:number;planningMode:PassivePlanningMode}
export interface PassiveAnalysisAdapterResult {signature:string;payload?:AnalyzePayload;errors:string[];classStartNodeId?:string}
const stable=(value:unknown):string=>JSON.stringify(value,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.entries(item).sort(([a],[b])=>a.localeCompare(b))):item)
const hash=(value:string)=>{let result=2166136261;for(let i=0;i<value.length;i++){result^=value.charCodeAt(i);result=Math.imul(result,16777619)}return`fnv1a32-${(result>>>0).toString(16).padStart(8,'0')}`}
export const createPassiveAnalysisInputSignature=(input:PassiveAnalysisUiInput)=>hash(stable(input))
export const realPassiveInitializePayload=():InitializePayload=>({sourceVersion:REAL_PASSIVE_UI_SOURCE_VERSION,expectedTreeIdentity:REAL_PASSIVE_UI_TREE_IDENTITY,expectedPipelineVersion:'5H-1.0.0',expectedContextFormatVersion:'1'})
export function buildRealPassiveWorkerRequest(input:PassiveAnalysisUiInput,requestId:string):PassiveAnalysisAdapterResult{
 const signature=createPassiveAnalysisInputSignature(input),errors:string[]=[],registry=treeClassRegistry.find(item=>item.classId===input.character.classId)
 if(!Number.isInteger(input.pointBudget)||input.pointBudget<1||input.pointBudget>REAL_PASSIVE_UI_MAXIMUM_POINT_BUDGET)errors.push('invalid-point-budget')
 if(!registry?.selectableInCurrentUi||!registry.classStartNodeId)errors.push('class-start-unavailable')
 if(!input.character.classId||input.character.level<1||input.character.level>100)errors.push('invalid-character-profile')
 const weaponSetPointBudget=input.weaponSetPointBudget??0
 if(!Number.isInteger(weaponSetPointBudget)||weaponSetPointBudget<0||weaponSetPointBudget>input.pointBudget)errors.push('invalid-weapon-set-point-budget')
 if(errors.length||!registry?.classStartNodeId)return{signature,errors}
 const referencedModifierIds=new Set(input.equipment.flatMap(entry=>entry.modifierValues.map(value=>value.modifierId)))
 const modifierDefinitions=allModifierDefinitions.filter(value=>referencedModifierIds.has(value.id))
 const selectedJewels=input.equipment.filter(entry=>entry.itemClassId==='Jewels'&&entry.itemDefinitionId).map(entry=>({slotId:entry.slotId,jewelId:entry.id,baseItemId:entry.itemDefinitionId,itemClassId:entry.itemClassId,itemLevel:entry.itemLevel,sourceVersion:'4.5.4.4.4',dataStatus:'partially-supported',modifiers:entry.modifierValues.map(value=>({modifierId:value.modifierId,tierId:value.tierId,statValues:value.statValues??[]}))}))
 const request:EngineRequest={input:{character:{...input.character},equipment:structuredClone(input.equipment),skillSetups:structuredClone(input.setups),selectedJewels,goalProfile:input.character.goalProfile},candidates:{skills:structuredClone(skillDefinitions),supports:structuredClone(supportDefinitions),passives:[],jewels:structuredClone([...jewelDefinitions,...clusterJewelDefinitions,...uniqueClusterJewelDefinitions]),uniques:[]}}
 return{signature,errors,classStartNodeId:registry.classStartNodeId,payload:{request,modifiers:structuredClone(modifierDefinitions),planning:{requestId,sourceVersion:REAL_PASSIVE_UI_SOURCE_VERSION,pointBudget:input.pointBudget,weaponSetPointBudget:input.weaponSetPointBudget,characterContext:{classId:String(registry.officialClassIndex),ascendancyId:registry.ascendancies.find(value=>value.ascendancyId===input.character.ascendancyId)?.officialExportId,characterLevel:input.character.level},planningMode:input.planningMode,targetProfile:input.character.goalProfile,requiredTargetNodeIds:[],blockedNodeIds:[],excludedTargetNodeIds:[],candidatePoolLimit:50,maximumSelectedTargets:20,minimumTargetScore:0,minimumConfidence:'low',allowKeystoneReoptimization:false}}}
}
