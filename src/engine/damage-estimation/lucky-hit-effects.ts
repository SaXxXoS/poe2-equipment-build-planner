import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'
import type { DamageComponent } from './types'
import type { EnemyMitigationProfile } from './types'

export interface LuckyHitEffect {
  damageType: DamageComponent['type'] | 'all'
  chancePercent: number
  sourceNodeId: string
  sourceText: string
  condition: 'unconditional' | 'enemy-low-life' | 'enemy-heavy-stunned'
  evidence: 'text-pattern-exact'
}

export interface BlockedLuckyHitEffect {
  sourceNodeId: string
  sourceText: string
  condition: 'enemy-low-life' | 'enemy-heavy-stunned'
  reason: 'enemy-state-not-confirmed'
  evidence: 'text-pattern-exact'
}

const stripMarkup = (value: string) =>
  value.replace(/\[[^|\]]+\|([^\]]+)\]/g, '$1').replace(/\[([^\]]+)\]/g, '$1').replace(/\s+/g, ' ').trim()

const exactGeneral = /^(\d+(?:\.\d+)?)% chance for Damage with Hits to be Lucky$/
const exactTyped = /^(\d+(?:\.\d+)?)% chance for (Physical|Fire|Cold|Lightning|Chaos) Damage with Hits to be Lucky$/
const exactLowLife = /^Damage with Hits is Lucky against Enemies that are on Low Life$/
const exactHeavyStunned = /^Damage with Hits is Lucky against Heavy Stunned Enemies$/

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

export function resolveLuckyHitEffectModel(input: {
  passiveTree?: RealPassiveTree
  planning?: RealPassivePlanningIntegrationResult
  weaponSet: 'set-1' | 'set-2'
  enemyProfile?: EnemyMitigationProfile
}): { effects: LuckyHitEffect[]; blockedEffects: BlockedLuckyHitEffect[] } {
  if (!input.passiveTree || !input.planning) return { effects: [], blockedEffects: [] }
  const nodes = new Map(input.passiveTree.nodes.map(node => [node.id, node]))
  const effects: LuckyHitEffect[] = []
  const blockedEffects: BlockedLuckyHitEffect[] = []
  for (const nodeId of allocatedNodeIds(input.planning, input.weaponSet)) {
    const node = nodes.get(nodeId)
    if (!node) continue
    for (const stat of node.stats) {
      const text = stripMarkup(stat.sourceText ?? '')
      const general = text.match(exactGeneral)
      const typed = text.match(exactTyped)
      const lowLife = exactLowLife.test(text)
      const heavyStunned = exactHeavyStunned.test(text)
      if (!general && !typed && !lowLife && !heavyStunned) continue
      const condition = lowLife ? 'enemy-low-life' : heavyStunned ? 'enemy-heavy-stunned' : 'unconditional'
      const active = condition === 'unconditional'
        || (condition === 'enemy-low-life' && input.enemyProfile?.lifeState === 'low-life')
        || (condition === 'enemy-heavy-stunned' && input.enemyProfile?.heavyStunned === true)
      if (!active) {
        blockedEffects.push({
          sourceNodeId: nodeId,
          sourceText: stat.sourceText ?? text,
          condition,
          reason: 'enemy-state-not-confirmed',
          evidence: 'text-pattern-exact',
        })
        continue
      }
      effects.push({
        damageType: typed ? typed[2].toLocaleLowerCase('en') as DamageComponent['type'] : 'all',
        chancePercent: lowLife || heavyStunned ? 100 : Number((typed ?? general)![1]),
        sourceNodeId: nodeId,
        sourceText: stat.sourceText ?? text,
        condition,
        evidence: 'text-pattern-exact',
      })
    }
  }
  const sort = <T extends { sourceNodeId: string; sourceText: string }>(values: T[]) =>
    values.sort((a, b) => a.sourceNodeId.localeCompare(b.sourceNodeId) || a.sourceText.localeCompare(b.sourceText))
  return { effects: sort(effects), blockedEffects: sort(blockedEffects) }
}

export function resolveLuckyHitEffects(input: {
  passiveTree?: RealPassiveTree
  planning?: RealPassivePlanningIntegrationResult
  weaponSet: 'set-1' | 'set-2'
  enemyProfile?: EnemyMitigationProfile
}): LuckyHitEffect[] {
  return resolveLuckyHitEffectModel(input).effects
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
