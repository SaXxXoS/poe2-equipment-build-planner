import { describe, expect, it } from 'vitest'
import { placeholderMetadata, type MechanicTag, type SkillGemDefinition, type SupportGemDefinition } from '../../domain'
import type { AnalyzerContext } from '../common/types'
import { equipmentAnalyzer } from '../equipment/analyzer'
import { engineModifierFixtures, fixtureA, fixtureB, fixtureD, fixtureE, syntheticSkillFixtures, syntheticSupportFixtures } from '../fixtures'
import { analyzeBuild } from '../orchestration/analyze-build'
import { skillAnalyzer } from '../skills/analyzer'
import { supportAnalyzer } from './analyzer'
const context = (): AnalyzerContext => ({ engineVersion: 'support-test', fixtureMode: true })
const support = (id: string, requiredTags: MechanicTag[] = [], values: Partial<SupportGemDefinition> = {}): SupportGemDefinition => ({ ...placeholderMetadata(id, id), requiredTags, excludedTags: [], ownTags: requiredTags, mappingBase: 50, bossBase: 50, utilityBase: 10, enabled: true, ...values })
const skill = (id: string, tags: MechanicTag[]): SkillGemDefinition => ({ ...placeholderMetadata(id, id, tags), damageTypes: tags.filter(tag => ['physical', 'fire', 'cold', 'lightning', 'chaos'].includes(tag)) as SkillGemDefinition['damageTypes'], possibleRoles: ['main'], enabled: true })
function setup(fixture = fixtureA, selected = syntheticSkillFixtures[0], candidates = syntheticSupportFixtures, goal = fixture.input.goalProfile) { const equipment = equipmentAnalyzer.analyze(fixture, context(), engineModifierFixtures).value.equipmentAnalysis; const skills = skillAnalyzer.analyzeRanked(equipment.combinedProfile, [selected], context(), { equipmentAnalysis: equipment, character: fixture.input.character, goalProfile: goal, availableWeaponTypes: ['any'] }); return supportAnalyzer.analyzeRanked(selected, equipment.combinedProfile, candidates, context(), { skillRecommendation: skills.allCandidates[0], equipmentAnalysis: equipment, character: fixture.input.character, goalProfile: goal, availableWeaponTypes: ['any'] }) }
const rec = (id: string, result = setup()) => result.allCandidates.find(item => item.supportId === id)!

