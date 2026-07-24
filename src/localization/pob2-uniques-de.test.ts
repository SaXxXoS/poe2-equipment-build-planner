import { describe, expect, it } from 'vitest'
import product from '../../generated/pob2/uniques.json'
import germanDisplay from '../../generated/localization/de/pob2-uniques.json'
import { localizedPob2LinesForVariant, localizedPob2UniquesDe, pob2GermanDisplayMetadata, resolvePob2GermanDisplay } from './pob2-uniques-de'

describe('PoB2 German display layer', () => {
  it('joins every item, variant and line by stable IDs', () => {
    expect(localizedPob2UniquesDe).toHaveLength(435)
    expect(localizedPob2UniquesDe.flatMap(item => item.variants)).toHaveLength(579)
    expect(localizedPob2UniquesDe.flatMap(item => item.modifiers)).toHaveLength(2345)
    expect(localizedPob2UniquesDe.flatMap(item => item.implicits)).toHaveLength(273)
    expect(localizedPob2UniquesDe.every(item => item.id.startsWith('pob2:'))).toBe(true)
    expect(new Set(localizedPob2UniquesDe.map(item => item.id)).size).toBe(435)
  })

  it('uses German display, then English fallback, then translation-missing', () => {
    expect(resolvePob2GermanDisplay({ text: 'Deutsch', status: 'reviewed-app-translation' }, 'English')).toEqual({
      text: 'Deutsch',
      status: 'reviewed-app-translation',
    })
    expect(resolvePob2GermanDisplay(undefined, 'English')).toEqual({ text: 'English', status: 'translation-missing' })
    expect(resolvePob2GermanDisplay(undefined, '')).toEqual({ text: 'translation-missing', status: 'translation-missing' })
  })

  it('keeps the English product identity and coverage unchanged', () => {
    expect(product.generatedDataHash).toBe('a5a7e7bac84bb5d921002a83efa6a16e96fec794bead9664dbf7de0bd7f04329')
    expect(pob2GermanDisplayMetadata.sourceProductHash).toBe('db3837b51c18fcae5e01572ef437a0f67186183f715402ac9cddb372c19a2452')
    expect(germanDisplay.coverage.statusCounts['translation-missing']).toBe(0)
  })

  it('resolves exact modifier sets by stable variant ID', () => {
    const item = localizedPob2UniquesDe.find(value => value.variants.length > 1)!
    const first = localizedPob2LinesForVariant(item, item.variants[0].id)
    const second = localizedPob2LinesForVariant(item, item.variants[1].id)
    const common = localizedPob2LinesForVariant(item)
    expect(first.exactVariant).toBe(true)
    expect(second.exactVariant).toBe(true)
    expect(common.exactVariant).toBe(false)
    expect(first.modifiers.length + first.implicits.length).toBeGreaterThanOrEqual(common.modifiers.length + common.implicits.length)
    expect(new Set([...first.modifiers, ...first.implicits].map(line => line.id))).not.toEqual(new Set([...second.modifiers, ...second.implicits].map(line => line.id)))
  })
})
