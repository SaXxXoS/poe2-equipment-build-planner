import { describe, expect, it } from 'vitest'
import type { SkillGemDefinition, SkillSetup } from '../../domain'
import { resolveChargedSkillState } from './charged-skill-state'

const skill = (id:string, nameEn:string):SkillGemDefinition => ({id,nameEn,displayNameDe:nameEn,tags:[],dataVersion:'test',source:'local-placeholder',status:'verified'})
const setup = (skillId:string, level?:number):SkillSetup => ({id:`setup:${skillId}`,skillId,role:'main',weaponSet:'set-1',supportGemIds:[],...(level==null?{}:{level})})

describe('charged skill state',()=>{
  it('bildet Detonating Arrow bei vier Stufen als 480 Prozent zusätzlichen Feuerschaden ab',()=>{
    expect(resolveChargedSkillState({setups:[setup('det',20)],skills:[skill('det','Detonating Arrow')]}).skills[0]).toMatchObject({
      maximumStages:4,gainAsFirePerStagePercent:120,fullStageGainAsFirePercent:480,
    })
  })
  it('bildet Volcano mit drei zusätzlichen Stufen getrennt ab',()=>{
    expect(resolveChargedSkillState({setups:[setup('volcano',20)],skills:[skill('volcano','Volcano')]}).skills[0]).toMatchObject({
      maximumStages:4,additionalStages:3,fullStageDamageMultiplier:5.5,fullStageAdditionalProjectiles:12,
    })
  })
  it('erfindet weder aktuelle Stufen noch Projektiltreffer',()=>{
    const state=resolveChargedSkillState({setups:[setup('volcano')],skills:[skill('volcano','Volcano')]}).skills[0]
    expect(state).not.toHaveProperty('currentStages')
  })
  it('blockiert nicht vorhandene Gemmenstufen',()=>{
    expect(resolveChargedSkillState({setups:[setup('det',99)],skills:[skill('det','Detonating Arrow')]}).skills).toEqual([])
  })
})
