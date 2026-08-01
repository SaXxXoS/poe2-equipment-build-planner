import { describe, expect, it } from 'vitest'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'
import { resolveDamagingAilmentRateEffects } from './ailment-rate-effects'

const tree = {
  nodes: [
    { id: 'generic', stats: [{ sourceText: '[DamagingAilments|Damaging Ailments] deal damage 12% faster' }] },
    { id: 'ignite', stats: [{ sourceText: '[Ignite|Ignites] you inflict deal Damage 18% faster' }] },
    { id: 'bleed', stats: [{ sourceText: 'Bleeding you inflict deals Damage 10% faster' }] },
    { id: 'conditional', stats: [{ sourceText: 'Ignites deal Damage 20% faster while affected by Foo' }] },
  ],
} as unknown as RealPassiveTree

describe('Ablaufrate schädigender Zustände', () => {
  it('addiert nur exakt belegte allgemeine und zustandsspezifische Knoten', () => {
    const planning = {
      pipelineResult: { allocatedNodeIds: ['generic', 'ignite', 'bleed', 'conditional'] },
    } as unknown as RealPassivePlanningIntegrationResult
    expect(resolveDamagingAilmentRateEffects({ passiveTree: tree, planning, weaponSet: 'set-1' })).toMatchObject({
      fasterPercent: { bleeding: 22, poison: 12, ignite: 30 },
      slowerPercent: { bleeding: 0, poison: 0, ignite: 0 },
    })
  })

  it('verwendet die tatsächlich aktive Waffenset-Planung', () => {
    const planning = {
      weaponSetPlanning: {
        'set-1': { allocatedNodeIds: ['ignite'] },
        'set-2': { allocatedNodeIds: ['bleed'] },
      },
    } as unknown as RealPassivePlanningIntegrationResult
    expect(resolveDamagingAilmentRateEffects({ passiveTree: tree, planning, weaponSet: 'set-1' }).fasterPercent)
      .toEqual({ bleeding: 0, poison: 0, ignite: 18 })
    expect(resolveDamagingAilmentRateEffects({ passiveTree: tree, planning, weaponSet: 'set-2' }).fasterPercent)
      .toEqual({ bleeding: 10, poison: 0, ignite: 0 })
  })
})
