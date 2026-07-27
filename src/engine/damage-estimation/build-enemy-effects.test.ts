import { describe,expect,it } from 'vitest'
import type { SkillGemDefinition,SkillSetup } from '../../domain'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'
import { applyBuildEnemyEffects } from './build-enemy-effects'

const skill=(id:string,nameEn:string):SkillGemDefinition=>({id,nameEn,displayNameDe:nameEn,tags:[],dataVersion:'test',source:'local-placeholder',status:'verified'})
const setup=(id:string,skillId:string):SkillSetup=>({id,skillId,role:'utility',weaponSet:'both',supportGemIds:[]})
const profile={id:'automatic',label:'Automatisch',source:'automatic-season-reference' as const}

describe('automatische belegte Gegnerwirkungen',()=>{
  it('übernimmt Elemental Weakness aus dem strukturierten Skillwert',()=>{
    const result=applyBuildEnemyEffects({profile,setups:[setup('curse','weakness')],skills:[skill('weakness','Elemental Weakness')],activeDamageTypes:['lightning'],weaponSet:'set-1'})
    expect(result.resistanceReduction).toEqual({fire:59,cold:59,lightning:59})
    expect(result.appliedEffects).toEqual([expect.objectContaining({sourceId:'weakness',kind:'resistance-reduction',value:59,evidence:'structured-exact',durationMs:7400,state:'assumed-active'})])
  })

  it('wendet die belegte verringerte Fluchwirkung für seltene und einzigartige Ziele an',()=>{
    const rare=applyBuildEnemyEffects({profile:{...profile,targetRarity:'rare'},setups:[setup('curse','weakness')],skills:[skill('weakness','Elemental Weakness')],activeDamageTypes:['fire'],weaponSet:'set-1'})
    const uniqueTarget=applyBuildEnemyEffects({profile:{...profile,targetRarity:'unique'},setups:[setup('curse','weakness')],skills:[skill('weakness','Elemental Weakness')],activeDamageTypes:['fire'],weaponSet:'set-1'})
    expect(rare.resistanceReduction?.fire).toBe(41.3)
    expect(uniqueTarget.resistanceReduction?.fire).toBe(29.5)
    expect(uniqueTarget.appliedEffects?.[0].effectiveValue).toBe(29.5)
  })

  it('wählt wegen des normalen Fluchlimits nur den stärksten relevanten Fluch',()=>{
    const result=applyBuildEnemyEffects({
      profile,setups:[setup('elemental','weakness'),setup('chaos','despair')],
      skills:[skill('weakness','Elemental Weakness'),skill('despair','Despair')],
      activeDamageTypes:['chaos'],weaponSet:'set-1',
    })
    expect(result.resistanceReduction).toEqual({chaos:49})
    expect(result.appliedEffects).toHaveLength(1)
    expect(result.appliedEffects?.[0].sourceId).toBe('despair')
  })

  it('erfasst strukturierten Rüstungsbruch, aber keine unbelegte Frost-Bomb-Exposition',()=>{
    const result=applyBuildEnemyEffects({
      profile,setups:[setup('breaker','breaker'),setup('bomb','bomb')],
      skills:[skill('breaker','Armour Breaker'),skill('bomb','Frost Bomb')],
      activeDamageTypes:['physical'],weaponSet:'set-1',
    })
    expect(result.armourBreak).toBe(4918)
    expect(result.appliedEffects).toEqual([expect.objectContaining({sourceId:'breaker',kind:'armour-break',value:4918})])
    expect(result.resistanceReduction).toBeUndefined()
  })

  it('berechnet Rüstungsbruch-Multiplikator, benötigte Treffer und vollständig gebrochene Rüstung',()=>{
    const oneHit=applyBuildEnemyEffects({
      profile:{...profile,targetRarity:'magic',armour:9000},
      setups:[setup('breaker','breaker')],skills:[skill('breaker','Armour Breaker')],
      activeDamageTypes:['physical'],weaponSet:'set-1',
    })
    expect(oneHit.armourBreak).toBe(9836)
    expect(oneHit.hitsToFullyBreakArmour).toBe(1)
    expect(oneHit.fullyBrokenArmour).toBe(true)
    expect(oneHit.appliedEffects?.[0]).toMatchObject({durationMs:12000,state:'fully-active'})

    const building=applyBuildEnemyEffects({
      profile:{...profile,targetRarity:'unique',armour:10000},
      setups:[setup('breaker','breaker')],skills:[skill('breaker','Armour Breaker')],
      activeDamageTypes:['physical'],weaponSet:'set-1',
    })
    expect(building.hitsToFullyBreakArmour).toBe(3)
    expect(building.fullyBrokenArmour).toBeUndefined()
    expect(building.appliedEffects?.[0].state).toBe('building')
  })

  it('übernimmt nur unbedingte, exakt lesbare Durchdringung aus belegten Baumknoten',()=>{
    const tree={metadata:{releaseTag:'test'},connections:[],nodes:[
      {id:'296',stats:[{sourceText:'Damage Penetrates 3% of Enemy Elemental Resistances'}]},
      {id:'conditional',stats:[{sourceText:'Damage Penetrates 20% Elemental Resistances while Shapeshifted'}]},
      {id:'asc',ascendancyId:'stormweaver',stats:[{sourceText:'Damage [Penetration|Penetrates] 8% [Resistances|Lightning Resistance]'}]},
    ]} as unknown as RealPassiveTree
    const planning={pipelineResult:{allocatedNodeIds:['296','conditional']},ascendancyPlanning:{allocatedNodeIds:['asc']}} as unknown as RealPassivePlanningIntegrationResult
    const result=applyBuildEnemyEffects({profile,setups:[],skills:[],activeDamageTypes:['lightning'],weaponSet:'set-1',passiveTree:tree,realPassivePlanning:planning})
    expect(result.penetration).toEqual({fire:3,cold:3,lightning:11})
    expect(result.appliedEffects).toHaveLength(2)
    expect(result.appliedEffects?.every(effect=>effect.conditional===false)).toBe(true)
  })

  it('ist bei identischer Eingabe deterministisch',()=>{
    const input={profile,setups:[setup('curse','weakness')],skills:[skill('weakness','Elemental Weakness')],activeDamageTypes:['fire' as const],weaponSet:'set-1' as const}
    expect(applyBuildEnemyEffects(input)).toEqual(applyBuildEnemyEffects(input))
  })
})
