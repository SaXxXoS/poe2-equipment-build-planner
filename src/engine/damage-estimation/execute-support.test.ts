import { describe,expect,it } from 'vitest'
import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup,SupportGemDefinition } from '../../domain/skills'
import { resolveExecuteSupport } from './execute-support'

const support=(rank:'I'|'II'|'III',id=`execute-${rank}`):SupportGemDefinition=>({id,nameEn:`Execute ${rank}`,displayNameDe:`Hinrichten ${rank}`,tags:[],dataVersion:'test',source:'local-placeholder',status:'verified',requiredTags:[],excludedTags:[],ownTags:[]})
const setup=(ids:string[]):SkillSetup=>({id:'setup',skillId:'skill',role:'main',weaponSet:'set-1',supportGemIds:ids})
const attack=()=>{
  const value=reference.skills.find(skill=>skill.name==='Load Galvanic Shards')
  if(!value)throw new Error('Missing pinned crossbow attack fixture')
  return value
}

describe('exact Execute support model',()=>{
  it('applies the pinned rank-specific multiplier only against confirmed low-life enemies',()=>{
    for(const [rank,multiplier] of [['I',1.4],['II',1.5],['III',1.3]] as const){
      const selected=support(rank)
      expect(resolveExecuteSupport({skill:attack(),setup:setup([selected.id]),supports:[selected],enemyProfile:{id:'enemy',label:'enemy',source:'manual-comparison-profile',lifeState:'low-life'}})).toMatchObject({status:'applied',damageMultiplier:multiplier})
    }
  })

  it('does not assume the enemy condition when its life state is unknown',()=>{
    const selected=support('II')
    expect(resolveExecuteSupport({skill:attack(),setup:setup([selected.id]),supports:[selected],enemyProfile:{id:'enemy',label:'enemy',source:'manual-comparison-profile',lifeState:'unknown'}})).toMatchObject({status:'blocked-unknown-enemy-life-state',damageMultiplier:1,blockedSupportIds:[selected.id]})
  })

  it('keeps the separate Execute III player-low-life effect blocked',()=>{
    const selected=support('III')
    expect(resolveExecuteSupport({skill:attack(),setup:setup([selected.id]),supports:[selected],enemyProfile:{id:'enemy',label:'enemy',source:'manual-comparison-profile',lifeState:'low-life'}})).toMatchObject({status:'applied',damageMultiplier:1.3,blockedPlayerLowLifeEffect:true})
  })

  it('blocks incompatible skills and duplicate ranks fail-closed',()=>{
    const first=support('I')
    const second=support('II')
    const incompatible={...attack(),skillTypes:['Duration']}
    expect(resolveExecuteSupport({skill:incompatible,setup:setup([first.id]),supports:[first],enemyProfile:{id:'enemy',label:'enemy',source:'manual-comparison-profile',lifeState:'low-life'}}).status).toBe('blocked-incompatible-skill')
    expect(resolveExecuteSupport({skill:attack(),setup:setup([first.id,second.id]),supports:[first,second],enemyProfile:{id:'enemy',label:'enemy',source:'manual-comparison-profile',lifeState:'low-life'}})).toMatchObject({status:'blocked-duplicate-family',damageMultiplier:1})
  })
})
