import { describe, expect, it } from 'vitest'
import { analyzeBuild } from '../orchestration/analyze-build'
import type { AnalyzerContext, ExplanationGeneratorInput, ScoreReason } from '../common/types'
import { engineModifierFixtures, fixtureA, fixtureB, fixtureC } from '../fixtures'
import { explanationGenerator } from './generator'
import { EXPLANATION_GENERATOR_VERSION, LIMITATION_CODE } from './config'
import { EXPLANATION_TEMPLATES } from './templates'
import { syntheticExplanationFixtureScenarios } from './fixtures'

const context = (): AnalyzerContext => ({ engineVersion: 'test', fixtureMode: true })
const buildInput = (fixture = fixtureA): ExplanationGeneratorInput => {
  const result = analyzeBuild(fixture, context(), engineModifierFixtures)
  const allRecommendations = [...result.skillRecommendations, ...result.supportRecommendations, ...result.passiveRecommendations, ...result.jewelRecommendations, ...result.uniqueRecommendations]
  const definitions = [...fixture.candidates.skills, ...fixture.candidates.supports, ...fixture.candidates.jewels, ...fixture.candidates.uniques]
  return { reasons: [...result.equipmentAnalysis.reasons, ...allRecommendations.flatMap(item => item.reasons)], violations: result.warnings, equipmentAnalysis: result.equipmentAnalysis, skillAnalysis: result.skillAnalysis, supportAnalysis: result.supportAnalysis, passiveAnalysis: result.passiveAnalysis, jewelAnalysis: result.jewelAnalysis, uniqueAnalysis: result.uniqueAnalysis, rotationAnalysis: result.rotationAnalysis, displayNames: Object.fromEntries(definitions.map(item => [item.id, item.displayNameDe])) }
}
const generate = (fixture = fixtureA) => explanationGenerator.generate(buildInput(fixture), context())
const customReason = (code: string, sourceType: ScoreReason['sourceType'] = 'skill', sourceId = 'fixture-main', polarity: ScoreReason['polarity'] = 'positive'): ScoreReason => ({ code, category: 'damage', messageKey: code, impact: polarity === 'negative' ? -10 : 10, polarity, sourceType, sourceId, affectedTags: ['lightning'] })

