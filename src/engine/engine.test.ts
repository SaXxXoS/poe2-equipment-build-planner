import { describe, expect, it } from 'vitest'
import { analyzeBuild, equipmentAnalyzer, jewelAnalyzer, passiveAnalyzer, skillAnalyzer, supportAnalyzer, uniqueAnalyzer, type AnalyzerContext } from '.'
import { engineCandidatesFixture, engineModifierFixtures, fixtureA, fixtureB, fixtureC } from './fixtures'
const context = (): AnalyzerContext => ({ engineVersion: 'test', fixtureMode: true })
const resultA = () => analyzeBuild(fixtureA, context(), engineModifierFixtures)

describe('deterministische Platzhalter-Build-Engine', () => {
  it('Equipment Analyzer erzeugt erwartete Profilwerte', () => { const result = equipmentAnalyzer.analyze(fixtureA, context(), engineModifierFixtures); expect(result.value.buildProfile.goals.mappingWeight).toBe(80) })
  it('Blitzmodifier erhöht lightning-Affinität', () => expect(resultA().buildProfile.damageTypes.lightning).toBeGreaterThan(0))
  it('Angriffsgeschwindigkeit erhöht attack-Affinität', () => expect(resultA().buildProfile.speed.attackSpeedAffinity).toBeGreaterThan(0))
  it('Zaubergeschwindigkeit erhöht spell-Affinität', () => expect(analyzeBuild(fixtureB, context(), engineModifierFixtures).buildProfile.speed.castSpeedAffinity).toBeGreaterThan(0))
  it('Skill Analyzer bewertet passende Tags höher', () => { const result = resultA(); expect(result.skillRecommendations[0].skillId).toBe('fixture-main') })
  it('inkompatibler Skill erzeugt ConstraintViolation', () => expect(resultA().skillRecommendations.find(item => item.skillId === 'fixture-invalid')?.violations[0].blocking).toBe(true))
  it('kompatibler Support erhält höhere Bewertung', () => { const result = resultA().supportRecommendations; expect(result[0].supportId).toBe('fixture-support-compatible') })
  it('inkompatibler Support wird blockiert', () => expect(resultA().supportRecommendations.find(item => item.supportId === 'fixture-support-incompatible')?.valid).toBe(false))
  it('Passive Score berücksichtigt pathCost', () => { const result = resultA().passiveRecommendations; expect(result.find(item => item.recommendationId === 'fixture-passive-cheap')!.totalScore).toBeGreaterThan(result.find(item => item.recommendationId === 'fixture-passive-expensive')!.totalScore) })
  it('Jewel Analyzer unterscheidet Juweltypen', () => expect(new Set(resultA().jewelRecommendations.map(item => item.jewelType)).size).toBe(3))
  it('Unique Analyzer berücksichtigt Aszendenz-Synergie', () => expect(resultA().uniqueRecommendations.find(item => item.uniqueId === 'fixture-unique-synergy')!.ascendancySynergyScore).toBe(20))
  it('Rotation Generator erzeugt eine eindeutige Reihenfolge', () => expect(resultA().mappingRotation.steps.map(item => item.order)).toEqual(resultA().mappingRotation.steps.map((_, index) => index + 1)))
  it('RotationAnalysis wird strukturell vom Orchestrator verwendet', () => expect(resultA().rotationAnalysis.mappingRotation).toEqual(resultA().mappingRotation))
  it('Explanation Generator wird strukturell vom Orchestrator verwendet', () => { const result = resultA().explanations; expect(result.allEntries.length).toBeGreaterThan(0); expect(result.traces).toHaveLength(result.allEntries.length) })
  it('Orchestrator ruft Module in korrekter Reihenfolge auf', () => expect(resultA().moduleTrace).toEqual(['equipment', 'skills', 'supports', 'passives', 'jewels', 'uniques', 'rotations', 'explanations']))
  it('gleiche Eingaben liefern gleiche Ausgabe', () => expect(resultA()).toEqual(resultA()))
  it('gleiche Scores werden stabil nach ID sortiert', () => { const profile = resultA().buildProfile; const candidates = [engineCandidatesFixture.skills[1], { ...engineCandidatesFixture.skills[1], id: 'fixture-a' }]; expect(skillAnalyzer.analyze(profile, candidates, context()).map(item => item.skillId)).toEqual(['fixture-a', 'fixture-spell']) })
  it('widersprüchliches Fixture erzeugt Warnungen', () => { const result = analyzeBuild(fixtureC, context(), engineModifierFixtures); expect(result.warnings.map(item => item.code)).toEqual(expect.arrayContaining(['mixed-attack-spell', 'unknown-modifier'])) })
  it('BuildAnalysis ist als placeholder gekennzeichnet', () => expect(resultA().status).toBe('placeholder'))
  it('alle Analyzer-Schnittstellen sind direkt aufrufbar', () => { const profile = resultA().buildProfile; expect(passiveAnalyzer.analyze(profile, [], context())).toEqual([]); expect(jewelAnalyzer.analyze(profile, [], context())).toEqual([]); expect(uniqueAnalyzer.analyze(profile, fixtureA.input, [], context())).toEqual([]); expect(supportAnalyzer.analyze(engineCandidatesFixture.skills[0], profile, [], context())).toEqual([]) })
})