describe('regelbasierter synthetischer Support Analyzer', () => {
  it('benötigtes Skill-Tag wird geprüft', () => expect(rec('fixture-support-cold-spell').violations.map(item => item.code)).toContain('required-skill-tag-missing'))
  it('ausgeschlossenes Skill-Tag blockiert', () => expect(rec('fixture-support-incompatible').eligibility).toBe('blocked'))
  it('passende Schadensart erhöht Score', () => expect(rec('fixture-support-lightning').damageScore).toBeGreaterThan(0))
  it('unpassende Schadensart gibt keinen Bonus', () => expect(rec('fixture-support-cold-spell').damageScore).toBe(0))
  it('Projectile-Support passt zu Projectile-Skill', () => expect(rec('fixture-support-compatible').matchedSkillTags).toEqual(expect.arrayContaining(['attack', 'projectile'])))
  it('Attack-Support passt nicht zu reinem Spell', () => expect(setup(fixtureB, syntheticSkillFixtures[1], [syntheticSupportFixtures[0]]).blockedCandidates).toHaveLength(1))
  it('Spell-Support passt nicht zu reinem Attack', () => expect(rec('fixture-support-cold-spell').valid).toBe(false))
  it('Critical-Support wirkt nur bei kompatiblem Skill', () => { expect(rec('fixture-support-critical').valid).toBe(true); expect(setup(fixtureB, syntheticSkillFixtures[1], [syntheticSupportFixtures[3]]).blockedCandidates).toHaveLength(1) })
  it.each([['damage-over-time', 'dot'], ['minion', 'minion']] as const)('%s-Support wirkt nur passend', (tag, id) => { const candidate = support(`support-${id}`, [tag], { supportedMechanics: [tag] }); expect(setup(fixtureD, skill(`skill-${id}`, [tag]), [candidate]).eligibleCandidates).toHaveLength(1); expect(setup(fixtureD, skill('plain', ['attack']), [candidate]).blockedCandidates).toHaveLength(1) })
  it('Mapping-Ziel verändert Mapping-Rangliste', () => expect(setup(fixtureB, syntheticSkillFixtures[1], syntheticSupportFixtures, 'mapping').topMappingSupports[0].supportId).toBe('fixture-support-area'))
  it('Boss-Ziel verändert Boss-Rangliste', () => expect(setup(fixtureA, syntheticSkillFixtures[0], syntheticSupportFixtures, 'boss').topBossSupports[0].supportId).toBe('fixture-support-boss'))
  it('ausgeglichenes Ziel gewichtet beide Bereiche', () => { const value = rec('fixture-support-lightning', setup(fixtureA, syntheticSkillFixtures[0], syntheticSupportFixtures, 'balanced')); expect(Math.abs(value.mappingScore - value.bossScore)).toBeLessThan(20) })
  it('Resource-Trade-off reduziert Score', () => { const costly = rec('fixture-support-resource'); const neutral = rec('fixture-support-experimental'); expect(costly.tradeOffs.map(item => item.type)).toContain('increasedResourceNeed'); expect(costly.resourceScore).toBeLessThan(neutral.resourceScore) })
  it('Speed-Trade-off erzeugt negativen Reason', () => expect(rec('fixture-support-boss').reasons.find(item => item.code === 'tradeoff-reducedSpeed')?.impact).toBeLessThan(0))
  it('Defensive-Support profitiert von DefenceNeed', () => { const defensive = support('support-defensive', [], { ownTags: ['defensive'] }); expect(setup(fixtureD, syntheticSkillFixtures[4], [defensive]).allCandidates[0].defenceScore).toBeGreaterThan(0) })
  it('Equipment-Synergy wird berücksichtigt', () => expect(rec('fixture-support-lightning').equipmentSynergyScore).toBeGreaterThan(0))
  it('Ascendancy-Synergy wird berücksichtigt', () => expect(rec('fixture-support-experimental').ascendancySynergyScore).toBeGreaterThan(0))
  it('falsche Waffenart blockiert', () => { const value = support('wrong-weapon', [], { requiredWeaponTypes: ['melee-weapon'] }); const equipment = equipmentAnalyzer.analyze(fixtureA, context(), engineModifierFixtures).value.equipmentAnalysis; expect(supportAnalyzer.analyzeRanked(syntheticSkillFixtures[0], equipment.combinedProfile, [value], context(), { equipmentAnalysis: equipment, availableWeaponTypes: ['ranged-weapon'] }).blockedCandidates).toHaveLength(1) })
  it('falsche Skillrolle blockiert', () => { const value = support('wrong-role', [], { allowedSkillRoles: ['utility'] }); expect(setup(fixtureA, syntheticSkillFixtures[0], [value]).blockedCandidates).toHaveLength(1) })
  it('deaktivierter Support blockiert', () => expect(setup(fixtureA, syntheticSkillFixtures[0], [support('disabled', [], { enabled: false })]).blockedCandidates).toHaveLength(1))
  it('experimenteller Status senkt Confidence', () => expect(rec('fixture-support-experimental').confidence).not.toBe('high'))
  it('Waffen-Sets werden getrennt bewertet', () => { const value = rec('fixture-support-lightning', setup(fixtureE)); expect(value.scoreSet1).toBeGreaterThan(value.scoreSet2); expect(value.preferredWeaponSet).toBe('set-1') })
  it('gleiche Set-Scores ergeben both', () => expect(rec('fixture-support-boss').preferredWeaponSet).toBe('both'))
  it('matchedSkillTags werden korrekt ausgegeben', () => expect(rec('fixture-support-lightning').matchedSkillTags).toContain('lightning'))
  it('unusedSupportTags werden erkannt', () => expect(rec('fixture-support-utility').unusedSupportTags).toContain('buff'))
  it('conflictingSkillTags werden erkannt', () => expect(rec('fixture-support-incompatible').conflictingSkillTags).toContain('attack'))
  it('blockierte Supports stehen hinter gültigen', () => { const values = setup().allCandidates; expect(values.findIndex(item => !item.valid)).toBeGreaterThan(values.findIndex(item => item.valid)) })
  it('gleiche Scores werden nach Support-ID sortiert', () => { const values = setup(fixtureD, syntheticSkillFixtures[4], [support('support-z'), support('support-a')]).allCandidates; expect(values.map(item => item.supportId)).toEqual(['support-a', 'support-z']) })
  it('gleiche Eingabe erzeugt identische Ausgabe', () => expect(setup(fixtureE)).toEqual(setup(fixtureE)))
  it('mindestens fünf gültige Top-Kandidaten werden ausgegeben', () => expect(setup().topCandidates).toHaveLength(5))
  it('keine Bewertung verwendet path-efficiency', () => expect(setup().allCandidates.flatMap(item => item.reasons).some(item => item.category === 'path-efficiency')).toBe(false))
  it('Orchestrator funktioniert weiterhin', () => { const value = analyzeBuild(fixtureA, context(), engineModifierFixtures); expect(value.supportAnalysis.allCandidates).toEqual(value.supportRecommendations); expect(value.moduleTrace[2]).toBe('supports') })
})
