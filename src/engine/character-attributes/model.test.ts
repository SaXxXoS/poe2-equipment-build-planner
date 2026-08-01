import { describe, expect, it } from 'vitest'
import type { EquipmentEntry } from '../../domain'
import { attributeDeficits, resolveCharacterAttributes } from './model'

const item = (slotId: string, stats: { statId: string; value: number }[]): EquipmentEntry => ({
  id: `item-${slotId}`,
  slotId,
  modifierValues: [{ id: `mod-${slotId}`, modifierId: 'attributes', value: 0, statValues: stats }],
})

describe('character attribute model', () => {
  it('verwendet gepinnte Klassen-Grundattribute und technische Ausrüstungsstats', () => {
    const result = resolveCharacterAttributes({
      classId: 'class-official-7',
      equipment: [item('helmet', [{ statId: 'additional_strength', value: 20 }, { statId: 'additional_all_attributes', value: 5 }])],
      activeSet: 'set-1',
    })
    expect(result.status).toBe('exact-confirmed-sources')
    expect(result.total).toEqual({ strength: 32, dexterity: 12, intelligence: 20 })
  })

  it('trennt Waffenattribute nach aktivem Waffenset', () => {
    const equipment = [
      item('weapon-set-1-left', [{ statId: 'additional_dexterity', value: 30 }]),
      item('weapon-set-2-left', [{ statId: 'additional_intelligence', value: 40 }]),
    ]
    expect(resolveCharacterAttributes({ classId: 'class-official-9', equipment, activeSet: 'set-1' }).total).toEqual({ strength: 11, dexterity: 41, intelligence: 7 })
    expect(resolveCharacterAttributes({ classId: 'class-official-9', equipment, activeSet: 'set-2' }).total).toEqual({ strength: 11, dexterity: 11, intelligence: 47 })
  })

  it('berechnet konkrete Defizite statt eines pauschalen Zielwerts', () => {
    expect(attributeDeficits({ strength: 40, intelligence: 10 }, { strength: 32, dexterity: 12, intelligence: 20 })).toEqual({ strength: 8, dexterity: 0, intelligence: 0 })
  })

  it('blockiert unbekannte Klassen fail-closed', () => {
    expect(resolveCharacterAttributes({ classId: 'unknown', equipment: [], activeSet: 'set-1' })).toMatchObject({ status: 'blocked-unknown-class', total: { strength: 0, dexterity: 0, intelligence: 0 } })
  })

  it('verarbeitet gepinnte kombinierte Attributzeilen deterministisch', () => {
    const passiveTree = { metadata: { releaseTag: '0.5.2' }, connections: [], nodes: [{ id: 'pair', name: 'Strength and Dexterity', nodeType: 'normal', stats: [{ sourceText: '+10 to [Strength|Strength] and [Dexterity|Dexterity]' }] }] }
    const realPassivePlanning = { pipelineResult: { allocatedNodeIds: ['pair'] } }
    const result = resolveCharacterAttributes({ classId: 'class-official-9', equipment: [], activeSet: 'set-1', passiveTree: passiveTree as never, realPassivePlanning: realPassivePlanning as never })

    expect(result.total).toEqual({ strength: 21, dexterity: 21, intelligence: 7 })
    expect(result.blockedPassiveLines).toEqual([])
  })

  it('wendet erhöhte und weniger Attribute nach den flachen Werten an', () => {
    const passiveTree = { metadata: { releaseTag: '0.5.2' }, connections: [], nodes: [
      { id: 'flat', name: 'Strength', nodeType: 'normal', stats: [{ sourceText: '+10 to [Strength]' }] },
      { id: 'increased', name: 'Attributes', nodeType: 'normal', stats: [{ sourceText: '20% increased [Attributes]' }] },
      { id: 'less', name: 'Less Attributes', nodeType: 'notable', stats: [{ sourceText: '20% less [Attributes]' }] },
    ] }
    const realPassivePlanning = { pipelineResult: { allocatedNodeIds: ['flat', 'increased', 'less'] } }
    const result = resolveCharacterAttributes({ classId: 'class-official-6', equipment: [], activeSet: 'set-1', passiveTree: passiveTree as never, realPassivePlanning: realPassivePlanning as never })

    expect(result.total).toEqual({ strength: 24, dexterity: 6, intelligence: 6 })
    expect(result.passives).toEqual({ strength: 9, dexterity: -1, intelligence: -1 })
  })

  it('lässt wählbare und bedingte Attributzeilen weiter fail-closed', () => {
    const passiveTree = { metadata: { releaseTag: '0.5.2' }, connections: [], nodes: [
      { id: 'choice', name: 'Attribute', nodeType: 'normal', stats: [{ sourceText: '+5 to any [Attributes|Attribute]' }] },
      { id: 'conditional', name: 'Body Armour Strength', nodeType: 'notable', stats: [{ sourceText: 'Body Armour grants 20% increased [Strength]' }] },
    ] }
    const realPassivePlanning = { pipelineResult: { allocatedNodeIds: ['choice', 'conditional'] } }
    const result = resolveCharacterAttributes({ classId: 'class-official-6', equipment: [], activeSet: 'set-1', passiveTree: passiveTree as never, realPassivePlanning: realPassivePlanning as never })

    expect(result.total).toEqual({ strength: 15, dexterity: 7, intelligence: 7 })
    expect(result.blockedPassiveLines).toEqual(['+5 to any Attribute', 'Body Armour grants 20% increased Strength'])
  })

})
