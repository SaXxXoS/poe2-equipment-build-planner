import { describe,expect,it } from 'vitest'
import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup,SupportGemDefinition } from '../../domain/skills'
import { applyBloodlustPhysicalDamageMultiplier,resolveBloodlustSupport } from './bloodlust-support'

const support=(id='bloodlust'):SupportGemDefinition=>({id,nameEn:'Bloodlust',displayNameDe:'Blutdurst',tags:[],dataVersion:'test',source:'local-placeholder',status:'verified',requiredTags:[],excludedTags:[],ownTags:[]})
const setup=(ids:string[]):SkillSetup=>({id:'setup',skillId:'skill',role:'main',weaponSet:'set-1',supportGemIds:ids})
const meleeSkill=()=>{const value=reference.skills.find(skill=>skill.skillTypes.includes('Melee')&&skill.kind==='attack');if(!value)throw new Error('Missing pinned melee fixture');return value}

describe('exact Bloodlust support model',()=>{
  it('applies only to physical damage against a confirmed bleeding enemy',()=>{
    const selected=support()
    const model=resolveBloodlustSupport({skill:meleeSkill(),setup:setup([selected.id]),supports:[selected],enemyProfile:{id:'bleeding',label:'Blutend',source:'manual-comparison-profile',ailmentStates:{bleeding:true}}})
    expect(model).toMatchObject({status:'applied',physicalDamageMultiplier:1.3})
    expect(applyBloodlustPhysicalDamageMultiplier([{type:'physical',minimum:100,maximum:200},{type:'fire',minimum:50,maximum:80}],model)).toEqual([{type:'physical',minimum:130,maximum:260},{type:'fire',minimum:50,maximum:80}])
  })
  it('distinguishes confirmed inactive and unknown state and blocks invalid selections',()=>{
    const first=support('bloodlust-one'),second=support('bloodlust-two')
    expect(resolveBloodlustSupport({skill:meleeSkill(),setup:setup([first.id]),supports:[first],enemyProfile:{id:'not-bleeding',label:'Nicht blutend',source:'manual-comparison-profile',ailmentStates:{bleeding:false}}}).status).toBe('inactive-enemy-not-bleeding')
    expect(resolveBloodlustSupport({skill:meleeSkill(),setup:setup([first.id]),supports:[first],enemyProfile:{id:'unknown',label:'Unbekannt',source:'manual-comparison-profile'}})).toMatchObject({status:'blocked-unknown-enemy-bleeding-state',physicalDamageMultiplier:1,blockedSupportIds:[first.id]})
    expect(resolveBloodlustSupport({skill:{...meleeSkill(),skillTypes:['Attack']},setup:setup([first.id]),supports:[first]}).status).toBe('blocked-incompatible-skill')
    expect(resolveBloodlustSupport({skill:meleeSkill(),setup:setup([first.id,second.id]),supports:[first,second]}).status).toBe('blocked-duplicate-family')
  })
})
