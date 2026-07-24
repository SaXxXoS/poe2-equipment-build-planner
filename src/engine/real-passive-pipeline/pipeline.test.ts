import { describe,expect,it } from 'vitest'
import officialTree from '../../../generated/poe2-tree/tree.json'
import { buildPassiveGraph } from '../passive-pathfinding/graph'
import type { PassivePathSource } from '../passive-pathfinding/types'
import { evaluatePassiveTargets } from '../passive-targeting/evaluator'
import { deterministicHash } from './diagnostics'
import { REAL_PASSIVE_FIXTURE_GRAPH,REAL_PASSIVE_FIXTURE_TREE,REAL_PASSIVE_PIPELINE_PROFILES,realPassivePipelineInput } from './fixtures'
import { runRealPassivePipeline } from './pipeline'
import { resolveRealPassiveStartNode } from './start-node-resolver'
import type { RealPassiveTree } from './types'

describe('Pipeline-Eingabe und Startknoten',()=>{
 it('blockiert fehlendes BuildProfile',()=>expect(runRealPassivePipeline(realPassivePipelineInput({buildProfile:undefined as never})).status).toBe('invalid-input'))
 it('blockiert ungültiges Budget',()=>expect(runRealPassivePipeline(realPassivePipelineInput({pointBudget:-1})).status).toBe('invalid-input'))
 it('blockiert Budget über Sicherheitslimit',()=>expect(runRealPassivePipeline(realPassivePipelineInput({pointBudget:124})).violations.map(value=>value.code)).toContain('point-budget-limit-exceeded'))
 it('blockiert falsche Quellversion gesondert',()=>expect(runRealPassivePipeline(realPassivePipelineInput({sourceVersion:'other'})).status).toBe('source-version-mismatch'))
 it('blockiert ungültigen Planning Mode',()=>expect(runRealPassivePipeline(realPassivePipelineInput({planningMode:'random' as never})).violations.map(value=>value.code)).toContain('invalid-planning-mode'))
 it('blockiert ungültiges Target Profile',()=>expect(runRealPassivePipeline(realPassivePipelineInput({targetProfile:'speed' as never})).violations.map(value=>value.code)).toContain('invalid-target-profile'))
 it('verwendet expliziten gültigen Start',()=>expect(resolveRealPassiveStartNode(realPassivePipelineInput({startNodeId:'S'}))).toMatchObject({resolvedStartNodeId:'S',resolutionSource:'explicit'}))
 it('blockiert expliziten fremden Klassenstart',()=>expect(resolveRealPassiveStartNode(realPassivePipelineInput({startNodeId:'S',characterClassId:'2'})).violations).toContain('explicit-start-class-mismatch'))
 it('löst offiziellen Klassenstart ohne Vermutung auf',()=>expect(resolveRealPassiveStartNode(realPassivePipelineInput())).toMatchObject({resolvedStartNodeId:'S',resolutionSource:'official-class-mapping'}))
 it('erfindet für unbekannte Klasse keinen Start',()=>expect(runRealPassivePipeline(realPassivePipelineInput({characterClassId:'unknown'})).status).toBe('start-node-unresolved'))
 it('blockiert mehrdeutige Klassenzuordnung',()=>{const duplicate={...REAL_PASSIVE_FIXTURE_TREE.nodes.find(value=>value.id==='S')!,id:'S2'};const tree={...REAL_PASSIVE_FIXTURE_TREE,nodes:[...REAL_PASSIVE_FIXTURE_TREE.nodes,duplicate]};expect(resolveRealPassiveStartNode(realPassivePipelineInput({passiveTree:tree})).violations).toContain('ambiguous-class-start')})
})

