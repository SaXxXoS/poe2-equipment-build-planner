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
        numericallyComparableCombinationCount:0,optimizationStatus:'structural-only',
        equipmentFirst:false,status:'selected',alternatives:[],
        selected:{
          skillId:'spark',skillName:'Funken',weaponType:'wand',weaponLabel:'Zauberstab',
          mainWeaponSet:'set-1',skillTags:['lightning','projectile'],
          setupSkillId:'orb',setupSkillName:'Gewittersphäre',setupSkillTags:['lightning','area'],setupWeaponType:'wand',
          compatibleSupportIds:[],affinityScore:1,passiveAffinityScore:1,
          analyzerScore:1,modeledDps:null,damageObjectiveScore:0,numericCoverageStatus:'unavailable',totalScore:1,reasons:[],
        },
      },
      uniqueRecommendations:[],
      uniqueNames:new Map(),
    })
    expect(suggestions).toMatchObject([
      {slotId:'slot-weapon-set-1-left',itemClassId:'Wands',detail:'Waffenset 1 · Hauptwaffe für Funken'},
      {slotId:'slot-weapon-set-2-left',itemClassId:'Wands',detail:'Waffenset 2 · Setup-Waffe für Gewittersphäre'},
    ])
    expect(suggestions[0].title).not.toBe(suggestions[1].title)
  })

  it('überschreibt keine vorhandene Waffe und zeigt nur positive gültige Uniques',()=>{
    const equipped=equipment.map(item=>item.slotId==='slot-weapon-set-1-left'?{...item,itemClassId:'Wands'}:item)
    const unique={valid:true,totalScore:10,itemSlot:'helmet',uniqueId:'unique-helmet',buildEnabler:false,damageScore:10,replacementVerdict:'clear-upgrade'} as UniqueRecommendation
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
    const bow={valid:true,totalScore:10,itemSlot:'weapon',uniqueId:'unique-bow',buildEnabler:false,damageScore:10,replacementVerdict:'clear-upgrade'} as UniqueRecommendation
    const suggestions=createEquipmentSlotSuggestions({
      equipment,
      optimization:{
        evaluatedSkillCount:1,evaluatedCombinationCount:1,blockedCombinationCount:0,
        numericallyComparableCombinationCount:0,optimizationStatus:'structural-only',
        equipmentFirst:true,status:'selected',alternatives:[],
        selected:{
          skillId:'snap',skillName:'Zerschlagen',weaponType:'wand',weaponLabel:'Zauberstab',
          mainWeaponSet:'set-1',compatibleSupportIds:[],affinityScore:1,
          passiveAffinityScore:1,analyzerScore:1,modeledDps:null,damageObjectiveScore:0,numericCoverageStatus:'unavailable',totalScore:1,reasons:[],
        },
      },
      uniqueRecommendations:[bow],
      uniqueNames:new Map([['unique-bow','Peripherie']]),
    })
    expect(suggestions.some(value=>value.uniqueItemId==='unique-bow')).toBe(true)
  })

  it('liefert für belegte Waffenarten eine konkrete gepinnte Basis mit Grundwerten',()=>{
    const suggestions=createEquipmentSlotSuggestions({
      equipment,
      optimization:{
        evaluatedSkillCount:1,evaluatedCombinationCount:1,blockedCombinationCount:0,
        numericallyComparableCombinationCount:0,optimizationStatus:'structural-only',
        equipmentFirst:false,status:'selected',alternatives:[],
        selected:{
          skillId:'bow-skill',skillName:'Bogenfertigkeit',weaponType:'bow',weaponLabel:'Bogen',
          mainWeaponSet:'set-1',compatibleSupportIds:[],affinityScore:1,
          passiveAffinityScore:1,analyzerScore:1,modeledDps:null,
          damageObjectiveScore:0,numericCoverageStatus:'unavailable',
          totalScore:1,reasons:[],
        },
      },
      uniqueRecommendations:[],
      uniqueNames:new Map(),
    })
    expect(suggestions[0]).toMatchObject({
      slotId:'slot-weapon-set-1-left',
      source:'weapon-optimizer',
      itemClassId:'Bows',
    })
    expect(suggestions[0].itemDefinitionId).toBeTruthy()
    expect(suggestions[0].baseDisplayName).toBeTruthy()
    expect(suggestions[0].weaponStats?.attacksPerSecond).toBeGreaterThan(0)
    expect(suggestions[0].weaponStats?.physicalDamage?.maximum).toBeGreaterThan(0)
  })

  it('unterdrückt ein Unique ohne positive, widerspruchsfreie Build-Wirkung',()=>{
    const misleading={
      valid:true,totalScore:40,itemSlot:'ring',uniqueId:'ventor',buildEnabler:false,
      damageScore:0,defenceScore:10,resourceScore:0,ascendancySynergyScore:0,
      supportsCurrentBuild:false,tradeOffs:['negative-roll-range'],
      replacementVerdict:'situational-upgrade',
    } as UniqueRecommendation
    expect(createEquipmentSlotSuggestions({
      equipment:[...equipment,{id:'ring',slotId:'slot-ring-1',modifierValues:[]}],
      optimization:null,
      uniqueRecommendations:[misleading],
      uniqueNames:new Map([['ventor','Ventors Glücksspiel']]),
    })).toEqual([])
  })
})
