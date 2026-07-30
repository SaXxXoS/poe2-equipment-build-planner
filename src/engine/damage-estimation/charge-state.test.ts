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

const setup = (skillId: string, level?: number): SkillSetup => ({
  id: `setup:${skillId}`,
  skillId,
  role: 'utility',
  weaponSet: 'set-1',
  supportGemIds: [],
  ...(level == null ? {} : { level }),
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
    expect(result.regulationScenarios[0]).toMatchObject({
      appliedSkillLevel: 20,
      skillLevelStatus: 'default-reference-level',
      frenzySkillSpeedPercent: 25,
      powerFinalCriticalChancePercent: 26,
      enduranceFinalDefencePercent: 20,
      consumptionIntervalMs: 10_000,
      currentChargeState: 'unknown',
      status: 'charge-effects-known-current-state-unknown',
    })
  })

  it('bindet Charge Regulation an die exakt gewählte Gemmenstufe', () => {
    const regulation = skill('regulation', 'Charge Regulation')
    expect(resolveChargeState({
      setups: [setup(regulation.id, 10)],
      skills: [regulation],
    }).regulationScenarios[0]).toMatchObject({
      appliedSkillLevel: 10,
      skillLevelStatus: 'exact',
      frenzySkillSpeedPercent: 23,
      powerFinalCriticalChancePercent: 23,
      enduranceFinalDefencePercent: 17,
    })
  })

  it('ersetzt eine unbekannte Charge-Regulation-Stufe nicht durch Referenzwerte', () => {
    const regulation = skill('regulation', 'Charge Regulation')
    const result = resolveChargeState({
      setups: [setup(regulation.id, 99)],
      skills: [regulation],
    })
    expect(result.regulationScenarios).toEqual([])
    expect(result.consumptions[0]).not.toHaveProperty('intervalMs')
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

  it('erfasst Combat Frenzy nur mit belegtem Intervall und ohne erfundene Ladungszahl', () => {
    const combatFrenzy = skill('combat-frenzy', 'Combat Frenzy')
    const result = resolveChargeState({ setups: [setup(combatFrenzy.id)], skills: [combatFrenzy] })
    expect(result.states.find(state => state.type === 'frenzy')).toEqual(expect.objectContaining({
      availability: 'conditional-unresolved',
      durationMs: 6_100,
      evidence: 'structured-exact',
    }))
    expect(result.states.find(state => state.type === 'frenzy')).not.toHaveProperty('count')
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
    expect(result.buffScenarios[0]).toMatchObject({
      appliedSkillLevel: 20,
      skillLevelStatus: 'default-reference-level',
      requiredCharges: 1,
      minimumAddedDamagePerCharge: 1,
      maximumAddedDamagePerCharge: 22,
      damageType: 'lightning',
      durationPerChargeMs: 6000,
      status: 'per-charge-scenario-known-current-count-unknown',
    })
  })

  it('bindet das Charged-Staff-Szenario exakt an die gewählte Gemmenstufe', () => {
    const chargedStaff = skill('charged-staff', 'Charged Staff')
    expect(resolveChargeState({
      setups: [setup(chargedStaff.id, 10)],
      skills: [chargedStaff],
    }).buffScenarios[0]).toMatchObject({
      appliedSkillLevel: 10,
      skillLevelStatus: 'exact',
      minimumAddedDamagePerCharge: 1,
      maximumAddedDamagePerCharge: 7,
    })
  })

  it('ersetzt eine unbekannte angeforderte Charged-Staff-Stufe nicht durch einen Referenzwert', () => {
    const chargedStaff = skill('charged-staff', 'Charged Staff')
    expect(resolveChargeState({
      setups: [setup(chargedStaff.id, 99)],
      skills: [chargedStaff],
    }).buffScenarios).toEqual([])
  })

  it('liefert bei identischer Eingabe identische Zustände', () => {
    const regulation = skill('regulation', 'Charge Regulation')
    const input = { setups: [setup(regulation.id)], skills: [regulation] }
    expect(resolveChargeState(input)).toEqual(resolveChargeState(input))
  })
})