describe('Graph, Targeting und Planung',()=>{
 it('verwendet vorbereiteten Graph ohne Neuaufbau',()=>expect(runRealPassivePipeline(realPassivePipelineInput({passiveGraph:REAL_PASSIVE_FIXTURE_GRAPH})).graphDiagnostics).toMatchObject({graphSource:'provided',graphReused:true,graphBuildCount:0}))
 it('baut Graph ohne vorbereitete Eingabe genau einmal',()=>expect(runRealPassivePipeline(realPassivePipelineInput()).graphDiagnostics).toMatchObject({graphSource:'built',graphBuildCount:1}))
 it('ruft bestehendes Targeting mit allen Knoten auf',()=>expect(runRealPassivePipeline(realPassivePipelineInput()).targetingDiagnostics.evaluatedNodeCount).toBe(REAL_PASSIVE_FIXTURE_TREE.nodes.length))
 it('gibt Coverage und unresolved Zeilen weiter',()=>{const result=runRealPassivePipeline(realPassivePipelineInput());expect(result.targetingDiagnostics.classificationCoveragePercent).toBe(result.targetingResult?.coverage.classificationCoveragePercent);expect(result.targetingDiagnostics.unresolvedStatLineCount).toBe(result.targetingResult?.coverage.unresolvedStatLineCount)})
 it('verändert ScoreReasons nicht',()=>{const input=realPassivePipelineInput();const direct=evaluatePassiveTargets({buildProfile:input.buildProfile,characterClassId:input.characterClassId,characterLevel:input.characterLevel,targetProfile:input.targetProfile,passiveNodes:input.passiveTree.nodes,analyzerContext:input.analyzerContext,sourceVersion:input.sourceVersion,minimumConfidence:input.minimumConfidence});expect(runRealPassivePipeline(input).targetingResult?.allCandidates.map(value=>value.reasons)).toEqual(direct.allCandidates.map(value=>value.reasons))})
 it('beachtet ausgeschlossene IDs',()=>expect(runRealPassivePipeline(realPassivePipelineInput({excludedTargetNodeIds:['L']})).targetingResult?.allCandidates.find(value=>value.nodeId==='L')?.eligibility).toBe('blocked'))
 it('übergibt das ausdrückliche Budget an den Planner',()=>{const result=runRealPassivePipeline(realPassivePipelineInput({pointBudget:3}));expect(result.planningResult?.pointBudget).toBe(3);expect(result.usedPointBudget).toBeLessThanOrEqual(3)})
 it('verfolgt erfolgreich geplantes Required Target',()=>{const result=runRealPassivePipeline(realPassivePipelineInput({requiredTargetNodeIds:['L']}));expect(result.requiredTargetDiagnostics[0]).toMatchObject({nodeId:'L',selected:true,pathStatus:'connected'})})
 it('meldet Required Target über Budget',()=>{const result=runRealPassivePipeline(realPassivePipelineInput({requiredTargetNodeIds:['L'],pointBudget:1}));expect(result.status).toBe('required-target-failed');expect(result.requiredTargetDiagnostics[0].pathStatus).toBe('over-budget')})
 it('gibt Pfadsuch- und Cachediagnose weiter',()=>{const result=runRealPassivePipeline(realPassivePipelineInput());expect(result.planningDiagnostics.pathSearchCount).toBe(result.planningResult?.pathSearchCount);expect(result.planningDiagnostics.pathCacheHitCount).toBe(result.planningResult?.pathCacheHitCount)})
 it('übernimmt die heuristische Optimalitätsgrenze',()=>expect(runRealPassivePipeline(realPassivePipelineInput()).optimalityClaim).toBe('heuristic'))
 it('nimmt keine Aszendenzknoten in den Normalplan auf',()=>{const result=runRealPassivePipeline(realPassivePipelineInput({ascendancyId:'foreign'}));expect(result.allocatedNodeIds).not.toEqual(expect.arrayContaining(['AS','AX']))})
 it('liefert deterministische Modusergebnisse',()=>{for(const planningMode of ['value-first','efficiency-first','balanced'] as const){const input=realPassivePipelineInput({planningMode});expect(runRealPassivePipeline(input).selectedTargetIds).toEqual(runRealPassivePipeline(input).selectedTargetIds)}})
})

