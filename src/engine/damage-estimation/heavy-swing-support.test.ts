import { describe, expect, it } from 'vitest'
import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain/skills'
import { applyHeavySwingPhysicalDamageMultiplier, resolveHeavySwingSupport } from './heavy-swing-support'

const support=(id='heavy-swing'):SupportGemDefinition=>({id,displayNameDe:'Wuchtiger Schwung',nameEn:'Heavy Swing',tags:[],dataVersion:'test',source:'local-placeholder',status:'verified',requiredTags:[],excludedTags:[],ownTags:[]})
const setup=(ids:string[]):SkillSetup=>({id:'setup',skillId:'skill',role:'main',weaponSet:'set-1',supportGemIds:ids})
const sourceSkill=(name:string)=>{const result=reference.skills.find(value=>value.name===name);if(!result)throw new Error(`Missing pinned skill fixture: ${name}`);return result}

describe('exact Heavy Swing support model',()=>{
  it('applies physical damage and attack speed together to a melee skill',()=>{
    const selected=support()
    const result=resolveHeavySwingSupport({skill:sourceSkill('Armour Breaker'),setup:setup([selected.id]),supports:[selected]})
    expect(result).toMatchObject({status:'applied',physicalDamageMultiplier:1.35,attackSpeedMultiplier:.9})
    expect(applyHeavySwingPhysicalDamageMultiplier([{type:'physical',minimum:10,maximum:20},{type:'fire',minimum:10,maximum:20}],result)).toEqual([
      {type:'physical',minimum:13.5,maximum:27},{type:'fire',minimum:10,maximum:20},
    ])
  })
  it('blocks a non-melee skill fail-closed',()=>{
    const selected=support()
    expect(resolveHeavySwingSupport({skill:sourceSkill('Spark'),setup:setup([selected.id]),supports:[selected]})).toMatchObject({status:'blocked-incompatible-skill',physicalDamageMultiplier:1,attackSpeedMultiplier:1})
  })
  it('blocks duplicate support families fail-closed',()=>{
    const first=support('one'),second=support('two')
    expect(resolveHeavySwingSupport({skill:sourceSkill('Armour Breaker'),setup:setup([first.id,second.id]),supports:[first,second]})).toMatchObject({status:'blocked-duplicate-family',blockedSupportIds:[first.id,second.id]})
  })
})
