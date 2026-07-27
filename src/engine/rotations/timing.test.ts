import { describe, expect, it } from 'vitest'
import { placeholderMetadata, type SkillGemDefinition } from '../../domain'
import { resolveRotationTiming } from './timing'

const skill = (nameEn: string, extra: Partial<SkillGemDefinition> = {}): SkillGemDefinition => ({
  ...placeholderMetadata(`skill-${nameEn}`, nameEn, []),
  nameEn,
  possibleRoles: ['utility'],
  enabled: true,
  ...extra,
})

describe('belegtes Rotations-Zeitmodell', () => {
  it('übernimmt Wirk- und Aktivierungszeit eines Fluchs', () => {
    expect(resolveRotationTiming(skill('Elemental Weakness', { refreshRequired: true }))).toMatchObject({
      activationTimeMs: 700, effectDurationMs: 7400, refreshIntervalMs: 7400,
      timingStatus: 'maintainable', evidence: 'structured-exact',
    })
  })
  it('übernimmt Flame Wall ohne Dauerwirkung zu behaupten', () => {
    const timing = resolveRotationTiming(skill('Flame Wall'))
    expect(timing).toMatchObject({ activationTimeMs: 1000, effectDurationMs: 6400, timingStatus: 'windowed' })
    expect(timing).not.toHaveProperty('refreshIntervalMs')
  })
  it('übernimmt eine Abklingzeit ohne Uptime zu erfinden', () => {
    const timing = resolveRotationTiming(skill('Ghost Dance'))
    expect(timing).toMatchObject({ cooldownMs: 10100, timingStatus: 'cooldown-limited' })
    expect(timing).not.toHaveProperty('effectDurationMs')
  })
  it('übernimmt Wither-Dauer und Aktivierungszeit', () => {
    expect(resolveRotationTiming(skill('Wither'))).toMatchObject({ activationTimeMs: 250, effectDurationMs: 2950, timingStatus: 'windowed' })
  })
  it('bevorzugt bei gleichnamigen Referenzen den strukturierten War-Banner-Datensatz', () => {
    expect(resolveRotationTiming(skill('War Banner'))).toMatchObject({
      activationTimeMs: 500,
      effectDurationMs: 9800,
      timingStatus: 'windowed',
      evidence: 'structured-exact',
    })
  })
  it('lässt unbekannte Zeitdaten ungelöst', () => {
    expect(resolveRotationTiming(skill('Nicht vorhandene Fertigkeit'))).toMatchObject({ timingStatus: 'unresolved', evidence: 'unresolved', sourceReferences: [] })
  })
  it('ist deterministisch', () => {
    const definition = skill('Despair', { canBeMaintained: true })
    expect(resolveRotationTiming(definition)).toEqual(resolveRotationTiming(definition))
  })
})
