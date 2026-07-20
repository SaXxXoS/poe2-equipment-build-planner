import { describe, expect, it } from 'vitest'
import { placeholderDataSet } from '../data'
import { findDuplicateIds, validateAscendancyReferences, validateModifierValues, validatePassiveConnections, validatePlaceholderData, validateSkillReferences } from './validation'

describe('normalisierte Platzhalterdaten', () => {
  it('verwendet innerhalb jeder Datenart eindeutige IDs', () => {
    const groups = [placeholderDataSet.classes, placeholderDataSet.ascendancies, placeholderDataSet.equipmentSlots, placeholderDataSet.modifierDefinitions, placeholderDataSet.skillDefinitions, placeholderDataSet.supportDefinitions, placeholderDataSet.skillSetups, placeholderDataSet.passiveNodes, placeholderDataSet.passiveConnections]
    expect(groups.flatMap(group => findDuplicateIds(group.map(item => item.id)))).toEqual([])
  })
  it('verwendet gültige Klassen- und Aszendenzreferenzen', () => { expect(validateAscendancyReferences(placeholderDataSet.classes, placeholderDataSet.ascendancies)).toEqual([]) })
  it('verwendet gültige Skill- und Supportreferenzen', () => { expect(validateSkillReferences(placeholderDataSet.skillDefinitions, placeholderDataSet.supportDefinitions, placeholderDataSet.skillSetups)).toEqual([]) })
  it('verwendet gültige passive Verbindungen', () => { expect(validatePassiveConnections(placeholderDataSet.passiveNodes, placeholderDataSet.passiveConnections)).toEqual([]) })
  it('akzeptiert Modifierwerte innerhalb ihrer Grenzen', () => { const definition = placeholderDataSet.modifierDefinitions[0]; expect(validateModifierValues([definition], [{ id: 'applied-valid', modifierId: definition.id, value: 100 }])).toEqual([]) })
  it('validiert den vollständigen vorhandenen Platzhalterdatensatz', () => { expect(validatePlaceholderData(placeholderDataSet)).toEqual([]) })
  it('erkennt absichtlich fehlerhafte Referenzen, Werte und Platzhalterstatus', () => {
    const broken = { ...placeholderDataSet, ascendancies: [{ ...placeholderDataSet.ascendancies[0], classId: 'class-missing' }], skillSetups: [{ ...placeholderDataSet.skillSetups[0], skillId: 'skill-missing', supportGemIds: ['support-missing'] }], passiveConnections: [{ id: 'connection-broken', fromNodeId: 'node-missing', toNodeId: placeholderDataSet.passiveNodes[0].id, selected: false }], appliedModifiers: [{ id: 'applied-invalid', modifierId: placeholderDataSet.modifierDefinitions[0].id, value: 999 }], buildResult: { ...placeholderDataSet.buildResult, isPlaceholder: false } }
    const errors = validatePlaceholderData(broken)
    expect(errors).toHaveLength(6); expect(errors.join('\n')).toContain('unbekannte Klasse'); expect(errors.join('\n')).toContain('unbekannter Skill'); expect(errors.join('\n')).toContain('unbekannter Support'); expect(errors.join('\n')).toContain('unbekannter Knoten'); expect(errors.join('\n')).toContain('über Maximum'); expect(errors.join('\n')).toContain('Platzhalter')
  })
})
