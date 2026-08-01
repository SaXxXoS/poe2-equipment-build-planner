import type { StructuredPassiveEffect } from './effect-model'

export interface PassiveEffectAggregate {
  targetProfileField: string
  flatAdded: number
  increasedReducedPercent: number
  moreLessMultiplier: number
  sourceCount: number
  sourceTexts: string[]
}

const round = (value: number) => Math.round(value * 1_000_000) / 1_000_000

export function aggregatePassiveEffects(
  effects: readonly StructuredPassiveEffect[],
): PassiveEffectAggregate[] {
  const aggregates = new Map<string, PassiveEffectAggregate>()
  for (const effect of effects) {
    if (effect.aggregationStatus !== 'ready') continue
    for (const targetProfileField of effect.targetProfileFields) {
      const aggregate = aggregates.get(targetProfileField) ?? {
        targetProfileField,
        flatAdded: 0,
        increasedReducedPercent: 0,
        moreLessMultiplier: 1,
        sourceCount: 0,
        sourceTexts: [],
      }
      if (effect.operator === 'flat-add') aggregate.flatAdded += effect.value
      if (effect.operator === 'increased')
        aggregate.increasedReducedPercent += effect.value
      if (effect.operator === 'reduced')
        aggregate.increasedReducedPercent -= effect.value
      if (effect.operator === 'more')
        aggregate.moreLessMultiplier *= 1 + effect.value / 100
      if (effect.operator === 'less')
        aggregate.moreLessMultiplier *= 1 - effect.value / 100
      aggregate.sourceCount += 1
      aggregate.sourceTexts.push(effect.sourceText)
      aggregates.set(targetProfileField, aggregate)
    }
  }
  return [...aggregates.values()]
    .map((aggregate) => ({
      ...aggregate,
      flatAdded: round(aggregate.flatAdded),
      increasedReducedPercent: round(aggregate.increasedReducedPercent),
      moreLessMultiplier: round(aggregate.moreLessMultiplier),
      sourceTexts: [...aggregate.sourceTexts].sort(),
    }))
    .sort((a, b) => a.targetProfileField.localeCompare(b.targetProfileField))
}
