import { describe,expect,it } from 'vitest'
import type { EquipmentEntry,SkillGemDefinition,SkillSetup,SupportGemDefinition } from '../../domain'
import type { RotationAnalysis } from '../common/types'
import { estimateHitDamage } from './estimate'

const skill=(id:string,nameEn:string):SkillGemDefinition=>({id,displayNameDe:nameEn,nameEn,tags:[],dataVersion:'test',source:'local-placeholder',status:'verified'})
const setup=(skillId:string,weaponSet:'set-1'|'set-2'='set-1'):SkillSetup=>({id:'setup',skillId,role:'main',weaponSet,supportGemIds:[],level:20})
const weapon=(baseDisplayName:string,slotId='slot-weapon-set-1-left'):EquipmentEntry=>({id:'weapon',slotId,baseDisplayName,itemClassId:'Bows',rarity:'normal',modifierValues:[]})

describe('begrenzte Trefferschadenberechnung',()=>{
  it('berechnet strukturierte Zauberbasiswerte deterministisch',()=>{
    const first=estimateHitDamage({equipment:[],setups:[setup('ball')],skills:[skill('ball','Ball Lightning')]})
    const second=estimateHitDamage({equipment:[],setups:[setup('ball')],skills:[skill('ball','Ball Lightning')]})
    expect(first).toEqual(second)
    expect(first.status).toBe('partial')
    expect(first.hitDamage).toMatchObject({minimum:6,maximum:105,average:55.5})
    expect(first.hitDamagePerSecond).toBe(55.5)
  })
  it('verwendet Waffenbasis und Angriffsmultiplikator für Angriffe',()=>{
    const result=estimateHitDamage({equipment:[weapon('Crude Bow')],setups:[setup('arrow')],skills:[skill('arrow','Lightning Arrow')]})
    expect(result.status).toBe('partial')
    expect(result.hitDamage).toMatchObject({minimum:15,maximum:22.5,average:18.75})
    expect(result.actionsPerSecond).toBe(1.08)
    expect(result.hitDamagePerSecond).toBe(20.25)
  })
  it('erfindet ohne zuordenbare Waffenbasis keinen Angriffsschaden',()=>{
    const result=estimateHitDamage({equipment:[weapon('Unbekannter Bogen')],setups:[setup('arrow')],skills:[skill('arrow','Lightning Arrow')]})
    expect(result.status).toBe('unavailable')
    expect(result.hitDamagePerSecond).toBeUndefined()
  })
  it('verwendet manuell oder per OCR erfasste endgültige Waffenwerte auch bei deutscher Basis',()=>{
    const observed={...weapon('Gezackter Speer'),weaponStats:{
      physicalDamage:{minimum:46,maximum:91},
      fireDamage:{minimum:28,maximum:44},
      coldDamage:{minimum:29,maximum:35},
      criticalHitChance:6,
      attacksPerSecond:1.5,
      range:15,
    }}
    const result=estimateHitDamage({equipment:[observed],setups:[setup('arrow')],skills:[skill('arrow','Lightning Arrow')]})
    expect(result.status).toBe('partial')
    expect(result.components).toEqual([
      {type:'physical',minimum:115,maximum:227.5},
      {type:'fire',minimum:70,maximum:110},
      {type:'cold',minimum:72.5,maximum:87.5},
    ])
    expect(result.actionsPerSecond).toBe(1.35)
    expect(result.included).toContain('eingegebene endgültige Waffenschadenswerte')
  })
  it('weist nicht enthaltene komplexe Mechaniken aus',()=>{
    const result=estimateHitDamage({equipment:[],setups:[setup('ball')],skills:[skill('ball','Ball Lightning')]})
    expect(result.excluded).toContain('nicht belegte Projektilüberlappung, Fork- und Rückkehrtreffer')
    expect(result.excluded).toContain('Trigger und Wiederholungen ohne vollständige Quelle-Bedingung-Ziel-Intervall-Kette')
    expect(result.excluded).toContain('bedingte Passive- und Aszendenzeffekte')
  })
  it('erfindet für eine eingebaute Triggerfertigkeit keine normale Wirkfrequenz',()=>{
    const result=estimateHitDamage({equipment:[],setups:[setup('blood')],skills:[skill('blood','Blood Explosion')]})
    expect(result.status).toBe('unavailable')
    expect(result.actionsPerSecond).toBeUndefined()
    expect(result.hitDamagePerSecond).toBeUndefined()
    expect(result.triggerRepeatModel).toMatchObject({
      primarySkillTriggered:true,
      productive:false,
      sources:[{kind:'inbuilt-trigger',status:'blocked-missing-trigger-source'}],
    })
  })
  it('zeigt eine konfigurierte Triggerquelle, rechnet sie aber ohne Ziel und Intervall nicht ein',()=>{
    const main=skill('arc','Arc')
    const trigger=skill('coc','Cast on Critical')
    const result=estimateHitDamage({
      equipment:[],
      setups:[setup(main.id),{...setup(trigger.id),id:'trigger',role:'utility'}],
      skills:[main,trigger],
    })
    expect(result.status).toBe('partial')
    expect(result.triggerRepeatModel?.sources).toContainEqual(expect.objectContaining({
      sourceSkillId:'coc',condition:'bei einem kritischen Treffer',status:'blocked-missing-target',
    }))
    expect(result.triggerRepeatModel?.productive).toBe(false)
  })
  it('weist Spark-Projektile als Mapping-Abdeckung aus, ohne den Boss-DPS zu vervielfachen',()=>{
    const spark=estimateHitDamage({equipment:[],setups:[setup('spark')],skills:[skill('spark','Spark')]})
    expect(spark.projectileHitModel).toMatchObject({
      isProjectileSkill:true,
      projectilesPerAction:9,
      singleTargetHitMultiplier:1,
      mappingPotentialTargetContacts:9,
      bossScenario:{hitMultiplier:1,status:'single-hit-only'},
    })
    expect(spark.hitDamagePerSecond).toBeCloseTo(spark.expectedCriticalHitDamagePerSecond!/(spark.criticalExpectationMultiplier??1),1)
  })
  it('behandelt Arc-Verkettungen nur als mögliche zusätzliche Zielkontakte',()=>{
    const arc=estimateHitDamage({equipment:[],setups:[setup('arc')],skills:[skill('arc','Arc')]})
    expect(arc.projectileHitModel?.mappingPotentialTargetContacts).toBe(10)
    expect(arc.projectileHitModel?.mechanics).toContainEqual(expect.objectContaining({
      kind:'chain-count',value:9,damageUse:'coverage-only',
    }))
    expect(arc.projectileHitModel?.singleTargetHitMultiplier).toBe(1)
  })
  it('weist Flammenwand-DoT getrennt vom Trefferschaden als Einzelanwendung aus',()=>{
    const result=estimateHitDamage({equipment:[],setups:[setup('wall')],skills:[skill('wall','Flame Wall')]})
    expect(result.damageOverTime?.effects[0]).toMatchObject({
      damageType:'fire',damagePerSecond:59.58,durationMs:6400,totalDamagePerApplication:381.33,stackCount:1,
    })
    expect(result.hitDamagePerSecond).toBe(226)
    expect(result.damageOverTime?.totalSingleApplicationDamagePerSecond).toBe(59.58)
    expect(result.excluded.join(' ')).toContain('Entzünden')
  })
  it('blockiert einen unvollständigen nativen DoT statt einen DPS zu erfinden',()=>{
    const result=estimateHitDamage({equipment:[],setups:[setup('contagion')],skills:[skill('contagion','Contagion')]})
    expect(result.status).toBe('unavailable')
    expect(result.hitDamagePerSecond).toBeUndefined()
  })
  it('wendet elementare Steigerungen nur auf die passende Schadenskomponente an',()=>{
    const fireItem:EquipmentEntry={id:'fire',slotId:'slot-helmet',itemClassId:'Helmets',rarity:'rare',modifierValues:[{
      id:'applied-fire-damage',modifierId:'fire-damage',value:100,statValues:[{statId:'fire_damage_+%',value:100}],
    }]}
    const result=estimateHitDamage({equipment:[fireItem],setups:[setup('ball')],skills:[skill('ball','Ball Lightning')]})
    expect(result.hitDamage).toMatchObject({minimum:6,maximum:105,average:55.5})
  })
  it('wendet einen technisch belegten passenden Schadenswert numerisch an und dokumentiert ihn',()=>{
    const lightningItem:EquipmentEntry={id:'lightning',slotId:'slot-helmet',itemClassId:'Helmets',rarity:'rare',modifierValues:[{
      id:'applied-lightning-damage',modifierId:'lightning-damage',value:100,statValues:[{statId:'lightning_damage_+%',value:100}],
    }]}
    const result=estimateHitDamage({equipment:[lightningItem],setups:[setup('ball')],skills:[skill('ball','Ball Lightning')]})
    expect(result.hitDamage).toMatchObject({minimum:12,maximum:210,average:111})
    expect(result.appliedDamageEffects).toEqual([expect.objectContaining({source:'equipment',value:100})])
    expect(result.stages?.map(stage=>stage.id)).toEqual(['base','conversion','increased-damage','support-more-damage','speed','critical-expectation'])
  })
  it('berechnet bei Zaubern den belegten kritischen Erwartungswert mit +100 Prozent Basisbonus',()=>{
    const result=estimateHitDamage({equipment:[],setups:[setup('arc')],skills:[skill('arc','Arc')]})
    expect(result.criticalChance).toMatchObject({base:9,effective:9})
    expect(result.criticalDamageBonus).toBe(100)
    expect(result.criticalExpectationMultiplier).toBe(1.09)
    expect(result.expectedCriticalHitDamagePerSecond).toBeGreaterThan(result.hitDamagePerSecond!)
  })
  it('wendet nur explizit strukturierte Supporteffekte numerisch an',()=>{
    const support:SupportGemDefinition={
      id:'support-exact',displayNameDe:'Exakter Support',tags:[],dataVersion:'test',source:'local-placeholder',status:'verified',
      requiredTags:[],excludedTags:[],ownTags:[],
      quantitativeEffects:[{kind:'more-damage',percent:25,evidence:'structured-exact',sourceReference:'fixture:effect'}],
    }
    const selected={...setup('arc'),supportGemIds:[support.id]}
    const without=estimateHitDamage({equipment:[],setups:[setup('arc')],skills:[skill('arc','Arc')],supports:[support]})
    const withSupport=estimateHitDamage({equipment:[],setups:[selected],skills:[skill('arc','Arc')],supports:[support]})
    expect(withSupport.hitDamagePerSecond).toBeCloseTo(without.hitDamagePerSecond!*1.25,1)
    expect(withSupport.appliedSupportEffects).toEqual([expect.objectContaining({sourceId:'support-exact',value:25})])
  })
  it('warnt bei Supports ohne strukturierten Effekt und verändert den Wert nicht',()=>{
    const support:SupportGemDefinition={id:'support-unresolved',displayNameDe:'Unbelegt',tags:[],dataVersion:'test',source:'local-placeholder',status:'verified',requiredTags:[],excludedTags:[],ownTags:[]}
    const selected={...setup('arc'),supportGemIds:[support.id]}
    const result=estimateHitDamage({equipment:[],setups:[selected],skills:[skill('arc','Arc')],supports:[support]})
    expect(result.appliedSupportEffects).toEqual([])
    expect(result.warnings.join(' ')).toContain('keinen strukturierten numerischen Effekt')
  })
  it('wendet ein explizites Gegnerprofil getrennt nach Schadensart an',()=>{
    const result=estimateHitDamage({
      equipment:[],setups:[setup('arc')],skills:[skill('arc','Arc')],
      enemyProfile:{id:'manual-test',label:'Manueller Testgegner',source:'manual-comparison-profile',resistances:{lightning:50},penetration:{lightning:10},resistanceReduction:{lightning:5}},
    })
    expect(result.enemyProfile?.id).toBe('manual-test')
    expect(result.mitigatedComponents?.[0]).toMatchObject({type:'lightning',effectiveDefence:35,mitigationPercent:35})
    expect(result.expectedDamagePerSecondAfterMitigation).toBeCloseTo(result.expectedCriticalHitDamagePerSecond!*0.65,1)
    expect(result.stages?.at(-1)?.id).toBe('enemy-mitigation')
  })
  it('wendet Rüstung und Rüstungsbruch nur auf physischen Trefferschaden an',()=>{
    const observed={...weapon('Gezackter Speer'),weaponStats:{physicalDamage:{minimum:100,maximum:100},criticalHitChance:0,attacksPerSecond:1,range:10}}
    const result=estimateHitDamage({
      equipment:[observed],setups:[setup('arrow')],skills:[skill('arrow','Lightning Arrow')],
      enemyProfile:{id:'armour-test',label:'Rüstungstest',source:'manual-comparison-profile',armour:2000,armourBreak:1000},
    })
    const physical=result.mitigatedComponents?.find(value=>value.type==='physical')
    expect(physical?.effectiveDefence).toBe(1000)
    expect(physical?.mitigationPercent).toBeGreaterThan(0)
    expect(result.expectedDamagePerSecondAfterMitigation).toBeLessThan(result.expectedCriticalHitDamagePerSecond!)
  })
  it('erfindet ohne Profil keine Gegnerabwehr',()=>{
    const result=estimateHitDamage({equipment:[],setups:[setup('arc')],skills:[skill('arc','Arc')]})
    expect(result.enemyProfile).toBeUndefined()
    expect(result.expectedDamagePerSecondAfterMitigation).toBeUndefined()
    expect(result.warnings.join(' ')).toContain('kein Vergleichsgegner')
  })
  it('lässt Durchdringung den Widerstand standardmäßig nicht unter null drücken',()=>{
    const result=estimateHitDamage({
      equipment:[],setups:[setup('arc')],skills:[skill('arc','Arc')],
      enemyProfile:{id:'penetration-floor',label:'Durchdringungsgrenze',source:'manual-comparison-profile',resistances:{lightning:10},penetration:{lightning:30}},
    })
    expect(result.mitigatedComponents?.[0]).toMatchObject({type:'lightning',effectiveDefence:0})
  })
  it('berücksichtigt einen gewählten strukturierten Fluch automatisch im Vergleichsprofil',()=>{
    const curseSetup:SkillSetup={id:'curse',skillId:'curse',role:'utility',weaponSet:'both',supportGemIds:[]}
    const result=estimateHitDamage({
      equipment:[],setups:[setup('arc'),curseSetup],
      skills:[skill('arc','Arc'),skill('curse','Elemental Weakness')],
      enemyProfile:{id:'automatic',label:'Automatischer Gegner',source:'automatic-season-reference',resistances:{lightning:40}},
    })
    expect(result.enemyProfile?.resistanceReduction?.lightning).toBe(59)
    expect(result.mitigatedComponents?.[0]).toMatchObject({type:'lightning',effectiveDefence:-19})
    expect(result.enemyProfile?.appliedEffects?.[0]).toMatchObject({
      sourceId:'curse',kind:'resistance-reduction',durationMs:7400,
      activationTimeMs:700,uptimeStatus:'windowed',
    })
    expect(result.enemyProfile?.temporalModelVersion).toBe('1.0.0')
  })
  it('wendet den belegten 20-Prozent-Zustand vollständig gebrochener Rüstung an',()=>{
    const observed={...weapon('Gezackter Speer'),weaponStats:{physicalDamage:{minimum:100,maximum:100},criticalHitChance:0,attacksPerSecond:1,range:10}}
    const breakerSetup:SkillSetup={id:'breaker',skillId:'breaker',role:'utility',weaponSet:'both',supportGemIds:[]}
    const result=estimateHitDamage({
      equipment:[observed],setups:[setup('arrow'),breakerSetup],
      skills:[skill('arrow','Lightning Arrow'),skill('breaker','Armour Breaker')],
      enemyProfile:{id:'magic',label:'Magisches Ziel',source:'manual-comparison-profile',targetRarity:'magic',armour:9000},
    })
    expect(result.enemyProfile).toMatchObject({fullyBrokenArmour:true,hitsToFullyBreakArmour:1})
    expect(result.mitigatedComponents?.find(value=>value.type==='physical')?.minimum).toBe(300)
  })
  it('weist einen belegten War-Banner-Bonus getrennt als aktives Schadensfenster aus',()=>{
    const main={...skill('arrow','Lightning Arrow'),tags:['attack'] as SkillGemDefinition['tags']}
    const banner=skill('banner','War Banner')
    const observed={...weapon('Gezackter Speer'),weaponStats:{physicalDamage:{minimum:100,maximum:100},criticalHitChance:0,attacksPerSecond:1,range:10}}
    const bannerSetup:SkillSetup={id:'banner-setup',skillId:'banner',role:'utility',weaponSet:'set-1',supportGemIds:[]}
    const rotationAnalysis={bossRotation:{steps:[{
      skillId:'banner',activationCondition:'once',
      timing:{activationTimeMs:500,effectDurationMs:9800,timingStatus:'windowed',evidence:'structured-exact',sourceReferences:['castTime','base_skill_effect_duration'],detail:'Belegt.'},
    }]}} as unknown as RotationAnalysis
    const result=estimateHitDamage({equipment:[observed],setups:[setup('arrow'),bannerSetup],skills:[main,banner],rotationAnalysis})
    expect(result.activeWindowDamagePerSecond).toBeCloseTo(result.hitDamagePerSecond!*1.5625,1)
    expect(result.temporalOffensiveEffects?.filter(effect=>effect.status==='active-window')).toHaveLength(2)
    expect(result.stages?.map(stage=>stage.id)).toContain('temporal-active-window')
  })
  it('weist einen vorbereiteten Armbrusttreffer aus, ohne den Dauer-DPS zu erhöhen',()=>{
    const main={...skill('main','Explosive Shot'),tags:['attack'] as SkillGemDefinition['tags'],requiredWeaponTypes:['crossbow'] as SkillGemDefinition['requiredWeaponTypes']}
    const reload=skill('reload','Emergency Reload')
    const observed={...weapon('Unbekannte Armbrust'),weaponStats:{physicalDamage:{minimum:100,maximum:100},criticalHitChance:0,attacksPerSecond:1,range:10}}
    const reloadSetup:SkillSetup={id:'reload-setup',skillId:'reload',role:'utility',weaponSet:'set-1',supportGemIds:[]}
    const rotationAnalysis={bossRotation:{steps:[
      {stepId:'reload',order:1,actionType:'use-skill',skillId:'reload'},
      {stepId:'main',order:2,actionType:'use-skill',skillId:'main'},
    ]}} as unknown as RotationAnalysis
    const result=estimateHitDamage({equipment:[observed],setups:[setup('main'),reloadSetup],skills:[main,reload],rotationAnalysis})
    const baseline=estimateHitDamage({equipment:[observed],setups:[setup('main')],skills:[main]})
    expect(result.hitDamagePerSecond).toBe(baseline.hitDamagePerSecond)
    expect(result.preparedNextHitDamage).toBeCloseTo(result.hitDamage!.average*1.31,1)
    expect(result.nextSkillEffects?.effects[0]).toMatchObject({sourceId:'reload',targetSkillId:'main',status:'prepared-next-hit'})
    expect(result.stages?.map(stage=>stage.id)).toContain('prepared-next-hit')
  })
})
