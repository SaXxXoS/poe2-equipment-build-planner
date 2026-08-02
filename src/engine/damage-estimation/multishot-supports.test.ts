import {describe,expect,it} from 'vitest'
import type {SkillSetup,SupportGemDefinition} from '../../domain/skills'
import {applyMultishotDamageMultiplier,resolveMultishotSupports} from './multishot-supports'

const support=(id:string,nameEn:string):SupportGemDefinition=>({id,nameEn,displayNameDe:nameEn,tags:[],requiredTags:[],excludedTags:[],ownTags:[],dataVersion:'test',source:'local-placeholder',status:'verified'})
const setup=(ids:string[]):SkillSetup=>({id:'setup',skillId:'skill',role:'main',weaponSet:'set-1',supportGemIds:ids})
const skill=(types:string[])=>({name:'Test',skillTypes:types,numericStats:{}} as never)

describe('structured multishot supports',()=>{
  it('applies all three pinned Multishot I values',()=>{
    const gem=support('multi-1','Multishot I')
    const result=resolveMultishotSupports({skill:skill(['Projectile','ProjectileNumber']),setup:setup([gem.id]),supports:[gem]})
    expect(result).toMatchObject({status:'applied',additionalProjectiles:2,damageMultiplier:.65,skillSpeedMultiplier:.8,singleTargetHitMultiplier:1})
    expect(applyMultishotDamageMultiplier([{type:'physical',minimum:10,maximum:20}],result)).toEqual([{type:'physical',minimum:6.5,maximum:13}])
  })
  it('blocks skills without modifiable projectile count',()=>{
    const gem=support('multi-1','Multishot I')
    expect(resolveMultishotSupports({skill:skill(['Projectile','ProjectileNumber','ProjectilesNumberModifiersNotApplied']),setup:setup([gem.id]),supports:[gem]})).toMatchObject({status:'blocked-incompatible-skill',damageMultiplier:1,additionalProjectiles:0})
  })
  it('blocks multiple tiers of the AdditionalProjectiles family',()=>{
    const first=support('multi-1','Multishot I'),second=support('multi-2','Multishot II')
    expect(resolveMultishotSupports({skill:skill(['Projectile','ProjectileNumber']),setup:setup([first.id,second.id]),supports:[first,second]})).toMatchObject({status:'blocked-duplicate-family',damageMultiplier:1,skillSpeedMultiplier:1,additionalProjectiles:0})
  })
})
