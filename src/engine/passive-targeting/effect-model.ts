import type {
  PassiveEffectDirection,
  PassiveStatClassification,
  PassiveTargetTag,
} from './types'

export type PassiveEffectOperator =
  | 'flat-add'
  | 'increased'
  | 'reduced'
  | 'more'
  | 'less'

export type PassiveEffectUnit = 'flat' | 'percent'

export interface StructuredPassiveEffect {
  sourceText: string
  normalizedText: string
  value: number
  unit: PassiveEffectUnit
  operator: PassiveEffectOperator
  direction: PassiveEffectDirection
  tags: PassiveTargetTag[]
  targetProfileFields: string[]
  conditional: boolean
  aggregationStatus: 'ready' | 'blocked-condition' | 'blocked-target'
}

const CONDITION_PATTERN =
  /\b(?:while|if|when|recently|on kill|on killing|on hit|for each|per |against|during|after|before|nearby|in your presence)\b/

function operation(text: string): {
  value: number
  unit: PassiveEffectUnit
  operator: PassiveEffectOperator
} | null {
  const percentage = text.match(
    /^([+-]?\d+(?:\.\d+)?)% (increased|reduced|more|less)\b/,
  )
  if (percentage) {
    return {
      value: Number(percentage[1]),
      unit: 'percent',
      operator: percentage[2] as PassiveEffectOperator,
    }
  }
  const flat = text.match(/^\+(\d+(?:\.\d+)?) to\b/)
  return flat
    ? { value: Number(flat[1]), unit: 'flat', operator: 'flat-add' }
    : null
}

export function structurePassiveStatEffect(
  stat: PassiveStatClassification,
): StructuredPassiveEffect | null {
  const parsed = operation(stat.normalizedText)
  if (!parsed || stat.unresolved || stat.effectDirection === 'unknown') return null
  const conditional = CONDITION_PATTERN.test(stat.normalizedText)
  const hasTarget = stat.affectedProfileFields.length > 0
  return {
    sourceText: stat.sourceText,
    normalizedText: stat.normalizedText,
    ...parsed,
    direction: stat.effectDirection,
    tags: [...stat.tags],
    targetProfileFields: [...stat.affectedProfileFields],
    conditional,
    aggregationStatus: !hasTarget
      ? 'blocked-target'
      : conditional
        ? 'blocked-condition'
        : 'ready',
  }
}
