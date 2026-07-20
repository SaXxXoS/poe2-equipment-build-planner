import { describe, expect, it } from 'vitest'
import type { MechanicTag, SkillGemDefinition, SyntheticWeaponType } from '../../domain'
import { placeholderMetadata } from '../../domain'
import { blankProfile } from '../common/scoring'
import type { AnalyzerContext, BuildProfile, EquipmentAnalysis } from '../common/types'
import { equipmentAnalyzer } from '../equipment/analyzer'
import { analyzeBuild } from '../orchestration/analyze-build'
import { engineModifierFixtures, fixtureA, fixtureB, fixtureC, fixtureD, fixtureE, syntheticSkillFixtures } from '../fixtures'
import { skillAnalyzer, type SkillAnalyzerInput } from './analyzer'

const context = (): AnalyzerContext => ({ engineVersion: 'skill-test', fixtureMode: true })
const equipment = (fixture = fixtureA) => equipmentAnalyzer.analyze(fixture, context(), engineModifierFixtures).value.equipmentAnalysis
const input = (report: EquipmentAnalysis, goal = fixtureA.input.goalProfile, weapons: SyntheticWeaponType[] = ['any'], character = fixtureA.input.character): SkillAnalyzerInput => ({ equipmentAnalysis: report, goalProfile: goal, availableWeaponTypes: weapons, character })
const report = (fixture = fixtureA, candidates = syntheticSkillFixtures, goal = fixture.input.goalProfile, weapons: SyntheticWeaponType[] = ['any']) => { const equipmentReport = equipment(fixture); return skillAnalyzer.analyzeRanked(equipmentReport.combinedProfile, candidates, context(), input(equipmentReport, goal, weapons, { ...fixture.input.character, goalProfile: goal })) }
const candidate = (id: string, tags: MechanicTag[], values: Partial<SkillGemDefinition> = {}): SkillGemDefinition => ({ ...placeholderMetadata(id, id, tags), damageTypes: tags.filter(tag => ['physical', 'fire', 'cold', 'lightning', 'chaos'].includes(tag)) as SkillGemDefinition['damageTypes'], possibleRoles: ['main', 'secondary'], mappingBase: 50, bossBase: 50, enabled: true, ...values })
const recommendation = (id: string, result = report()) => result.allCandidates.find(item => item.skillId === id)!
function syntheticEquipmentAnalysis(profile: BuildProfile, clarity = 100, conflictLevel = 0): EquipmentAnalysis { const base = equipment(); return { ...base, combinedProfile: profile, profileSet1: profile, profileSet2: profile, profileClarity: clarity, conflictLevel } }
const compareOnProfile = (profile: BuildProfile, candidates: SkillGemDefinition[]) => skillAnalyzer.analyzeRanked(profile, candidates, context(), input(syntheticEquipmentAnalysis(profile))).allCandidates

