import officialPassiveTree from '../../../generated/poe2-tree/tree.json'
import type { MechanicTag, SkillGemDefinition } from '../../domain'
import { classifyPassiveNode } from '../../engine/passive-targeting/classifier'
import type { PassiveTargetNode, PassiveTargetTag } from '../../engine/passive-targeting/types'

const supportedTags = new Set<MechanicTag>([
  'attack', 'spell', 'projectile', 'melee', 'area', 'physical', 'fire', 'cold',
  'lightning', 'chaos', 'critical', 'damage-over-time', 'minion', 'movement',
  'resistance', 'resource', 'strength', 'dexterity', 'intelligence',
])

const tagMap: Partial<Record<PassiveTargetTag, MechanicTag>> = {
  attack: 'attack',
  spell: 'spell',
  projectile: 'projectile',
  melee: 'melee',
  area: 'area',
  physical: 'physical',
  fire: 'fire',
  cold: 'cold',
  lightning: 'lightning',
  chaos: 'chaos',
  critical: 'critical',
  'damage-over-time': 'damage-over-time',
  minion: 'minion',
  movement: 'movement',
  resistance: 'resistance',
  mana: 'resource',
  spirit: 'resource',
  'resource-cost': 'resource',
  strength: 'strength',
  dexterity: 'dexterity',
  intelligence: 'intelligence',
}

const normalizeAscendancyId = (id: string) =>
  id.replace(/^ascendancy-official-/u, '')

const nodes = officialPassiveTree.nodes as PassiveTargetNode[]
const tagWeightsByAscendancy = new Map<string, Map<MechanicTag, number>>()

for (const node of nodes) {
  if (!node.ascendancyId || node.isAscendancyStart) continue
  const classification = classifyPassiveNode(node)
  const weights = tagWeightsByAscendancy.get(node.ascendancyId) ?? new Map<MechanicTag, number>()
  for (const rawTag of classification.tags) {
    const tag = tagMap[rawTag]
    if (!tag || !supportedTags.has(tag)) continue
    const resolvedStats = classification.stats.filter(value =>
      !value.unresolved && value.tags.includes(rawTag),
    )
    const hasPositive = resolvedStats.some(value => value.positiveEffects.includes(rawTag))
      || classification.name.positiveEffects.includes(rawTag)
    if (!hasPositive) continue
    const nodeWeight = node.nodeType === 'notable' ? 3 : 1
    weights.set(tag, (weights.get(tag) ?? 0) + nodeWeight)
  }
  tagWeightsByAscendancy.set(node.ascendancyId, weights)
}

export function derivedAscendancyAffinity(skill: SkillGemDefinition, ascendancyId: string) {
  const normalizedId = normalizeAscendancyId(ascendancyId)
  const weights = tagWeightsByAscendancy.get(normalizedId) ?? new Map<MechanicTag, number>()
  const matches = skill.tags
    .filter(tag => (weights.get(tag) ?? 0) > 0)
    .sort()
  const score = Math.min(225, matches.reduce((sum, tag) => sum + Math.min(45, (weights.get(tag) ?? 0) * 5), 0))
  return {
    matches,
    score,
    evidence: matches.length ? 'structured-derived' as const : 'unresolved' as const,
    sourceNodeCount: nodes.filter(node => node.ascendancyId === normalizedId && !node.isAscendancyStart).length,
  }
}

export function ascendancyAffinityCoverage() {
  return {
    ascendancyCount: tagWeightsByAscendancy.size,
    ascendanciesWithProductiveTags: [...tagWeightsByAscendancy.values()].filter(value => value.size > 0).length,
  }
}
