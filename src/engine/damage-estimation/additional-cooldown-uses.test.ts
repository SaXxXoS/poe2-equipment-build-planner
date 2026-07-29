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
    expect(result.recoveryPercent).toBe(0)
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
    })).toEqual({ count: 0, recoveryPercent: 0, sourceReferences: [] })
  })

  it('addiert allgemeine und Grenade-spezifische Recovery, aber blockiert Grenade-Recovery für andere Skills', () => {
    const recoveryTree = {
      ...passiveTree,
      nodes: [
        { id: 'generic', stats: [{ sourceText: '6% increased [CooldownRecovery|Cooldown Recovery Rate]' }] },
        { id: 'grenade', stats: [{ sourceText: '15% increased Cooldown Recovery Rate for [Grenade] Skills' }] },
      ],
    } as unknown as RealPassiveTree
    const planning = {
      weaponSetPlanning: {
        'set-1': { allocatedNodeIds: ['generic', 'grenade'] },
        'set-2': { allocatedNodeIds: [] },
      },
    } as unknown as RealPassivePlanningIntegrationResult
    const grenade = additionalCooldownUsesFor({
      skillTypes: ['Grenade'],
      equipment: [],
      weaponSet: 'set-1',
      passiveTree: recoveryTree,
      planning,
    })
    const spell = additionalCooldownUsesFor({
      skillTypes: ['Spell'],
      equipment: [],
      weaponSet: 'set-1',
      passiveTree: recoveryTree,
      planning,
    })
    expect(grenade.recoveryPercent).toBe(21)
    expect(spell.recoveryPercent).toBe(6)
  })

  it('liest technische Grenade-Recovery nur aus der aktiven Waffe', () => {
    const recoveryEquipment = (slotId: string, value: number): EquipmentEntry => ({
      id: `recovery:${slotId}`,
      slotId,
      itemClassId: 'Crossbows',
      modifierValues: [{
        id: `recovery-mod:${slotId}`,
        modifierId: 'GrenadeSkillCooldownRecovery',
        value,
        statValues: [{ statId: 'grenade_skill_cooldown_speed_+%', value }],
      }],
    })
    expect(additionalCooldownUsesFor({
      skillTypes: ['Grenade'],
      equipment: [
        recoveryEquipment('slot-weapon-set-1-left', 30),
        recoveryEquipment('slot-weapon-set-2-left', 20),
      ],
      weaponSet: 'set-1',
    }).recoveryPercent).toBe(30)
  })

  it('bindet Warcry- und Minion-Command-Recovery an ihre strukturierten Skilltypen', () => {
    const typedTree = {
      ...passiveTree,
      nodes: [
        { id: 'warcry', stats: [{ sourceText: '18% increased [Warcry|Warcry] Cooldown Recovery Rate' }] },
        { id: 'command', stats: [{ sourceText: '[Minion|Minions] have 25% increased [CooldownRecovery|Cooldown Recovery Rate] for [Command] Skills' }] },
      ],
    } as unknown as RealPassiveTree
    const planning = {
      pipelineResult: { allocatedNodeIds: ['warcry', 'command'] },
    } as unknown as RealPassivePlanningIntegrationResult
    const collect = (skillTypes: string[]) => additionalCooldownUsesFor({
      skillTypes,
      equipment: [],
      weaponSet: 'set-1',
      passiveTree: typedTree,
      planning,
    }).recoveryPercent
    expect(collect(['Warcry', 'Cooldown'])).toBe(18)
    expect(collect(['CommandsMinions'])).toBe(25)
    expect(collect(['Spell', 'Cooldown'])).toBe(0)
  })
})
