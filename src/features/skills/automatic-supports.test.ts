import { describe, expect, it } from 'vitest'
import type { SkillGemDefinition, SkillSetup, SupportGemDefinition } from '../../domain'
import { fillRecommendedSupportSlots, rankedSupportsForSkill } from './automatic-supports'

const setup: SkillSetup = {
  id: 'setup-main',
  skillId: 'skill-main',
  role: 'main',
  weaponSet: 'set-1',
  origin: 'manual',
  supportGemIds: ['manual-support'],
}

const support = (id:string, family?:string):SupportGemDefinition => ({
  id,
  displayNameDe:id,
  dataVersion:'test',
  source:'local-placeholder',
  status:'placeholder',
  tags:[],
  requiredTags:[],
  excludedTags:[],
  ownTags:[],
  supportFamilyId:family,
})

describe('automatische Supportbefüllung',()=>{
  it('verbindet Paket-, Top- und Fallbacklisten nur für die konkrete Fertigkeit',()=>{
    expect(rankedSupportsForSkill('skill-main',
      [{skillId:'skill-main',supportId:'package-first'}],
      [
        {skillId:'other-skill',supportId:'foreign'},
        {skillId:'skill-main',supportId:'package-first'},
        {skillId:'skill-main',supportId:'fallback'},
      ],
    )).toEqual([
      {skillId:'skill-main',supportId:'package-first'},
      {skillId:'skill-main',supportId:'fallback'},
    ])
  })

  it('behält Nutzerwahl und füllt freie Plätze aus derselben Skillrangliste',()=>{
    const definitions=[support('manual-support'),support('rank-1'),support('rank-2')]
    const result=fillRecommendedSupportSlots(setup,[
      {skillId:'other-skill',supportId:'rank-2'},
      {skillId:'skill-main',supportId:'rank-1'},
      {skillId:'skill-main',supportId:'rank-2'},
    ],definitions,3)
    expect(result.supportGemIds).toEqual(['manual-support','rank-1','rank-2'])
  })

  it('füllt keine zweite Stufe derselben Supportfamilie ein',()=>{
    const definitions=[support('family-i','family'),support('family-ii','family'),support('other')]
    const result=fillRecommendedSupportSlots({...setup,supportGemIds:[]},[
      {skillId:'skill-main',supportId:'family-i'},
      {skillId:'skill-main',supportId:'family-ii'},
      {skillId:'skill-main',supportId:'other'},
    ],definitions)
    expect(result.supportGemIds).toEqual(['family-i','other'])
  })

  it('bevorzugt bei gleicher fachlicher Eignung die belegbar tragbare Kostenkette',()=>{
    const costly = support('costly')
    costly.costMultiplierPercent = 300
    const efficient = support('efficient')
    efficient.costMultiplierPercent = 100
    const skillDefinition:SkillGemDefinition = {
      id:'skill-main',nameEn:'Ancestral Cry',displayNameDe:'Ahnenschrei',
      dataVersion:'test',source:'local-placeholder',status:'placeholder',
      tags:['buff'],enabled:true,
    }
    const result=fillRecommendedSupportSlots(
      {...setup,supportGemIds:[]},
      [
        {skillId:'skill-main',supportId:'costly'},
        {skillId:'skill-main',supportId:'efficient'},
      ],
      [costly,efficient],
      1,
      {
        equipment:[],
        setups:[{...setup,supportGemIds:[]}],
        skills:[skillDefinition],
        characterLevel:1,
      },
    )
    expect(result.supportGemIds).toEqual(['efficient'])
  })

})
