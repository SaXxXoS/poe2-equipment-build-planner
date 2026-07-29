import type { EquipmentEntry } from '../../domain'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'

const GRENADE_COOLDOWN_USE_STAT = 'grenade_skill_cooldown_count_+'
const GRENADE_PASSIVE_NODE_ID = '58714'

export interface AdditionalCooldownUses {
  count: number
  sourceReferences: string[]
}

const activeEquipment = (equipment: EquipmentEntry[], weaponSet: 'set-1' | 'set-2') =>
  equipment.filter(entry =>
    !entry.slotId.includes('weapon-set-')
    || entry.slotId.includes(`weapon-${weaponSet}`),
  )

const allocatedNodeIds = (
  planning: RealPassivePlanningIntegrationResult | undefined,
  weaponSet: 'set-1' | 'set-2',
) => new Set([
  ...(planning?.weaponSetPlanning?.[weaponSet]?.allocatedNodeIds
    ?? planning?.pipelineResult?.allocatedNodeIds
    ?? []),
  ...(planning?.ascendancyPlanning?.allocatedNodeIds ?? []),
])

export function additionalCooldownUsesFor(input: {
  skillTypes?: readonly string[]
  equipment: EquipmentEntry[]
  weaponSet: 'set-1' | 'set-2'
  passiveTree?: RealPassiveTree
  planning?: RealPassivePlanningIntegrationResult
}): AdditionalCooldownUses {
  if (!input.skillTypes?.includes('Grenade')) return { count: 0, sourceReferences: [] }

  let count = 0
  const sourceReferences: string[] = []
  for (const entry of activeEquipment(input.equipment, input.weaponSet)) {
    for (const modifier of entry.modifierValues) {
      for (const stat of modifier.statValues ?? []) {
        if (stat.statId !== GRENADE_COOLDOWN_USE_STAT || !Number.isFinite(stat.value) || stat.value <= 0) continue
        count += stat.value
        sourceReferences.push(`equipment:${entry.id}:${modifier.modifierId}:${stat.statId}`)
      }
    }
  }

  if (input.passiveTree && allocatedNodeIds(input.planning, input.weaponSet).has(GRENADE_PASSIVE_NODE_ID)) {
    const node = input.passiveTree.nodes.find(value => value.id === GRENADE_PASSIVE_NODE_ID)
    const matchingStat = node?.stats.findIndex(value =>
      value.sourceText?.replace(/\[[^|\]]+\|([^\]]+)\]/g, '$1').includes('Skills have +1 Cooldown Use'),
    ) ?? -1
    if (matchingStat >= 0) {
      count += 1
      sourceReferences.push(`poe2-tree:${GRENADE_PASSIVE_NODE_ID}:stats:${matchingStat}`)
    }
  }

  return {
    count,
    sourceReferences: [...new Set(sourceReferences)].sort((a, b) => a.localeCompare(b, 'en')),
  }
}
