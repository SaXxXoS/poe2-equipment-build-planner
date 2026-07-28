import { describe,expect,it } from 'vitest'
import type { EquipmentEntry } from '../../domain'
import type { UniqueRecommendation } from '../../engine'
import { createEquipmentSlotSuggestions } from './recommendations'

const equipment=(['set-1','set-2'] as const).flatMap(set=>['left','right'].map(hand=>({
  id:`${set}-${hand}`,
  slotId:`slot-weapon-${set}-${hand}`,
  modifierValues:[],
}))) as EquipmentEntry[]

describe('sichtbare Ausrüstungsvorschläge',()=>{
  it('legt Haupt- und Setup-Waffenart in getrennte leere Waffensets',()=>{
    const suggestions=createEquipmentSlotSuggestions({
      equipment,
      optimization:{
        evaluatedSkillCount:1,evaluatedCombinationCount:1,blockedCombinationCount:0,
        equipmentFirst:false,status:'selected',alternatives:[],
        selected:{
          skillId:'spark',weaponType:'wand',weaponLabel:'Zauberstab',
          mainWeaponSet:'set-1',setupSkillId:'orb',setupWeaponType:'wand',
          compatibleSupportIds:[],affinityScore:1,passiveAffinityScore:1,
          analyzerScore:1,modeledDps:null,totalScore:1,reasons:[],
        },
      },
      uniqueRecommendations:[],
      uniqueNames:new Map(),
    })
    expect(suggestions).toMatchObject([
      {slotId:'slot-weapon-set-1-left',title:'Zauberstab'},
      {slotId:'slot-weapon-set-2-left',title:'Zauberstab'},
    ])
  })

  it('überschreibt keine vorhandene Waffe und zeigt nur positive gültige Uniques',()=>{
    const equipped=equipment.map(item=>item.slotId==='slot-weapon-set-1-left'?{...item,itemClassId:'Wands'}:item)
    const unique={valid:true,totalScore:10,itemSlot:'helmet',uniqueId:'unique-helmet',buildEnabler:false} as UniqueRecommendation
    const suggestions=createEquipmentSlotSuggestions({
      equipment:[...equipped,{id:'helmet',slotId:'slot-helmet',modifierValues:[]}],
      optimization:null,
      uniqueRecommendations:[unique,{...unique,uniqueId:'blocked',valid:false}],
      uniqueNames:new Map([['unique-helmet','Deutscher Unique-Name']]),
    })
    expect(suggestions).toEqual([{
      slotId:'slot-helmet',
      title:'Deutscher Unique-Name',
      detail:'Passender Unique-Kandidat',
      source:'unique-analyzer',
      uniqueItemId:'unique-helmet',
      reasons:[],
      tradeOffs:[],
    }])
  })

  it('behält ein vom Unique Analyzer als gültig bewertetes Waffen-Unique bei',()=>{
    const bow={valid:true,totalScore:10,itemSlot:'weapon',uniqueId:'unique-bow',buildEnabler:false} as UniqueRecommendation
    const suggestions=createEquipmentSlotSuggestions({
      equipment,
      optimization:{
        evaluatedSkillCount:1,evaluatedCombinationCount:1,blockedCombinationCount:0,
        equipmentFirst:true,status:'selected',alternatives:[],
        selected:{
          skillId:'snap',weaponType:'wand',weaponLabel:'Zauberstab',
          mainWeaponSet:'set-1',compatibleSupportIds:[],affinityScore:1,
          passiveAffinityScore:1,analyzerScore:1,modeledDps:null,totalScore:1,reasons:[],
        },
      },
      uniqueRecommendations:[bow],
      uniqueNames:new Map([['unique-bow','Peripherie']]),
    })
    expect(suggestions.some(value=>value.uniqueItemId==='unique-bow')).toBe(true)
  })
})
