import { describe,expect,it } from 'vitest'
import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup,SupportGemDefinition } from '../../domain/skills'
import { applyMaximumPhysicalDamageSupports } from './maximum-physical-damage-supports'

const heft:SupportGemDefinition={id:'heft',nameEn:'Heft',displayNameDe:'Muskelkraft',tags:[],requiredTags:[],excludedTags:[],ownTags:[],dataVersion:'test',source:'local-placeholder',status:'verified'}
const setup:SkillSetup={id:'main',skillId:'skill',role:'main',weaponSet:'set-1',supportGemIds:[heft.id]}
const attack=reference.skills.find(value=>value.skillTypes.includes('Attack')&&value.skillTypes.includes('Damage'))!
const spell=reference.skills.find(value=>value.skillTypes.includes('Spell')&&!value.skillTypes.includes('Attack'))!

describe('strukturierter maximaler physischer Schaden durch Supports',()=>{
  it('erhöht mit Muskelkraft nur das physische Maximum',()=>{
    const value=applyMaximumPhysicalDamageSupports({components:[{type:'physical',minimum:100,maximum:200},{type:'fire',minimum:10,maximum:20}],skill:attack,setup,supports:[heft]})
    expect(value).toMatchObject({status:'applied',components:[{type:'physical',minimum:100,maximum:260},{type:'fire',minimum:10,maximum:20}]})
    expect(value.appliedSupports[0]).toMatchObject({supportName:'Muskelkraft',finalMaximumPhysicalDamagePercent:30})
  })
  it('blockiert Muskelkraft für einen Zauber',()=>expect(applyMaximumPhysicalDamageSupports({components:[{type:'physical',minimum:100,maximum:200}],skill:spell,setup,supports:[heft]})).toMatchObject({status:'blocked-incompatible-skill',components:[{type:'physical',minimum:100,maximum:200}]}))
  it('erfindet ohne physischen Ausgangsschaden keinen Bonus',()=>expect(applyMaximumPhysicalDamageSupports({components:[{type:'lightning',minimum:100,maximum:200}],skill:attack,setup,supports:[heft]}).status).toBe('blocked-missing-physical-damage'))
})
