import { describe,expect,it } from 'vitest'
import type { EquipmentEntry,SkillGemDefinition,SkillSetup } from '../../domain'
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
  it('weist nicht enthaltene komplexe Mechaniken aus',()=>{
    const result=estimateHitDamage({equipment:[],setups:[setup('ball')],skills:[skill('ball','Ball Lightning')]})
    expect(result.excluded).toContain('Mehrfachtreffer, Projektile und situationsabhängige Effekte')
    expect(result.excluded).toContain('Passive und Aszendenzwerte')
  })
  it('wendet elementare Steigerungen nur auf die passende Schadenskomponente an',()=>{
    const fireItem:EquipmentEntry={id:'fire',slotId:'slot-helmet',itemClassId:'Helmets',rarity:'rare',modifierValues:[{
      id:'applied-fire-damage',modifierId:'fire-damage',value:100,statValues:[{statId:'fire_damage_+%',value:100}],
    }]}
    const result=estimateHitDamage({equipment:[fireItem],setups:[setup('ball')],skills:[skill('ball','Ball Lightning')]})
    expect(result.hitDamage).toMatchObject({minimum:6,maximum:105,average:55.5})
  })
})
