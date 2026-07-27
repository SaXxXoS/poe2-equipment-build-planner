import { describe,expect,it } from 'vitest'
import type { EquipmentEntry,SkillGemDefinition,SkillSetup,SupportGemDefinition } from '../../domain'
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
    expect(result.excluded).toContain('Mehrfachtreffer, Projektile und situationsabhängige Effekte')
    expect(result.excluded).toContain('bedingte Passive- und Aszendenzeffekte')
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
})
