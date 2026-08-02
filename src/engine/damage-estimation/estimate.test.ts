import { describe,expect,it } from 'vitest'
import type { EquipmentEntry,SkillGemDefinition,SkillSetup,SupportGemDefinition } from '../../domain'
import type { RotationAnalysis } from '../common/types'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'
import { estimateHitDamage } from './estimate'
import { pob2QuantitativeEffectsFor } from '../../gems/pob2-support-reference'

const skill=(id:string,nameEn:string):SkillGemDefinition=>({id,displayNameDe:nameEn,nameEn,tags:[],dataVersion:'test',source:'local-placeholder',status:'verified'})
const setup=(skillId:string,weaponSet:'set-1'|'set-2'='set-1'):SkillSetup=>({id:'setup',skillId,role:'main',weaponSet,supportGemIds:[],level:20})
const supportDef=(id:string,nameEn:string):SupportGemDefinition=>({id,nameEn,displayNameDe:nameEn,tags:[],requiredTags:[],excludedTags:[],ownTags:[],dataVersion:'test',source:'local-placeholder',status:'verified'})
const weapon=(baseDisplayName:string,slotId='slot-weapon-set-1-left'):EquipmentEntry=>({id:'weapon',slotId,baseDisplayName,itemClassId:'Bows',rarity:'normal',modifierValues:[]})

