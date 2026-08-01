import { describe, expect, it } from 'vitest'
import type { EquipmentEntry } from '../../domain'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'
import { resolveCharacterDefenceModel } from './character-defence-model'

const node = (id: string, sourceText: string, ascendancyId?: string) => ({
  id,
  nodeType: 'normal',
  isClassStart: false,
  isAscendancyStart: false,
  isJewelSocket: false,
  ascendancyId,
  name: { sourceText: id },
  stats: [{ sourceText }],
}) as never
const tree: RealPassiveTree = {
  metadata: { releaseTag: 'test' },
  connections: [],
  nodes: [
    node('shared', '20% increased Armour and Evasion Rating'),
    node('set-1', '10% more Armour'),
    node('set-2', '25% increased Energy Shield'),
    node('asc', '+10 to maximum Energy Shield', 'stormweaver'),
    node('conditional', '30% increased Armour while stationary'),
    node('intelligence-evasion', '3% increased [Evasion] Rating per 10 [Intelligence]'),
  ],
}
const projected = (allocatedNodeIds: string[]) => ({ allocatedNodeIds }) as never
const planning = {
  pipelineResult: projected(['shared']),
  weaponSetPlanning: {
    'set-1': projected(['shared', 'set-1', 'conditional']),
    'set-2': projected(['shared', 'set-2']),
  },
  ascendancyPlanning: projected(['asc']),
} as unknown as RealPassivePlanningIntegrationResult
const equipment: EquipmentEntry[] = [
  { id: 'body', slotId: 'slot-body-armour', modifierValues: [], defences: { armour: 100, evasion: 200, energyShield: 50 } },
  { id: 'weapon', slotId: 'slot-weapon-set-1-left', modifierValues: [], defences: { armour: 999 } },
]

describe('waffensetspezifisches Charakter-Defensivmodell', () => {
  it('verknüpft bestätigte Gegenstandswerte mit unbedingten Passiv- und Aszendenzeffekten', () => {
    const result = resolveCharacterDefenceModel({ equipment, passiveTree: tree, realPassivePlanning: planning, weaponSet: 'set-1' })
    expect(result.contributions).toEqual([
      expect.objectContaining({ type: 'armour', equipmentBase: 100, increasedReducedPercent: 20, moreLessMultiplier: 1.1, calculatedContribution: 132 }),
      expect.objectContaining({ type: 'evasion', equipmentBase: 200, increasedReducedPercent: 20, calculatedContribution: 240 }),
      expect.objectContaining({ type: 'energyShield', equipmentBase: 50, flatPassive: 10, calculatedContribution: 60 }),
    ])
    expect(result.blockedPassiveLines).toEqual(['30% increased Armour while stationary'])
  })

  it('hält Waffensetpfade getrennt und schließt Verteidigungswerte auf Waffen aus', () => {
    const set1 = resolveCharacterDefenceModel({ equipment, passiveTree: tree, realPassivePlanning: planning, weaponSet: 'set-1' })
    const set2 = resolveCharacterDefenceModel({ equipment, passiveTree: tree, realPassivePlanning: planning, weaponSet: 'set-2' })
    expect(set1.contributions.find(value => value.type === 'armour')?.calculatedContribution).toBe(132)
    expect(set2.contributions.find(value => value.type === 'armour')?.calculatedContribution).toBe(120)
    expect(set2.contributions.find(value => value.type === 'energyShield')?.calculatedContribution).toBe(75)
    expect(set1.excludedWeaponItemIds).toEqual(['weapon'])
    expect(set2.excludedWeaponItemIds).toEqual(['weapon'])
  })

  it('ist bei identischer Eingabe deterministisch', () => {
    const input = { equipment, passiveTree: tree, realPassivePlanning: planning, weaponSet: 'set-2' as const }
    expect(resolveCharacterDefenceModel(input)).toEqual(resolveCharacterDefenceModel(input))
  })

  it('wertet Ausweichen pro voller Intelligenzschwelle aus', () => {
    const result = resolveCharacterDefenceModel({ equipment, passiveTree: tree, realPassivePlanning: { pipelineResult: projected(['intelligence-evasion']) } as unknown as RealPassivePlanningIntegrationResult, weaponSet: 'set-1', characterClassId: 'class-official-1' })
    expect(result.contributions.find(value => value.type === 'evasion')).toEqual(expect.objectContaining({ increasedReducedPercent: 3, calculatedContribution: 206 }))
  })
})
