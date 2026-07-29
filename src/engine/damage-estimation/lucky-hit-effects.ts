import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'
import type { DamageComponent } from './types'

export interface LuckyHitEffect {
  damageType: DamageComponent['type'] | 'all'
  chancePercent: number
  sourceNodeId: string
  sourceText: string
  evidence: 'text-pattern-exact'
}

const stripMarkup = (value: string) =>
  value.replace(/\[[^|\]]+\|([^\]]+)\]/g, '$1').replace(/\[([^\]]+)\]/g, '$1').replace(/\s+/g, ' ').trim()

const exactGeneral = /^(\d+(?:\.\d+)?)% chance for Damage with Hits to be Lucky$/
const exactTyped = /^(\d+(?:\.\d+)?)% chance for (Physical|Fire|Cold|Lightning|Chaos) Damage with Hits to be Lucky$/

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

export function resolveLuckyHitEffects(input: {
  passiveTree?: RealPassiveTree
  planning?: RealPassivePlanningIntegrationResult
  weaponSet: 'set-1' | 'set-2'
}): LuckyHitEffect[] {
  if (!input.passiveTree || !input.planning) return []
  const nodes = new Map(input.passiveTree.nodes.map(node => [node.id, node]))
  const effects: LuckyHitEffect[] = []
  for (const nodeId of allocatedNodeIds(input.planning, input.weaponSet)) {
    const node = nodes.get(nodeId)
    if (!node) continue
    for (const stat of node.stats) {
      const text = stripMarkup(stat.sourceText ?? '')
      const general = text.match(exactGeneral)
      const typed = text.match(exactTyped)
      if (!general && !typed) continue
      effects.push({
        damageType: typed ? typed[2].toLocaleLowerCase('en') as DamageComponent['type'] : 'all',
        chancePercent: Number((typed ?? general)![1]),
        sourceNodeId: nodeId,
        sourceText: stat.sourceText ?? text,
        evidence: 'text-pattern-exact',
      })
    }
  }
  return effects.sort((a, b) => a.sourceNodeId.localeCompare(b.sourceNodeId) || a.sourceText.localeCompare(b.sourceText))
}

export function expectedLuckyHitDamage(
  components: DamageComponent[],
  effects: LuckyHitEffect[],
) {
  return components.reduce((sum, component) => {
    const normalAverage = (component.minimum + component.maximum) / 2
    const luckyAverage = component.minimum + (component.maximum - component.minimum) * 2 / 3
    const chance = Math.min(100, effects
      .filter(effect => effect.damageType === 'all' || effect.damageType === component.type)
      .reduce((total, effect) => total + effect.chancePercent, 0)) / 100
    return sum + normalAverage + (luckyAverage - normalAverage) * chance
  }, 0)
}
