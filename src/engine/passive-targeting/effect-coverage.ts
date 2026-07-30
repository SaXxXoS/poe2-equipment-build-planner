import { classifyPassiveNode } from './classifier'
import { structurePassiveStatEffect } from './effect-model'
import type { PassiveTargetNode, PassiveTargetTag } from './types'

const DIRECT_NEED_TAGS = new Set<PassiveTargetTag>([
  'life',
  'resistance',
  'mana',
  'spirit',
  'resource-cost',
])

export interface PassiveEffectCoverageReport {
  totalStatLines: number
  semanticallyClassifiedStatLines: number
  profileLinkedStatLines: number
  extractedNumericStatLines: number
  structuredNumericStatLines: number
  aggregationReadyStatLines: number
  conditionBlockedStatLines: number
  targetBlockedStatLines: number
  numericallyAppliedStatLines: number
  semanticOnlyStatLines: number
  profileLinkedPercent: number
  numericalApplicationPercent: number
  semanticOnlyTags: Record<string, number>
}

const percent = (value: number, total: number) =>
  total ? Math.round((value / total) * 10_000) / 100 : 0

export function measurePassiveEffectCoverage(
  nodes: readonly PassiveTargetNode[],
): PassiveEffectCoverageReport {
  const stats = nodes.flatMap((node) => classifyPassiveNode(node).stats)
  const classified = stats.filter((stat) => !stat.unresolved)
  const profileLinked = classified.filter(
    (stat) =>
      stat.affectedProfileFields.length > 0 ||
      stat.tags.some((tag) => DIRECT_NEED_TAGS.has(tag)),
  )
  const profileLinkedSet = new Set(profileLinked)
  const semanticOnlyTags = new Map<string, number>()
  classified
    .filter((stat) => !profileLinkedSet.has(stat))
    .flatMap((stat) => stat.tags)
    .forEach((tag) =>
      semanticOnlyTags.set(tag, (semanticOnlyTags.get(tag) ?? 0) + 1),
    )
  const extractedNumeric = classified.filter(
    (stat) => (stat.numericValues?.length ?? 0) > 0,
  )
  const structuredEffects = classified
    .map(structurePassiveStatEffect)
    .filter((effect) => effect !== null)

  return {
    totalStatLines: stats.length,
    semanticallyClassifiedStatLines: classified.length,
    profileLinkedStatLines: profileLinked.length,
    extractedNumericStatLines: extractedNumeric.length,
    structuredNumericStatLines: structuredEffects.length,
    aggregationReadyStatLines: structuredEffects.filter(
      (effect) => effect.aggregationStatus === 'ready',
    ).length,
    conditionBlockedStatLines: structuredEffects.filter(
      (effect) => effect.aggregationStatus === 'blocked-condition',
    ).length,
    targetBlockedStatLines: structuredEffects.filter(
      (effect) => effect.aggregationStatus === 'blocked-target',
    ).length,
    numericallyAppliedStatLines: 0,
    semanticOnlyStatLines: classified.length - profileLinked.length,
    profileLinkedPercent: percent(profileLinked.length, stats.length),
    numericalApplicationPercent: 0,
    semanticOnlyTags: Object.fromEntries(
      [...semanticOnlyTags].sort(
        (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
      ),
    ),
  }
}
