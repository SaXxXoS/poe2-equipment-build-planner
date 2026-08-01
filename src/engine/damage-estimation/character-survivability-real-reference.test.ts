import { describe, expect, it } from 'vitest'
import officialTree from '../../../generated/poe2-tree/tree.json'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'
import { resolveCharacterSurvivabilityModel } from './character-survivability-model'

const planning = (ids: string[]) => ({ pipelineResult: { allocatedNodeIds: ids } }) as unknown as RealPassivePlanningIntegrationResult
const input = (ids: string[]) => ({ classId: 'class-official-1', characterLevel: 90, equipment: [], weaponSet: 'set-1' as const, passiveTree: officialTree as RealPassiveTree, realPassivePlanning: planning(ids) })

describe('reale PoE2-Referenzen fuer Beeintraechtigungsdauer auf dem Charakter', () => {
  it('wendet Shimmering Mirage auf alle Beeintraechtigungen an', () => {
    const result = resolveCharacterSurvivabilityModel(input(['5335']))
    expect(result.debuffDurationOnSelf?.ailments).toEqual({ ignite: 90, chill: 90, freeze: 90, shock: 90, scorch: 90, brittle: 90, sap: 90, bleed: 90, poison: 90 })
  })

  it('wendet Feel the Earth nur auf Schockdauer an', () => {
    const result = resolveCharacterSurvivabilityModel(input(['9968']))
    expect(result.debuffDurationOnSelf?.ailments.shock).toBe(75)
    expect(result.debuffDurationOnSelf?.ailments.freeze).toBe(100)
  })

  it('wendet allgemeines schnelleres Ablaufen auf Blindheit und alle Beeintraechtigungen an', () => {
    const result = resolveCharacterSurvivabilityModel(input(['11330']))
    expect(result.debuffDurationOnSelf?.debuffExpirationRate).toBe(10)
    expect(result.debuffDurationOnSelf?.blindPercent).toBe(90.909091)
    expect(result.debuffDurationOnSelf?.ailments.poison).toBe(90.909091)
  })

  it('kombiniert Sanguine Tolerance mit verderbtem Blut und Blutungsdauer', () => {
    const result = resolveCharacterSurvivabilityModel(input(['4810']))
    expect(result.secondaryDebuffProtection?.corruptedBlood.immune).toBe(true)
    expect(result.debuffDurationOnSelf?.ailments.bleed).toBe(60)
    expect(result.debuffDurationOnSelf?.ailments.poison).toBe(100)
  })

  it('wendet The Ancient Serpent nur auf Giftdauer an', () => {
    const result = resolveCharacterSurvivabilityModel(input(['4544']))
    expect(result.debuffDurationOnSelf?.ailments.poison).toBe(60)
    expect(result.debuffDurationOnSelf?.ailments.bleed).toBe(100)
  })
})