describe('regelbasierter Explanation Generator', () => {
  it('besitzt elf synthetische Fixture-Szenarien', () => expect(syntheticExplanationFixtureScenarios).toHaveLength(11))
  it('jede Erklärung besitzt einen Trace', () => { const result = generate(); expect(result.traces).toHaveLength(result.allEntries.length); expect(result.allEntries.every(entry => result.traces.some(trace => trace.explanationId === entry.explanationId))).toBe(true) })
  it('jede Erklärung verweist auf vorhandene strukturierte Gründe', () => expect(generate().allEntries.every(item => item.sourceReasonCodes.length > 0)).toBe(true))
  it('meldet unbekannte ReasonCodes', () => { const input = buildInput(); input.reasons = [customReason('vollkommen-unbekannt')]; expect(explanationGenerator.generate(input, context()).unresolvedReasonCodes).toContain('vollkommen-unbekannt') })
  it('meldet fehlende Anzeigenamen und verwendet die ID', () => { const input = buildInput(); input.reasons = [customReason('damage-lightning', 'skill', 'fehlender-name')]; input.displayNames = {}; const result = explanationGenerator.generate(input, context()); expect(result.missingDisplayNames).toContain('fehlender-name'); expect(result.allEntries.some(item => item.body.includes('fehlender-name'))).toBe(true) })
  it('ordnet blockierende Erklärungen zuerst', () => { const result = generate(fixtureC); const blocking = result.allEntries.findIndex(item => item.tone === 'blocking'); const normal = result.allEntries.findIndex(item => item.tone !== 'blocking'); expect(blocking).toBeGreaterThanOrEqual(0); expect(blocking).toBeLessThan(normal) })
  it('erklärt Equipment-Synergie', () => expect(generate().sections.some(item => item.section === 'equipment')).toBe(true))
  it('erklärt profileClarity über Confidence', () => expect(generate().sections.some(item => item.section === 'confidence')).toBe(true))
  it('erklärt conflictLevel als Warnung', () => expect(generate(fixtureC).warningEntries.length).toBeGreaterThan(0))
  it('kann ungenutzte Modifier erklären', () => { const input = buildInput(); input.reasons = [customReason('unused-modifier', 'equipment', 'fixture-unused-one', 'negative')]; expect(explanationGenerator.generate(input, context()).allEntries.some(item => item.sourceReasonCodes.includes('unused-modifier'))).toBe(true) })
  it('erklärt die Hauptskill-Empfehlung', () => expect(generate().allEntries.some(item => item.section === 'main-skill')).toBe(true))
  it('erklärt blockierte Skills', () => expect(generate().blockingEntries.some(item => item.sourceIds.includes('fixture-invalid'))).toBe(true))
  it('erklärt Support-Kompatibilität', () => expect(generate().allEntries.some(item => item.section === 'supports')).toBe(true))
  it('erklärt Support-Trade-offs', () => { const input = buildInput(); input.reasons = [customReason('tradeoff-reducedSpeed', 'support', 'fixture-support-boss', 'negative')]; expect(explanationGenerator.generate(input, context()).warningEntries.some(item => item.section === 'supports')).toBe(true) })
  it('erklärt Passive-Pfadkosten', () => expect(generate().allEntries.some(item => item.section === 'passives' && item.body.includes('Pfads'))).toBe(true))
  it('erklärt Keystone-Trade-offs', () => expect(generate().allEntries.some(item => item.sourceReasonCodes.includes('keystone-trade-off'))).toBe(true))
  it('erklärt normale Juwele', () => expect(generate().allEntries.some(item => item.section === 'jewels' && item.sourceIds.includes('fixture-jewel-normal'))).toBe(true))
  it('erklärt Cluster-Juwele', () => expect(generate().allEntries.some(item => item.section === 'jewels' && item.sourceIds.includes('fixture-jewel-cluster'))).toBe(true))
  it('erklärt Unique-Cluster-Build-Enabler', () => expect(generate().allEntries.some(item => item.sourceIds.includes('fixture-jewel-enabler'))).toBe(true))
  it('erklärt Unique-Aszendenz-Synergie', () => expect(generate().allEntries.some(item => item.section === 'uniques' && item.sourceIds.includes('fixture-unique-synergy'))).toBe(true))
  it('erklärt replacementVerdict', () => expect(generate().allEntries.some(item => item.sourceReasonCodes.includes('unique-replacement-verdict'))).toBe(true))
  it('erklärt requiresReoptimization', () => expect(generate().allEntries.some(item => item.sourceReasonCodes.includes('unique-reoptimization'))).toBe(true))
  it('ordnet Mapping-Schritte korrekt', () => { const result = generate().rotationEntries.filter(item => item.section === 'mapping-rotation'); const orders = result.map(item => Number(result.find(entry => entry.explanationId === item.explanationId)?.title.match(/\d+/)?.[0])); expect(orders).toEqual([...orders].sort((a, b) => a - b)) })
  it('ordnet Boss-Schritte korrekt', () => { const result = generate().rotationEntries.filter(item => item.section === 'boss-rotation'); const orders = result.map(item => Number(item.title.match(/\d+/)?.[0])); expect(orders).toEqual([...orders].sort((a, b) => a - b)) })
  it('erklärt Waffenwechsel nur bei vorhandenen Schritten', () => { const input = buildInput(); const expected = input.rotationAnalysis.allPlans.flatMap(item => item.steps).filter(item => item.actionType === 'switch-weapon-set').length; expect(explanationGenerator.generate(input, context()).rotationEntries.filter(item => item.section === 'weapon-swap')).toHaveLength(expected) })
  it('erklärt persistierende Effekte beim Waffenwechsel', () => { const input = buildInput(); const plan = input.rotationAnalysis.bossRotation; plan.steps[0].durationCondition = 'persistent'; plan.steps.splice(1, 0, { stepId: 'synthetic-persistent-swap', order: 2, rotationType: 'boss', actionType: 'switch-weapon-set', weaponSet: 'set-1', previousWeaponSet: 'set-2', nextWeaponSet: 'set-1', reasonCodes: ['rotation-switch-weapon-set'], sourceRecommendationIds: [plan.steps[0].skillId ?? '', plan.steps[1].skillId ?? ''].filter(Boolean), warnings: [], status: 'experimental', confidence: 'high' }); expect(explanationGenerator.generate(input, context()).rotationEntries.some(item => item.section === 'weapon-swap' && item.body.includes('persistent'))).toBe(true) })
  it('macht verfallende Effekte als Warnung sichtbar', () => { const input = buildInput(); input.violations = [{ code: 'effect-expires-on-weapon-swap', severity: 'warning', messageKey: 'rotation.effect', sourceId: 'fixture-debuff', relatedIds: [], blocking: false }]; expect(explanationGenerator.generate(input, context()).warningEntries.some(item => item.sourceReasonCodes.includes('effect-expires-on-weapon-swap'))).toBe(true) })
  it('erklärt Refresh-Bedingungen aus Rotationsschritten', () => { const input = buildInput(); const repeat = input.rotationAnalysis.bossRotation.steps.find(item => item.actionType === 'repeat')!; repeat.repeatCondition = 'on-debuff-expired'; expect(explanationGenerator.generate(input, context()).rotationEntries.some(item => item.body.includes('on debuff expired'))).toBe(true) })
  it('warnt bei häufiger Waffenwechsel-Metadatenlage', () => { const input = buildInput(); input.violations = [{ code: 'frequent-weapon-swaps', severity: 'warning', messageKey: 'rotation.swaps', relatedIds: [], blocking: false }]; expect(explanationGenerator.generate(input, context()).warningEntries.some(item => item.sourceReasonCodes.includes('frequent-weapon-swaps'))).toBe(true) })
  it('niedrige Confidence erzeugt Unsicherheitshinweis', () => { const input = buildInput(fixtureC); input.skillAnalysis.topMainCandidates[0].confidence = 'low'; expect(explanationGenerator.generate(input, context()).allEntries.some(item => item.templateId === 'confidence' && item.body.includes('unsicher'))).toBe(true) })
  it('hohe Confidence erzeugt Klarheitshinweis', () => expect(generate().allEntries.some(item => item.templateId === 'confidence' && item.body.includes('klare Richtung'))).toBe(true))
  it('Platzhalterhinweis ist immer vorhanden', () => expect(generate().limitations.some(item => item.sourceReasonCodes.includes(LIMITATION_CODE))).toBe(true))
  it('erzeugt keine DPS-Aussage außer der verpflichtenden Abgrenzung', () => expect(generate().allEntries.filter(item => item.section !== 'limitations').every(item => !item.body.includes('DPS'))).toBe(true))
  it('erzeugt keine nicht belegte Zahl', () => expect(generate().allEntries.every(item => !/\bSekunden\b|\bMillionen\b/.test(item.body))).toBe(true))
  it('gleiche Eingabe erzeugt identische Texte', () => expect(generate().allEntries.map(item => item.body)).toEqual(generate().allEntries.map(item => item.body)))
  it('gleiche Eingabe erzeugt identische Traces', () => expect(generate().traces).toEqual(generate().traces))
  it('sortiert deterministisch nach absteigender Priorität', () => { const priorities = generate().allEntries.map(item => item.priority); expect(priorities).toEqual([...priorities].sort((a, b) => b - a)) })
  it('alle Templates sind zentral und aktiviert', () => expect(EXPLANATION_TEMPLATES.every(item => item.enabled && item.requiredPlaceholders && item.supportedReasonCodes.length)).toBe(true))
  it('füllt ExplanationResult vollständig', () => expect(generate()).toMatchObject({ summary: expect.any(Array), sections: expect.any(Array), allEntries: expect.any(Array), blockingEntries: expect.any(Array), warningEntries: expect.any(Array), positiveEntries: expect.any(Array), rotationEntries: expect.any(Array), traces: expect.any(Array), unresolvedReasonCodes: expect.any(Array), missingDisplayNames: expect.any(Array), confidenceSummary: expect.any(Object), limitations: expect.any(Array), status: 'experimental', generatorVersion: EXPLANATION_GENERATOR_VERSION }))
  it('Cold-Spell-Fixture erzeugt Skill-, Support- und Passive-Sektionen', () => { const sections = generate(fixtureB).sections.map(item => item.section); expect(sections).toEqual(expect.arrayContaining(['main-skill', 'supports', 'passives'])) })
})
