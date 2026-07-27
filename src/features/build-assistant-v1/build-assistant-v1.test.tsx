import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { initialEquipment, skillSetups } from '../../data'
import type { CharacterConfiguration, EquipmentEntry } from '../../domain'
import { BuildAssistantResultSection } from '../../components/BuildAssistantResultSection'
import { buildAssistantCandidates, createBuildAssistantRequest, deriveWeaponContext, runBuildAssistantV1, validateBuildAssistantInput } from '.'

const character = (goalProfile: CharacterConfiguration['goalProfile'] = 'balanced', desiredMainSkillId = 'skill-lightning-arrow'): CharacterConfiguration => ({
  classId: 'class-official-6',
  ascendancyId: 'ascendancy-official-6-1',
  level: 80,
  goalProfile,
  desiredMainSkillId,
})
const equipment = (): EquipmentEntry[] => initialEquipment.map((entry, index) => index === 8 ? {
  ...entry,
  itemClassId: 'Bows',
  modifierValues: [
    { id: 'applied-lightning', modifierId: 'modifier-added-lightning-damage', value: 60 },
    { id: 'applied-speed', modifierId: 'modifier-attack-speed', value: 40 },
  ],
} : { ...entry })
const input = (goal: CharacterConfiguration['goalProfile'] = 'balanced', skill = 'skill-lightning-arrow') => ({ character: character(goal, skill), equipment: equipment(), setups: skillSetups })
const realSkillId = (nameEn: string) => {
  const skill = buildAssistantCandidates.skills.find(candidate => candidate.nameEn === nameEn)
  if (!skill) throw new Error(`Produktiver Skill fehlt: ${nameEn}`)
  return skill.id
}

