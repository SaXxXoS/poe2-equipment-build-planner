import { describe,expect,it } from 'vitest'
import { resolveConditionalHitEffects } from './conditional-hit-effects'

const stats={'lightning_conduit_damage_+%_final_per_5%_increased_damage_taken_from_shock':10}

describe('conditional hit effects',()=>{
  it('applies Lightning Conduit more hit damage in full five-percent shock steps',()=>{
    const result=resolveConditionalHitEffects({
      sourceRecordId:'LightningConduitPlayer',skillName:'Lightning Conduit',numericStats:stats,
      enemyProfile:{
        id:'target',label:'Target',source:'manual-comparison-profile',
        appliedEffects:[{
          source:'skill',sourceId:'shock-source',label:'Shock',kind:'damage-taken-increased',
          damageTypes:['lightning'],value:23,effectiveValue:23,evidence:'structured-exact',sourceReference:'test',conditional:true,
          uptimeStatus:'maintainable',state:'fully-active',effectGroup:'shock',selectionStatus:'selected-strongest',
        }],
      },
    })
    expect(result.damageMultiplier).toBe(1.4)
    expect(result.effects[0]).toMatchObject({conditionValue:23,appliedSteps:4,totalMoreDamagePercent:40})
  })

  it('does not invent the conditional bonus without confirmed shock effect',()=>{
    const result=resolveConditionalHitEffects({sourceRecordId:'LightningConduitPlayer',skillName:'Lightning Conduit',numericStats:stats})
    expect(result.damageMultiplier).toBe(1)
    expect(result.effects).toEqual([])
    expect(result.blockedEffects[0]?.reason).toBe('enemy-shock-effect-not-confirmed')
  })

  it('does not apply the stat to another skill',()=>{
    const result=resolveConditionalHitEffects({sourceRecordId:'ArcPlayer',skillName:'Arc',numericStats:stats})
    expect(result).toMatchObject({damageMultiplier:1,effects:[],blockedEffects:[]})
  })
})
