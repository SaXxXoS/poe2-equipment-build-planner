import { describe, expect, it } from 'vitest'
import { analyzeBuild } from '../orchestration/analyze-build'
import type { AnalyzerContext, DamageType } from '../common/types'
import { engineCandidatesFixture, engineModifierFixtures, fixtureA, fixtureB, fixtureC, fixtureD, fixtureE, syntheticInput } from '../fixtures'
import { equipmentAnalyzer } from './analyzer'
import { normalizeAffinity, normalizeContribution } from './normalization'

const context = (): AnalyzerContext => ({ engineVersion: 'equipment-test', fixtureMode: true })
const request = (modifierId: string, value = 60) => ({ input: syntheticInput([{ modifierId, value }]), candidates: engineCandidatesFixture })
const analyze = (modifierId: string, value = 60) => equipmentAnalyzer.analyze(request(modifierId, value), context(), engineModifierFixtures).value
const analysis = (fixture = fixtureA) => equipmentAnalyzer.analyze(fixture, context(), engineModifierFixtures).value.equipmentAnalysis

describe('regelbasierter synthetischer Equipment Analyzer', () => {
  it('normalisiert auf 0 bis 100', () => { expect(normalizeAffinity(-20)).toBe(0); expect(normalizeAffinity(120)).toBe(100) })
  it('normalisiert deterministisch', () => expect(normalizeContribution(47, 5, 50)).toBe(normalizeContribution(47, 5, 50)))
  it.each<[string, DamageType]>([['fixture-physical-damage', 'physical'], ['fixture-fire-damage', 'fire'], ['fixture-cold-damage', 'cold'], ['fixture-lightning-damage', 'lightning'], ['fixture-chaos-damage', 'chaos']])('%s erhöht %s', (modifierId, field) => expect(analyze(modifierId).buildProfile.damageTypes[field]).toBeGreaterThan(0))
  it('Angriffsgeschwindigkeit erhöht attack', () => expect(analyze('fixture-attack-speed').buildProfile.mechanics.attack).toBeGreaterThan(0))
  it('Zaubergeschwindigkeit erhöht spell', () => expect(analyze('fixture-cast-speed').buildProfile.mechanics.spell).toBeGreaterThan(0))
  it('Projektilmodifier erhöht projectile', () => expect(analyze('fixture-projectile-damage').buildProfile.mechanics.projectile).toBeGreaterThan(0))
  it('kritische Modifier erhöhen critical', () => { const result = equipmentAnalyzer.analyze({ input: syntheticInput([{ modifierId: 'fixture-critical-chance', value: 40 }, { modifierId: 'fixture-critical-multiplier', value: 40 }]), candidates: engineCandidatesFixture }, context(), engineModifierFixtures); expect(result.value.buildProfile.mechanics.critical).toBeGreaterThan(0) })
  it.each([['fixture-maximum-life', 'lifeAffinity'], ['fixture-armour', 'armourAffinity'], ['fixture-evasion', 'evasionAffinity'], ['fixture-energy-shield', 'energyShieldAffinity']] as const)('%s erhöht %s', (modifierId, field) => expect(analyze(modifierId).buildProfile.defence[field]).toBeGreaterThan(0))
  it('niedrige Widerstände erhöhen resistanceNeed', () => expect(analysis(fixtureD).combinedProfile.defence.resistanceNeed).toBeGreaterThan(80))
  it('hohe Widerstände senken resistanceNeed', () => { const input = syntheticInput(['fire', 'cold', 'lightning', 'chaos'].map(name => ({ modifierId: `fixture-${name}-resistance`, value: 40 }))); const result = equipmentAnalyzer.analyze({ input, candidates: engineCandidatesFixture }, context(), engineModifierFixtures); expect(result.value.buildProfile.defence.resistanceNeed).toBe(0) })
  it('defensive Schwäche erhöht generalDefenceNeed', () => expect(analysis(fixtureD).combinedProfile.defence.generalDefenceNeed).toBeGreaterThan(80))
  it('Attribute und künstliche Anforderungen werden getrennt analysiert', () => { const result = analyze('fixture-strength', 40); expect(result.buildProfile.requirements.strengthNeed).toBe(20); expect(result.equipmentAnalysis.recognizedRequirements).toContain('dexterityNeed') })
  it('Waffen-Sets werden getrennt analysiert', () => { const result = analysis(fixtureE); expect(result.profileSet1.damageTypes.lightning).toBeGreaterThan(0); expect(result.profileSet2.mechanics.debuff).toBeGreaterThan(0) })
  it('dominantes Waffen-Set wird stabil bestimmt', () => expect(analysis(fixtureE).dominantWeaponSet).toBe('set-1'))
  it('gleich starke Waffen-Sets bleiben balanced', () => { const input = syntheticInput([{ modifierId: 'fixture-fire-damage', value: 40, weaponSet: 'set-1' }, { modifierId: 'fixture-cold-damage', value: 40, weaponSet: 'set-2' }]); expect(equipmentAnalyzer.analyze({ input, candidates: engineCandidatesFixture }, context(), engineModifierFixtures).value.equipmentAnalysis.dominantWeaponSet).toBe('balanced') })
  it('Attack-/Spell-Konflikt wird erkannt', () => expect(analysis(fixtureC).warnings.map(item => item.code)).toContain('mixed-attack-spell'))
  it('Melee-/Projectile-Konflikt wird erkannt', () => expect(analysis(fixtureC).warnings.map(item => item.code)).toContain('melee-projectile'))
  it('konkurrierende Schadensarten werden erkannt', () => expect(analysis(fixtureC).warnings.map(item => item.code)).toContain('competing-damage-types'))
  it('ungenutzte Modifier werden erkannt', () => { const result = equipmentAnalyzer.analyze({ input: syntheticInput([{ modifierId: 'fixture-area-damage', value: 1 }]), candidates: engineCandidatesFixture }, context(), engineModifierFixtures); expect(result.value.equipmentAnalysis.unusedModifierIds).toContain('fixture-area-damage') })
  it('schwach genutzte Modifier werden erkannt', () => { const input = syntheticInput([{ modifierId: 'fixture-lightning-damage', value: 60 }, { modifierId: 'fixture-area-damage', value: 10 }]); const result = equipmentAnalyzer.analyze({ input, candidates: engineCandidatesFixture }, context(), engineModifierFixtures); expect(result.value.equipmentAnalysis.weaklyUsedModifierIds).toContain('fixture-area-damage') })
  it('klare Ausrüstung erzeugt hohe profileClarity', () => expect(analysis(fixtureA).profileClarity).toBeGreaterThanOrEqual(70))
  it('widersprüchliche Ausrüstung erzeugt niedrige profileClarity', () => expect(analysis(fixtureC).profileClarity).toBeLessThan(70))
  it('Fixture B bleibt klar auf Spell, Kälte und Energieschild ausgerichtet', () => { const result = analysis(fixtureB); expect(result.combinedProfile.mechanics.spell).toBeGreaterThan(result.combinedProfile.mechanics.attack); expect(result.dominantDamageType).toBe('cold'); expect(result.dominantDefence).toBe('energy-shield'); expect(result.profileClarity).toBeGreaterThanOrEqual(70) })
  it('Fixture C meldet mehrere konfliktbehaftete Modifier', () => expect(analysis(fixtureC).conflictingModifierIds.length).toBeGreaterThanOrEqual(4))
  it('gleiche Eingabe liefert identische Ausgabe', () => expect(analysis(fixtureE)).toEqual(analysis(fixtureE)))
  it('gleiche Scores werden stabil nach ID aufgelöst', () => { const input = syntheticInput([{ modifierId: 'fixture-fire-damage', value: 40 }, { modifierId: 'fixture-cold-damage', value: 40 }]); const result = equipmentAnalyzer.analyze({ input, candidates: engineCandidatesFixture }, context(), engineModifierFixtures); expect(result.value.equipmentAnalysis.dominantDamageType).toBe('cold') })
  it('EquipmentAnalysis enthält alle Pflichtfelder', () => expect(analysis()).toEqual(expect.objectContaining({ combinedProfile: expect.any(Object), profileSet1: expect.any(Object), profileSet2: expect.any(Object), detectedTags: expect.any(Array), dominantWeaponSet: expect.any(String), profileClarity: expect.any(Number), conflictLevel: expect.any(Number), unusedModifierIds: expect.any(Array), weaklyUsedModifierIds: expect.any(Array), conflictingModifierIds: expect.any(Array), reasons: expect.any(Array), violations: expect.any(Array), warnings: expect.any(Array), status: 'experimental', analyzerVersion: expect.any(String) })))
  it('Beiträge bleiben über Regel-ID, Rohwert und Ergebnis nachvollziehbar', () => expect(analysis().reasons.find(item => item.code === 'equipment-lightning-damage')?.details).toEqual(expect.objectContaining({ ruleId: 'equipment-rule-lightning-damage', rawValue: 60, contribution: 50, result: 50 })))
  it('Orchestrator funktioniert weiterhin mit dem erweiterten Bericht', () => { const result = analyzeBuild(fixtureA, context(), engineModifierFixtures); expect(result.equipmentAnalysis.combinedProfile).toEqual(result.buildProfile); expect(result.moduleTrace[0]).toBe('equipment') })
})
