import { describe, expect, it } from 'vitest'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'
import { resolveBleedingPassiveEffect } from './bleeding-passive-effects'

const tree = (sourceText: string): RealPassiveTree => ({
  nodes: [{
    id: 'bleed-node',
    stats: [{ sourceText }],
  }],
} as unknown as RealPassiveTree)

const planning = {
  pipelineResult: { allocatedNodeIds: ['bleed-node'] },
} as unknown as RealPassivePlanningIntegrationResult

describe('passive Blutungs-Sonderwirkung', () => {
  it('erkennt ausschließlich den vollständig belegten unbedingten PoB2-Knoten', () => {
    const result = resolveBleedingPassiveEffect({
      passiveTree: tree('[Bleeding] you inflict is [Aggravate|Aggravated]\nBase [Bleeding] Duration is 1 second\n50% more [BuffMagnitude|Magnitude] of [Bleeding] you inflict'),
      planning,
      weaponSet: 'set-1',
    })
    expect(result).toMatchObject({
      aggravated: true,
      durationMs: 1000,
      magnitudeMultiplier: 1.5,
      aggravatedMultiplier: 2,
    })
  })

  it('übernimmt keine bedingte oder nur ähnlich formulierte Aggravation', () => {
    expect(resolveBleedingPassiveEffect({
      passiveTree: tree('25% chance to Aggravate Bleeding on Critical Hit'),
      planning,
      weaponSet: 'set-1',
    })).toBeUndefined()
  })
})
