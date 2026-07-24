import { describe,expect,it } from 'vitest'
import { REAL_PASSIVE_FIXTURE_TREE,REAL_PASSIVE_PIPELINE_PROFILES } from '../real-passive-pipeline/fixtures'
import { applyPassiveProfileFeedback } from './passive-profile-feedback'

describe('Passive-Profil-Rückkopplung',()=>{
  it('verstärkt belegte positive Skalierungen deterministisch',()=>{
    const profile=REAL_PASSIVE_PIPELINE_PROFILES.lightningProjectileBalanced
    const first=applyPassiveProfileFeedback(profile,REAL_PASSIVE_FIXTURE_TREE,['AX'],'ascendancy')
    const second=applyPassiveProfileFeedback(profile,REAL_PASSIVE_FIXTURE_TREE,['AX'],'ascendancy')
    expect(first).toEqual(second)
    expect(first.profile.damageTypes.lightning).toBeGreaterThan(profile.damageTypes.lightning)
    expect(first.feedback.appliedNodeIds).toEqual(['AX'])
  })
  it('verändert das Eingabeprofil nicht',()=>{
    const profile=structuredClone(REAL_PASSIVE_PIPELINE_PROFILES.lightningProjectileBalanced)
    const before=structuredClone(profile)
    applyPassiveProfileFeedback(profile,REAL_PASSIVE_FIXTURE_TREE,['AX'],'ascendancy')
    expect(profile).toEqual(before)
  })
  it('ignoriert Startknoten und erfindet für unbekannte Knoten keine Wirkung',()=>{
    const profile=REAL_PASSIVE_PIPELINE_PROFILES.lightningProjectileBalanced
    const result=applyPassiveProfileFeedback(profile,REAL_PASSIVE_FIXTURE_TREE,['S','AS','missing'],'shared-passive')
    expect(result.profile).toEqual(profile)
    expect(result.feedback.appliedNodeIds).toEqual([])
    expect(result.feedback.fieldDeltas).toEqual([])
  })
})

