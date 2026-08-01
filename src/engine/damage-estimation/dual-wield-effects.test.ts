import { describe,expect,it } from 'vitest'
import type { EquipmentEntry,SkillGemDefinition } from '../../domain'
import { harmonicMean,resolveDualWieldAttackModel } from './dual-wield-effects'

const skill:SkillGemDefinition={id:'earthquake',nameEn:'Earthquake',displayNameDe:'Erdbeben',tags:['attack','melee'],requiredWeaponTypes:['mace'],dataVersion:'test',source:'local-placeholder',status:'verified'}
const entry=(hand:'left'|'right',name:string):EquipmentEntry=>({id:hand,slotId:`slot-weapon-set-1-${hand}`,baseDisplayName:name,modifierValues:[]})
const references:Record<string,{name:string;type:string;tags:string[]}>= {
  Club:{name:'Club',type:'One Hand Mace',tags:['weapon','one_hand_weapon']},
  Hammer:{name:'Hammer',type:'One Hand Mace',tags:['weapon','one_hand_weapon']},
  Bow:{name:'Bow',type:'Bow',tags:['weapon','two_hand_weapon']},
}
const resolve=(item:EquipmentEntry)=>references[item.baseDisplayName!]
const stats={'active_skill_damage_+%_final_while_dual_wielding':-30}

describe('strukturierte Dual-Wield-Wirkung',()=>{
  it('wendet den Malus und zwei Treffer nur bei zwei kompatiblen Einhandwaffen an',()=>{
    expect(resolveDualWieldAttackModel({skill,numericStats:stats,equipment:[entry('left','Club'),entry('right','Hammer')],weaponSet:'set-1',resolveWeapon:resolve})).toMatchObject({status:'applied',damageMultiplier:.7,hitSequenceMultiplier:2,evidence:'structured-exact'})
  })
  it('aktiviert den Effekt bei nur einer Hand nicht',()=>{
    expect(resolveDualWieldAttackModel({skill,numericStats:stats,equipment:[entry('left','Club')],weaponSet:'set-1',resolveWeapon:resolve})).toMatchObject({status:'single-weapon',damageMultiplier:1,hitSequenceMultiplier:1})
  })
  it('blockiert Zweihandwaffen und unaufgelöste Waffen fail-closed',()=>{
    expect(resolveDualWieldAttackModel({skill,numericStats:stats,equipment:[entry('left','Club'),entry('right','Bow')],weaponSet:'set-1',resolveWeapon:resolve}).status).toBe('blocked-not-two-one-hand-weapons')
    expect(resolveDualWieldAttackModel({skill,numericStats:stats,equipment:[entry('left','Club'),entry('right','Unknown')],weaponSet:'set-1',resolveWeapon:resolve}).status).toBe('blocked-unresolved-weapon')
  })
  it('verwendet für zwei abwechselnde Waffen die harmonische Wirkfrequenz',()=>{
    expect(harmonicMean(1,2)).toBeCloseTo(4/3)
  })
})
