import { describe, expect, it } from 'vitest'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'
import { expectedLuckyHitDamage, resolveLuckyHitEffects } from './lucky-hit-effects'

const tree = {
  nodes: [
    { id: 'general', stats: [{ sourceText: '20% chance for Damage with [HitDamage|Hits] to be [Lucky]' }] },
    { id: 'lightning', stats: [{ sourceText: '30% chance for [Lightning] Damage with [HitDamage|Hits] to be [Lucky]' }] },
    { id: 'conditional', stats: [{ sourceText: '[HitDamage|Damage with Hits] is [Lucky|Lucky] against Enemies that are on [LowLife|Low Life]' }] },
  ],
} as unknown as RealPassiveTree

const planning = {
  weaponSetPlanning: {
    'set-1': { allocatedNodeIds: ['general', 'lightning', 'conditional'] },
    'set-2': { allocatedNodeIds: [] },
  },
  ascendancyPlanning: { allocatedNodeIds: [] },
} as unknown as RealPassivePlanningIntegrationResult

describe('lucky hit effects', () => {
  it('imports only unconditional exact allocated hit-lucky stats', () => {
    expect(resolveLuckyHitEffects({ passiveTree: tree, planning, weaponSet: 'set-1' })).toEqual([
      expect.objectContaining({ sourceNodeId: 'general', damageType: 'all', chancePercent: 20 }),
      expect.objectContaining({ sourceNodeId: 'lightning', damageType: 'lightning', chancePercent: 30 }),
    ])
  })

  it('keeps weapon-set allocation separate', () => {
    expect(resolveLuckyHitEffects({ passiveTree: tree, planning, weaponSet: 'set-2' })).toEqual([])
  })

  it('blends normal and lucky uniform roll expectations by applicable chance', () => {
    const effects = resolveLuckyHitEffects({ passiveTree: tree, planning, weaponSet: 'set-1' })
    expect(expectedLuckyHitDamage([
      { type: 'physical', minimum: 0, maximum: 120 },
      { type: 'lightning', minimum: 0, maximum: 120 },
    ], effects)).toBeCloseTo(134, 8)
  })
})
