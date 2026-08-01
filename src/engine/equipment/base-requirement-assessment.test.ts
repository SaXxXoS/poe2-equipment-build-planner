import { describe, expect, it } from 'vitest'
import type { EquipmentEntry } from '../../domain'
import type { CharacterAttributeModel, CharacterAttributeValues } from '../character-attributes/model'
import { assessEquipmentBaseRequirements, maximumEquipmentRequirements } from './base-requirement-assessment'

const model=(total:CharacterAttributeValues,set:'set-1'|'set-2'):CharacterAttributeModel=>({modelVersion:'pinned-tree-0.5.2-v1',activeSet:set,status:'exact-confirmed-sources',base:{strength:7,dexterity:7,intelligence:15},equipment:{strength:0,dexterity:0,intelligence:0},passives:{strength:0,dexterity:0,intelligence:0},total,blockedPassiveLines:[],sourceReferences:[]})
const entry=(overrides:Partial<EquipmentEntry>={}):EquipmentEntry=>({id:'bow',slotId:'slot-weapon-set-1-left',modifierValues:[],itemDefinitionId:'pob2-weapon-base:Bow:Adherent Bow:2',baseDisplayName:'Adherent Bow',...overrides})

describe('equipment base requirement assessment',()=>{
  it('blocks an entered base when level is too low',()=>{
    const result=assessEquipmentBaseRequirements({equipment:[entry()],characterLevel:50,attributesWithoutEntry:(_,set)=>model({strength:200,dexterity:200,intelligence:200},set)})
    expect(result.blockedItems[0]?.status).toBe('blocked-level')
    expect(result.violations[0]?.code).toBe('base-level-requirement')
  })
  it('checks only the active weapon set and reports the exact deficit',()=>{
    const result=assessEquipmentBaseRequirements({equipment:[entry()],characterLevel:90,attributesWithoutEntry:(_,set)=>model({strength:20,dexterity:set==='set-1'?90:1,intelligence:20},set)})
    expect(result.blockedItems[0]?.missing.dexterity).toBe(14)
    expect(result.items[0]?.activeSets).toEqual(['set-1'])
  })
  it('requires shared armour to be wearable in both sets',()=>{
    const armour=entry({id:'armour',slotId:'slot-body-armour',itemDefinitionId:'pob2-equipment-base:Body Armour:Abyssal Cuirass:0',baseDisplayName:'Abyssal Cuirass'})
    const result=assessEquipmentBaseRequirements({equipment:[armour],characterLevel:90,attributesWithoutEntry:(_,set)=>model({strength:set==='set-1'?130:100,dexterity:20,intelligence:20},set)})
    expect(result.blockedItems[0]?.missing.strength).toBe(21)
    expect(result.items[0]?.activeSets).toEqual(['set-1','set-2'])
  })
  it('keeps an unresolved visible base fail-closed and derives maximum known requirements',()=>{
    const unknown=entry({itemDefinitionId:undefined,baseDisplayName:'OCR base'})
    const result=assessEquipmentBaseRequirements({equipment:[unknown],characterLevel:90,attributesWithoutEntry:(_,set)=>model({strength:200,dexterity:200,intelligence:200},set)})
    expect(result.status).toBe('partial')
    expect(result.unresolvedItems).toHaveLength(1)
    expect(maximumEquipmentRequirements([entry()],'set-1').dexterity).toBe(104)
  })
  it('resolves an exact visible OCR base name without fuzzy matching',()=>{
    const helmet=entry({id:'helmet',slotId:'slot-helmet',itemDefinitionId:undefined,itemClassId:'Helmets',baseDisplayName:'AHNENTIARA'})
    const result=assessEquipmentBaseRequirements({equipment:[helmet],characterLevel:80,attributesWithoutEntry:(_,set)=>model({strength:20,dexterity:20,intelligence:115},set)})
    expect(result.items[0]).toMatchObject({status:'met',requiredLevel:80})
  })
})