describe('begrenzte Trefferschadenberechnung',()=>{
  it('integriert Fork als belegte Folgeprojektilwirkung ohne den ersten Treffer zu multiplizieren',()=>{
    const fork=supportDef('fork','Fork')
    const spark=skill('spark','Spark')
    const baseline=estimateHitDamage({equipment:[],setups:[setup(spark.id)],skills:[spark],supports:[fork]})
    const result=estimateHitDamage({equipment:[],setups:[{...setup(spark.id),supportGemIds:[fork.id]}],skills:[spark],supports:[fork]})
    expect(result.forkSupportModel).toMatchObject({status:'applied-coverage-only',forkEnabled:true,forkedProjectileDamageMultiplier:.7,singleTargetHitMultiplier:1})
    expect(result.projectileHitModel).toMatchObject({forkEnabled:true,forkedProjectileDamageMultiplier:.7,singleTargetHitMultiplier:1})
    expect(result.projectileHitModel?.mappingPotentialTargetContacts).toBe(baseline.projectileHitModel?.mappingPotentialTargetContacts)
    expect(result.hitDamage?.average).toBe(baseline.hitDamage?.average)
    expect(result.warnings.join(' ')).not.toContain('keinen strukturierten numerischen Effekt')
  })
  it('integriert Pierce I als Mapping-Wirkung ohne den ersten Einzelzieltreffer zu verändern',()=>{
    const pierce=supportDef('pierce-i','Pierce I')
    const spark=skill('spark','Spark')
    const baseline=estimateHitDamage({equipment:[],setups:[setup(spark.id)],skills:[spark],supports:[pierce]})
    const result=estimateHitDamage({equipment:[],setups:[{...setup(spark.id),supportGemIds:[pierce.id]}],skills:[spark],supports:[pierce]})
    expect(result.pierceSupportModel).toMatchObject({status:'applied',chanceToPiercePercent:100,postPierceDamageMultiplier:.8,singleTargetHitMultiplier:1})
    expect(result.projectileHitModel).toMatchObject({supportPierceChancePercent:100,postPierceDamageMultiplier:.8,singleTargetHitMultiplier:1})
    expect(result.hitDamage?.average).toBe(baseline.hitDamage?.average)
    expect(result.warnings.join(' ')).not.toContain('keinen strukturierten numerischen Effekt')
  })
  it('transportiert Doppellauf als belegte Armbrust-Burstwirkung ohne erfundenen Dauer-DPS-Bonus',()=>{
    const doubleBarrel=supportDef('double-barrel-i','Double Barrel I')
    const loadExplosive=skill('load-explosive','Load Explosive Shot')
    const result=estimateHitDamage({equipment:[],setups:[{...setup(loadExplosive.id),supportGemIds:[doubleBarrel.id]}],skills:[loadExplosive],supports:[doubleBarrel]})
    expect(result.crossbowAmmunitionSupportModel).toMatchObject({status:'applied-burst-only',baseBolts:1,additionalBolts:1,loadedBolts:2,reloadSpeedMultiplier:.7,sustainedDamageMultiplier:1})
  })
  it('transportiert Munitionsersparnis als erwartete Schüsse pro Ladung ohne erfundenen Dauer-DPS-Bonus',()=>{
    const conservation=supportDef('ammo-conservation-ii','Ammo Conservation II')
    const loadExplosive=skill('load-explosive','Load Explosive Shot')
    const result=estimateHitDamage({equipment:[],setups:[{...setup(loadExplosive.id),supportGemIds:[conservation.id]}],skills:[loadExplosive],supports:[conservation]})
    expect(result.crossbowAmmunitionSupportModel).toMatchObject({status:'applied-burst-only',baseBolts:1,loadedBolts:1,ammunitionConservationChancePercent:25,expectedShotsPerLoad:1.33333333,reloadSpeedMultiplier:1,sustainedDamageMultiplier:1})
    expect(result.warnings.join(' ')).not.toContain('keinen strukturierten numerischen Effekt')
  })
  it('integriert Multishot I mit Schaden, Skill-Speed und zwei Coverage-Projektilen',()=>{
    const multishot=supportDef('multishot-i','Multishot I')
    const grenade:SkillGemDefinition={...skill('explosive-grenade','Explosive Grenade'),tags:['attack','projectile'],requiredWeaponTypes:['crossbow']}
    const crossbow={...weapon('Crossbow'),itemClassId:'Crossbows',weaponStatsSource:'observed-final' as const,weaponStats:{physicalDamage:{minimum:100,maximum:100},criticalHitChance:5,attacksPerSecond:1}}
    const baseline=estimateHitDamage({equipment:[crossbow],setups:[setup(grenade.id)],skills:[grenade],supports:[multishot]})
    const result=estimateHitDamage({equipment:[crossbow],setups:[{...setup(grenade.id),supportGemIds:[multishot.id]}],skills:[grenade],supports:[multishot]})
    expect(result.multishotSupportModel).toMatchObject({status:'applied',damageMultiplier:.65,skillSpeedMultiplier:.8,additionalProjectiles:2,singleTargetHitMultiplier:1})
    expect(result.hitDamage?.average).toBeCloseTo(baseline.hitDamage!.average*.65,6)
    expect(result.actionsPerSecond).toBeCloseTo(baseline.actionsPerSecond!,6)
    expect(result.projectileHitModel?.projectilesPerAction).toBe(baseline.projectileHitModel!.projectilesPerAction+2)
    expect(result.projectileHitModel?.singleTargetHitMultiplier).toBe(1)
  })
  it('integriert Verkettung als Treffernachteil und zusätzliche Mapping-Abdeckung',()=>{
    const chain=supportDef('chain-i','Chain I')
    const arc=skill('arc','Arc')
    const baseline=estimateHitDamage({equipment:[],setups:[setup(arc.id)],skills:[arc],supports:[chain]})
    const result=estimateHitDamage({equipment:[],setups:[{...setup(arc.id),supportGemIds:[chain.id]}],skills:[arc],supports:[chain]})
    expect(result.chainSupportModel).toMatchObject({status:'applied',hitDamageMultiplier:.7,additionalChains:1,singleTargetHitMultiplier:1})
    expect(result.hitDamage?.average).toBeCloseTo(baseline.hitDamage!.average*.7,6)
    expect(result.projectileHitModel?.mappingPotentialTargetContacts).toBe(baseline.projectileHitModel!.mappingPotentialTargetContacts+1)
    expect(result.projectileHitModel?.singleTargetHitMultiplier).toBe(1)
  })
  it('integriert Zauberkaskade mit drei Flächen, aber ohne erfundenen Überlappungsmultiplikator',()=>{
    const cascade=supportDef('spell-cascade','Spell Cascade')
    const boneBlast=skill('bone-blast','Bone Blast')
    const baseline=estimateHitDamage({equipment:[],setups:[setup(boneBlast.id)],skills:[boneBlast],supports:[cascade]})
    const result=estimateHitDamage({equipment:[],setups:[{...setup(boneBlast.id),supportGemIds:[cascade.id]}],skills:[boneBlast],supports:[cascade]})
    expect(result.spellCascadeSupportModel).toMatchObject({status:'applied',damageMultiplier:.7,areaOfEffectMultiplier:.8,totalCascadeAreas:3,singleTargetOverlapMultiplier:1})
    expect(result.hitDamage?.average).toBeCloseTo(baseline.hitDamage!.average*.7,6)
  })
  it('wendet Zauberkaskades Schadensnachteil auf nativen DoT an',()=>{
    const cascade=supportDef('spell-cascade','Spell Cascade')
    const flameWall=skill('wall','Flame Wall')
    const baseline=estimateHitDamage({equipment:[],setups:[setup(flameWall.id)],skills:[flameWall],supports:[cascade]})
    const result=estimateHitDamage({equipment:[],setups:[{...setup(flameWall.id),supportGemIds:[cascade.id]}],skills:[flameWall],supports:[cascade]})
    expect(result.spellCascadeSupportModel?.status).toBe('applied')
    expect(result.damageOverTime?.effects[0].damagePerSecond).toBeCloseTo(baseline.damageOverTime!.effects[0].damagePerSecond*.7,1)
  })
  it('wendet Konzentrierte Wirkung auf Area-Treffer und die getrennte Wirkungsfläche an',()=>{
    const concentrated=supportDef('concentrated-area','Concentrated Area')
    const flameblast=skill('flameblast','Flameblast')
    const baseline=estimateHitDamage({equipment:[],setups:[setup(flameblast.id)],skills:[flameblast],supports:[concentrated]})
    const result=estimateHitDamage({equipment:[],setups:[{...setup(flameblast.id),supportGemIds:[concentrated.id]}],skills:[flameblast],supports:[concentrated]})
    expect(result.areaDamageSupportModel).toMatchObject({status:'applied',damageMultiplier:1.3,areaOfEffectMultiplier:.5})
    expect(result.hitDamage?.average).toBeCloseTo(baseline.hitDamage!.average*1.3,6)
  })
  it('wendet Konzentrierte Wirkung auch auf nativen Area-Schaden über Zeit an',()=>{
    const concentrated=supportDef('concentrated-area','Concentrated Area')
    const flameWall=skill('wall','Flame Wall')
    const baseline=estimateHitDamage({equipment:[],setups:[setup(flameWall.id)],skills:[flameWall],supports:[concentrated]})
    const result=estimateHitDamage({equipment:[],setups:[{...setup(flameWall.id),supportGemIds:[concentrated.id]}],skills:[flameWall],supports:[concentrated]})
    expect(result.areaDamageSupportModel?.status).toBe('applied')
    expect(result.damageOverTime?.effects[0].damagePerSecond).toBeCloseTo(baseline.damageOverTime!.effects[0].damagePerSecond*1.3,1)
  })
  it('wendet Muskelkraft vor Umwandlungen nur auf das physische Schadensmaximum an',()=>{
    const heft=supportDef('heft','Heft')
    const earthquake:SkillGemDefinition={...skill('earthquake','Earthquake'),tags:['attack','melee'],requiredWeaponTypes:['mace']}
    const selected={...setup(earthquake.id),supportGemIds:[heft.id]}
    const inputWeapon={...weapon('Akoyan Club'),itemClassId:'One Hand Maces'}
    const baseline=estimateHitDamage({equipment:[inputWeapon],setups:[setup(earthquake.id)],skills:[earthquake],supports:[heft]})
    const result=estimateHitDamage({equipment:[inputWeapon],setups:[selected],skills:[earthquake],supports:[heft]})
    expect(result.maximumPhysicalDamageSupportModel).toMatchObject({status:'applied',appliedSupports:[{finalMaximumPhysicalDamagePercent:30}]})
    expect(result.baseComponents?.[0].minimum).toBe(baseline.baseComponents?.[0].minimum)
    expect(result.baseComponents?.[0].maximum).toBeCloseTo(baseline.baseComponents![0].maximum*1.3,6)
    expect(result.hitDamage?.average).toBeGreaterThan(baseline.hitDamage!.average)
  })
  it('integriert verkürzte Dauer in den nativen DoT ohne falschen DPS-Bonus',()=>{
    const compressed=supportDef('compressed-duration','Compressed Duration I')
    const selected={...setup('wall'),supportGemIds:[compressed.id]}
    const result=estimateHitDamage({equipment:[],setups:[selected],skills:[skill('wall','Flame Wall')],supports:[compressed]})
    expect(result.skillEffectDurationSupportModel).toMatchObject({status:'applied',durationMultiplier:.7})
    expect(result.damageOverTime?.effects[0]).toMatchObject({damagePerSecond:59.58,durationMs:4480,totalDamagePerApplication:266.93})
  })
  it('berechnet PoB2-Dual-Wield-Angriffe aus beiden Waffen statt nur aus der ersten Hand',()=>{
    const earthquake:SkillGemDefinition={...skill('earthquake','Earthquake'),tags:['attack','melee'],requiredWeaponTypes:['mace']}
    const main={...weapon('Akoyan Club'),id:'main',itemClassId:'One Hand Maces'}
    const off={...weapon('Bandit Mace','slot-weapon-set-1-right'),id:'off',itemClassId:'One Hand Maces'}
    const single=estimateHitDamage({equipment:[main],setups:[setup(earthquake.id)],skills:[earthquake]})
    const dual=estimateHitDamage({equipment:[main,off],setups:[setup(earthquake.id)],skills:[earthquake]})
    expect(dual.dualWieldAttackModel).toMatchObject({status:'applied',finalDamagePercent:-30,damageMultiplier:.7,hitSequenceMultiplier:2})
    expect(dual.hitDamagePerSecond).toBeGreaterThan(single.hitDamagePerSecond!)
    expect(dual.included).toContain('PoB2-Dual-Wield: beide kompatiblen Einhandwaffen, 30% weniger Schaden je Hand und ein Treffer je Hand')
    expect(dual.actionsPerSecond).toBeCloseTo(2.17,2)
  })
  it('wendet finale PoB2-Dual-Wield-Angriffsgeschwindigkeit auf beide abwechselnden Waffen an',()=>{
    const breaker:SkillGemDefinition={...skill('armour-breaker','Armour Breaker'),tags:['attack','melee'],requiredWeaponTypes:['mace']}
    const main={...weapon('Akoyan Club'),id:'main',itemClassId:'One Hand Maces'}
    const off={...weapon('Bandit Mace','slot-weapon-set-1-right'),id:'off',itemClassId:'One Hand Maces'}
    const dual=estimateHitDamage({equipment:[main,off],setups:[setup(breaker.id)],skills:[breaker]})
    expect(dual.dualWieldAttackModel).toMatchObject({status:'applied',finalDamagePercent:null,finalAttackSpeedPercent:40,damageMultiplier:1,attackSpeedMultiplier:1.4,hitSequenceMultiplier:1})
    expect(dual.included).toContain('PoB2-Dual-Wield: beide kompatiblen Einhandwaffen abwechselnd, 40% finale Angriffsgeschwindigkeit')
    expect(dual.actionsPerSecond).toBeGreaterThan(0)
  })
  it('verbindet Lightning Conduit mit der tatsÃ¤chlich belegten Schockwirkung des Ziels',()=>{
    const conduit=skill('conduit','Lightning Conduit')
    const ball=skill('ball','Ball Lightning')
    const result=estimateHitDamage({
      equipment:[],
      setups:[
        {...setup(conduit.id),id:'conduit'},
        {...setup(ball.id),id:'ball',role:'utility'},
      ],
      skills:[conduit,ball],
      enemyProfile:{id:'target',label:'Ziel',source:'manual-comparison-profile',level:1},
    })
    expect(result.conditionalHitEffects?.effects[0]).toMatchObject({
      sourceRecordId:'LightningConduitPlayer',kind:'more-hit-damage-per-shock-effect',valuePerStep:10,
    })
    expect(result.conditionalHitEffects?.damageMultiplier).toBeGreaterThan(1)
    expect(result.included).toContain('strukturierter fertigkeitseigener Trefferschadensbonus aus der belegten Schockwirkung auf dem Ziel')
  })

  it('blockiert Lightning Conduits Zielbonus ohne belegten Zielschock',()=>{
    const conduit=skill('conduit','Lightning Conduit')
    const result=estimateHitDamage({equipment:[],setups:[setup(conduit.id)],skills:[conduit]})
    expect(result.conditionalHitEffects).toMatchObject({damageMultiplier:1,effects:[]})
    expect(result.conditionalHitEffects?.blockedEffects[0]?.reason).toBe('enemy-shock-effect-not-confirmed')
  })

  it('erh\u00f6ht Scharfsch\u00fctzenmal nur den kritischen Erwartungsanteil des aktiven Waffensets',()=>{
    const arc=skill('arc','Arc')
    const mark=skill('mark',"Sniper's Mark")
    const main={...setup(arc.id),id:'arc'}
    const activeMark={...setup(mark.id),id:'mark',role:'utility' as const,level:20}
    const inactiveMark={...activeMark,weaponSet:'set-2' as const}
    const baseline=estimateHitDamage({equipment:[],setups:[main,inactiveMark],skills:[arc,mark]})
    const result=estimateHitDamage({equipment:[],setups:[main,activeMark],skills:[arc,mark]})
    expect(result.criticalDamageBonus).toBe((baseline.criticalDamageBonus??100)+77)
    expect(result.expectedCriticalHitDamage).toBeGreaterThan(baseline.expectedCriticalHitDamage!)
    expect(result.hitDamage).toEqual(baseline.hitDamage)
    expect(result.included).toContain('Scharfsch\u00fctzenmal: strukturierter kritischer Schadensbonus gegen das markierte Ziel')
  })

  it('berechnet strukturierte Zauberbasiswerte deterministisch',()=>{
    const first=estimateHitDamage({equipment:[],setups:[setup('ball')],skills:[skill('ball','Ball Lightning')]})
    const second=estimateHitDamage({equipment:[],setups:[setup('ball')],skills:[skill('ball','Ball Lightning')]})
    expect(first).toEqual(second)
    expect(first.status).toBe('partial')
    expect(first.hitDamage).toMatchObject({minimum:6,maximum:105,average:55.5})
    expect(first.hitDamagePerSecond).toBe(55.5)
  })
  it('bewertet weitere aktive Blitzfertigkeiten als getrennte konkurrierende Schockquellen',()=>{
    const result=estimateHitDamage({
      equipment:[],
      setups:[
        {id:'arc-main',skillId:'arc',role:'main',weaponSet:'set-1',supportGemIds:[],level:20},
        {id:'ball-utility',skillId:'ball',role:'utility',weaponSet:'set-1',supportGemIds:[],level:20},
      ],
      skills:[skill('arc','Arc'),skill('ball','Ball Lightning')],
      enemyProfile:{id:'test-enemy',label:'Testgegner',source:'manual-comparison-profile',level:1},
    })
    const shocks=result.enemyProfile?.appliedEffects?.filter(value=>value.effectGroup==='shock')??[]
    expect(shocks.map(value=>value.sourceId).sort()).toEqual(['arc','ball'])
    expect(shocks.filter(value=>value.selectionStatus==='selected-strongest')).toHaveLength(1)
    expect(result.enemyProfile?.damageTakenIncreased?.lightning).toBeGreaterThan(0)
  })
  it('weist Flameblast bei voller Kanalisierung als getrennten vorbereiteten Treffer aus',()=>{
    const result=estimateHitDamage({
      equipment:[],
      setups:[setup('flameblast')],
      skills:[skill('flameblast','Flameblast')],
    })
    expect(result.channelledStageState?.skills[0]).toMatchObject({
      maximumStages:10,
      fullStageDamageMultiplier:8.5,
      appliedSkillLevel:20,
    })
    expect(result.maximumChannelledHitDamage).toBeCloseTo(result.criticalDamageBonus == null
      ? result.hitDamage!.average*8.5
      : result.hitDamage!.average*result.criticalExpectationMultiplier!*8.5,2)
    expect(result.stages).toContainEqual(expect.objectContaining({
      id:'maximum-channelled-hit',
      label:'Voll aufgeladener vorbereiteter Treffer',
    }))
  })
  it('wendet Detonating Arrows Vollstufen-Feuergewinn nur im vorbereiteten Szenario an',()=>{
    const result=estimateHitDamage({
      equipment:[weapon('Shortbow')],
      setups:[setup('detonating-arrow')],
      skills:[skill('detonating-arrow','Detonating Arrow')],
    })
    expect(result.chargedSkillState?.skills[0]).toMatchObject({
      maximumStages:4,
      fullStageGainAsFirePercent:480,
    })
    expect(result.maximumChargedHitDamage).toBeGreaterThan(result.hitDamagePerSecond!)
    expect(result.stages).toContainEqual(expect.objectContaining({id:'maximum-charged-hit'}))
  })
  it('weist Volcano-Projektile nicht als Einzelzielmultiplikator aus',()=>{
    const result=estimateHitDamage({
      equipment:[],
      setups:[setup('volcano')],
      skills:[skill('volcano','Volcano')],
    })
    expect(result.chargedSkillState?.skills[0]).toMatchObject({
      maximumStages:4,
      fullStageDamageMultiplier:5.5,
      fullStageAdditionalProjectiles:12,
    })
    expect(result.maximumChargedHitDamage).toBeCloseTo(result.expectedCriticalHitDamage!*5.5,2)
  })
  it('wendet Archmage-Kosten und zusätzlichen Blitzschaden nur im aktiven Waffenset an',()=>{
    const arc=skill('arc','Arc')
    const archmage=skill('archmage','Archmage')
    const arcSetup={...setup(arc.id,'set-1'),id:'arc-setup'}
    const activeArchmage={...setup(archmage.id,'set-1'),id:'archmage-setup',role:'utility' as const}
    const inactiveArchmage={...activeArchmage,weaponSet:'set-2' as const}
    const baseline=estimateHitDamage({equipment:[],setups:[arcSetup,inactiveArchmage],skills:[arc,archmage],characterLevel:100})
    const result=estimateHitDamage({equipment:[],setups:[arcSetup,activeArchmage],skills:[arc,archmage],characterLevel:100})
    expect(result.resourceSpiritModel?.skillCostChains.find(value=>value.skillId===arc.id)).toMatchObject({
      baseCosts:[{baseAmount:112,supportAdjustedAmount:112,resourceAdjustedAmount:112}],
      intrinsicSkillCostEffects:[{
        kind:'archmage-max-mana-cost',
        additionalBaseManaCost:31,
        gainAsLightningPercent:20.8,
      }],
    })
    expect(result.hitDamage!.average).toBeCloseTo(baseline.hitDamage!.average*1.208,1)
    expect(result.confirmedGainAsExtra).toContainEqual(expect.objectContaining({
      from:'all',
      to:'lightning',
      percent:20.8,
      source:'skill',
      sourceId:archmage.id,
    }))
    expect(result.included).toContain('Archmage: 20.8% des Schadens als zusätzlicher Blitzschaden bei 31 zusätzlichen Mana-Grundkosten')
  })
  it('weist Mana Tempest als begrenztes aktives Schadensfenster statt Dauer-DPS aus',()=>{
    const arc=skill('arc','Arc')
    const tempest=skill('tempest','Mana Tempest')
    const baseline=estimateHitDamage({
      equipment:[],
      setups:[{...setup(arc.id,'set-1'),id:'arc-setup',level:20}],
      skills:[arc],
      characterLevel:100,
    })
    const result=estimateHitDamage({
      equipment:[],
      setups:[
        {...setup(arc.id,'set-1'),id:'arc-setup',level:20},
        {...setup(tempest.id,'set-1'),id:'tempest-setup',role:'utility',level:20},
      ],
      skills:[arc,tempest],
      characterLevel:100,
    })
    expect(result.temporalOffensiveEffects).toMatchObject([{
      sourceId:tempest.id,
      kind:'gain-as-lightning',
      percent:78,
      durationMs:6489,
      status:'active-window',
    }])
    expect(result.activeWindowDamagePerSecond).toBeGreaterThan(result.expectedCriticalHitDamagePerSecond!)
    expect(result.hitDamagePerSecond).toBe(baseline.hitDamagePerSecond)
  })
  it('wendet Hourglass-Schaden und den belegten Cooldown-Override gemeinsam an',()=>{
    const hourglass:SupportGemDefinition={
      id:'hourglass',displayNameDe:'Sanduhr',nameEn:'Hourglass',tags:[],dataVersion:'test',
      source:'local-placeholder',status:'verified',requiredTags:[],excludedTags:[],ownTags:[],
      quantitativeEffects:pob2QuantitativeEffectsFor('Hourglass'),
    }
    const selected={...setup('spark'),supportGemIds:[hourglass.id]}
    const baseline=estimateHitDamage({equipment:[],setups:[setup('spark')],skills:[skill('spark','Spark')],supports:[hourglass]})
    const result=estimateHitDamage({equipment:[],setups:[selected],skills:[skill('spark','Spark')],supports:[hourglass]})
    expect(result.actionsPerSecond).toBe(0.1)
    expect(result.hitDamage!.average).toBeCloseTo(baseline.hitDamage!.average*1.3,2)
    expect(result.hitDamagePerSecond).toBeLessThan(result.hitDamage!.average)
    expect(result.included).toContain('supportbedingter Cooldown-Override mit nachhaltiger Nutzungsrate')
  })
  it('wendet einen exakt belegten Lucky-Trefferschadensknoten im Erwartungswert an',()=>{
    const passiveTree={nodes:[{
      id:'lucky',
      stats:[{sourceText:'20% chance for Damage with [HitDamage|Hits] to be [Lucky]'}],
    }]} as unknown as RealPassiveTree
    const realPassivePlanning={
      pipelineResult:{allocatedNodeIds:['lucky']},
    } as unknown as RealPassivePlanningIntegrationResult
    const result=estimateHitDamage({
      equipment:[],
      setups:[setup('ball')],
      skills:[skill('ball','Ball Lightning')],
      passiveTree,
      realPassivePlanning,
    })
    expect(result.hitDamage).toMatchObject({minimum:6,maximum:105,average:55.5})
    expect(result.luckyHitEffects).toMatchObject({
      modelVersion:'2.0.0',
      expectedHitDamage:58.8,
      effects:[{sourceNodeId:'lucky',damageType:'all',chancePercent:20,condition:'unconditional'}],
      blockedEffects:[],
    })
    expect(result.hitDamagePerSecond).toBe(58.8)
    expect(result.stages?.map(stage=>stage.id)).toContain('lucky-hit-expectation')
  })
  it('blockiert bedingtes Lucky ohne bestätigten Gegnerzustand und aktiviert es bei Low Life',()=>{
    const passiveTree={nodes:[{
      id:'low-life-lucky',
      stats:[{sourceText:'Damage with [HitDamage|Hits] is [Lucky] against Enemies that are on Low Life'}],
    }]} as unknown as RealPassiveTree
    const realPassivePlanning={
      pipelineResult:{allocatedNodeIds:['low-life-lucky']},
    } as unknown as RealPassivePlanningIntegrationResult
    const baseInput={
      equipment:[],
      setups:[setup('ball')],
      skills:[skill('ball','Ball Lightning')],
      passiveTree,
      realPassivePlanning,
    }
    const blocked=estimateHitDamage(baseInput)
    expect(blocked.hitDamagePerSecond).toBe(55.5)
    expect(blocked.luckyHitEffects).toMatchObject({
      effects:[],
      blockedEffects:[{condition:'enemy-low-life',reason:'enemy-state-not-confirmed'}],
    })
    const active=estimateHitDamage({
      ...baseInput,
      enemyProfile:{id:'low-life',label:'Low Life',source:'manual-comparison-profile',lifeState:'low-life'},
    })
    expect(active.hitDamagePerSecond).toBe(72)
    expect(active.luckyHitEffects).toMatchObject({
      effects:[{condition:'enemy-low-life',chancePercent:100}],
      blockedEffects:[],
    })
  })
  it('aktiviert Heavy-Stun-Lucky ausschließlich bei explizit schwer betäubtem Gegner',()=>{
    const passiveTree={nodes:[{
      id:'heavy-stun-lucky',
      stats:[{sourceText:'Damage with [HitDamage|Hits] is [Lucky] against Heavy Stunned Enemies'}],
    }]} as unknown as RealPassiveTree
    const realPassivePlanning={
      pipelineResult:{allocatedNodeIds:['heavy-stun-lucky']},
    } as unknown as RealPassivePlanningIntegrationResult
    const result=estimateHitDamage({
      equipment:[],
      setups:[setup('ball')],
      skills:[skill('ball','Ball Lightning')],
      passiveTree,
      realPassivePlanning,
      enemyProfile:{id:'heavy-stunned',label:'Heavy Stunned',source:'manual-comparison-profile',heavyStunned:true},
    })
    expect(result.hitDamagePerSecond).toBe(72)
    expect(result.luckyHitEffects?.effects[0]).toMatchObject({
      condition:'enemy-heavy-stunned',
      chancePercent:100,
    })
  })
  it('wendet Doppel- und Dreifachschaden in der belegten PoB2-Erwartungsreihenfolge an',()=>{
    const passiveTree={nodes:[
      {
        id:'double',
        stats:[{sourceText:'20% chance to deal Double Damage'}],
      },
      {
        id:'triple',
        stats:[{sourceText:'10% chance to deal Triple Damage'}],
      },
    ]} as unknown as RealPassiveTree
    const realPassivePlanning={
      pipelineResult:{allocatedNodeIds:['double','triple']},
    } as unknown as RealPassivePlanningIntegrationResult
    const baseline=estimateHitDamage({
      equipment:[],
      setups:[setup('ball')],
      skills:[skill('ball','Ball Lightning')],
    })
    const result=estimateHitDamage({
      equipment:[],
      setups:[setup('ball')],
      skills:[skill('ball','Ball Lightning')],
      passiveTree,
      realPassivePlanning,
    })
    expect(result.multipleDamageEffect).toMatchObject({
      doubleDamageChancePercent:20,
      tripleDamageChancePercent:10,
      effectiveDoubleDamageChancePercent:18,
      expectedDamageMultiplier:1.38,
    })
    expect(result.hitDamagePerSecond).toBeCloseTo(baseline.hitDamagePerSecond!*1.38,2)
    expect(result.expectedCriticalHitDamagePerSecond).toBeCloseTo(
      baseline.expectedCriticalHitDamagePerSecond!*1.38,
      1,
    )
    expect(result.stages?.map(stage=>stage.id)).toContain('multiple-damage-expectation')
  })
  it('verwendet die exakt gewählte Skill-Levelzeile für Schaden und Kosten',()=>{
    const selected={...setup('ball'),level:19}
    const result=estimateHitDamage({equipment:[],setups:[selected],skills:[skill('ball','Ball Lightning')]})
    expect(result.status).toBe('partial')
    expect(result.gemLevel).toBe(19)
    expect(result.hitDamage).toMatchObject({minimum:5,maximum:93,average:49})
    expect(result.resourceSpiritModel?.skillCostChains[0]).toMatchObject({
      baseCostStatus:'structured-exact-level',
      baseCosts:[{resource:'mana',cadence:'per-use',baseAmount:87}],
    })
  })
  it('verwendet Waffenbasis und Angriffsmultiplikator für Angriffe',()=>{
    const result=estimateHitDamage({equipment:[weapon('Crude Bow')],setups:[setup('arrow')],skills:[skill('arrow','Lightning Arrow')]})
    expect(result.status).toBe('partial')
    expect(result.hitDamage).toMatchObject({minimum:15,maximum:22.5,average:18.75})
    expect(result.actionsPerSecond).toBe(1.08)
    expect(result.hitDamagePerSecond).toBe(20.25)
  })
  it('weist Angriffsschaden mit exakter PoB2-Trefferchance separat aus',()=>{
    const result=estimateHitDamage({
      equipment:[weapon('Crude Bow')],
      setups:[setup('arrow')],
      skills:[skill('arrow','Lightning Arrow')],
      characterLevel:80,
      characterClassId:'class-official-8',
      enemyProfile:{id:'target',label:'Stufe 80',source:'manual-comparison-profile',level:80,evasion:853},
    })
    expect(result.attackHitChance).toMatchObject({
      status:'exact',
      playerAccuracy:564,
      enemyEvasion:853,
      hitChancePercent:86,
    })
    expect(result.accuracyAdjustedDamagePerSecond).toBe(17.41)
    expect(result.accuracyAdjustedDamagePerSecondAfterMitigation).toBe(17.41)
  })
  it('übergibt die belegte erfolgreiche Trefferfrequenz an die Raserei-Ressourcenkette',()=>{
    const rage:SupportGemDefinition={
      id:'rage-three',displayNameDe:'Raserei III',nameEn:'Rage III',tags:[],dataVersion:'test',
      source:'local-placeholder',status:'verified',requiredTags:[],excludedTags:[],ownTags:[],
      costMultiplierPercent:100,
    }
    const selected={...setup('leap'),supportGemIds:[rage.id]}
    const result=estimateHitDamage({
      equipment:[weapon('Akoyan Club')],
      setups:[selected],
      skills:[skill('leap','Leap Slam')],
      supports:[rage],
      characterLevel:80,
      characterClassId:'class-official-8',
      enemyProfile:{id:'target',label:'Stufe 80',source:'manual-comparison-profile',level:80,evasion:853},
    })
    const chain=result.resourceSpiritModel?.skillCostChains[0]
    expect(result.attackHitChance?.status).toBe('exact')
    expect(chain).toMatchObject({
      rageGenerationPerHit:5,
      rageSustainStatus:'no-rage-cost',
    })
    expect(chain?.actionFrequencyPerSecond).toBe(result.actionsPerSecond)
    expect(chain?.rageGenerationPerSecond).toBeCloseTo(
      result.actionsPerSecond!*result.attackHitChance!.hitChancePercent!/100*5,
      2,
    )
    expect(result.rageDamageComparison).toMatchObject({
      modelVersion:'2.1.0',
      status:'ramped-sustained-combat-comparison',
      inherentMoreAttackDamagePerRagePercent:1,
      comparedRage:30,
      effectiveRageEffect:30,
      appliesTo:'attack',
      damageMultiplier:1.3,
    })
    expect(result.rageDamageComparison?.expectedDamagePerSecondAtComparedRage).toBeCloseTo(
      result.accuracyAdjustedExpectedCriticalDamagePerSecond!*1.3,
      2,
    )
  })
  it('rechnet belegte passive Wutskalierung nur in den bestätigten Wutzustand ein',()=>{
    const rage:SupportGemDefinition={
      id:'rage-three',displayNameDe:'Raserei III',nameEn:'Rage III',tags:[],dataVersion:'test',
      source:'local-placeholder',status:'verified',requiredTags:[],excludedTags:[],ownTags:[],
      costMultiplierPercent:100,
    }
    const selected={...setup('leap'),supportGemIds:[rage.id]}
    const passiveTree={
      metadata:{releaseTag:'test'},
      connections:[],
      nodes:[{
        id:'bestial-rage',
        name:{sourceText:'Bestial Rage'},
        stats:[{sourceText:'Every 10 [Rage|Rage] also grants 12% increased [Physical|Physical] Damage'}],
        nodeType:'normal',
        isClassStart:false,
        classStartIndex:null,
        isAscendancyStart:false,
        ascendancyId:null,
        isJewelSocket:false,
      }],
    } as RealPassiveTree
    const realPassivePlanning={
      pipelineResult:{allocatedNodeIds:['bestial-rage']},
    } as unknown as RealPassivePlanningIntegrationResult
    const common={
      equipment:[weapon('Akoyan Club')],
      setups:[selected],
      skills:[skill('leap','Leap Slam')],
      supports:[rage],
      characterLevel:80,
      characterClassId:'class-official-8',
      enemyProfile:{id:'target',label:'Stufe 80',source:'manual-comparison-profile' as const,level:80,evasion:853},
    }
    const baseline=estimateHitDamage(common)
    const result=estimateHitDamage({...common,passiveTree,realPassivePlanning})
    expect(result.accuracyAdjustedExpectedCriticalDamagePerSecond).toBe(
      baseline.accuracyAdjustedExpectedCriticalDamagePerSecond,
    )
    expect(result.rageDamageComparison?.appliedRageScaledEffects).toEqual([
      expect.objectContaining({
        sourceId:'bestial-rage',
        kind:'increased',
        percent:36,
        rageDivisor:10,
      }),
    ])
    expect(result.rageDamageComparison!.expectedDamagePerSecondAtComparedRage!).toBeGreaterThan(
      baseline.rageDamageComparison!.expectedDamagePerSecondAtComparedRage!,
    )
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
      {type:'physical',minimum:23,maximum:45.5},
      {type:'fire',minimum:70,maximum:110},
      {type:'cold',minimum:72.5,maximum:87.5},
      {type:'lightning',minimum:92,maximum:182},
    ])
    expect(result.actionsPerSecond).toBe(1.35)
    expect(result.included).toContain('eingegebene endgültige Waffenschadenswerte einschließlich lokaler Wirkungen und Qualität')
  })
  it('wendet Qualität und lokale Affixe nicht erneut auf eingegebene Endwerte an',()=>{
    const observed={...weapon('Gezackter Speer'),quality:20,weaponStats:{
      physicalDamage:{minimum:100,maximum:100},criticalHitChance:0,attacksPerSecond:1,
    },modifierValues:[{
      id:'local-physical',modifierId:'local-physical',value:100,isLocal:true,
      statValues:[{statId:'local_physical_damage_+%',value:100}],
    }]}
    const result=estimateHitDamage({equipment:[observed],setups:[setup('arrow')],skills:[skill('arrow','Lightning Arrow')]})
    expect(result.hitDamage).toMatchObject({minimum:250,maximum:250})
    expect(result.itemValueScopeModel).toMatchObject({
      observedFinalValueItemIds:['weapon'],
      localModifiersExcludedFromGlobalScaling:1,
      blockedItemIds:[],
    })
  })
  it('blockiert unbelegte Qualitätsberechnung auf einer reinen Waffenbasis',()=>{
    const result=estimateHitDamage({
      equipment:[{...weapon('Crude Bow'),quality:20}],
      setups:[setup('arrow')],
      skills:[skill('arrow','Lightning Arrow')],
    })
    expect(result.status).toBe('unavailable')
    expect(result.hitDamage).toBeUndefined()
    expect(result.itemValueScopeModel?.blockedItemIds).toEqual(['weapon'])
    expect(result.warnings.join(' ')).toContain('fehlt eine exakte')
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
  it('berechnet ein kompatibles Cast-on-Critical-Ziel rekursionssicher als normierten Teilwert',()=>{
    const main=skill('arc','Arc')
    const trigger=skill('coc','Cast on Critical')
    const target=skill('comet','Comet')
    const result=estimateHitDamage({
      equipment:[],
      setups:[
        setup(main.id),
        {...setup(trigger.id),id:'trigger',role:'utility',embeddedSkillIds:[target.id]},
      ],
      skills:[main,trigger,target],
    })
    expect(result.status).toBe('partial')
    expect(result.triggerRepeatModel?.sources).toContainEqual(expect.objectContaining({
      sourceSkillId:'coc',
      targetSkillId:'comet',
      status:'normalized-target-damage-only',
      targetDamageMultiplier:0.8,
      targetExpectedHitDamage:expect.any(Number),
      normalizedTriggeredDamagePerSecondAtMonsterPowerOne:expect.any(Number),
    }))
    expect(result.triggerRepeatModel?.productive).toBe(false)
  })
  it('nimmt ein vollständig belegtes Cast-on-Critical-Ziel in den kombinierten Vergleichsschaden auf',()=>{
    const main=skill('arc','Arc')
    const trigger=skill('coc','Cast on Critical')
    const target=skill('comet','Comet')
    const result=estimateHitDamage({
      equipment:[],
      setups:[
        setup(main.id),
        {...setup(trigger.id),id:'trigger',role:'utility',embeddedSkillIds:[target.id]},
      ],
      skills:[main,trigger,target],
      enemyProfile:{
        id:'test-unique',
        label:'Testgegner',
        source:'manual-comparison-profile',
        level:1,
        monsterPower:20,
        monsterPowerEvidence:'manual-exact',
        resistances:{fire:0,cold:0,lightning:0,chaos:0},
      },
    })
    expect(result.triggerRepeatModel?.productive).toBe(true)
    expect(result.triggerRepeatModel?.sources).toContainEqual(expect.objectContaining({
      sourceSkillId:'coc',
      targetSkillId:'comet',
      status:'productive-target-damage',
      monsterPower:20,
      enemyAilmentThreshold:15,
      triggeredDamagePerSecond:expect.any(Number),
    }))
    expect(result.combinedDamagePerSecond).toBeGreaterThan(result.accuracyAdjustedExpectedCriticalDamagePerSecond!)
    expect(result.combinedDamagePerSecondAfterMitigation).toBeGreaterThan(result.accuracyAdjustedDamagePerSecondAfterMitigation!)
  })
  it('berechnet eine Minion-Hauptfertigkeit nicht fälschlich mit Spielerwaffe und Spielertempo',()=>{
    const result=estimateHitDamage({
      equipment:[weapon('Crude Bow')],
      setups:[setup('raging')],
      skills:[skill('raging','Raging Spirits')],
    })
    expect(result.status).toBe('unavailable')
    expect(result.hitDamagePerSecond).toBeUndefined()
    expect(result.actionsPerSecond).toBeUndefined()
    expect(result.minionCompanionModel).toMatchObject({
      primarySkillMinion:true,
      productive:false,
      sources:[{kind:'minion',status:'blocked-missing-count-and-uptime'}],
    })
  })
  it('zeigt einen belegten Offering-Bonus, addiert ihn aber ohne Minion-Ziel nicht zum Spielerschaden',()=>{
    const main=skill('arc','Arc')
    const offering=skill('offering','Pain Offering')
    const baseline=estimateHitDamage({equipment:[],setups:[setup(main.id)],skills:[main,offering]})
    const result=estimateHitDamage({
      equipment:[],
      setups:[setup(main.id),{...setup(offering.id),id:'offering',role:'utility'}],
      skills:[main,offering],
    })
    expect(result.hitDamagePerSecond).toBe(baseline.hitDamagePerSecond)
    expect(result.minionCompanionModel?.sources).toContainEqual(expect.objectContaining({
      sourceSkillId:'offering',kind:'offering',damageBonusPercent:58,speedBonusPercent:29,status:'support-only',
    }))
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
  it('stapelt Rapid Casting additiv mit anderer erhöhter Zaubergeschwindigkeit',()=>{
    const rapid:SupportGemDefinition={
      ...supportDef('rapid-casting-ii','Rapid Casting II'),
      quantitativeEffects:pob2QuantitativeEffectsFor('Rapid Casting II'),
    }
    const castSpeedItem:EquipmentEntry={id:'cast-speed',slotId:'slot-helmet',itemClassId:'Helmets',rarity:'rare',modifierValues:[{
      id:'cast-speed-value',modifierId:'cast-speed',value:20,statValues:[{statId:'cast_speed_+%',value:20}],
    }]}
    const baseline=estimateHitDamage({equipment:[castSpeedItem],setups:[setup('arc')],skills:[skill('arc','Arc')],supports:[rapid]})
    const selected={...setup('arc'),supportGemIds:[rapid.id]}
    const result=estimateHitDamage({equipment:[castSpeedItem],setups:[selected],skills:[skill('arc','Arc')],supports:[rapid]})
    expect(baseline.actionsPerSecond).toBe(1.09)
    expect(result.actionsPerSecond).toBe(1.27)
    expect(result.appliedSupportEffects).toEqual([expect.objectContaining({sourceId:'rapid-casting-ii',value:20})])
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
  it('wendet den gewählten strukturierten Durchdringungs-Support auf den Treffer des Hauptskills an',()=>{
    const selected={...setup('arc'),supportGemIds:['lightning-penetration']}
    const enemyProfile={id:'penetration-support',label:'Durchdringungstest',source:'manual-comparison-profile' as const,resistances:{lightning:40}}
    const baseline=estimateHitDamage({equipment:[],setups:[setup('arc')],skills:[skill('arc','Arc')],enemyProfile})
    const result=estimateHitDamage({
      equipment:[],setups:[selected],skills:[skill('arc','Arc')],
      supports:[supportDef('lightning-penetration','Lightning Penetration')],
      enemyProfile,
    })
    expect(result.enemyProfile?.penetration).toEqual({lightning:30})
    expect(result.enemyProfile?.appliedEffects).toContainEqual(expect.objectContaining({
      source:'support',sourceId:'lightning-penetration',kind:'penetration',value:30,
    }))
    expect(result.mitigatedComponents?.[0]).toMatchObject({type:'lightning',effectiveDefence:10})
    expect(result.expectedDamagePerSecondAfterMitigation).toBeGreaterThan(baseline.expectedDamagePerSecondAfterMitigation!)
  })
  it('wendet Trefferpenetration nicht auf eine reine Schaden-über-Zeit-Fertigkeit an',()=>{
    const selected={...setup('contagion'),supportGemIds:['fire-penetration']}
    const result=estimateHitDamage({
      equipment:[],setups:[selected],skills:[skill('contagion','Contagion')],
      supports:[supportDef('fire-penetration','Fire Penetration I')],
      enemyProfile:{id:'dot-penetration',label:'DoT-Test',source:'manual-comparison-profile',resistances:{fire:40,chaos:40}},
    })
    expect(result.enemyProfile?.penetration).toBeUndefined()
    expect(result.enemyProfile?.appliedEffects?.some(effect=>effect.kind==='penetration')).not.toBe(true)
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
    expect(result.enemyProfile?.temporalModelVersion).toBe('2.0.0')
  })
  it('führt eine gewählte Fire-Exposure-Unterstützung über den realen Trefferkontext bis zur Schadensminderung',()=>{
    const fireSetup={...setup('fireball'),supportGemIds:['fire-exposure']}
    const baseline=estimateHitDamage({
      equipment:[],setups:[setup('fireball')],skills:[skill('fireball','Fireball')],
      enemyProfile:{id:'fire-target',label:'Feuerziel',source:'manual-comparison-profile',level:1,resistances:{fire:40}},
    })
    const exposed=estimateHitDamage({
      equipment:[],setups:[fireSetup],skills:[skill('fireball','Fireball')],supports:[supportDef('fire-exposure','Fire Exposure')],
      enemyProfile:{id:'fire-target',label:'Feuerziel',source:'manual-comparison-profile',level:1,resistances:{fire:40}},
    })
    expect(exposed.enemyProfile?.resistanceReduction?.fire).toBe(20)
    expect(exposed.enemyProfile?.appliedEffects).toContainEqual(expect.objectContaining({sourceId:'fire-exposure',effectGroup:'exposure'}))
    expect(exposed.expectedDamagePerSecondAfterMitigation).toBeGreaterThan(baseline.expectedDamagePerSecondAfterMitigation!)
  })
  it('verbindet ausgewähltes Wither mit Chaos-Treffer und eigenständigem Chaos-DoT',()=>{
    const witherSetup:SkillSetup={id:'wither-setup',skillId:'wither',role:'utility',weaponSet:'set-1',supportGemIds:[]}
    const baseInput={
      equipment:[],setups:[setup('essence-drain')],skills:[skill('essence-drain','Essence Drain'),skill('wither','Wither')],
      enemyProfile:{id:'chaos-target',label:'Chaosziel',source:'manual-comparison-profile' as const,resistances:{chaos:0}},
    }
    const baseline=estimateHitDamage(baseInput)
    const withWither=estimateHitDamage({...baseInput,setups:[...baseInput.setups,witherSetup]})
    expect(withWither.enemyProfile?.damageTakenIncreased).toEqual({chaos:60})
    expect(withWither.expectedDamageAfterMitigation).toBeCloseTo(baseline.expectedDamageAfterMitigation!*1.6,1)

    const contagionInput={
      equipment:[],setups:[setup('contagion')],skills:[skill('contagion','Contagion'),skill('wither','Wither')],
      enemyProfile:{id:'chaos-dot-target',label:'Chaos-DoT-Ziel',source:'manual-comparison-profile' as const,resistances:{chaos:0}},
    }
    const contagionBaseline=estimateHitDamage(contagionInput)
    const contagionWithWither=estimateHitDamage({...contagionInput,setups:[...contagionInput.setups,witherSetup]})
    expect(contagionWithWither.damageOverTime?.totalSingleApplicationDamagePerSecondAfterMitigation)
      .toBeCloseTo(contagionBaseline.damageOverTime!.totalSingleApplicationDamagePerSecondAfterMitigation!*1.6,1)
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
    expect(result.mitigatedComponents?.find(value=>value.type==='physical')?.minimum).toBe(60)
    expect(result.mitigatedComponents?.find(value=>value.type==='lightning')?.minimum).toBe(200)
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
  it('blockiert eine nicht referenzierte Gemmenstufe statt Stufe 20 zu verwenden',()=>{
    const mismatched={...setup('arc'),level:99}
    const result=estimateHitDamage({equipment:[],setups:[mismatched],skills:[skill('arc','Arc')]})
    expect(result.status).toBe('unavailable')
    expect(result.gemLevel).toBeUndefined()
    expect(result.gemLevelQualityModel).toMatchObject({requestedSkillLevel:99,productive:false})
    expect(result.warnings.join(' ')).toContain('keine exakte numerische Referenz')
  })
})
