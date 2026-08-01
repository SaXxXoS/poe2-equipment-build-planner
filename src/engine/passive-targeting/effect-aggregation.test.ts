import { describe, expect, it } from 'vitest'
import { classifyPassiveText } from './classifier'
import { aggregatePassiveEffects } from './effect-aggregation'
import { structurePassiveStatEffect } from './effect-model'

const effects = (texts: string[]) =>
  texts
    .map((text) =>
      structurePassiveStatEffect(classifyPassiveText(text, 'normal')),
    )
    .filter((effect) => effect !== null)

describe('deterministische Passivwirkungsaggregation', () => {
  it('stapelt flach, erhöht/verringert und mehr/weniger getrennt', () => {
    const result = aggregatePassiveEffects(
      effects([
        '+10 to Strength',
        '+12 to Strength',
        '20% increased Attack Damage',
        '5% reduced Attack Damage',
        '10% more Attack Damage',
        '20% more Attack Damage',
        '10% less Attack Damage',
      ]),
    )
    expect(result.find((value) => value.targetProfileField === 'requirements.strengthNeed')).toMatchObject({
      flatAdded: 22,
    })
    expect(result.find((value) => value.targetProfileField === 'mechanics.attack')).toMatchObject({
      increasedReducedPercent: 15,
      moreLessMultiplier: 1.188,
    })
  })

  it('schließt blockierte Bedingungen und ziellose Effekte aus', () => {
    const result = aggregatePassiveEffects(
      effects([
        '20% increased Attack Damage while on Full Life',
        '20% increased Totem Placement Speed',
      ]),
    )
    expect(result).toEqual([])
  })

  it('ist von der Eingabereihenfolge unabhängig', () => {
    const source = ['10% increased Fire Damage', '20% increased Fire Damage']
    expect(aggregatePassiveEffects(effects(source))).toEqual(
      aggregatePassiveEffects(effects([...source].reverse())),
    )
  })
})
