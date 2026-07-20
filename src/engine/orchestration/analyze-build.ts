import type { ModifierDefinition } from '../../domain'
import { equipmentAnalyzer } from '../equipment/analyzer'
import { skillAnalyzer } from '../skills/analyzer'
import { supportAnalyzer } from '../supports/analyzer'
import { passiveAnalyzer } from '../passives/analyzer'
import { jewelAnalyzer } from '../jewels/analyzer'
import { uniqueAnalyzer } from '../uniques/analyzer'
import { rotationGenerator } from '../rotations/generator'
import { explanationGenerator } from '../explanations/generator'
import type { AnalyzerContext, BuildAnalysis, EngineRequest } from '../common/types'
export const ENGINE_VERSION = '0.1.0-placeholder'
export function analyzeBuild(request: EngineRequest, context: AnalyzerContext = { engineVersion: ENGINE_VERSION, fixtureMode: true }, modifiers: ModifierDefinition[] = []): BuildAnalysis {
  const moduleTrace: string[] = []; const runtime = { ...context, trace: moduleTrace }; const equipment = equipmentAnalyzer.analyze(request, runtime, modifiers)
  const skillAnalysis = skillAnalyzer.analyzeRanked(equipment.value.buildProfile, request.candidates.skills, runtime, { equipmentAnalysis: equipment.value.equipmentAnalysis, character: request.input.character, goalProfile: request.input.goalProfile, availableWeaponTypes: ['any'] }); const skills = skillAnalysis.allCandidates; const selectedRecommendation = skills.find(item => item.valid); const selectedSkill = request.candidates.skills.find(item => item.id === selectedRecommendation?.skillId) ?? request.candidates.skills[0]
  const supportAnalysis = selectedSkill ? supportAnalyzer.analyzeRanked(selectedSkill, equipment.value.buildProfile, request.candidates.supports, runtime, { skillRecommendation: selectedRecommendation, equipmentAnalysis: equipment.value.equipmentAnalysis, character: request.input.character, goalProfile: request.input.goalProfile, availableWeaponTypes: ['any'] }) : { allCandidates: [], eligibleCandidates: [], blockedCandidates: [], topCandidates: [], topDamageSupports: [], topMappingSupports: [], topBossSupports: [], topUtilitySupports: [], topDefensiveSupports: [], status: 'placeholder' as const, analyzerVersion: 'none' }; const supports = supportAnalysis.allCandidates
  const selectedSupports = supportAnalysis.topCandidates; const passiveAnalysis = passiveAnalyzer.analyzeRanked(equipment.value.buildProfile, request.candidates.passives, runtime, { equipmentAnalysis: equipment.value.equipmentAnalysis, skillRecommendation: selectedRecommendation, supportRecommendations: selectedSupports, character: request.input.character, goalProfile: request.input.goalProfile }); const passives = passiveAnalysis.allCandidates
  const jewels = jewelAnalyzer.analyze(equipment.value.buildProfile, request.candidates.jewels, runtime); const uniques = uniqueAnalyzer.analyze(equipment.value.buildProfile, request.input, request.candidates.uniques, runtime); const rotations = rotationGenerator.generate(runtime); const allRecommendations = [...skills, ...supports, ...passives, ...jewels, ...uniques]
  const warnings = [...equipment.violations, ...skillAnalysis.allCandidates.flatMap(item => item.warnings), ...supportAnalysis.allCandidates.flatMap(item => item.warnings), ...passiveAnalysis.allCandidates.flatMap(item => item.warnings), ...allRecommendations.flatMap(item => item.violations)]; const explanations = explanationGenerator.generate([...equipment.reasons, ...allRecommendations.flatMap(item => item.reasons)], warnings, runtime)
  return { equipmentAnalysis: equipment.value.equipmentAnalysis, buildProfile: equipment.value.buildProfile, skillAnalysis, skillRecommendations: skills, supportAnalysis, supportRecommendations: supports, passiveAnalysis, passiveRecommendations: passives, jewelRecommendations: jewels, uniqueRecommendations: uniques, ...rotations, explanations, warnings, status: 'placeholder', engineVersion: context.engineVersion, moduleTrace }
}
