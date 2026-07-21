import { describe,expect,it } from 'vitest'
import { buildPassivePlanningCandidates } from './candidate-builder'
import { PASSIVE_PLANNING_CONFIG } from './config'
import { passivePlanningInput, planningRecommendation, planningTargetAnalysis } from './fixtures'
import { createPassivePlanningPathCache, planPassiveTargets } from './planner'

describe('Passive-Planning Kandidatenpool',()=>{
 it('schließt blockierte Empfehlungen aus',()=>{const bad=planningRecommendation('A',100,{eligibility:'blocked'});expect(buildPassivePlanningCandidates(passivePlanningInput({targetingResult:planningTargetAnalysis([bad])}))).toHaveLength(0)})
 it('prüft Mindestscore',()=>expect(buildPassivePlanningCandidates(passivePlanningInput({minimumTargetScore:1000}))).toHaveLength(0))
 it('prüft Mindest-Confidence',()=>{const low=planningRecommendation('A',100,{confidence:'low'});expect(buildPassivePlanningCandidates(passivePlanningInput({targetingResult:planningTargetAnalysis([low]),minimumConfidence:'high'}))).toHaveLength(0)})
 it('entfernt ausgeschlossene IDs',()=>expect(buildPassivePlanningCandidates(passivePlanningInput({excludedTargetNodeIds:['A']})).some(value=>value.recommendation.nodeId==='A')).toBe(false))
 it('begrenzt und sortiert den Pool deterministisch',()=>{const input=passivePlanningInput({candidatePoolLimit:2});expect(buildPassivePlanningCandidates(input)).toEqual(buildPassivePlanningCandidates(input));expect(buildPassivePlanningCandidates(input)).toHaveLength(2)})
 it('wählt Juwelsockel nicht regulär',()=>expect(buildPassivePlanningCandidates(passivePlanningInput()).some(value=>value.recommendation.nodeId==='J')).toBe(false))
 it('erlaubt einen Juwelsockel ausschließlich als explizites Pflichtziel',()=>expect(buildPassivePlanningCandidates(passivePlanningInput({requiredTargetNodeIds:['J']})).some(value=>value.recommendation.nodeId==='J')).toBe(true))
 it('schließt Start- und Aszendenzknoten aus',()=>{const ids=buildPassivePlanningCandidates(passivePlanningInput()).map(value=>value.recommendation.nodeId);expect(ids).not.toContain('S');expect(ids).not.toContain('ASC')})
 it('schließt Reoptimierung ohne Freigabe aus',()=>expect(buildPassivePlanningCandidates(passivePlanningInput()).some(value=>value.recommendation.nodeId==='K')).toBe(false))
 it('lässt kontrollierte Reoptimierung zu',()=>expect(buildPassivePlanningCandidates(passivePlanningInput({allowReoptimizationTargets:true})).some(value=>value.recommendation.nodeId==='K')).toBe(true))
})

