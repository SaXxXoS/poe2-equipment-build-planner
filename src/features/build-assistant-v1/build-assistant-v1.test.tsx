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

describe('Build-Assistent V1 End-to-End-Integration', () => {
  it('führt alle vorhandenen Analyzer in stabiler Reihenfolge aus', () => {
    const result = runBuildAssistantV1(input())
    expect(result.moduleTrace).toEqual(['equipment', 'skills', 'supports', 'passives', 'jewels', 'uniques', 'rotations', 'explanations'])
    expect(result.equipmentAnalysis).toBeDefined()
    expect(result.supportAnalysis.allCandidates.length).toBeGreaterThan(0)
    expect(result.passiveAnalysis.allCandidates.length).toBeGreaterThan(0)
    expect(result.jewelAnalysis.allCandidates.length).toBeGreaterThan(0)
    expect(result.uniqueAnalysis.allCandidates).toHaveLength(435)
  })

  it('verwendet den gewählten Hauptangriff als Support-Treiber', () => {
    const result = runBuildAssistantV1(input('mapping', 'skill-ball-lightning'))
    expect(result.supportAnalysis.allCandidates.every(item => item.skillId === 'skill-ball-lightning')).toBe(true)
  })

  it('überträgt Klasse, Aszendenz, Ausrüstung, Unique und Variante verlustfrei', () => {
    const values = equipment()
    values[0] = { ...values[0], uniqueItemId: buildAssistantCandidates.uniques[0].id, uniqueVariantId: 'variant:test', modifierValues: [] }
    const request = createBuildAssistantRequest({ character: character(), equipment: values, setups: skillSetups })
    expect(request.input.character).toEqual(character())
    expect(request.input.equipment[0]).toMatchObject({ uniqueItemId: buildAssistantCandidates.uniques[0].id, uniqueVariantId: 'variant:test' })
    expect(request.input.equipment[8].modifierValues).toHaveLength(2)
  })

  it('leitet Waffentyp und belegte Sets aus den echten Ausrüstungsslots ab', () => {
    const values = equipment()
    values[10] = { ...values[10], itemClassId: 'One Hand Maces' }
    expect(deriveWeaponContext(values)).toEqual({
      availableWeaponTypes: ['melee-weapon', 'ranged-weapon'],
      availableWeaponSets: ['set-1', 'set-2'],
    })
  })

  it('behandelt ein leeres zweites Waffenset nicht als verfügbare Wechselgrundlage', () => {
    const request = createBuildAssistantRequest(input())
    expect(request.weaponContext.availableWeaponSets).toEqual(['set-1'])
    const result = runBuildAssistantV1(input())
    expect(result.rotationAnalysis.allPlans.flatMap(plan => plan.steps).some(step => step.actionType === 'switch-weapon-set')).toBe(false)
  })

  it('wendet Waffenanforderungen des Hauptskills auf reale Ausrüstung an', () => {
    const result = runBuildAssistantV1(input('balanced', 'skill-ice-strike'))
    expect(result.skillAnalysis.allCandidates.find(item => item.skillId === 'skill-ice-strike')?.violations.map(value => value.code)).toContain('skill-wrong-weapon')
  })

  it('verwendet in Rotationen nur tatsächlich konfigurierte Skills', () => {
    const values = input()
    values.setups = [{ id: 'setup-main-only', skillId: 'skill-lightning-arrow', role: 'main', weaponSet: 'set-1', supportGemIds: [] }]
    const result = runBuildAssistantV1(values)
    expect(result.rotationAnalysis.allPlans.flatMap(plan => plan.requiredSkills).every(id => id === 'skill-lightning-arrow')).toBe(true)
  })

  it('verwendet ausschließlich echte PoB2-Uniques ohne Fixture-Namespace', () => {
    expect(buildAssistantCandidates.uniques).toHaveLength(435)
    expect(buildAssistantCandidates.uniques.every(item => item.id.startsWith('pob2:'))).toBe(true)
    expect(buildAssistantCandidates.uniques.some(item => item.id.startsWith('fixture:'))).toBe(false)
  })

  it('ändert zielprofilabhängige Bewertungen zwischen Mapping und Boss', () => {
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

  it('rendert einen zusammenhängenden deutschen Ergebnisbericht mit allen V1-Bereichen', () => {
    const html = renderToStaticMarkup(<BuildAssistantResultSection analysis={runBuildAssistantV1(input())} equipment={equipment()}/>)
    for (const heading of ['Zusammenfassung', 'Ausrüstung', 'Hauptangriff und Supports', 'Passive Schwerpunkte', 'Juwelen und Cluster', 'Passende Uniques', 'Mapping', 'Boss', 'Nächste Verbesserungen']) expect(html).toContain(heading)
    expect(html).not.toContain('FESTE PLATZHALTERDATEN')
    expect(html).toContain('Mapping-Ranglisten')
    expect(html).toContain('Boss-Ranglisten')
    expect(html).toContain('Konkreter Pfad noch nicht berechnet')
  })
})
