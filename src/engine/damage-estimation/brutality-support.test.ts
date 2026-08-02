import { describe,expect,it } from 'vitest'
import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup,SupportGemDefinition } from '../../domain/skills'
import { applyBrutalityPhysicalDamageMultiplier,resolveBrutalitySupport } from './brutality-support'

const support=(nameEn:string,id=nameEn):SupportGemDefinition=>({id,displayNameDe:nameEn,nameEn,tags:[],dataVersion:'test',source:'local-placeholder',status:'verified',requiredTags:[],excludedTags:[],ownTags:[]})
const setup=(ids:string[]):SkillSetup=>({id:'setup',skillId:'skill',role:'main',weaponSet:'set-1',supportGemIds:ids})
const sourceSkill=(name:string)=>{const result=reference.skills.find(value=>value.name===name);if(!result)throw new Error(`Missing pinned skill fixture: ${name}`);return result}

describe('exact Brutality support model',()=>{
  it('applies Brutality I only to physical damage',()=>{
    const selected=support('Brutality I')
    const result=resolveBrutalitySupport({skill:sourceSkill('Armour Breaker'),setup:setup([selected.id]),supports:[selected]})
    expect(result).toMatchObject({status:'applied',physicalDamageMultiplier:1.25,physicalDamageReductionIgnoreChancePercent:0})
    expect(applyBrutalityPhysicalDamageMultiplier([{type:'physical',minimum:10,maximum:20},{type:'fire',minimum:10,maximum:20}],result)).toEqual([
      {type:'physical',minimum:12.5,maximum:25},{type:'fire',minimum:10,maximum:20},
    ])
  })
  it('includes Brutality III hit-based physical reduction ignore chance',()=>{
    const selected=support('Brutality III')
    expect(resolveBrutalitySupport({skill:sourceSkill('Armour Breaker'),setup:setup([selected.id]),supports:[selected]})).toMatchObject({status:'applied',physicalDamageMultiplier:1.3,physicalDamageReductionIgnoreChancePercent:20})
  })
  it('blocks a skill without a required pinned skill type',()=>{
    const selected=support('Brutality II')
    const incompatible={...sourceSkill('Spark'),skillTypes:['Spell']}
    expect(resolveBrutalitySupport({skill:incompatible,setup:setup([selected.id]),supports:[selected]})).toMatchObject({status:'blocked-incompatible-skill',physicalDamageMultiplier:1})
  })
  it('blocks duplicate ranks from the same support family',()=>{
    const first=support('Brutality I','one'),second=support('Brutality II','two')
    expect(resolveBrutalitySupport({skill:sourceSkill('Armour Breaker'),setup:setup([first.id,second.id]),supports:[first,second]})).toMatchObject({status:'blocked-duplicate-family',blockedSupportIds:[first.id,second.id]})
  })
})
