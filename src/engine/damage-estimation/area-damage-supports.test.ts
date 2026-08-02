import { describe,expect,it } from 'vitest'
import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup,SupportGemDefinition } from '../../domain/skills'
import { applyAreaDamageMultiplier,resolveAreaDamageSupports } from './area-damage-supports'

const support=(id:string):SupportGemDefinition=>({id,nameEn:'Concentrated Area',displayNameDe:'Konzentrierte Wirkung',tags:[],requiredTags:[],excludedTags:[],ownTags:[],dataVersion:'test',source:'local-placeholder',status:'verified'})
const setup=(ids:string[]):SkillSetup=>({id:'main',skillId:'skill',role:'main',weaponSet:'set-1',supportGemIds:ids})
const skill=(name:string)=>reference.skills.find(value=>value.name===name)!

describe('strukturierter Flächenschaden-Support',()=>{
  it('wendet Schaden und Wirkungsfläche getrennt an',()=>{
    const concentrated=support('concentrated')
    const model=resolveAreaDamageSupports({skill:skill('Flameblast'),setup:setup([concentrated.id]),supports:[concentrated]})
    expect(model).toMatchObject({status:'applied',damageMultiplier:1.3,areaOfEffectMultiplier:.5,appliedSupports:[{finalAreaDamagePercent:30,finalAreaOfEffectPercent:-50}]})
    expect(applyAreaDamageMultiplier([{type:'fire',minimum:100,maximum:200}],model)).toEqual([{type:'fire',minimum:130,maximum:260}])
  })
  it('blockiert eine Fertigkeit ohne strukturierten Area-Typ',()=>{
    const concentrated=support('concentrated')
    expect(resolveAreaDamageSupports({skill:skill('Arc'),setup:setup([concentrated.id]),supports:[concentrated]})).toMatchObject({status:'blocked-incompatible-skill',damageMultiplier:1,areaOfEffectMultiplier:1})
  })
  it('blockiert mehrere Stufen derselben Familie fail-closed',()=>{
    const first=support('first'),second=support('second')
    expect(resolveAreaDamageSupports({skill:skill('Flameblast'),setup:setup([first.id,second.id]),supports:[first,second]})).toMatchObject({status:'blocked-duplicate-family',blockedSupportIds:['first','second']})
  })
})
