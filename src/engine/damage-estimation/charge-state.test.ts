import { describe, expect, it } from 'vitest'
import type { SkillGemDefinition, SkillSetup } from '../../domain'
import { resolveChargeState } from './charge-state'

const skill = (id: string, nameEn: string): SkillGemDefinition => ({
  id,
  nameEn,
  displayNameDe: nameEn,
  tags: [],
  dataVersion: 'test',
  source: 'local-placeholder',
  status: 'verified',
})

const setup = (skillId: string): SkillSetup => ({
  id: `setup:${skillId}`,
  skillId,
  role: 'utility',
  weaponSet: 'set-1',
  supportGemIds: [],
})

describe('automatisches Ladungszustandsmodell', () => {
  it('bleibt ohne ladungsabhängige Fertigkeit unsichtbar', () => {
    const arc = skill('arc', 'Arc')
    const result = resolveChargeState({ setups: [setup(arc.id)], skills: [arc] })
    expect(result.relevant).toBe(false)
    expect(result.productive).toBe(false)
  })

  it('erfasst den belegten Verbrauch von Charge Regulation ohne Ladungen zu erfinden', () => {
    const regulation = skill('regulation', 'Charge Regulation')
    const result = resolveChargeState({ setups: [setup(regulation.id)], skills: [regulation] })
    expect(result.relevant).toBe(true)
    expect(result.productive).toBe(false)
    expect(result.states.every(state => state.availability === 'unavailable')).toBe(true)
    expect(result.consumptions).toEqual([
      expect.objectContaining({
        sourceId: regulation.id,
        chargeTypes: ['frenzy', 'power', 'endurance'],
        intervalMs: 10_000,
        evidence: 'structured-exact',
      }),
    ])
  })

  it('erfasst Disengage nur als bedingte Frenzy-Quelle', () => {
    const disengage = skill('disengage', 'Disengage')
    const result = resolveChargeState({ setups: [setup(disengage.id)], skills: [disengage] })
    const frenzy = result.states.find(state => state.type === 'frenzy')
    expect(frenzy).toEqual(expect.objectContaining({
      availability: 'conditional-unresolved',
      count: 3,
      evidence: 'structured-exact',
    }))
    expect(frenzy?.detail).toContain('Parry-Debuffs')
    expect(result.productive).toBe(false)
  })

  it('blockiert Charged Staff ohne belegte Power Charges', () => {
    const chargedStaff = skill('charged-staff', 'Charged Staff')
    const result = resolveChargeState({ setups: [setup(chargedStaff.id)], skills: [chargedStaff] })
    expect(result.states.find(state => state.type === 'power')?.availability).toBe('unavailable')
    expect(result.consumptions[0]).toEqual(expect.objectContaining({
      sourceId: chargedStaff.id,
      chargeTypes: ['power'],
    }))
    expect(result.productive).toBe(false)
  })

  it('liefert bei identischer Eingabe identische Zustände', () => {
    const regulation = skill('regulation', 'Charge Regulation')
    const input = { setups: [setup(regulation.id)], skills: [regulation] }
    expect(resolveChargeState(input)).toEqual(resolveChargeState(input))
  })
})
