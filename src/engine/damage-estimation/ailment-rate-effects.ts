import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'

export type DamagingAilmentKind = 'bleeding' | 'poison' | 'ignite'

export interface DamagingAilmentRateEffects {
  fasterPercent: Record<DamagingAilmentKind, number>
  slowerPercent: Record<DamagingAilmentKind, number>
  sourceReferences: Record<DamagingAilmentKind, string[]>
}

const stripMarkup = (value: string) =>
  value.replace(/\[[^|\]]+\|([^\]]+)\]/g, '$1').replace(/\[([^\]]+)\]/g, '$1').replace(/\s+/g, ' ').trim()

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

export function resolveDamagingAilmentRateEffects(input: {
  passiveTree?: RealPassiveTree
  planning?: RealPassivePlanningIntegrationResult
  weaponSet: 'set-1' | 'set-2'
}): DamagingAilmentRateEffects {
  const result: DamagingAilmentRateEffects = {
    fasterPercent: { bleeding: 0, poison: 0, ignite: 0 },
    slowerPercent: { bleeding: 0, poison: 0, ignite: 0 },
    sourceReferences: { bleeding: [], poison: [], ignite: [] },
  }
  if (!input.passiveTree || !input.planning) return result
  const nodes = new Map(input.passiveTree.nodes.map(node => [node.id, node]))
  for (const nodeId of allocatedNodeIds(input.planning, input.weaponSet)) {
    const node = nodes.get(nodeId)
    if (!node) continue
    for (const stat of node.stats) {
      const text = stripMarkup(stat.sourceText ?? '')
      const generic = text.match(/^Damaging Ailments deal damage (\d+(?:\.\d+)?)% (faster|slower)$/i)
      const ignite = text.match(/^Ignites you inflict deal Damage (\d+(?:\.\d+)?)% (faster|slower)$/i)
      const bleeding = text.match(/^Bleeding you inflict deals Damage (\d+(?:\.\d+)?)% (faster|slower)$/i)
      const match = generic ?? ignite ?? bleeding
      if (!match) continue
      const kinds: DamagingAilmentKind[] = generic
        ? ['bleeding', 'poison', 'ignite']
        : ignite
          ? ['ignite']
          : ['bleeding']
      const target = match[2].toLocaleLowerCase('en') === 'faster'
        ? result.fasterPercent
        : result.slowerPercent
      for (const kind of kinds) {
        target[kind] += Number(match[1])
        result.sourceReferences[kind].push(`passive-node:${nodeId}`, stat.sourceText ?? text)
      }
    }
  }
  return result
}
