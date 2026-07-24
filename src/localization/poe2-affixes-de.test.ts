import { describe, expect, it } from 'vitest'
import { allTechnicalAffixes, technicalAffixById } from '../affixes/registry'
import { affixDisplayName } from '../features/equipment-editor/affix-display'
import { germanAffixDisplay, germanAffixDisplayCoverage } from './poe2-affixes-de'

describe('deutsche Anzeige normaler PoE2-Affixe', () => {
  it('deckt alle 2.255 produktiven Affixe ohne translation-missing ab', () => {
    expect(allTechnicalAffixes).toHaveLength(2255)
    expect(new Set(allTechnicalAffixes.map(affix => affix.affixId)).size).toBe(2255)
    expect(germanAffixDisplayCoverage).toEqual({
      total: 2255,
      verifiedLocalSource: 2169,
      reviewedAppTranslation: 86,
      translationMissing: 0,
    })
    for (const affixId of new Set(allTechnicalAffixes.map(affix => affix.affixId))) {
      const localized = germanAffixDisplay(affixId)
      expect(localized?.text.trim(), affixId).toBeTruthy()
    }
  })

  it('rendert eine technisch verknüpfte deutsche CSD-Zeile mit Wertebereichen', () => {
    const affix = technicalAffixById.get('AddedColdDamage1')
    expect(affix).toBeDefined()
    expect(affixDisplayName(affix!)).toBe('Fügt Angriffen 1 bis (2–3) Kälteschaden hinzu')
    expect(germanAffixDisplay(affix!.affixId)?.status).toBe('verified-local-source')
  })

  it('kennzeichnet den deutschen Hybrid-Fallback getrennt von lokaler CSD', () => {
    const affix = technicalAffixById.get('LocalIncreasedPhysicalDamagePercentAndAccuracyRating5')
    expect(affix).toBeDefined()
    expect(affixDisplayName(affix!)).toContain('erhöhter physischer Schaden')
    expect(affixDisplayName(affix!)).toContain('Treffgenauigkeit')
    expect(affixDisplayName(affix!)).not.toContain('increased Physical Damage')
    expect(germanAffixDisplay(affix!.affixId)?.status).toBe('reviewed-app-translation')
  })

  it('hält deutsche Anzeige und technische Identität getrennt', () => {
    const affix = technicalAffixById.get('AddedColdDamage1')!
    expect(affix.technicalText).toBe('Adds 1 to (2-3) [Cold] damage to [Attack|Attacks]')
    expect(affix.statLines.map(line => line.statId)).toEqual([
      'attack_minimum_added_cold_damage',
      'attack_maximum_added_cold_damage',
    ])
    expect(affixDisplayName(affix)).not.toContain('Adds')
  })
})
