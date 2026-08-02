import { describe, expect, it } from 'vitest'
import { pob2QuantitativeEffectsFor, pob2SupportReferenceCoverage, pob2SupportReferenceFor } from './pob2-support-reference'

describe('pinned PoB2 support reference', () => {
  it('retains the reduced pinned support population', () => {
    expect(pob2SupportReferenceCoverage.totalRecords).toBe(540)
    expect(pob2SupportReferenceCoverage.uniquelyNamedRecords).toBe(538)
    expect(pob2SupportReferenceCoverage.quantitativelyMappedRecords).toBeGreaterThan(10)
  })

  it('maps only explicitly allowed structured final damage stats', () => {
    expect(pob2QuantitativeEffectsFor('Elemental Focus')).toEqual([
      expect.objectContaining({
        kind: 'more-damage',
        percent: 25,
        damageTypes: ['fire', 'cold', 'lightning'],
        evidence: 'structured-exact',
      }),
    ])
    expect(pob2QuantitativeEffectsFor('Hourglass')).toEqual([
      expect.objectContaining({
        kind: 'more-damage',
        percent: 30,
        evidence: 'structured-exact',
      }),
    ])
    expect(pob2QuantitativeEffectsFor('Biting Frost I')).toBeUndefined()
  })

  it('does not resolve an ambiguous name', () => {
    expect(pob2SupportReferenceFor("Oisin's Oath")).toBeUndefined()
  })

  it('maps increased attack and cast speed without turning it into a More multiplier', () => {
    expect(pob2QuantitativeEffectsFor('Rapid Attacks I')).toEqual([
      expect.objectContaining({ kind: 'increased-action-speed', percent: 15, evidence: 'structured-exact' }),
    ])
    expect(pob2QuantitativeEffectsFor('Rapid Casting II')).toEqual([
      expect.objectContaining({ kind: 'increased-action-speed', percent: 20, evidence: 'structured-exact' }),
    ])
    expect(pob2QuantitativeEffectsFor('Rapid Attacks III')).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'increased-action-speed', percent: 35 }),
      expect.objectContaining({ kind: 'more-damage', percent: -50 }),
    ]))
    expect(pob2QuantitativeEffectsFor('Rapid Casting III')).toBeUndefined()
  })
})