describe('Build-Assistent V1 End-to-End-Integration', () => {
  it('fÃ¼hrt alle vorhandenen Analyzer in stabiler Reihenfolge aus', () => {
    const result = runBuildAssistantV1(input())
    expect(result.moduleTrace).toEqual(['equipment', 'skills', 'supports', 'passives', 'jewels', 'uniques', 'rotations', 'explanations'])
    expect(result.equipmentAnalysis).toBeDefined()
    expect(result.supportAnalysis.allCandidates.length).toBeGreaterThan(0)
    expect(result.passiveAnalysis.allCandidates.length).toBeGreaterThan(0)
    expect(result.jewelAnalysis.allCandidates.length).toBeGreaterThan(0)
    expect(result.uniqueAnalysis.allCandidates).toHaveLength(435)
  })

  it.each([
    ['balanced', 'automatic-allround'],
    ['mapping', 'automatic-mapping'],
    ['boss', 'automatic-boss-sustained'],
  ] as const)('wÃ¤hlt fÃ¼r %s automatisch das Vergleichsgegnerprofil', (goal, profileId) => {
    const skillId = realSkillId('Spark')
    const result = runBuildAssistantV1({
      character: character(goal, skillId),
      equipment: equipment(),
      setups: [{ id: 'automatic-profile-test', skillId, role: 'main', weaponSet: 'both', supportGemIds: [] }],
    })
    expect(result.damageEstimate?.enemyProfile).toMatchObject({
      id: profileId,
      source: 'automatic-season-reference',
      sourceVersion: 'poe2-0.4-reference-v2',
    })
  })

  it('verwendet den gewÃ¤hlten Hauptangriff als Support-Treiber', () => {
    const skillId = realSkillId('Ball Lightning')
    const result = runBuildAssistantV1(input('mapping', skillId))
    expect(result.supportAnalysis.allCandidates.every(item => item.skillId === skillId)).toBe(true)
  })

  it('trennt die Skilltreiber der beiden Waffensets', () => {
    const fire = realSkillId('Flameblast')
    const lightning = realSkillId('Spark')
    const setups = [
      { id: 'fire-main', skillId: fire, role: 'main' as const, weaponSet: 'set-1' as const, supportGemIds: [] },
      { id: 'lightning-secondary', skillId: lightning, role: 'secondary' as const, weaponSet: 'set-2' as const, supportGemIds: [] },
    ]
    const result = runBuildAssistantV1({
      character: character('balanced', fire),
      equipment: structuredClone(initialEquipment),
      setups,
    })
    expect(result.equipmentAnalysis.profileSet1.damageTypes.fire).toBeGreaterThan(0)
    expect(result.equipmentAnalysis.profileSet1.damageTypes.lightning).toBe(0)
    expect(result.equipmentAnalysis.profileSet2.damageTypes.lightning).toBeGreaterThan(0)
    expect(result.equipmentAnalysis.profileSet2.damageTypes.fire).toBe(0)
  })

  it('Ã¼bertrÃ¤gt Klasse, Aszendenz, AusrÃ¼stung, Unique und Variante verlustfrei', () => {
    const values = equipment()
    values[0] = { ...values[0], uniqueItemId: buildAssistantCandidates.uniques[0].id, uniqueVariantId: 'variant:test', modifierValues: [] }
    const request = createBuildAssistantRequest({ character: character(), equipment: values, setups: skillSetups })
    expect(request.input.character).toEqual(character())
    expect(request.input.equipment[0]).toMatchObject({ uniqueItemId: buildAssistantCandidates.uniques[0].id, uniqueVariantId: 'variant:test' })
    expect(request.input.equipment[8].modifierValues).toHaveLength(2)
  })

  it('leitet Waffentyp und belegte Sets aus den echten AusrÃ¼stungsslots ab', () => {
    const values = equipment()
    values[10] = { ...values[10], itemClassId: 'One Hand Maces' }
    expect(deriveWeaponContext(values)).toEqual({
      availableWeaponTypes: ['bow', 'mace'],
      availableWeaponSets: ['set-1', 'set-2'],
    })
  })

  it('behandelt ein leeres zweites Waffenset nicht als verfÃ¼gbare Wechselgrundlage', () => {
    const request = createBuildAssistantRequest(input())
    expect(request.weaponContext.availableWeaponSets).toEqual(['set-1'])
    const result = runBuildAssistantV1(input())
    expect(result.rotationAnalysis.allPlans.flatMap(plan => plan.steps).some(step => step.actionType === 'switch-weapon-set')).toBe(false)
  })

  it('wendet Waffenanforderungen des Hauptskills auf reale AusrÃ¼stung an', () => {
    const skillId = realSkillId('Ice Strike')
    const result = runBuildAssistantV1(input('balanced', skillId))
    expect(result.skillAnalysis.allCandidates.find(item => item.skillId === skillId)?.violations.map(value => value.code)).toContain('skill-wrong-weapon')
  })

  it('verwendet in Rotationen nur tatsÃ¤chlich konfigurierte Skills', () => {
    const values = input()
    values.setups = [{ id: 'setup-main-only', skillId: 'skill-lightning-arrow', role: 'main', weaponSet: 'set-1', supportGemIds: [] }]
    const result = runBuildAssistantV1(values)
    expect(result.rotationAnalysis.allPlans.flatMap(plan => plan.requiredSkills).every(id => id === 'skill-lightning-arrow')).toBe(true)
  })

  it('verwendet ausschlieÃŸlich echte PoB2-Uniques ohne Fixture-Namespace', () => {
    expect(buildAssistantCandidates.uniques).toHaveLength(435)
    expect(buildAssistantCandidates.uniques.every(item => item.id.startsWith('pob2:'))).toBe(true)
    expect(buildAssistantCandidates.uniques.some(item => item.id.startsWith('fixture:'))).toBe(false)
  })

  it('verwendet im Produkt nur den gepinnten aktuellen Gemmenbestand mit lokaler deutscher Anzeige', () => {
    expect(buildAssistantCandidates.skills).toHaveLength(235)
    expect(buildAssistantCandidates.supports).toHaveLength(451)
    expect(buildAssistantCandidates.skills.find(item => item.nameEn === 'Spark')?.displayNameDe).toBe('Funken')
    expect(buildAssistantCandidates.skills.some(item => item.id.startsWith('skill-'))).toBe(false)
    expect(buildAssistantCandidates.supports.some(item => item.id.startsWith('support-'))).toBe(false)
  })

  it('Ã¤ndert zielprofilabhÃ¤ngige Bewertungen zwischen Mapping und Boss', () => {
    const mapping = runBuildAssistantV1(input('mapping'))
    const boss = runBuildAssistantV1(input('boss'))
    expect(mapping.skillRecommendations.map(item => [item.skillId, item.mappingScore, item.bossScore])).not.toEqual(boss.skillRecommendations.map(item => [item.skillId, item.mappingScore, item.bossScore]))
  })

  it('bleibt bei identischen Eingaben deterministisch', () => {
    expect(runBuildAssistantV1(input())).toEqual(runBuildAssistantV1(input()))
  })

  it('erlaubt leere optionale Slots und validiert nur echte Mindesteingaben', () => {
    expect(validateBuildAssistantInput({ character: character(), equipment: initialEquipment, setups: skillSetups })).toEqual([])
    expect(() => runBuildAssistantV1({ character: character(), equipment: initialEquipment, setups: skillSetups })).not.toThrow()
    expect(validateBuildAssistantInput({ character: { ...character(), desiredMainSkillId: undefined }, equipment: initialEquipment, setups: skillSetups })).toEqual([])
    expect(runBuildAssistantV1({ character: { ...character(), desiredMainSkillId: undefined }, equipment: initialEquipment, setups: skillSetups }).supportAnalysis.allCandidates[0]?.skillId).toBeTruthy()
  })

  it('rendert einen zusammenhÃ¤ngenden deutschen Ergebnisbericht mit allen V1-Bereichen', () => {
    const html = renderToStaticMarkup(<BuildAssistantResultSection analysis={runBuildAssistantV1(input())} equipment={equipment()}/>)
    for (const heading of ['Zusammenfassung', 'Beste Schadensskalierungen', 'Ausrüstung', 'Hauptangriff und Supports', 'Passive Schwerpunkte', 'Juwelen und Cluster', 'Passende Uniques', 'Mapping', 'Boss', 'Nächste Verbesserungen']) expect(html).toContain(heading)
    expect(html).not.toContain('FESTE PLATZHALTERDATEN')
    expect(html).toContain('Mapping-Ranglisten')
    expect(html).toContain('Boss-Ranglisten')
    expect(html).toContain('Konkreter Pfad noch nicht berechnet')
  })

  it('zeigt die Schadensart der gewÃ¤hlten Hauptfertigkeit statt eines fremden Baumprofils', () => {
    const fire = realSkillId('Flameblast')
    const values = input('balanced', fire)
    values.setups = [{ id: 'fire-main', skillId: fire, role: 'main', weaponSet: 'set-1', supportGemIds: [] }]
    const html = renderToStaticMarkup(<BuildAssistantResultSection analysis={runBuildAssistantV1(values)} equipment={values.equipment}/>)
    expect(html).toContain('<dt>Hauptschaden</dt><dd>Feuerschaden</dd>')
  })
})
