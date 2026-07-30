import { describe, expect, it } from 'vitest'
import type { SkillGemDefinition, SkillSetup } from '../../domain'
import { resolveElementalState } from './elemental-state'

const skill = (id: string, nameEn: string): SkillGemDefinition => ({
  id, nameEn, displayNameDe: nameEn, tags: [], dataVersion: 'test', source: 'local-placeholder', status: 'verified',
})
const setup = (skillId: string, level?: number): SkillSetup => ({
  id: `${skillId}-setup`, skillId, role: 'utility', weaponSet: 'both', supportGemIds: [], level,
})

describe('Elementarzustände', () => {
  it('modelliert Elemental Conflux auf Stufe 20 ohne ein aktives Element zu erfinden', () => {
    const value = skill('conflux', 'Elemental Conflux')
    expect(resolveElementalState({ setups: [setup(value.id, 20)], skills: [value] }).scenarios[0]).toMatchObject({
      kind: 'rotating-element', finalDamagePercent: 59, effectDurationMs: 8000,
      activeElement: null,
    })
  })

  it('modelliert Trinity auf Stufe 20 ohne aktuelle Resonanz zu erfinden', () => {
    const value = skill('trinity', 'Trinity')
    expect(resolveElementalState({ setups: [setup(value.id, 20)], skills: [value] }).scenarios[0]).toMatchObject({
      kind: 'three-element-resonance', resonanceGrantedPerHit: 13,
      finalDamagePercentPer50Resonance: 6, resonanceDecayDelayMs: 8000,
      resonanceLossPerSecond: 10, resonanceLossPerHit: 3, currentResonance: null,
    })
  })

  it('blockiert eine nicht vorhandene explizite Gemmenstufe', () => {
    const value = skill('trinity', 'Trinity')
    expect(resolveElementalState({ setups: [setup(value.id, 99)], skills: [value] }).scenarios).toEqual([])
  })

  it('ist bei identischer Eingabe deterministisch', () => {
    const value = skill('trinity', 'Trinity')
    const input = { setups: [setup(value.id)], skills: [value] }
    expect(resolveElementalState(input)).toEqual(resolveElementalState(input))
  })
})
