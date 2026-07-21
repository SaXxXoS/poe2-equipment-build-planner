import { describe,expect,it } from 'vitest'
import { ascendancyDefinitions,initialEquipment,skillSetups } from '../../data'
import { buildRealPassiveWorkerRequest,createPassiveAnalysisInputSignature,REAL_PASSIVE_UI_SOURCE_VERSION,type PassiveAnalysisUiInput } from './adapter'
const input=():PassiveAnalysisUiInput=>({character:{classId:'class-official-6',ascendancyId:ascendancyDefinitions.find(value=>value.classId==='class-official-6')?.id??'',level:70,goalProfile:'balanced'},equipment:structuredClone(initialEquipment),setups:structuredClone(skillSetups),pointBudget:20,planningMode:'balanced'})
describe('UI-zu-Passive-Worker-Adapter',()=>{
 it('erzeugt eine Compact-Anfrage mit explizitem Budget und offizieller Startzuordnung',()=>{const source=input(),copy=structuredClone(source),result=buildRealPassiveWorkerRequest(source,'request');expect(result.errors).toEqual([]);expect(result.classStartNodeId).toBe('marauder594');expect(result.payload?.planning).toMatchObject({requestId:'request',sourceVersion:REAL_PASSIVE_UI_SOURCE_VERSION,pointBudget:20,characterContext:{classId:'6'},requiredTargetNodeIds:[]});expect(result.payload?.planning.startNodeId).toBeUndefined();expect(result.payload?.request.realPassivePlanning).toBeUndefined();expect(source).toEqual(copy)})
 it('rät keinen Klassenstart',()=>{const source=input();source.character.classId='class-official-0';expect(buildRealPassiveWorkerRequest(source,'request').errors).toContain('class-start-unavailable')})
 it('erzwingt ganzzahliges technisches Budget',()=>{const source=input();source.pointBudget=1.5;expect(buildRealPassiveWorkerRequest(source,'request').errors).toContain('invalid-point-budget')})
 it('erzeugt deterministische fachliche Signaturen',()=>{const first=input(),second=input();expect(createPassiveAnalysisInputSignature(first)).toBe(createPassiveAnalysisInputSignature(second));second.pointBudget++;expect(createPassiveAnalysisInputSignature(first)).not.toBe(createPassiveAnalysisInputSignature(second))})
})
