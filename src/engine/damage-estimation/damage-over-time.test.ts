import { describe, expect, it } from 'vitest'
import reference from '../../../generated/pob2/damage-reference.json'
import { collectDamageOverTime } from './damage-over-time'

const byName = (name: string) => {
  const skill = reference.skills.find(value => value.name === name)
  if (!skill) throw new Error(`Testreferenz fehlt: ${name}`)
  return skill
}

describe('getrennter Schaden über Zeit', () => {
  it('berechnet Flammenwand nur als belegtes Einzelanwendungsfenster', () => {
    const result = collectDamageOverTime(byName('Flame Wall'))
    expect(result.modelVersion).toBe('1.0.0')
    expect(result.effects).toEqual([expect.objectContaining({
      damageType: 'fire',
      damagePerSecond: 59.58,
      durationMs: 6400,
      totalDamagePerApplication: 381.33,
      stackCount: 1,
      status: 'single-application-window',
    })])
    expect(result.totalSingleApplicationDamagePerSecond).toBe(59.58)
  })

  it.each([
    ['Contagion', 'chaos', 93.92, 5000],
    ['Profane Ritual', 'chaos', 652.17, 2000],
    ['Tornado', 'physical', 146.08, 8000],
  ] as const)('berechnet %s aus konstantem Dauerwert und Levelwert', (name, damageType, damagePerSecond, durationMs) => {
    const result = collectDamageOverTime(byName(name))
    expect(result.effects).toEqual([expect.objectContaining({
      damageType,
      damagePerSecond,
      durationMs,
      status: 'single-application-window',
    })])
    expect(result.blockedEffects).toEqual([])
  })

  it('blockiert Incinerate ohne geschlossene Wirkungsdauer', () => {
    const result = collectDamageOverTime(byName('Incinerate'))
    expect(result.effects).toEqual([])
    expect(result.blockedEffects.length).toBeGreaterThan(0)
    expect(result.blockedEffects[0].detail).toContain('keine gemeinsam gepinnte Wirkungsdauer')
  })

  it('erfindet für einen reinen Trefferschaden-Skill keinen DoT', () => {
    const result = collectDamageOverTime(byName('Arc'))
    expect(result.effects).toEqual([])
    expect(result.blockedEffects).toEqual([])
    expect(result.totalSingleApplicationDamagePerSecond).toBeUndefined()
  })
})
