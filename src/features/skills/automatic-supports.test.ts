import { describe, expect, it } from 'vitest'
import type { SkillSetup, SupportGemDefinition } from '../../domain'
import { fillRecommendedSupportSlots } from './automatic-supports'

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
})