describe('Ausgabe, Diagnose und Fixtures',()=>{
 it('erzeugt einen zusammenhängenden eindeutigen Teilbaum',()=>{const result=runRealPassivePipeline(realPassivePipelineInput());expect(result.violations.map(value=>value.code)).not.toContain('allocated-subtree-disconnected');expect(new Set(result.allocatedNodeIds).size).toBe(result.allocatedNodeIds.length);expect(new Set(result.allocatedConnectionIds).size).toBe(result.allocatedConnectionIds.length)})
 it('führt alle acht Stufen in kontrollierter Reihenfolge',()=>expect(runRealPassivePipeline(realPassivePipelineInput()).pipelineStages.map(value=>value.stageId)).toEqual(['validate-input','resolve-start-node','prepare-graph','evaluate-targets','prepare-planning-input','create-passive-plan','validate-output','complete']))
 it('erzeugt stabilen deterministischen Hash',()=>{const input=realPassivePipelineInput();expect(runRealPassivePipeline(input).pipelineDiagnostics.deterministicResultHash).toBe(runRealPassivePipeline(input).pipelineDiagnostics.deterministicResultHash)})
 it('schließt Laufzeitwerte aus dem Hashverfahren aus',()=>{const a={result:'same',stages:[{durationMs:1}]},b={result:'same',stages:[{durationMs:999}]};expect(deterministicHash({...a,stages:undefined})).toBe(deterministicHash({...b,stages:undefined}))})
 it('Lightning Projectile, Cold Spell und Defence erzeugen unterschiedliche Zielpläne',()=>{const lightning=runRealPassivePipeline(realPassivePipelineInput({buildProfile:REAL_PASSIVE_PIPELINE_PROFILES.lightningProjectileBalanced,planningMode:'value-first'}));const cold=runRealPassivePipeline(realPassivePipelineInput({buildProfile:REAL_PASSIVE_PIPELINE_PROFILES.coldSpellMapping,targetProfile:'mapping',planningMode:'value-first'}));const defence=runRealPassivePipeline(realPassivePipelineInput({buildProfile:REAL_PASSIVE_PIPELINE_PROFILES.defensiveLifeArmour,planningMode:'value-first'}));expect(new Set([JSON.stringify(lightning.selectedTargetIds),JSON.stringify(cold.selectedTargetIds),JSON.stringify(defence.selectedTargetIds)]).size).toBeGreaterThan(1)})
 it('liefert no-eligible-targets kontrolliert',()=>expect(runRealPassivePipeline(realPassivePipelineInput({minimumTargetScore:100000})).status).toBe('no-eligible-targets'))
 it('behält Quellversionen konsistent',()=>{const result=runRealPassivePipeline(realPassivePipelineInput());expect(result.targetingResult?.sourceVersion).toBe('fixture');expect(result.planningResult?.sourceVersion).toBe('fixture')})
})

describe('offizieller Baum Release 0.5.2',()=>{
 const tree=officialTree as unknown as RealPassiveTree
 const graph=buildPassiveGraph(officialTree as unknown as PassivePathSource)
 const input=realPassivePipelineInput({requestId:'official-pipeline',sourceVersion:'0.5.2',passiveTree:tree,passiveGraph:graph,characterClassId:'0',buildProfile:REAL_PASSIVE_PIPELINE_PROFILES.lightningProjectileBalanced,pointBudget:10,candidatePoolLimit:10,maximumSelectedTargets:1,maximumTargetingResults:10})
 it('verarbeitet 5.150 Knoten und 6.067 Verbindungen mit offiziellem Klassenstart',()=>{const result=runRealPassivePipeline(input);expect(result.graphDiagnostics).toMatchObject({graphNodeCount:5150,graphConnectionCount:6067,graphBuildCount:0});expect(result.resolvedStartNodeId).toBe('47175');expect(result.targetingDiagnostics.evaluatedNodeCount).toBe(5150);expect(result.usedPointBudget).toBeLessThanOrEqual(10)},30000)
 it('vergibt ein vollständiges normales Endgame-Budget, wenn genügend belegte Ziele erreichbar sind',()=>{const result=runRealPassivePipeline({...input,requestId:'official-full-budget',pointBudget:121,candidatePoolLimit:150,maximumSelectedTargets:121,maximumTargetingResults:500});expect(result.usedPointBudget).toBe(121);expect(result.remainingPointBudget).toBe(0);expect(result.allocatedNodeIds.length).toBeGreaterThan(100)},60000)
})
