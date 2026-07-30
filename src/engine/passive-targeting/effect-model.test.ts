import { describe, expect, it } from 'vitest'
import { classifyPassiveText } from './classifier'
import { structurePassiveStatEffect } from './effect-model'

const effect = (text: string) =>
  structurePassiveStatEffect(classifyPassiveText(text, 'normal'))

describe('strukturiertes Passivwirkungsmodell', () => {
  it.each([
    ['20% increased Lightning Damage', 'increased', 20, 'percent'],
    ['10% reduced Mana Cost of Skills', 'reduced', 10, 'percent'],
    ['15% more Attack Damage', 'more', 15, 'percent'],
    ['8% less Attack Damage', 'less', 8, 'percent'],
    ['+12 to Strength', 'flat-add', 12, 'flat'],
  ] as const)(
    'normalisiert die eindeutige Form %s',
    (text, operator, value, unit) => {
      expect(effect(text)).toMatchObject({
        operator,
        value,
        unit,
        aggregationStatus: 'ready',
      })
    },
  )

  it('blockiert bedingte Zahlen bis eine Bedingungsauflösung existiert', () => {
    expect(effect('20% increased Attack Damage while on Full Life')).toMatchObject(
      {
        conditional: true,
        aggregationStatus: 'blocked-condition',
      },
    )
  })

  it('blockiert Zahlen ohne belegtes Profilziel', () => {
    expect(effect('20% increased Totem Placement Speed')).toMatchObject({
      aggregationStatus: 'blocked-target',
    })
  })

  it('erfindet für komplexe oder unbekannte Formen keinen Effekt', () => {
    expect(effect('Skills have +1 to Limit')).toBeNull()
    expect(effect('Zorb becomes stronger')).toBeNull()
  })
})
