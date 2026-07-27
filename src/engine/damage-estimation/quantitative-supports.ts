import type { DamageComponent, AppliedQuantitativeEffect } from './types'
import type { SkillSetup, SupportGemDefinition } from '../../domain'

export interface QuantitativeSupportSummary {
  components: DamageComponent[]
  actionSpeedMultiplier: number
  criticalChanceMultiplier: number
  criticalDamageBonus: number
  appliedEffects: AppliedQuantitativeEffect[]
  unresolvedSupportIds: string[]
}

const round = (value: number) => Number(value.toFixed(8))

export function applyQuantitativeSupports(input: {
  components: DamageComponent[]
  setup?: SkillSetup
  supports: SupportGemDefinition[]
}): QuantitativeSupportSummary {
  const selected = new Set(input.setup?.supportGemIds ?? [])
  const definitions = input.supports.filter(support => selected.has(support.id))
  let components = input.components.map(component => ({ ...component }))
  let actionSpeedMultiplier = 1
  let criticalChanceMultiplier = 1
  let criticalDamageBonus = 0
  const appliedEffects: AppliedQuantitativeEffect[] = []
  const unresolvedSupportIds: string[] = []

  for (const support of definitions) {
    if (!support.quantitativeEffects?.length) {
      unresolvedSupportIds.push(support.id)
      continue
    }
    for (const effect of support.quantitativeEffects) {
      const factor = 1 + effect.percent / 100
      if (effect.kind === 'more-damage') {
        components = components.map(component =>
          !effect.damageTypes?.length || effect.damageTypes.includes(component.type)
            ? { ...component, minimum: round(component.minimum * factor), maximum: round(component.maximum * factor) }
            : component,
        )
      } else if (effect.kind === 'action-speed') actionSpeedMultiplier *= factor
      else if (effect.kind === 'more-critical-chance') criticalChanceMultiplier *= factor
      else criticalDamageBonus += effect.percent
      appliedEffects.push({
        source: 'support',
        sourceId: support.id,
        label: `${support.displayNameDe}: ${effect.kind}`,
        value: effect.percent,
      })
    }
  }

  return {
    components,
    actionSpeedMultiplier: round(actionSpeedMultiplier),
    criticalChanceMultiplier: round(criticalChanceMultiplier),
    criticalDamageBonus: round(criticalDamageBonus),
    appliedEffects,
    unresolvedSupportIds,
  }
}
