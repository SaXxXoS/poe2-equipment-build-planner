import { describe, expect, it } from 'vitest'
import type { EquipmentEntry } from '../../domain'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'
import { resolveCharacterSurvivabilityModel } from './character-survivability-model'

const node = (id: string, sourceText: string) => ({ id, nodeType: 'normal', isClassStart: false, isAscendancyStart: false, isJewelSocket: false, name: { sourceText: id }, stats: [{ sourceText }] }) as never
const tree = { metadata: { releaseTag: 'test' }, connections: [], nodes: [
  node('life-dex', '+1 Life per 4 [Dexterity]'),
  node('stun-dex', '+1 to [StunThreshold|Stun Threshold] per [Dexterity|Dexterity]'),
  node('stun-str', '+3 to [StunThreshold|Stun Threshold] per [Strength|Strength]'),
  node('ailment-dex', '+4 to [AilmentThreshold|Ailment Threshold] per [Dexterity|Dexterity]'),
  node('life-percent', '10% increased maximum Life'),
  node('blocked', 'Stun Threshold is based on 30% of your Energy Shield instead of Life'),
] } as RealPassiveTree
const planning = (ids: string[]) => ({ pipelineResult: { allocatedNodeIds: ids } }) as unknown as RealPassivePlanningIntegrationResult
const equipment: EquipmentEntry[] = [{ id: 'body', slotId: 'slot-body-armour', modifierValues: [{ id: 'life-applied', modifierId: 'life', value: 50, statValues: [{ statId: 'maximum_life', value: 50 }] }] }]

describe('Charakter-Lebens- und Schwellenmodell', () => {
  it('berechnet Leben aus Level, Stärke, Ausrüstung und exakt belegten Passivwirkungen', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment, weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['life-dex', 'life-percent']) })
    expect(result.life).toEqual(expect.objectContaining({ baseFromLevel: 312, fromStrength: 14, fromDexterityPassives: 1, flatFromEquipment: 50, increasedReducedPercent: 10, maximum: 414 }))
    expect(result.stunThreshold?.baseFromLife).toBe(414)
    expect(result.ailmentThreshold?.baseFromLife).toBe(207)
  })
  it('wendet Attributbeiträge auf Betäubungs- und Beeinträchtigungsschwelle exakt an', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['stun-dex', 'stun-str', 'ailment-dex']) })
    expect(result.stunThreshold).toEqual(expect.objectContaining({ flatFromAttributes: 28, total: 354 }))
    expect(result.ailmentThreshold).toEqual(expect.objectContaining({ flatFromAttributes: 28, total: 191 }))
  })
  it('blockiert Sonderbasen statt sie mit der Standardformel zu vermischen', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['blocked']) })
    expect(result.status).toBe('partial-blocked-special-cases')
    expect(result.blockedLines).toEqual(['Stun Threshold is based on 30% of your Energy Shield instead of Life'])
  })
  it('blockiert ohne Level und bleibt deterministisch', () => {
    const input = { classId: 'class-official-1', equipment: [], weaponSet: 'set-1' as const }
    expect(resolveCharacterSurvivabilityModel(input)).toEqual(resolveCharacterSurvivabilityModel(input))
    expect(resolveCharacterSurvivabilityModel(input).status).toBe('blocked-missing-level')
  })
})
