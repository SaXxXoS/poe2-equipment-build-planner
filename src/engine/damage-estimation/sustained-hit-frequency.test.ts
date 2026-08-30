import { describe, expect, it } from 'vitest'
import { resolveSustainedHitFrequency } from './sustained-hit-frequency'

describe('sustained hit frequency', () => {
  it('uses the fixed pulse interval for Solar Orb instead of cast speed', () => {
    const result = resolveSustainedHitFrequency({
      skill: { name: 'Solar Orb', skillTypes: ['Sustained'], numericStats: { base_skill_effect_duration: 10_000, solar_orb_base_pulse_frequency_ms: 1_400 } },
      activationRatePerSecond: 1.25,
    })
    expect(result).toMatchObject({ pulseRatePerSecond: 0.714286, uptime: 1, effectiveHitRatePerSecond: 0.714286 })
  })

  it('caps Orb of Storms by its structured hit limit', () => {
    const result = resolveSustainedHitFrequency({
      skill: { name: 'Orb of Storms', skillTypes: ['Sustained'], numericStats: { base_skill_effect_duration: 12_000, orb_of_storms_base_bolt_frequency_ms: 4_000, orb_of_storms_maximum_number_of_hits: 2 } },
      activationRatePerSecond: 2,
    })
    expect(result).toMatchObject({ hitsPerInstance: 2, effectiveHitRatePerSecond: 0.166667 })
  })

  it('uses Thunderstorm single-target hit prevention and partial upkeep', () => {
    const result = resolveSustainedHitFrequency({
      skill: { name: 'Thunderstorm', skillTypes: ['Sustained'], numericStats: { base_skill_effect_duration: 12_000, lightning_storm_hit_frequency_ms: 350, lightning_storm_hit_prevention_duration_ms: 500 } },
      activationRatePerSecond: 1 / 24,
    })
    expect(result).toMatchObject({ pulseIntervalMs: 500, pulseRatePerSecond: 2, uptime: 0.5, effectiveHitRatePerSecond: 1 })
  })

  it('does not invent a duration for Ball Lightning', () => {
    expect(resolveSustainedHitFrequency({
      skill: { name: 'Ball Lightning', skillTypes: ['Sustained'], numericStats: { ball_lightning_base_hit_frequency_ms: 200 } },
      activationRatePerSecond: 1,
    })).toBeUndefined()
  })
})
