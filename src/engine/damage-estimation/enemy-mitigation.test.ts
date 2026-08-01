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
