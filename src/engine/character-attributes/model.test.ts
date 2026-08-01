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
})
