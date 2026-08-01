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
  node('giants-blood', 'You can wield Two-Handed Axes in one hand\nInherent Life granted by Strength is halved'),
  node('double-attributes', 'Inherent bonuses gained from Attributes are doubled'),
  node('no-strength-life', 'Strength provides no bonus to maximum Life'),
  node('chaos-inoculation', 'Maximum Life is 1\nImmune to Chaos Damage and Bleeding'),
  node('mana-threshold', 'Stun Threshold is based on 40% of your Mana instead of Life'),
  node('es-addition', '20% of your Energy Shield is added to your Stun Threshold'),
  node('threshold-es', 'Gain additional [AilmentThreshold|Ailment Threshold] equal to 15% of maximum [EnergyShield|Energy Shield]\nGain additional [StunThreshold|Stun Threshold] equal to 15% of maximum [EnergyShield|Energy Shield]'),
  node('evasion-ailment', '[Gain] 100% of [Evasion|Evasion Rating] as extra [AilmentThreshold|Ailment Threshold]'),
  node('helmet-lowest', 'Gain [StunThreshold|Stun Threshold] equal to the lowest of [Evasion|Evasion] and [Armour|Armour] on your Helmet'),
  node('boots-lowest', 'Gain [AilmentThreshold|Ailment Threshold] equal to the lowest of [Evasion|Evasion] and [Armour|Armour] on your Boots'),
  node('armour-items', 'Gain additional [StunThreshold|Stun Threshold] equal to 30% of [ItemArmour|Item Armour] on [EquipArmour|Equipped Armour Items]'),
] } as RealPassiveTree
const planning = (ids: string[]) => ({ pipelineResult: { allocatedNodeIds: ids } }) as unknown as RealPassivePlanningIntegrationResult
const equipment: EquipmentEntry[] = [{ id: 'body', slotId: 'slot-body-armour', modifierValues: [{ id: 'life-applied', modifierId: 'life', value: 50, statValues: [{ statId: 'maximum_life', value: 50 }] }] }]

describe('Charakter-Lebens- und Schwellenmodell', () => {
  it('berechnet Leben aus Level, Stärke, Ausrüstung und exakt belegten Passivwirkungen', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment, weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['life-dex', 'life-percent']) })
    expect(result.life).toEqual(expect.objectContaining({ baseFromLevel: 312, fromStrength: 14, fromDexterityPassives: 1, flatFromEquipment: 50, increasedReducedPercent: 10, maximum: 414 }))
    expect(result.stunThreshold?.baseValue).toBe(414)
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
  it('wendet halbierte, verdoppelte und entfernte inhärente Stärke-Lebensboni in PoB2-Reihenfolge an', () => {
    const halved = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['giants-blood']) })
    const halvedAndDoubled = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['giants-blood', 'double-attributes']) })
    const removed = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['no-strength-life', 'double-attributes']) })
    expect(halved.life).toEqual(expect.objectContaining({ strengthLifePerPoint: 1, inherentAttributeMultiplier: 1, fromStrength: 7, maximum: 319 }))
    expect(halvedAndDoubled.life).toEqual(expect.objectContaining({ strengthLifePerPoint: 1, inherentAttributeMultiplier: 2, fromStrength: 14, maximum: 326 }))
    expect(removed.life).toEqual(expect.objectContaining({ strengthLifePerPoint: 0, fromStrength: 0, maximum: 312 }))
  })
  it('setzt Chaos Inoculation auf ein Leben und verwendet für Betäubung das Leben davor', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['chaos-inoculation']) })
    expect(result.life).toEqual(expect.objectContaining({ preOverrideMaximum: 326, maximum: 1, override: 'chaos-inoculation' }))
    expect(result.stunThreshold).toEqual(expect.objectContaining({ baseKind: 'pre-chaos-inoculation-life', baseValue: 326, total: 326 }))
    expect(result.ailmentThreshold?.baseFromLife).toBe(0.5)
  })
  it('verwendet bestätigte Mana- und Energieschildwerte für alternative Betäubungsbasen', () => {
    const mana = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['mana-threshold', 'es-addition']), maximumMana: 500, maximumEnergyShield: 200 })
    expect(mana.status).toBe('exact-confirmed-components')
    expect(mana.stunThreshold).toEqual(expect.objectContaining({ baseKind: 'mana', basePercent: 40, baseValue: 200, additionalFromEnergyShield: 40, total: 240 }))
  })
  it('blockiert widersprüchliche alternative Betäubungsbasen deterministisch', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['blocked', 'mana-threshold']), maximumMana: 500, maximumEnergyShield: 200 })
    expect(result.status).toBe('partial-blocked-special-cases')
    expect(result.stunThreshold?.baseKind).toBe('life')
    expect(result.blockedLines).toHaveLength(2)
  })
  it('wendet globale Energieschild- und Ausweichbeiträge auf die richtigen Schwellen an', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['threshold-es', 'evasion-ailment']), maximumEnergyShield: 200, totalArmour: 100, totalEvasion: 300 })
    expect(result.stunThreshold).toEqual(expect.objectContaining({ additionalFromEnergyShield: 30, additionalFromDefences: 0, total: 356 }))
    expect(result.ailmentThreshold).toEqual(expect.objectContaining({ additionalFromEnergyShield: 30, additionalFromDefences: 300, total: 493 }))
  })
  it('verwendet Helm, Schuhe und Rüstungsteile positionsgenau', () => {
    const positionalEquipment: EquipmentEntry[] = [
      { id: 'helmet', slotId: 'slot-helmet', modifierValues: [], defences: { armour: 100, evasion: 80 } },
      { id: 'boots', slotId: 'slot-boots', modifierValues: [], defences: { armour: 40, evasion: 60 } },
      { id: 'gloves', slotId: 'slot-gloves', modifierValues: [], defences: { armour: 20 } },
      { id: 'body', slotId: 'slot-body-armour', modifierValues: [], defences: { armour: 200 } },
      { id: 'weapon', slotId: 'slot-weapon-set-1-left', modifierValues: [], defences: { armour: 999, evasion: 999 } },
    ]
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: positionalEquipment, weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['helmet-lowest', 'boots-lowest', 'armour-items']), maximumEnergyShield: 0, totalArmour: 360, totalEvasion: 140 })
    expect(result.stunThreshold).toEqual(expect.objectContaining({ additionalFromEquipmentPositions: 188, total: 514 }))
    expect(result.ailmentThreshold).toEqual(expect.objectContaining({ additionalFromEquipmentPositions: 40, total: 203 }))
  })
  it('blockiert globale Defensive-Beiträge ohne berechneten Quellwert', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['evasion-ailment']) })
    expect(result.status).toBe('partial-blocked-special-cases')
    expect(result.blockedLines).toContain('Additional threshold from Evasion Rating')
  })
})