describe('regelbasierter synthetischer Skill Analyzer', () => {
  it('passende Schadensart erhöht Skillscore', () => expect(recommendation('fixture-main').damageScore).toBeGreaterThan(recommendation('fixture-spell').damageScore))
  it('dominante Schadensart wirkt stärker als sekundäre', () => { const profile = blankProfile(); profile.damageTypes.lightning = 80; profile.damageTypes.cold = 30; const result = compareOnProfile(profile, [candidate('a-lightning', ['spell', 'lightning']), candidate('b-cold', ['spell', 'cold'])]); expect(result[0].skillId).toBe('a-lightning') })
  it.each([['projectile', 'fixture-main'], ['melee', 'fixture-melee-physical'], ['attack', 'fixture-main']] as const)('%s-Affinität erhöht passenden Skill', (field, id) => { const profile = blankProfile(); profile.mechanics[field] = 80; const matching = candidate(id, [field, 'physical'] as MechanicTag[]); const neutral = candidate('fixture-neutral', ['physical']); expect(compareOnProfile(profile, [matching, neutral])[0].skillId).toBe(id) })
  it('Spell-Affinität erhöht Spell-Skill', () => { const profile = blankProfile(); profile.mechanics.spell = 80; expect(compareOnProfile(profile, [candidate('spell-a', ['spell']), candidate('neutral-b', ['buff'])])[0].skillId).toBe('spell-a') })
  it('Critical wirkt nur bei Critical-Skills', () => { const profile = blankProfile(); profile.mechanics.critical = 80; const values = compareOnProfile(profile, [candidate('critical-a', ['attack', 'critical']), candidate('plain-b', ['attack'])]); expect(values.find(item => item.skillId === 'critical-a')!.equipmentSynergyScore).toBeGreaterThan(values.find(item => item.skillId === 'plain-b')!.equipmentSynergyScore) })
  it.each([['damage-over-time', 'dot-a'], ['minion', 'minion-a']] as const)('%s wirkt nur beim passenden Skill', (tag, id) => { const profile = blankProfile(); profile.mechanics[tag] = 80; const values = compareOnProfile(profile, [candidate(id, [tag]), candidate('neutral-b', ['buff'])]); expect(values[0].skillId).toBe(id) })
  it('Angriffsgeschwindigkeit wirkt nur bei Attack-Skills', () => { const profile = blankProfile(); profile.speed.attackSpeedAffinity = 80; const values = compareOnProfile(profile, [candidate('attack-a', ['attack']), candidate('spell-b', ['spell'])]); expect(values.find(item => item.skillId === 'attack-a')!.equipmentSynergyScore).toBeGreaterThan(values.find(item => item.skillId === 'spell-b')!.equipmentSynergyScore) })
  it('Zaubergeschwindigkeit wirkt nur bei Spell-Skills', () => { const profile = blankProfile(); profile.speed.castSpeedAffinity = 80; const values = compareOnProfile(profile, [candidate('spell-a', ['spell']), candidate('attack-b', ['attack'])]); expect(values.find(item => item.skillId === 'spell-a')!.equipmentSynergyScore).toBeGreaterThan(values.find(item => item.skillId === 'attack-b')!.equipmentSynergyScore) })
  it('Movement-Affinität erhöht Movement-Skill', () => { const profile = blankProfile(); profile.mechanics.movement = 80; profile.speed.movementAffinity = 80; expect(compareOnProfile(profile, [candidate('movement-a', ['movement']), candidate('buff-b', ['buff'])])[0].skillId).toBe('movement-a') })
  it('Mapping-Ziel verändert Mapping-Rangliste', () => expect(report(fixtureD, syntheticSkillFixtures, 'mapping').mappingRanking[0].skillId).toBe('fixture-movement'))
  it('Boss-Ziel verändert Boss-Rangliste', () => expect(report(fixtureD, syntheticSkillFixtures, 'boss').bossRanking[0].skillId).toBe('fixture-debuff'))
  it('ausgeglichenes Ziel gewichtet beide Bereiche ähnlich', () => { const value = recommendation('fixture-main', report(fixtureD, syntheticSkillFixtures, 'balanced')); expect(Math.abs(value.mappingScore - value.bossScore)).toBeLessThan(30) })
  it('Klassenpräferenz erzeugt positive Synergie', () => expect(recommendation('fixture-main').reasons.map(item => item.code)).toContain('preferred-class'))
  it('ausgeschlossene Klasse blockiert Skill', () => expect(recommendation('fixture-invalid').eligibility).toBe('blocked'))
  it('Aszendenzpräferenz erzeugt positive Synergie', () => expect(recommendation('fixture-main').ascendancySynergyScore).toBeGreaterThan(0))
  it('ausgeschlossene Aszendenz blockiert Skill', () => { const skill = candidate('excluded-asc', ['buff'], { excludedAscendancyIds: ['fixture-ascendancy-storm'] }); expect(report(fixtureD, [skill]).blockedCandidates[0].violations[0].blocking).toBe(true) })
  it('Attributdefizit erzeugt ConstraintViolation', () => { const skill = candidate('attribute-skill', ['buff'], { attributeRequirements: { strength: 10 } }); expect(report(fixtureD, [skill]).blockedCandidates[0].violations.map(item => item.code)).toContain('skill-attribute-deficit') })
  it('falsche Waffenart blockiert Skill', () => expect(report(fixtureA, [syntheticSkillFixtures[0]], 'mapping', ['melee-weapon']).blockedCandidates[0].violations.map(item => item.code)).toContain('skill-wrong-weapon'))
  it('Attack-Skill wird in reinem Spell-Profil blockiert', () => expect(recommendation('fixture-main', report(fixtureB)).eligibility).toBe('blocked'))
  it('gemischtes Profil blockiert nicht automatisch', () => expect(recommendation('fixture-main', report(fixtureC)).eligibility).toBe('eligible'))
  it('Hauptskillrolle wird korrekt bestimmt', () => expect(recommendation('fixture-main').recommendedRole).toBe('main'))
  it('Movement-Rolle wird korrekt bestimmt', () => expect(recommendation('fixture-movement').recommendedRole).toBe('movement'))
  it('Utility-Rolle wird korrekt bestimmt', () => expect(recommendation('fixture-buff').recommendedRole).toBe('utility'))
  it('Waffen-Sets werden getrennt bewertet', () => { const value = recommendation('fixture-main', report(fixtureE)); expect(value.scoreSet1).toBeGreaterThan(value.scoreSet2); expect(value.preferredWeaponSet).toBe('set-1') })
  it('gleich starke Sets ergeben both', () => expect(recommendation('fixture-buff', report(fixtureD)).preferredWeaponSet).toBe('both'))
  it('ungenutzte dominante Profilfelder werden erkannt', () => expect(recommendation('fixture-melee-physical').unusedDominantProfileFields).toEqual(expect.arrayContaining(['damageTypes.lightning', 'mechanics.projectile'])))
  it('conflictLevel erzeugt Warnung', () => expect(recommendation('fixture-main', report(fixtureC)).warnings.map(item => item.code)).toContain('equipment-conflict'))
  it('geringe profileClarity senkt Confidence', () => { const profile = blankProfile(); const skill = candidate('clarity-skill', ['buff']); const result = skillAnalyzer.analyzeRanked(profile, [skill], context(), input(syntheticEquipmentAnalysis(profile, 20, 80))); expect(result.allCandidates[0].confidence).toBe('low') })
  it('blockierte Skills stehen hinter gültigen Skills', () => { const values = report().allCandidates; expect(values.findIndex(item => !item.valid)).toBeGreaterThan(values.findIndex(item => item.valid)) })
  it('gleiche Scores werden stabil nach Skill-ID sortiert', () => { const profile = blankProfile(); const values = compareOnProfile(profile, [candidate('skill-z', ['buff']), candidate('skill-a', ['buff'])]); expect(values.map(item => item.skillId)).toEqual(['skill-a', 'skill-z']) })
  it('gleiche Eingabe erzeugt identische Ausgabe', () => expect(report(fixtureE)).toEqual(report(fixtureE)))
  it('mindestens drei Hauptskillkandidaten werden bereitgestellt', () => expect(report(fixtureD).topMainCandidates).toHaveLength(3))
  it('Mapping- und Bossranglisten enthalten nur gültige Kandidaten', () => { const value = report(); expect(value.mappingRanking.every(item => item.valid)).toBe(true); expect(value.bossRanking.every(item => item.valid)).toBe(true) })
  it('keine Skillbewertung verwendet path-efficiency', () => expect(report().allCandidates.flatMap(item => item.reasons).some(item => item.category === 'path-efficiency')).toBe(false))
  it('Orchestrator funktioniert weiterhin', () => { const value = analyzeBuild(fixtureA, context(), engineModifierFixtures); expect(value.skillAnalysis.allCandidates).toEqual(value.skillRecommendations); expect(value.moduleTrace[1]).toBe('skills') })
})
