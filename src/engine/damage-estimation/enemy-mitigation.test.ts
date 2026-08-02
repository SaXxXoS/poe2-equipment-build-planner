import {describe,expect,it} from 'vitest'
import {applyEnemyMitigation} from './enemy-mitigation'

describe('vollständig gebrochene Rüstung',()=>{
  it('wendet die belegte Wirkung nur auf freigegebene Trefferschadensarten an',()=>{
    const result=applyEnemyMitigation([
      {type:'physical',minimum:100,maximum:100},
      {type:'fire',minimum:100,maximum:100},
      {type:'cold',minimum:100,maximum:100},
    ],{
      id:'test',label:'Test',source:'manual-comparison-profile',armour:5000,resistances:{fire:0,cold:0},
      fullyBrokenArmour:true,fullyBrokenArmourEffect:{physical:23,fire:23},
    })
    expect(result.components).toEqual([
      expect.objectContaining({type:'physical',minimum:123,maximum:123}),
      expect.objectContaining({type:'fire',minimum:123,maximum:123}),
      expect.objectContaining({type:'cold',minimum:100,maximum:100}),
    ])
  })
})

describe('erwartete ignorierte physische Schadensreduktion',()=>{
  it('mischt bei 20 Prozent Chance den normalen und den ignorierenden Trefferzweig',()=>{
    const result=applyEnemyMitigation([{type:'physical',minimum:100,maximum:100}],{
      id:'test',label:'Test',source:'manual-comparison-profile',armour:1000,damageTakenIncreased:{physical:25},
    },{physicalDamageReductionIgnoreChancePercent:20})
    expect(result.components[0]).toMatchObject({minimum:75,maximum:75,mitigationPercent:40})
  })
  it('wendet die Trefferchance nicht auf nichtphysischen Schaden an',()=>{
    const result=applyEnemyMitigation([{type:'fire',minimum:100,maximum:100}],{
      id:'test',label:'Test',source:'manual-comparison-profile',resistances:{fire:50},
    },{physicalDamageReductionIgnoreChancePercent:100})
    expect(result.components[0]).toMatchObject({minimum:50,maximum:50,mitigationPercent:50})
  })
})
