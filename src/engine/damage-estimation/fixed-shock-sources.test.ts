import { describe,expect,it } from 'vitest'
import type { EquipmentEntry } from '../../domain'
import { resolveBlockedFixedShockSources } from './fixed-shock-sources'

const wakeId='pob2:src/Data/Uniques/boots.lua#21'
const wake=(variant?:string):EquipmentEntry=>({
  id:'boots',slotId:'boots',modifierValues:[],rarity:'unique',
  uniqueItemId:wakeId,...(variant?{uniqueVariantId:variant}:{}),
})

describe('feste Schockquellen aus Ausrüstung',()=>{
  it('erkennt Wake of Destruction mit gepinnter Grundwirkung und Wirkzeit',()=>{
    expect(resolveBlockedFixedShockSources([wake()])).toEqual([expect.objectContaining({
      source:'equipment',sourceId:wakeId,kind:'fixed-shock',value:20,durationMs:8000,
      activationCondition:'enemy-on-shocked-ground',reason:'enemy-ground-occupancy-unconfirmed',
      evidence:'text-pattern-exact',
    })])
  })

  it('erkennt die gemeinsame Linie auch für die aktuelle Variante',()=>{
    const result=resolveBlockedFixedShockSources([wake('src/Data/Uniques/boots.lua#21:variant:2')])
    expect(result).toHaveLength(1)
    expect(result[0].sourceReferences[0]).toContain('src/Data/Uniques/boots.lua#21:line:4')
  })

  it('erzeugt aus bloßem OCR- oder manuellem Text keine feste Schockquelle',()=>{
    const observed={
      id:'boots',slotId:'boots',modifierValues:[],
      observedItemLines:['Drop Shocked Ground while moving, lasting 8 seconds'],
      properties:[{id:'line',kind:'unknown',text:'Drop Shocked Ground while moving, lasting 8 seconds',values:[8],source:'ocr',confirmed:true}],
    } satisfies EquipmentEntry
    expect(resolveBlockedFixedShockSources([observed])).toEqual([])
  })

  it('ignoriert andere Unique-Gegenstände deterministisch',()=>{
    const other={id:'other',slotId:'boots',modifierValues:[],rarity:'unique',uniqueItemId:'pob2:other'} satisfies EquipmentEntry
    expect(resolveBlockedFixedShockSources([other])).toEqual([])
  })
})
