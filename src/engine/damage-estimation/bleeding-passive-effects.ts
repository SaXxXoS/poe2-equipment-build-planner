import reference from '../../../generated/pob2/damage-reference.json'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'

export interface BleedingPassiveEffect {
  aggravated: true
  durationMs: number
  magnitudeMultiplier: number
  aggravatedMultiplier: number
  sourceReferences: string[]
}

const stripMarkup = (value: string) =>
  value.replace(/\[[^|\]]+\|([^\]]+)\]/g, '$1').replace(/\[([^\]]+)\]/g, '$1').replace(/\s+/g, ' ').trim()

const exactAggravation =
  'Bleeding you inflict is Aggravated Base Bleeding Duration is 1 second 50% more Magnitude of Bleeding you inflict'

function allocatedNodeIds(
  planning: RealPassivePlanningIntegrationResult | undefined,
  weaponSet: 'set-1' | 'set-2',
) {
  const selected = planning?.weaponSetPlanning?.[weaponSet] ?? planning?.pipelineResult
  return [...new Set([
    ...(selected?.allocatedNodeIds ?? []),
    ...(planning?.ascendancyPlanning?.allocatedNodeIds ?? []),
  ])]
}

export function resolveBleedingPassiveEffect(input: {
  passiveTree?: RealPassiveTree
  planning?: RealPassivePlanningIntegrationResult
  weaponSet: 'set-1' | 'set-2'
}): BleedingPassiveEffect | undefined {
  if (!input.passiveTree || !input.planning) return undefined
  const nodes = new Map(input.passiveTree.nodes.map(node => [node.id, node]))
  for (const nodeId of allocatedNodeIds(input.planning, input.weaponSet)) {
    const node = nodes.get(nodeId)
    if (!node) continue
    for (const stat of node.stats) {
      if (stripMarkup(stat.sourceText ?? '') !== exactAggravation) continue
      return {
        aggravated: true,
        durationMs: 1000,
        magnitudeMultiplier: 1.5,
        aggravatedMultiplier: reference.ailmentConstants.bloodstainedMultiplierWhenMovingOrBleedingAggravated,
        sourceReferences: [
          `passive-node:${nodeId}`,
          stat.sourceText ?? exactAggravation,
          'BloodstainedMultiplierWhenMovingOrBleedingAggravated',
        ],
      }
    }
  }
  return undefined
}
