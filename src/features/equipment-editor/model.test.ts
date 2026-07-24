import { describe, expect, it } from 'vitest'
import type { EquipmentEntry } from '../../domain'
import { appliedModifierId, createManualProperty, inferItemRarity, migrateEquipmentEntry, modifiersFor, numericPropertyValues, RARITY_LIMITS } from './model'
import { cleanAffixText } from './affix-display'

const entry = (values: EquipmentEntry['modifierValues'] = []): EquipmentEntry => ({ id:'equipment-slot-helmet', slotId:'slot-helmet', modifierValues:values })

describe('V1.3 equipment editor model', () => {
  it('defines explicit rarity limits', () => {
    expect(RARITY_LIMITS.rare).toEqual({ prefix:3, suffix:3 })
    expect(RARITY_LIMITS.magic).toEqual({ prefix:1, suffix:1 })
    expect(RARITY_LIMITS.normal).toEqual({ prefix:0, suffix:0 })
  })
  it('keeps six explicit modifiers and an implicit separately addressable', () => {
    const values = [
      ...Array.from({ length:3 }, (_, index) => ({ id:appliedModifierId('e','prefix',index), modifierId:`p${index}`, value:index, affixSide:'prefix' as const })),
      ...Array.from({ length:3 }, (_, index) => ({ id:appliedModifierId('e','suffix',index), modifierId:`s${index}`, value:index, affixSide:'suffix' as const })),
      { id:appliedModifierId('e','implicit',0), modifierId:'i', value:1, affixSide:'implicit' as const },
    ]
    expect(modifiersFor(entry(values),'prefix')).toHaveLength(3)
    expect(modifiersFor(entry(values),'suffix')).toHaveLength(3)
    expect(modifiersFor(entry(values),'implicit')).toHaveLength(1)
    expect(inferItemRarity(entry(values))).toBe('rare')
  })
  it('migrates former entries deterministically without losing actual values', () => {
    const legacy = entry([{ id:'', modifierId:'legacy', value:42, affixSide:'prefix', statValues:[{ statId:'stat', value:42 }] }])
    expect(migrateEquipmentEntry(legacy)).toMatchObject({ rarity:'magic', modifierValues:[{ id:'equipment-slot-helmet:prefix:1', statValues:[{ value:42 }] }] })
  })
  it('migrates all observed image lines into editable dynamic properties',()=>{
    const migrated=migrateEquipmentEntry({...entry(),observedItemLines:['+120 TO MAXIMUM LIFE','95% INCREASED ENERGY SHIELD'],observedImplicitLines:['95% INCREASED ENERGY SHIELD']})
    expect(migrated.properties).toEqual([
      expect.objectContaining({kind:'unknown',text:'+120 TO MAXIMUM LIFE',values:[120],source:'ocr',confirmed:false}),
      expect.objectContaining({kind:'implicit',text:'95% INCREASED ENERGY SHIELD',values:[95],source:'ocr',confirmed:false}),
    ])
  })
  it('supports arbitrary manual properties and actual numeric values',()=>{
    expect(numericPropertyValues('Adds 12 to 45 Fire Damage')).toEqual([12,45])
    expect(createManualProperty('item',7)).toEqual({id:'item:manual:8',kind:'unknown',text:'',values:[],source:'manual',confirmed:true})
  })
  it('removes parser separators from visible text', () => {
    expect(cleanAffixText('[Accuracy|Accuracy|]')).not.toContain('|')
  })
})
