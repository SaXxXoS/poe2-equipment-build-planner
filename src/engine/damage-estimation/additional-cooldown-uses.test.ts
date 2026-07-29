import { describe, expect, it } from 'vitest'
import type { EquipmentEntry } from '../../domain'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'
import { additionalCooldownUsesFor } from './additional-cooldown-uses'

const equipment = (slotId: string, value: number): EquipmentEntry => ({
  id: `crossbow:${slotId}`,
  slotId,
  itemClassId: 'Crossbows',
  modifierValues: [{
    id: `cooldown-use:${slotId}`,
    modifierId: 'GrenadeSkillAdditionalCooldownUse',
    value,
    statValues: [{ statId: 'grenade_skill_cooldown_count_+', value }],
  }],
})

const passiveTree = {
  nodes: [{
    id: '58714',
    stats: [{ sourceText: '[Grenade|Grenade] Skills have +1 Cooldown Use' }],
  }],
  connections: [],
  metadata: { releaseTag: 'test' },
} as unknown as RealPassiveTree

describe('Zusätzliche Cooldown-Nutzungen', () => {
  it('addiert exakte Grenade-Nutzungen nur aus dem aktiven Waffenset und dessen Passiveplan', () => {
    const result = additionalCooldownUsesFor({
      skillTypes: ['Grenade', 'Attack'],
      equipment: [
        equipment('slot-weapon-set-1-left', 2),
        equipment('slot-weapon-set-2-left', 1),
      ],
      weaponSet: 'set-1',
      passiveTree,
      planning: {
        weaponSetPlanning: {
          'set-1': { allocatedNodeIds: ['58714'] },
          'set-2': { allocatedNodeIds: [] },
        },
      } as unknown as RealPassivePlanningIntegrationResult,
    })
    expect(result.count).toBe(3)
    expect(result.sourceReferences).toEqual([
      'equipment:crossbow:slot-weapon-set-1-left:GrenadeSkillAdditionalCooldownUse:grenade_skill_cooldown_count_+',
      'poe2-tree:58714:stats:0',
    ])
  })

  it('wendet Grenade-spezifische Quellen nicht auf andere Fertigkeiten an', () => {
    expect(additionalCooldownUsesFor({
      skillTypes: ['Spell', 'Lightning'],
      equipment: [equipment('slot-weapon-set-1-left', 2)],
      weaponSet: 'set-1',
      passiveTree,
      planning: { pipelineResult: { allocatedNodeIds: ['58714'] } } as unknown as RealPassivePlanningIntegrationResult,
    })).toEqual({ count: 0, sourceReferences: [] })
  })
})
