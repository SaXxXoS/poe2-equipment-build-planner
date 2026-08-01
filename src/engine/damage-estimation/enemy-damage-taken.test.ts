import { describe, expect, it } from 'vitest'
import { applyEnemyMitigation } from './enemy-mitigation'

describe('gegnerseitige erhöhte Schadensaufnahme',()=>{
  it('wendet typisierte Schadensaufnahme nach Widerstand auf Treffer an',()=>{
    const result=applyEnemyMitigation([{type:'chaos',minimum:100,maximum:100}],{
      id:'withered',label:'Withered',source:'manual-comparison-profile',
      resistances:{chaos:25},damageTakenIncreased:{chaos:60},
    })
    expect(result.components[0]).toMatchObject({minimum:120,maximum:120,effectiveDefence:25})
  })

  it('begrenzt eine Verringerung der Schadensaufnahme bei minus 100 Prozent auf null',()=>{
    const result=applyEnemyMitigation([{type:'fire',minimum:100,maximum:100}],{
      id:'immune',label:'Immun',source:'manual-comparison-profile',damageTakenIncreased:{fire:-120},
    })
    expect(result.average).toBe(0)
  })
})
