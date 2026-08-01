import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CharacterDefencePanel } from './BuildAssistantResultSection'

describe('CharacterDefencePanel', () => {
  it('zeigt bestätigte Verteidigungswerte und deren Rechenteile', () => {
    const html = renderToStaticMarkup(<CharacterDefencePanel model={{
      modelVersion: '1.0.0',
      weaponSet: 'set-2',
      status: 'partial-confirmed-equipment-and-passives',
      contributions: [{
        type: 'evasion',
        equipmentBase: 1000,
        flatPassive: 50,
        increasedReducedPercent: 20,
        moreLessMultiplier: 1.1,
        calculatedContribution: 1386,
        sourceNodeIds: ['node-1'],
        sourceTexts: ['20% increased Evasion Rating'],
      }],
      excludedWeaponItemIds: ['weapon-2'],
      blockedPassiveLines: ['20% increased Evasion Rating while moving'],
      limitations: ['Nur bestätigte Werte.'],
    }}/>)

    expect(html).toContain('Belegte Charakterverteidigung · Waffenset 2')
    expect(html).toContain('Ausweichwert')
    expect(html).toContain('1.386')
    expect(html).toContain('1.000 aus Ausrüstung')
    expect(html).toContain('Verteidigungswerte auf 1 Waffen-Eintrag')
    expect(html).toContain('1 bedingte oder noch nicht sicher strukturierte Passive-Wirkung')
  })

  it('zeigt einen klaren Leerzustand', () => {
    const html = renderToStaticMarkup(<CharacterDefencePanel model={{
      modelVersion: '1.0.0',
      weaponSet: 'set-1',
      status: 'no-confirmed-defence-values',
      contributions: [],
      excludedWeaponItemIds: [],
      blockedPassiveLines: [],
      limitations: [],
    }}/>)

    expect(html).toContain('Keine bestätigten Verteidigungswerte für dieses Waffenset vorhanden.')
  })
})
