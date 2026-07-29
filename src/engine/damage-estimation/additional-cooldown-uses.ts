import type { EquipmentEntry } from '../../domain'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'

const GRENADE_COOLDOWN_USE_STAT = 'grenade_skill_cooldown_count_+'
const GRENADE_PASSIVE_NODE_ID = '58714'
const stripMarkup = (value: string) => value
  .replace(/\[[^|\]]+\|([^\]]+)\]/g, '$1')
  .replace(/\[([^\]]+)\]/g, '$1')
  .trim()

export interface AdditionalCooldownUses {
  count: number
  recoveryPercent: number
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
  let count = 0
  let recoveryPercent = 0
  const sourceReferences: string[] = []
  const grenade = input.skillTypes?.includes('Grenade') === true
  for (const entry of activeEquipment(input.equipment, input.weaponSet)) {
    for (const modifier of entry.modifierValues) {
      for (const stat of modifier.statValues ?? []) {
        if (!Number.isFinite(stat.value) || stat.value <= 0) continue
        if (grenade && stat.statId === GRENADE_COOLDOWN_USE_STAT) {
          count += stat.value
          sourceReferences.push(`equipment:${entry.id}:${modifier.modifierId}:${stat.statId}`)
        }
        if (grenade && stat.statId === 'grenade_skill_cooldown_speed_+%') {
          recoveryPercent += stat.value
          sourceReferences.push(`equipment:${entry.id}:${modifier.modifierId}:${stat.statId}`)
        }
      }
    }
  }

  if (input.passiveTree) {
    const allocated = allocatedNodeIds(input.planning, input.weaponSet)
    for (const node of input.passiveTree.nodes) {
      if (!allocated.has(node.id)) continue
      node.stats.forEach((stat, index) => {
        const text = stat.sourceText ? stripMarkup(stat.sourceText) : ''
        if (grenade && node.id === GRENADE_PASSIVE_NODE_ID && text.includes('Skills have +1 Cooldown Use')) {
          count += 1
          sourceReferences.push(`poe2-tree:${node.id}:stats:${index}`)
        }
        const genericRecovery = text.match(/^(\d+(?:\.\d+)?)% increased Cooldown Recovery Rate$/i)
        const grenadeRecovery = grenade
          ? text.match(/^(\d+(?:\.\d+)?)% increased Cooldown Recovery Rate for Grenade Skills$/i)
          : null
        const recovery = Number(genericRecovery?.[1] ?? grenadeRecovery?.[1])
        if (Number.isFinite(recovery) && recovery > 0) {
          recoveryPercent += recovery
          sourceReferences.push(`poe2-tree:${node.id}:stats:${index}`)
        }
      })
    }
  }

  return {
    count,
    recoveryPercent,
    sourceReferences: [...new Set(sourceReferences)].sort((a, b) => a.localeCompare(b, 'en')),
  }
}