describe('Pfade, Budget und Required-Ziele',()=>{
 it('verwendet den Pathfinder und liefert dessen echte Verbindung',()=>{const result=planPassiveTargets(passivePlanningInput({requiredTargetNodeIds:['A'],maximumSelectedTargets:1}));expect(result.selectedTargets[0].pathNodeIds).toEqual(['S','p1','A']);expect(result.pathSearchCount).toBeGreaterThan(0)})
 it('reduziert Kosten mit bereits belegten Knoten',()=>{const fresh=planPassiveTargets(passivePlanningInput({requiredTargetNodeIds:['A'],maximumSelectedTargets:1}));const reused=planPassiveTargets(passivePlanningInput({requiredTargetNodeIds:['A'],maximumSelectedTargets:1,alreadyAllocatedNodeIds:['p1']}));expect(reused.usedPointBudget).toBeLessThan(fresh.usedPointBudget)})
 it('verwendet gemeinsame Pfade wieder',()=>{const result=planPassiveTargets(passivePlanningInput({requiredTargetNodeIds:['A','C'],maximumSelectedTargets:2}));expect(result.selectedTargets[1].incrementalPointCost).toBe(1);expect(result.selectedTargets[1].reusedNodeIds).toContain('A')})
 it('überschreitet das Gesamtbudget nie',()=>{const result=planPassiveTargets(passivePlanningInput({pointBudget:3,maximumSelectedTargets:5}));expect(result.usedPointBudget).toBeLessThanOrEqual(3);expect(result.remainingPointBudget).toBe(3-result.usedPointBudget)})
 it('blockiert ein Pflichtziel über Budget',()=>expect(planPassiveTargets(passivePlanningInput({requiredTargetNodeIds:['B'],pointBudget:2})).status).toBe('required-target-over-budget'))
 it('blockiert ein unerreichbares Pflichtziel',()=>expect(planPassiveTargets(passivePlanningInput({requiredTargetNodeIds:['X']})).status).toBe('required-target-unreachable'))
 it('überspringt einen unerreichbaren optionalen Kandidaten',()=>expect(planPassiveTargets(passivePlanningInput()).selectedTargetIds).not.toContain('X'))
 it('cached identische Pathfinder-Anfragen über einen kontrolliert geteilten Cache',()=>{const pathCache=createPassivePlanningPathCache();const first=planPassiveTargets(passivePlanningInput({pathCache}));const second=planPassiveTargets(passivePlanningInput({pathCache}));expect(first.pathSearchCount).toBeGreaterThan(0);expect(second.pathCacheHitCount).toBeGreaterThan(0);expect(second.pathSearchCount).toBe(0)})
})

describe('Planungsmodi und iterative Auswahl',()=>{
 const two=()=>planningTargetAnalysis([planningRecommendation('A',90),planningRecommendation('B',120)])
 it('value-first bevorzugt höheren absoluten Nutzen',()=>expect(planPassiveTargets(passivePlanningInput({targetingResult:two(),planningMode:'value-first',maximumSelectedTargets:1})).selectedTargetIds[0]).toBe('B'))
 it('efficiency-first bevorzugt Nutzen pro Punkt',()=>expect(planPassiveTargets(passivePlanningInput({targetingResult:two(),planningMode:'efficiency-first',maximumSelectedTargets:1})).selectedTargetIds[0]).toBe('A'))
 it('balanced berücksichtigt Nutzen und Kosten deterministisch',()=>{const input=passivePlanningInput({targetingResult:two(),planningMode:'balanced',maximumSelectedTargets:1});expect(planPassiveTargets(input)).toEqual(planPassiveTargets(input));expect(planPassiveTargets(input).selectedTargetIds).toHaveLength(1)})
 it('erzeugt für gleiche Eingabe kontrolliert unterschiedliche Modusergebnisse',()=>{const value=planPassiveTargets(passivePlanningInput({targetingResult:two(),planningMode:'value-first',maximumSelectedTargets:1}));const efficient=planPassiveTargets(passivePlanningInput({targetingResult:two(),planningMode:'efficiency-first',maximumSelectedTargets:1}));expect(value.selectedTargetIds).not.toEqual(efficient.selectedTargetIds)})
 it('verwendet nur vorhandene Mapping- und Bosswerte',()=>{const map=planningRecommendation('A',50,{mappingScore:100,bossScore:0});const boss=planningRecommendation('R',50,{mappingScore:0,bossScore:100});expect(planPassiveTargets(passivePlanningInput({targetingResult:planningTargetAnalysis([map,boss]),targetProfile:'mapping',maximumSelectedTargets:1})).selectedTargetIds[0]).toBe('A')})
 it('plant Required-Ziele zuerst',()=>expect(planPassiveTargets(passivePlanningInput({requiredTargetNodeIds:['R'],maximumSelectedTargets:2})).selectionSteps[0].candidateNodeId).toBe('R'))
 it('aktualisiert Budget nach jedem Schritt',()=>{const steps=planPassiveTargets(passivePlanningInput({requiredTargetNodeIds:['A','C']})).selectionSteps;expect(steps.every(step=>step.budgetAfter===step.budgetBefore-step.incrementalPointCost)).toBe(true)})
 it('bewertet nach Pfadwiederverwendung neu',()=>{const close=planningRecommendation('C',85,{matchedTags:['projectile'],matchedProfileFields:['mechanics.projectile']});const far=planningRecommendation('B',120,{matchedTags:['lightning'],matchedProfileFields:['damageTypes.lightning']});const result=planPassiveTargets(passivePlanningInput({targetingResult:planningTargetAnalysis([planningRecommendation('A',90),close,far]),requiredTargetNodeIds:['A'],planningMode:'efficiency-first',maximumSelectedTargets:2}));expect(result.selectedTargetIds[1]).toBe('C')})
 it('wählt kein Ziel doppelt',()=>{const ids=planPassiveTargets(passivePlanningInput()).selectedTargetIds;expect(new Set(ids).size).toBe(ids.length)})
 it('reduziert redundanten Wert',()=>{const c=planningRecommendation('C',80,{redundantWithNodeIds:['A']});const result=planPassiveTargets(passivePlanningInput({targetingResult:planningTargetAnalysis([planningRecommendation('A',90),c]),requiredTargetNodeIds:['A'],maximumSelectedTargets:2}));expect(result.selectedTargets[1]?.valueComponents.redundancyPenalty??1).toBeGreaterThan(0)})
 it('reduziert Konflikte',()=>{const clean=planningRecommendation('A',80);const conflict=planningRecommendation('R',80,{conflictingTags:['spell']});const candidates=buildPassivePlanningCandidates(passivePlanningInput({targetingResult:planningTargetAnalysis([clean,conflict])}));expect(candidates.find(value=>value.recommendation.nodeId==='R')!.effectiveValue).toBeLessThan(candidates.find(value=>value.recommendation.nodeId==='A')!.effectiveValue)})
 it('wählt keinen Kandidaten mit negativem Endwert',()=>{const bad=planningRecommendation('R',1,{conflictingTags:['spell','minion','cold']});expect(planPassiveTargets(passivePlanningInput({targetingResult:planningTargetAnalysis([bad])})).status).toBe('no-eligible-targets')})
 it('hält maximale Zielzahl ein',()=>expect(planPassiveTargets(passivePlanningInput({maximumSelectedTargets:1})).selectedTargetIds).toHaveLength(1))
 it('hält zentral maximale Iterationen ein',()=>expect(planPassiveTargets(passivePlanningInput({maximumSelectedTargets:99,pointBudget:50})).planningIterationCount).toBeLessThanOrEqual(PASSIVE_PLANNING_CONFIG.limits.maximumIterations))
})

