import { describe, expect, it } from 'vitest'
import { defenceBaseDisplayName, defenceBaseValueById, defenceBaseValues, defenceBaseValuesFor, utilityBaseDisplayName, utilityBaseValueById, utilityBaseValues, utilityBaseValuesFor, weaponBaseDisplayName, weaponBaseValueById, weaponBaseValues, weaponBaseValuesFor, weaponStatsFromBase } from './weapon-base-values'

describe('weapon base values', () => {
  it('exposes pinned productive bases with localized display fallbacks', () => {
    expect(weaponBaseValues.length).toBeGreaterThan(300)
    expect(weaponBaseValues.every(value => weaponBaseValueById.get(value.id) === value)).toBe(true)
    expect(weaponBaseValuesFor('Bows').length).toBeGreaterThan(20)
    expect(weaponBaseValues.every(value => weaponBaseDisplayName(value).length > 0)).toBe(true)
  })

  it('exposes pinned defence bases with exact localized names', () => {
    expect(defenceBaseValues.length).toBeGreaterThan(1_200)
    expect(defenceBaseValues.every(value => defenceBaseValueById.get(value.id) === value)).toBe(true)
    expect(defenceBaseValuesFor('Body Armours').length).toBeGreaterThan(100)
    expect(defenceBaseValues.every(value => defenceBaseDisplayName(value).length > 0)).toBe(true)
    expect(defenceBaseValues.every(value => value.displayNameDe)).toBe(true)
  })

  it('keeps caster and utility bases without inventing weapon damage', () => {
    expect(utilityBaseValues.length).toBeGreaterThan(400)
    expect(utilityBaseValues.every(value => utilityBaseValueById.get(value.id) === value)).toBe(true)
    expect(utilityBaseValuesFor('Wands').length).toBeGreaterThan(10)
    expect(utilityBaseValues.every(value => utilityBaseDisplayName(value).length > 0)).toBe(true)
    expect(weaponBaseValuesFor('Quarterstaves').length).toBeGreaterThan(10)
    expect(weaponBaseValuesFor('Sceptres')).toHaveLength(0)
  })

  it('copies every numeric base value', () => {
    const base = weaponBaseValues.find(value => value.itemClassId === 'Bows')!
    const stats = weaponStatsFromBase(base)
    expect(stats).toMatchObject({ physicalDamage: base.physicalDamage, criticalHitChance: base.criticalHitChance, attacksPerSecond: base.attacksPerSecond })
    expect(stats.physicalDamage).not.toBe(base.physicalDamage)
  })
})
