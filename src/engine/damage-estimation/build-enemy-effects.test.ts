import { describe,expect,it } from 'vitest'
import type { EquipmentEntry,SkillGemDefinition,SkillSetup,SupportGemDefinition } from '../../domain'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'
import { applyBuildEnemyEffects,resolveAllocatedShockModifiers } from './build-enemy-effects'

const skill=(id:string,nameEn:string):SkillGemDefinition=>({id,nameEn,displayNameDe:nameEn,tags:[],dataVersion:'test',source:'local-placeholder',status:'verified'})
const setup=(id:string,skillId:string):SkillSetup=>({id,skillId,role:'utility',weaponSet:'both',supportGemIds:[]})
const support=(id:string,nameEn:string):SupportGemDefinition=>({id,nameEn,displayNameDe:nameEn,tags:[],requiredTags:[],excludedTags:[],ownTags:[],dataVersion:'test',source:'local-placeholder',status:'verified'})
const profile={id:'automatic',label:'Automatisch',source:'automatic-season-reference' as const}

describe('automatische belegte Gegnerwirkungen',()=>{
  it('übernimmt Elemental Weakness aus dem strukturierten Skillwert',()=>{
    const result=applyBuildEnemyEffects({profile,setups:[setup('curse','weakness')],skills:[skill('weakness','Elemental Weakness')],activeDamageTypes:['lightning'],weaponSet:'set-1'})
    expect(result.resistanceReduction).toEqual({fire:59,cold:59,lightning:59})
    expect(result.appliedEffects).toEqual([expect.objectContaining({
      sourceId:'weakness',kind:'resistance-reduction',value:59,evidence:'structured-exact',
      durationMs:7400,activationTimeMs:700,uptimeStatus:'windowed',state:'assumed-active',
    })])
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

  it('berechnet Withered aus belegter Stapelwirkung, Wirkzeit und Kanalisierungszeit',()=>{
    const result=applyBuildEnemyEffects({
      profile,setups:[setup('wither','wither')],skills:[skill('wither','Wither')],
      activeDamageTypes:['chaos'],weaponSet:'set-1',
    })
    expect(result.damageTakenIncreased).toEqual({chaos:60})
    expect(result.appliedEffects).toEqual([expect.objectContaining({
      sourceId:'wither',kind:'damage-taken-increased',value:60,
      stackCount:10,maximumStacks:10,durationMs:2950,activationTimeMs:250,
      applicationRatePerSecond:4,timeToFullEffectMs:2500,
      uptimeStatus:'maintainable',state:'fully-active',evidence:'structured-exact',
    })])
  })

  it('wendet Withered weder auf den falschen Waffensatz noch auf Nicht-Chaosschaden an',()=>{
    const set2={...setup('wither','wither'),weaponSet:'set-2' as const}
    const wrongSet=applyBuildEnemyEffects({profile,setups:[set2],skills:[skill('wither','Wither')],activeDamageTypes:['chaos'],weaponSet:'set-1'})
    const wrongType=applyBuildEnemyEffects({profile,setups:[setup('wither','wither')],skills:[skill('wither','Wither')],activeDamageTypes:['fire'],weaponSet:'set-1'})
    expect(wrongSet.damageTakenIncreased).toBeUndefined()
    expect(wrongType.damageTakenIncreased).toBeUndefined()
  })

  it('berechnet einen aufrechterhaltbaren Schock aus Treffer, Schwelle, Chance und intrinsischem Skillmodifikator',()=>{
    const result=applyBuildEnemyEffects({
      profile,setups:[setup('ball','ball')],skills:[skill('ball','Ball Lightning')],
      activeDamageTypes:['lightning'],weaponSet:'set-1',
      primaryShockContext:{
        skillId:'ball',enemyAilmentThreshold:1000,lightningHitAverage:100,lightningCriticalHitAverage:200,
        hitChancePercent:100,criticalHitChancePercent:20,actionsPerSecond:2,
      },
    })
    expect(result.damageTakenIncreased).toEqual({physical:22.33,fire:22.33,cold:22.33,lightning:22.33,chaos:22.33})
    expect(result.appliedEffects).toEqual([expect.objectContaining({
      sourceId:'ball',kind:'damage-taken-increased',value:22.33,effectiveValue:22.33,
      durationMs:8000,applicationRatePerSecond:0.285,estimatedUptime:1,
      uptimeStatus:'maintainable',state:'fully-active',evidence:'structured-exact',
    })])
  })

  it('erzeugt ohne aufrechterhaltbare Schockrate keinen produktiven Schadensbonus',()=>{
    const result=applyBuildEnemyEffects({
      profile,setups:[setup('ball','ball')],skills:[skill('ball','Ball Lightning')],
      activeDamageTypes:['lightning'],weaponSet:'set-1',
      primaryShockContext:{
        skillId:'ball',enemyAilmentThreshold:1000,lightningHitAverage:10,lightningCriticalHitAverage:20,
        hitChancePercent:50,criticalHitChancePercent:5,actionsPerSecond:0.1,
      },
    })
    expect(result.damageTakenIncreased).toBeUndefined()
    expect(result.appliedEffects?.[0]).toMatchObject({effectiveValue:0,uptimeStatus:'unresolved',state:'building'})
  })

  it('wendet Lightning Exposure nur über einen aufrechterhaltbaren Schock derselben Fertigkeit an',()=>{
    const exposedSetup={...setup('ball','ball'),supportGemIds:['lightning-exposure']}
    const result=applyBuildEnemyEffects({
      profile,setups:[exposedSetup],skills:[skill('ball','Ball Lightning')],
      supports:[support('lightning-exposure','Lightning Exposure')],activeDamageTypes:['lightning'],weaponSet:'set-1',
      primaryShockContext:{
        skillId:'ball',enemyAilmentThreshold:1000,lightningHitAverage:100,lightningCriticalHitAverage:200,
        hitChancePercent:100,criticalHitChancePercent:20,actionsPerSecond:2,
      },
    })
    expect(result.resistanceReduction?.lightning).toBe(20)
    expect(result.appliedEffects).toContainEqual(expect.objectContaining({
      source:'support',sourceId:'lightning-exposure',effectGroup:'exposure',value:20,effectiveValue:20,
      durationMs:8000,estimatedUptime:1,uptimeStatus:'maintainable',state:'fully-active',
    }))
  })

  it('verstärkt belegte Blitz-Exposition mit Potent Exposure auf 24 Prozent',()=>{
    const exposedSetup={...setup('ball','ball'),supportGemIds:['lightning-exposure','potent-exposure']}
    const result=applyBuildEnemyEffects({
      profile,setups:[exposedSetup],skills:[skill('ball','Ball Lightning')],
      supports:[support('lightning-exposure','Lightning Exposure'),support('potent-exposure','Potent Exposure')],
      activeDamageTypes:['lightning'],weaponSet:'set-1',
      primaryShockContext:{
        skillId:'ball',enemyAilmentThreshold:1000,lightningHitAverage:100,lightningCriticalHitAverage:200,
        hitChancePercent:100,criticalHitChancePercent:20,actionsPerSecond:2,
      },
    })
    expect(result.resistanceReduction?.lightning).toBe(24)
    expect(result.appliedEffects).toContainEqual(expect.objectContaining({effectGroup:'exposure',value:24}))
  })

  it('blockiert Lightning Exposure ohne zuverlässig aufrechterhaltbaren Schock',()=>{
    const exposedSetup={...setup('ball','ball'),supportGemIds:['lightning-exposure']}
    const result=applyBuildEnemyEffects({
      profile,setups:[exposedSetup],skills:[skill('ball','Ball Lightning')],
      supports:[support('lightning-exposure','Lightning Exposure')],activeDamageTypes:['lightning'],weaponSet:'set-1',
      primaryShockContext:{
        skillId:'ball',enemyAilmentThreshold:1000,lightningHitAverage:10,lightningCriticalHitAverage:20,
        hitChancePercent:100,criticalHitChancePercent:0,actionsPerSecond:0.1,
      },
    })
    expect(result.resistanceReduction).toBeUndefined()
    expect(result.appliedEffects?.some(effect=>effect.effectGroup==='exposure')).toBe(false)
  })

  it('addiert den stärksten Fluch und die stärkste Exposition, ohne Exposition durch Zielrarität abzuschwächen',()=>{
    const exposedSetup={...setup('ball','ball'),supportGemIds:['lightning-exposure']}
    const result=applyBuildEnemyEffects({
      profile:{...profile,targetRarity:'unique'},setups:[exposedSetup,setup('curse','weakness')],
      skills:[skill('ball','Ball Lightning'),skill('weakness','Elemental Weakness')],
      supports:[support('lightning-exposure','Lightning Exposure')],activeDamageTypes:['lightning'],weaponSet:'set-1',
      primaryShockContext:{
        skillId:'ball',enemyAilmentThreshold:1000,lightningHitAverage:100,lightningCriticalHitAverage:200,
        hitChancePercent:100,criticalHitChancePercent:20,actionsPerSecond:2,
      },
    })
    expect(result.resistanceReduction?.lightning).toBe(49.5)
    expect(result.appliedEffects?.find(effect=>effect.effectGroup==='curse')?.effectiveValue).toBe(29.5)
    expect(result.appliedEffects?.find(effect=>effect.effectGroup==='exposure')?.effectiveValue).toBe(20)
  })

  it('wendet Fire Exposure nur bei einer zuverlässig erneuerbaren Entzündung derselben Fertigkeit an',()=>{
    const fireSetup={...setup('fireball','fireball'),supportGemIds:['fire-exposure']}
    const result=applyBuildEnemyEffects({
      profile,setups:[fireSetup],skills:[skill('fireball','Fireball')],supports:[support('fire-exposure','Fire Exposure')],
      activeDamageTypes:['fire'],weaponSet:'set-1',
      primaryShockContext:{
        skillId:'fireball',enemyAilmentThreshold:1000,lightningHitAverage:0,lightningCriticalHitAverage:0,
        fireHitAverage:100,fireCriticalHitAverage:200,hitChancePercent:100,criticalHitChancePercent:20,actionsPerSecond:10,
      },
    })
    expect(result.resistanceReduction?.fire).toBe(20)
    expect(result.appliedEffects).toContainEqual(expect.objectContaining({
      sourceId:'fire-exposure',effectGroup:'exposure',damageTypes:['fire'],durationMs:8000,
      uptimeStatus:'maintainable',state:'fully-active',
    }))
  })

  it('blockiert Fire Exposure, wenn die belegte Entzündungsrate das Fenster nicht erneuert',()=>{
    const fireSetup={...setup('fireball','fireball'),supportGemIds:['fire-exposure']}
    const result=applyBuildEnemyEffects({
      profile,setups:[fireSetup],skills:[skill('fireball','Fireball')],supports:[support('fire-exposure','Fire Exposure')],
      activeDamageTypes:['fire'],weaponSet:'set-1',
      primaryShockContext:{
        skillId:'fireball',enemyAilmentThreshold:100000,lightningHitAverage:0,lightningCriticalHitAverage:0,
        fireHitAverage:1,fireCriticalHitAverage:2,hitChancePercent:100,criticalHitChancePercent:0,actionsPerSecond:0.1,
      },
    })
    expect(result.resistanceReduction).toBeUndefined()
    expect(result.appliedEffects?.some(effect=>effect.sourceId==='fire-exposure')).toBe(false)
  })

  it('wendet Cold Exposure nur bei ausreichend häufigen kritischen Kältetreffern an',()=>{
    const coldSetup={...setup('cold-skill','cold-skill'),supportGemIds:['cold-exposure']}
    const result=applyBuildEnemyEffects({
      profile,setups:[coldSetup],skills:[skill('cold-skill','Frostbolt')],supports:[support('cold-exposure','Cold Exposure')],
      activeDamageTypes:['cold'],weaponSet:'set-1',
      primaryShockContext:{
        skillId:'cold-skill',enemyAilmentThreshold:1000,lightningHitAverage:0,lightningCriticalHitAverage:0,
        coldHitAverage:100,hitChancePercent:100,criticalHitChancePercent:20,actionsPerSecond:1,
      },
    })
    expect(result.resistanceReduction?.cold).toBe(20)
    expect(result.appliedEffects).toContainEqual(expect.objectContaining({
      sourceId:'cold-exposure',effectGroup:'exposure',damageTypes:['cold'],applicationRatePerSecond:0.2,durationMs:8000,
    }))
  })

  it('blockiert Cold Exposure ohne ausreichend häufige kritische Kältetreffer',()=>{
    const coldSetup={...setup('cold-skill','cold-skill'),supportGemIds:['cold-exposure']}
    const result=applyBuildEnemyEffects({
      profile,setups:[coldSetup],skills:[skill('cold-skill','Frostbolt')],supports:[support('cold-exposure','Cold Exposure')],
      activeDamageTypes:['cold'],weaponSet:'set-1',
      primaryShockContext:{
        skillId:'cold-skill',enemyAilmentThreshold:1000,lightningHitAverage:0,lightningCriticalHitAverage:0,
        coldHitAverage:100,hitChancePercent:100,criticalHitChancePercent:5,actionsPerSecond:0.1,
      },
    })
    expect(result.resistanceReduction).toBeUndefined()
    expect(result.appliedEffects?.some(effect=>effect.sourceId==='cold-exposure')).toBe(false)
  })

  it('verwendet bei mehreren normalen Schockquellen nur den stärksten aufrechterhaltbaren Schock',()=>{
    const weak={skillId:'arc',enemyAilmentThreshold:1000,lightningHitAverage:100,lightningCriticalHitAverage:200,hitChancePercent:100,criticalHitChancePercent:20,actionsPerSecond:20}
    const strong={skillId:'ball',enemyAilmentThreshold:1000,lightningHitAverage:400,lightningCriticalHitAverage:800,hitChancePercent:100,criticalHitChancePercent:20,actionsPerSecond:2}
    const common={
      profile,setups:[setup('arc-setup','arc'),setup('ball-setup','ball')],
      skills:[skill('arc','Arc'),skill('ball','Ball Lightning')],activeDamageTypes:['lightning' as const],weaponSet:'set-1' as const,
    }
    const result=applyBuildEnemyEffects({...common,shockSourceContexts:[weak,strong]})
    const reversed=applyBuildEnemyEffects({...common,shockSourceContexts:[strong,weak]})
    const shocks=result.appliedEffects?.filter(value=>value.effectGroup==='shock')??[]
    const selected=shocks.find(value=>value.selectionStatus==='selected-strongest')
    const superseded=shocks.find(value=>value.selectionStatus==='superseded-by-stronger')
    expect(shocks).toHaveLength(2)
    expect(selected).toMatchObject({sourceId:'ball',effectiveValue:expect.any(Number)})
    expect(superseded).toMatchObject({sourceId:'arc',effectiveValue:0})
    expect(result.damageTakenIncreased?.lightning).toBe(selected?.value)
    expect(reversed.damageTakenIncreased).toEqual(result.damageTakenIncreased)
  })

  it('lässt eine nicht aufrechterhaltbare hohe Schockquelle keine schwächere dauerhafte Quelle verdrängen',()=>{
    const result=applyBuildEnemyEffects({
      profile,setups:[setup('arc-setup','arc'),setup('ball-setup','ball')],skills:[skill('arc','Arc'),skill('ball','Ball Lightning')],
      activeDamageTypes:['lightning'],weaponSet:'set-1',shockSourceContexts:[
        {skillId:'arc',enemyAilmentThreshold:1000,lightningHitAverage:100,lightningCriticalHitAverage:200,hitChancePercent:100,criticalHitChancePercent:20,actionsPerSecond:20},
        {skillId:'ball',enemyAilmentThreshold:1000,lightningHitAverage:1000,lightningCriticalHitAverage:2000,hitChancePercent:1,criticalHitChancePercent:20,actionsPerSecond:0.01},
      ],
    })
    expect(result.appliedEffects?.find(value=>value.selectionStatus==='selected-strongest')?.sourceId).toBe('arc')
    expect(result.damageTakenIncreased?.lightning).toBe(result.appliedEffects?.find(value=>value.sourceId==='arc')?.value)
  })

  it('wendet den Schockkontext nicht auf einen anderen Skill oder Waffensatz an',()=>{
    const set2={...setup('ball','ball'),weaponSet:'set-2' as const}
    const result=applyBuildEnemyEffects({
      profile,setups:[set2],skills:[skill('ball','Ball Lightning')],activeDamageTypes:['lightning'],weaponSet:'set-1',
      primaryShockContext:{skillId:'ball',enemyAilmentThreshold:100,lightningHitAverage:100,lightningCriticalHitAverage:200,hitChancePercent:100,criticalHitChancePercent:20,actionsPerSecond:2},
    })
    expect(result.damageTakenIncreased).toBeUndefined()
    expect(result.appliedEffects).toEqual([])
  })

  it('löst nur exakt belegte Schockchance, -stärke und -dauer aus den zugewiesenen Baumknoten auf',()=>{
    const tree={metadata:{releaseTag:'test'},connections:[],nodes:[
      {id:'chance',stats:[{sourceText:'20% increased chance to [Shock]'}]},
      {id:'magnitude',stats:[{sourceText:'25% increased [BuffMagnitude|Magnitude] of [Shock|Shock] you inflict'}]},
      {id:'ailments',stats:[{sourceText:'30% increased [BuffMagnitude|Magnitude] of [NonDamagingAilments|Non-Damaging Ailments] you inflict'}]},
      {id:'duration',stats:[{sourceText:'10% increased Duration of [Ignite], [Shock] and [Chill] on Enemies'}]},
      {id:'asc',ascendancyId:'stormweaver',stats:[{sourceText:'25% less [BuffMagnitude|Magnitude] of [Shock] you inflict'}]},
      {id:'strike-twice',ascendancyId:'stormweaver',stats:[{sourceText:'Targets can be affected by two of your [Shock]s at the same time'}]},
      {id:'conditional',stats:[{sourceText:'40% increased Magnitude of Shock you inflict with Critical Hits'}]},
    ]} as unknown as RealPassiveTree
    const planning={pipelineResult:{allocatedNodeIds:['chance','magnitude','ailments','duration','conditional']},ascendancyPlanning:{allocatedNodeIds:['asc','strike-twice']}} as unknown as RealPassivePlanningIntegrationResult
    expect(resolveAllocatedShockModifiers(tree,planning,'set-1')).toMatchObject({
      chanceIncreasedPercent:20,magnitudeIncreasedPercent:55,magnitudeMoreMultiplier:0.75,durationIncreasedPercent:10,maximumStacks:2,
    })
  })

  it('belegt mit Strike Twice höchstens zwei dauerhaft aufrechterhaltbare Schocks und wendet dessen geringere Stärke an',()=>{
    const tree={metadata:{releaseTag:'test'},connections:[],nodes:[{
      id:'strike-twice',ascendancyId:'Sorceress1',stats:[
        {sourceText:'Targets can be affected by two of your [Shock]s at the same time'},
        {sourceText:'25% less [BuffMagnitude|Magnitude] of [Shock] you inflict'},
      ],
    }]} as unknown as RealPassiveTree
    const planning={ascendancyPlanning:{allocatedNodeIds:['strike-twice']}} as unknown as RealPassivePlanningIntegrationResult
    const result=applyBuildEnemyEffects({
      profile,setups:[setup('ball','ball')],skills:[skill('ball','Ball Lightning')],activeDamageTypes:['lightning'],weaponSet:'set-1',
      passiveTree:tree,realPassivePlanning:planning,
      primaryShockContext:{skillId:'ball',enemyAilmentThreshold:1000,lightningHitAverage:100,lightningCriticalHitAverage:200,hitChancePercent:100,criticalHitChancePercent:20,actionsPerSecond:2},
    })
    expect(result.appliedEffects?.[0]).toMatchObject({
      sourceId:'ball',value:16.75,effectiveValue:33.5,stackCount:2,maximumStacks:2,selectionStatus:'selected-stacked',
    })
    expect(result.damageTakenIncreased?.lightning).toBe(33.5)
    expect(result.limitations?.join(' ')).toContain('2 gleichzeitige Schocks')
  })

  it('wendet belegte Schockmodifikatoren waffensetgenau auf Stärke und Aufrechterhaltung an',()=>{
    const tree={metadata:{releaseTag:'test'},connections:[],nodes:[
      {id:'set1-chance',stats:[{sourceText:'40% increased chance to [Shock]'}]},
      {id:'set1-effect',stats:[{sourceText:'25% increased [BuffMagnitude|Magnitude] of [Shock|Shock] you inflict'}]},
      {id:'set1-duration',stats:[{sourceText:'50% increased [Shock] Duration'}]},
    ]} as unknown as RealPassiveTree
    const planning={
      weaponSetPlanning:{'set-1':{allocatedNodeIds:['set1-chance','set1-effect','set1-duration']},'set-2':{allocatedNodeIds:[]}},
    } as unknown as RealPassivePlanningIntegrationResult
    const common={profile,setups:[setup('ball','ball')],skills:[skill('ball','Ball Lightning')],activeDamageTypes:['lightning' as const],primaryShockContext:{
      skillId:'ball',enemyAilmentThreshold:1000,lightningHitAverage:100,lightningCriticalHitAverage:200,
      hitChancePercent:100,criticalHitChancePercent:20,actionsPerSecond:2,
    },passiveTree:tree,realPassivePlanning:planning}
    const set1=applyBuildEnemyEffects({...common,weaponSet:'set-1'})
    const set2=applyBuildEnemyEffects({...common,weaponSet:'set-2'})
    expect(set1.appliedEffects?.[0]).toMatchObject({value:27.92,durationMs:12000,uptimeStatus:'maintainable'})
    expect(set1.appliedEffects?.[0].applicationRatePerSecond).toBeGreaterThan(set2.appliedEffects?.[0].applicationRatePerSecond??0)
    expect(set2.appliedEffects?.[0]).toMatchObject({value:22.33,durationMs:8000})
  })

  it('verbindet ausschließlich gewählte strukturierte Schock-Supports und technische Ausrüstungswerte',()=>{
    const selected={...setup('ball','ball'),supportGemIds:['lasting','overcharge','shock']}
    const equipment=[{
      id:'ring',slotId:'slot-ring-1',modifierValues:[
        {id:'chance',modifierId:'chance',value:60,isLocal:false,statValues:[{statId:'shock_chance_+%',value:60}]},
        {id:'effect',modifierId:'effect',value:25,isLocal:false,statValues:[{statId:'shock_effect_+%',value:25}]},
        {id:'self',modifierId:'self',value:50,isLocal:false,statValues:[{statId:'base_self_shock_duration_-%',value:50}]},
      ],
    }] as EquipmentEntry[]
    const result=applyBuildEnemyEffects({
      profile,setups:[selected],skills:[skill('ball','Ball Lightning')],supports:[support('lasting','Lasting Shock'),support('overcharge','Overcharge'),support('shock','Shock')],equipment,
      activeDamageTypes:['lightning'],weaponSet:'set-1',
      primaryShockContext:{skillId:'ball',enemyAilmentThreshold:1000,lightningHitAverage:100,lightningCriticalHitAverage:200,hitChancePercent:100,criticalHitChancePercent:20,actionsPerSecond:2},
    })
    expect(result.appliedEffects?.[0]).toMatchObject({value:39.08,durationMs:16000,uptimeStatus:'maintainable'})
    expect(result.appliedEffects?.[0].sourceReference).toContain('allocated shock modifiers')
  })

  it('verwendet für Withered die exakt gewählte Gemmenstufe',()=>{
    const levelOne={...setup('wither','wither'),level:1}
    const result=applyBuildEnemyEffects({profile,setups:[levelOne],skills:[skill('wither','Wither')],activeDamageTypes:['chaos'],weaponSet:'set-1'})
    expect(result.damageTakenIncreased).toEqual({chaos:48})
    expect(result.appliedEffects?.[0]).toMatchObject({stackCount:8,durationMs:2000,timeToFullEffectMs:2000})
  })

  it('wendet Frostbomben-Exposition nicht auf rein physischen Schaden an',()=>{
    const result=applyBuildEnemyEffects({
      profile,setups:[setup('breaker','breaker'),setup('bomb','bomb')],
      skills:[skill('breaker','Armour Breaker'),skill('bomb','Frost Bomb')],
      activeDamageTypes:['physical'],weaponSet:'set-1',
    })
    expect(result.armourBreak).toBe(4918)
    expect(result.appliedEffects).toEqual([expect.objectContaining({sourceId:'breaker',kind:'armour-break',value:4918})])
    expect(result.resistanceReduction).toBeUndefined()
  })

  it('wendet den belegten Frostbomben-Grundwert auf relevante Elemente an',()=>{
    const result=applyBuildEnemyEffects({
      profile:{...profile,level:100},setups:[setup('bomb','bomb')],
      skills:[skill('bomb','Frost Bomb')],activeDamageTypes:['fire','cold','lightning'],weaponSet:'set-1',
    })
    expect(result.resistanceReduction).toEqual({fire:20,cold:20,lightning:20})
    expect(result.appliedEffects).toEqual([expect.objectContaining({
      source:'skill',sourceId:'bomb',effectGroup:'exposure',value:20,
      durationMs:8000,activationTimeMs:4000,applicationRatePerSecond:0.1667,
      estimatedUptime:1,uptimeStatus:'maintainable',state:'fully-active',
    })])
    expect(result.appliedEffects?.[0].stateDetail).toContain('anwachsende Stärke')
  })

  it('beachtet die stufenabhängige Gegnerlevel-Grenze der Frostbombe fail-closed',()=>{
    const levelOne={...setup('bomb','bomb'),level:1}
    const allowed=applyBuildEnemyEffects({
      profile:{...profile,level:20},setups:[levelOne],skills:[skill('bomb','Frost Bomb')],
      activeDamageTypes:['cold'],weaponSet:'set-1',
    })
    const blockedByLevel=applyBuildEnemyEffects({
      profile:{...profile,level:21},setups:[levelOne],skills:[skill('bomb','Frost Bomb')],
      activeDamageTypes:['cold'],weaponSet:'set-1',
    })
    const blockedWithoutTargetLevel=applyBuildEnemyEffects({
      profile,setups:[levelOne],skills:[skill('bomb','Frost Bomb')],
      activeDamageTypes:['cold'],weaponSet:'set-1',
    })
    expect(allowed.resistanceReduction).toEqual({cold:20})
    expect(blockedByLevel.resistanceReduction).toBeUndefined()
    expect(blockedWithoutTargetLevel.resistanceReduction).toBeUndefined()
  })

  it('verstärkt Frostbomben-Exposition nur mit gewählter Potent Exposure',()=>{
    const selected={...setup('bomb','bomb'),supportGemIds:['potent']}
    const result=applyBuildEnemyEffects({
      profile:{...profile,level:100},setups:[selected],skills:[skill('bomb','Frost Bomb')],
      supports:[support('potent','Potent Exposure')],activeDamageTypes:['cold'],weaponSet:'set-1',
    })
    expect(result.resistanceReduction).toEqual({cold:24})
    expect(result.appliedEffects?.[0]).toMatchObject({value:24,effectGroup:'exposure'})
  })

  it('trennt die Frostbomben-Exposition nach Waffenset',()=>{
    const set2={...setup('bomb','bomb'),weaponSet:'set-2' as const}
    const input={profile:{...profile,level:100},setups:[set2],skills:[skill('bomb','Frost Bomb')],activeDamageTypes:['cold' as const]}
    expect(applyBuildEnemyEffects({...input,weaponSet:'set-1'}).resistanceReduction).toBeUndefined()
    expect(applyBuildEnemyEffects({...input,weaponSet:'set-2'}).resistanceReduction).toEqual({cold:20})
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

  it('verbindet den Rüstungsbruch des Hauptskills mit seiner belegten Trefferfrequenz',()=>{
    const sustained=applyBuildEnemyEffects({
      profile:{...profile,targetRarity:'unique',armour:10000},
      setups:[setup('breaker','breaker')],skills:[skill('breaker','Armour Breaker')],
      activeDamageTypes:['physical'],weaponSet:'set-1',
      primarySkillId:'breaker',primaryActionsPerSecond:2,
    })
    expect(sustained).toMatchObject({
      hitsToFullyBreakArmour:3,timeToFullyBreakArmourMs:1500,
      fullyBrokenArmour:true,temporalModelVersion:'2.0.0',
    })
    expect(sustained.appliedEffects?.[0]).toMatchObject({
      state:'fully-active',uptimeStatus:'maintainable',
      applicationRatePerSecond:2,timeToFullEffectMs:1500,estimatedUptime:1,
    })
  })

  it('behauptet keinen vollständigen Rüstungsbruch, wenn der Aufbau vor Ablauf verfällt',()=>{
    const result=applyBuildEnemyEffects({
      profile:{...profile,targetRarity:'unique',armour:10000},
      setups:[setup('breaker','breaker')],skills:[skill('breaker','Armour Breaker')],
      activeDamageTypes:['physical'],weaponSet:'set-1',
      primarySkillId:'breaker',primaryActionsPerSecond:0.1,
    })
    expect(result.timeToFullyBreakArmourMs).toBe(30000)
    expect(result.fullyBrokenArmour).toBeUndefined()
    expect(result.appliedEffects?.[0]).toMatchObject({state:'building',uptimeStatus:'unresolved'})
    expect(result.limitations?.join(' ')).toContain('reicht nicht aus')
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

  it('weist belegten Schockboden aus, ohne den Gegnerstandort oder Schaden zu erfinden',()=>{
    const equipment=[{
      id:'boots',slotId:'boots',modifierValues:[],rarity:'unique',
      uniqueItemId:'pob2:src/Data/Uniques/boots.lua#21',
    }] satisfies EquipmentEntry[]
    const result=applyBuildEnemyEffects({profile,setups:[],skills:[],equipment,activeDamageTypes:['lightning'],weaponSet:'set-1'})
    expect(result.damageTakenIncreased).toBeUndefined()
    expect(result.appliedEffects).toEqual([])
    expect(result.blockedEnemyEffects).toEqual([expect.objectContaining({
      sourceId:'pob2:src/Data/Uniques/boots.lua#21',kind:'fixed-shock',value:20,durationMs:8000,
      reason:'enemy-ground-occupancy-unconfirmed',
    })])
    expect(result.limitations?.join(' ')).toContain('Standort des Gegners')
  })

  it('lässt einen belegten Trefferschock wirken, ohne den blockierten Schockboden zu addieren',()=>{
    const equipment=[{
      id:'boots',slotId:'boots',modifierValues:[],rarity:'unique',
      uniqueItemId:'pob2:src/Data/Uniques/boots.lua#21',
    }] satisfies EquipmentEntry[]
    const result=applyBuildEnemyEffects({
      profile,setups:[setup('ball','ball')],skills:[skill('ball','Ball Lightning')],equipment,
      activeDamageTypes:['lightning'],weaponSet:'set-1',
      primaryShockContext:{skillId:'ball',enemyAilmentThreshold:1000,lightningHitAverage:100,lightningCriticalHitAverage:200,hitChancePercent:100,criticalHitChancePercent:20,actionsPerSecond:2},
    })
    expect(result.damageTakenIncreased?.lightning).toBe(22.33)
    expect(result.blockedEnemyEffects).toHaveLength(1)
  })

  it('ist bei identischer Eingabe deterministisch',()=>{
    const input={profile,setups:[setup('curse','weakness')],skills:[skill('weakness','Elemental Weakness')],activeDamageTypes:['fire' as const],weaponSet:'set-1' as const}
    expect(applyBuildEnemyEffects(input)).toEqual(applyBuildEnemyEffects(input))
  })
})