describe('Ergebnis und Grenzen',()=>{
 it('liefert eindeutige Knoten und Verbindungen',()=>{const result=planPassiveTargets(passivePlanningInput());expect(new Set(result.mergedNodeIds).size).toBe(result.mergedNodeIds.length);expect(new Set(result.mergedConnectionIds).size).toBe(result.mergedConnectionIds.length)})
 it('liefert Gründe und Heuristikgrenze',()=>{const result=planPassiveTargets(passivePlanningInput());expect(result.selectedTargets[0].reasons.length).toBeGreaterThan(0);expect(result.warnings).toContain('heuristic-plan-no-global-optimality');expect(result.optimalityClaim).toBe('heuristic')})
 it('liefert gültiges partielles Ergebnis bei knappem Budget',()=>{const result=planPassiveTargets(passivePlanningInput({pointBudget:2,maximumSelectedTargets:4}));expect(['partial','budget-exhausted']).toContain(result.status);expect(result.selectedTargetIds.length).toBeGreaterThan(0)})
 it('blockiert ungültige Eingabe',()=>expect(planPassiveTargets(passivePlanningInput({pointBudget:-1})).status).toBe('invalid-input'))
 it('warnt bei kontrolliert ausgewähltem Keystone',()=>{const key=planningRecommendation('K',200,{nodeType:'keystone',requiresReoptimization:true,confidence:'high',tradeOffs:['core-trade-off']});const result=planPassiveTargets(passivePlanningInput({targetingResult:planningTargetAnalysis([key]),allowReoptimizationTargets:true,maximumSelectedTargets:1}));expect(result.selectedTargets[0].keystone).toBe(true);expect(result.keystoneWarnings.length).toBeGreaterThan(0)})
 it('liefert no-eligible-targets ohne geeignete Kandidaten',()=>expect(planPassiveTargets(passivePlanningInput({minimumTargetScore:1000})).status).toBe('no-eligible-targets'))
})
