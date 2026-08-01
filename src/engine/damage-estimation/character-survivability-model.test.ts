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
  node('double-stun', 'Your [StunThreshold|Stun Threshold] is doubled'),
  node('avoid-stun-a', '60% chance to Avoid being Stunned'),
  node('avoid-stun-b', '55% chance to Avoid being Stunned'),
  node('avoid-ailment', '35% chance to Avoid Elemental Ailments'),
  node('avoid-ignite', '40% chance to Avoid being Ignited'),
  node('avoid-freeze-a', '70% chance to Avoid being Frozen'),
  node('avoid-freeze-b', '45% chance to Avoid being Frozen'),
  node('immune-shock', 'Cannot be Shocked'),
  node('immune-chill-freeze', 'You Cannot be Chilled or Frozen'),
  node('immune-elemental', 'Immune to Elemental Ailments'),
  node('conditional-immune-ignite', 'Cannot be Ignited while on Low Life'),
  node('avoid-all-ailments', '20% chance to Avoid Ailments'),
  node('avoid-bleed', '35% chance to Avoid Bleeding'),
  node('avoid-poison-a', '55% chance to Avoid being Poisoned'),
  node('avoid-poison-b', '40% chance to Avoid being Poisoned'),
  node('immune-bleed', 'Bleeding cannot be inflicted on you'),
  node('immune-poison', 'Cannot be Poisoned'),
  node('conditional-immune-poison', 'Cannot be Poisoned while Bleeding'),
  node('stun-immune', 'Cannot be Stunned'),
  node('stun-immune-es', 'Cannot be Stunned while you have Energy Shield'),
  node('conditional-avoid', '25% chance to Avoid being Stunned while Channelling'),
  node('curse-effect-a', '15% reduced [BuffEffect|effect] of [Curse|Curses] on you'),
  node('curse-effect-b', '50% reduced effect of Curses on you'),
  node('curse-effect-c', '50% reduced effect of Curses on you'),
  node('curse-effect-increased', '20% increased effect of Curses on you'),
  node('curse-unaffected', 'Unaffected by Curses'),
  node('curse-unaffected-conditional', 'Unaffected by Curses while affected by Zealotry'),
  node('curse-immune-conditional', 'Immunity to Curses while you have at least 25 Rage'),
  node('avoid-blind-a', '35% chance to Avoid being Blinded'),
  node('avoid-blind-b', '80% chance to Avoid Blind'),
  node('avoid-impale', '45% chance to Avoid being Impaled'),
  node('immune-blind', 'Cannot be Blinded'),
  node('immune-impale', 'You Cannot be Impaled'),
  node('immune-corrupted-blood', 'Immune to [CorruptedBlood|Corrupted Blood]'),
  node('immune-maim-hinder', 'Immune to [Hinder]\nImmune to [Maim]'),
  node('immune-silence', 'You cannot be Cursed with Silence'),
  node('conditional-maim', 'Immune to Maim while Shapeshifted'),
  node('conditional-deflect-maim', 'Deflected Hits cannot inflict Maim on you'),
  node('debuff-expiry-a', '[Debuff|Debuffs] on you expire 20% faster'),
  node('debuff-expiry-b', 'Debuffs on you expire 10% faster'),
  node('ailment-duration', '10% reduced Duration of [Ailments|Ailments] on You'),
  node('elemental-duration', '15% reduced Elemental Ailment Duration on you'),
  node('shock-duration', '25% reduced [Shock|Shock] duration on you'),
  node('freeze-duration', '25% reduced [Freeze|Freeze] Duration on you'),
  node('bleed-duration', '40% reduced Duration of [Bleeding] on You'),
  node('poison-duration', '40% reduced [Poison|Poison] Duration on you'),
  node('blind-duration', '25% reduced Blind Duration on you'),
  node('shock-duration-overcap', '120% reduced Shock Duration on you'),
  node('conditional-shock-duration', '25% reduced Shock Duration on you while on Low Life'),
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
  it('wendet die PoB2-MORE-Regel fuer eine verdoppelte Betaeubungsschwelle an', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['double-stun']) })
    expect(result.stunThreshold).toEqual(expect.objectContaining({ moreLessMultiplier: 2, total: 652 }))
  })
  it('addiert unbedingte Vermeidung und deckelt sie wie PoB2 bei 100 Prozent', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['avoid-stun-a', 'avoid-stun-b', 'avoid-ailment']) })
    expect(result.avoidance).toEqual(expect.objectContaining({ stunChance: 100, elementalAilmentChance: 35, stunImmune: false, stunImmunitySource: 'none' }))
    expect(result.avoidance?.ignite.chance).toBe(35)
    expect(result.avoidance?.shock.chance).toBe(35)
  })
  it('setzt unbedingte Betaeubungsimmunitaet auf effektive 100 Prozent Vermeidung', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['stun-immune']) })
    expect(result.avoidance).toEqual(expect.objectContaining({ stunChance: 100, stunImmune: true, stunImmunitySource: 'unconditional' }))
  })
  it('wendet Energieschild-Immunitaet nur mit bestaetigtem Laufzeitzustand an', () => {
    const blocked = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['stun-immune-es']) })
    const active = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['stun-immune-es']), hasEnergyShield: true })
    const inactive = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['stun-immune-es']), hasEnergyShield: false })
    expect(blocked.blockedLines).toContain('Cannot be Stunned while you have Energy Shield')
    expect(active.avoidance).toEqual(expect.objectContaining({ stunChance: 100, stunImmune: true, stunImmunitySource: 'energy-shield-condition' }))
    expect(inactive.avoidance).toEqual(expect.objectContaining({ stunChance: 0, stunImmune: false, stunImmunitySource: 'none' }))
  })
  it('blockiert bedingte Vermeidung ohne bestaetigten Laufzeitzustand', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['conditional-avoid']) })
    expect(result.status).toBe('partial-blocked-special-cases')
    expect(result.blockedLines).toContain('25% chance to Avoid being Stunned while Channelling')
    expect(result.avoidance?.stunChance).toBe(0)
  })
  it('addiert allgemeine und individuelle Elementarvermeidung getrennt und deckelt jede Beeintraechtigung', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['avoid-ailment', 'avoid-ignite', 'avoid-freeze-a', 'avoid-freeze-b']) })
    expect(result.avoidance?.ignite).toEqual({ chance: 75, immune: false, immunitySource: 'none' })
    expect(result.avoidance?.freeze).toEqual({ chance: 100, immune: false, immunitySource: 'none' })
    expect(result.avoidance?.chill.chance).toBe(35)
    expect(result.avoidance?.shock.chance).toBe(35)
  })
  it('wendet individuelle Immunitaeten nur auf die zugehoerigen Elementarbeeintraechtigungen an', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['immune-shock', 'immune-chill-freeze']) })
    expect(result.avoidance?.shock).toEqual({ chance: 100, immune: true, immunitySource: 'individual' })
    expect(result.avoidance?.chill).toEqual({ chance: 100, immune: true, immunitySource: 'individual' })
    expect(result.avoidance?.freeze).toEqual({ chance: 100, immune: true, immunitySource: 'individual' })
    expect(result.avoidance?.ignite).toEqual({ chance: 0, immune: false, immunitySource: 'none' })
  })
  it('setzt unbedingte Elementarbeeintraechtigungsimmunitaet fuer alle vier Typen', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['immune-elemental']) })
    for (const ailment of ['ignite', 'chill', 'freeze', 'shock'] as const) expect(result.avoidance?.[ailment]).toEqual({ chance: 100, immune: true, immunitySource: 'elemental-ailment-immunity' })
  })
  it('blockiert bedingte Einzelimmunitaet statt sie als permanente Immunitaet zu werten', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['conditional-immune-ignite']) })
    expect(result.status).toBe('partial-blocked-special-cases')
    expect(result.blockedLines).toContain('Cannot be Ignited while on Low Life')
    expect(result.avoidance?.ignite).toEqual({ chance: 0, immune: false, immunitySource: 'none' })
  })
  it('wendet allgemeine Beeintraechtigungsvermeidung auf elementare, Blutungs- und Giftwerte an', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['avoid-all-ailments', 'avoid-ailment', 'avoid-bleed', 'avoid-poison-a']) })
    expect(result.avoidance).toEqual(expect.objectContaining({ ailmentChance: 20, elementalAilmentChance: 55 }))
    expect(result.avoidance?.ignite.chance).toBe(55)
    expect(result.avoidance?.bleed).toEqual({ chance: 55, immune: false, immunitySource: 'none' })
    expect(result.avoidance?.poison).toEqual({ chance: 75, immune: false, immunitySource: 'none' })
  })
  it('addiert individuelle Giftvermeidung und deckelt sie bei 100 Prozent', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['avoid-all-ailments', 'avoid-poison-a', 'avoid-poison-b']) })
    expect(result.avoidance?.poison).toEqual({ chance: 100, immune: false, immunitySource: 'none' })
    expect(result.avoidance?.bleed.chance).toBe(20)
  })
  it('wendet Blutungs- und Giftimmunitaet getrennt an', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['immune-bleed', 'immune-poison']) })
    expect(result.avoidance?.bleed).toEqual({ chance: 100, immune: true, immunitySource: 'individual' })
    expect(result.avoidance?.poison).toEqual({ chance: 100, immune: true, immunitySource: 'individual' })
    expect(result.avoidance?.ignite.chance).toBe(0)
  })
  it('erkennt Chaos Inoculation als belegte Blutungsimmunitaet', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['chaos-inoculation']) })
    expect(result.avoidance?.bleed).toEqual({ chance: 100, immune: true, immunitySource: 'individual' })
  })
  it('blockiert bedingte Giftimmunitaet ohne bestaetigten Laufzeitzustand', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['conditional-immune-poison']) })
    expect(result.status).toBe('partial-blocked-special-cases')
    expect(result.blockedLines).toContain('Cannot be Poisoned while Bleeding')
    expect(result.avoidance?.poison).toEqual({ chance: 0, immune: false, immunitySource: 'none' })
  })
  it('addiert verringerte und erhoehte Fluchwirkung nach der PoB2-INC-Regel', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['curse-effect-a', 'curse-effect-b', 'curse-effect-increased']) })
    expect(result.curseProtection).toEqual({ avoidChance: 0, immune: false, unaffected: false, effectPercent: 55, reducedEffectPercent: 45 })
  })
  it('begrenzt Fluchwirkung wie PoB2 auf mindestens null', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['curse-effect-a', 'curse-effect-b', 'curse-effect-c']) })
    expect(result.curseProtection).toEqual({ avoidChance: 0, immune: false, unaffected: false, effectPercent: 0, reducedEffectPercent: 100 })
  })
  it('setzt unbedingtes Unbeeinflusstsein auf null Fluchwirkung ohne Immunitaet zu behaupten', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['curse-effect-increased', 'curse-unaffected']) })
    expect(result.curseProtection).toEqual({ avoidChance: 0, immune: false, unaffected: true, effectPercent: 0, reducedEffectPercent: 100 })
  })
  it('blockiert bedingtes Unbeeinflusstsein und bedingte Fluchimmunitaet fail-closed', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['curse-unaffected-conditional', 'curse-immune-conditional']) })
    expect(result.status).toBe('partial-blocked-special-cases')
    expect(result.blockedLines).toEqual(expect.arrayContaining(['Unaffected by Curses while affected by Zealotry', 'Immunity to Curses while you have at least 25 Rage']))
    expect(result.curseProtection).toEqual({ avoidChance: 0, immune: false, unaffected: false, effectPercent: 100, reducedEffectPercent: 0 })
  })
  it('addiert und deckelt Blindheitsvermeidung getrennt von Aufspiessvermeidung', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['avoid-blind-a', 'avoid-blind-b', 'avoid-impale']) })
    expect(result.secondaryDebuffProtection?.blind).toEqual({ avoidChance: 100, immune: false })
    expect(result.secondaryDebuffProtection?.impale).toEqual({ avoidChance: 45, immune: false })
  })
  it('setzt Blindheits- und Aufspiessimmunitaet auf effektive 100 Prozent Vermeidung', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['immune-blind', 'immune-impale']) })
    expect(result.secondaryDebuffProtection?.blind).toEqual({ avoidChance: 100, immune: true })
    expect(result.secondaryDebuffProtection?.impale).toEqual({ avoidChance: 100, immune: true })
  })
  it('erkennt unbedingte Immunitaeten gegen verderbtes Blut, Maim und Hinder', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['immune-corrupted-blood', 'immune-maim-hinder']) })
    expect(result.secondaryDebuffProtection).toEqual(expect.objectContaining({ corruptedBlood: { immune: true }, maim: { immune: true }, hinder: { immune: true } }))
  })
  it('modelliert Stille als Fluchschutz und nicht als allgemeine Immunitaet', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['immune-silence']) })
    expect(result.secondaryDebuffProtection?.silence).toEqual({ avoidChance: 100, immune: true, inheritedCurseAvoidance: 0 })
    expect(result.curseProtection?.immune).toBe(false)
  })
  it('blockiert bedingte Maim-Schutzzeilen ohne belegten Laufzeitzustand', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['conditional-maim', 'conditional-deflect-maim']) })
    expect(result.status).toBe('partial-blocked-special-cases')
    expect(result.blockedLines).toEqual(expect.arrayContaining(['Immune to Maim while Shapeshifted', 'Deflected Hits cannot inflict Maim on you']))
    expect(result.secondaryDebuffProtection?.maim.immune).toBe(false)
  })
  it('wendet allgemeine, elementare und einzelne Dauer in PoB2-Reihenfolge an', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['debuff-expiry-a', 'ailment-duration', 'elemental-duration', 'shock-duration', 'bleed-duration', 'blind-duration']) })
    expect(result.debuffDurationOnSelf).toEqual({
      debuffExpirationRate: 20,
      debuffDurationMultiplierPercent: 83.333333,
      blindPercent: 62.5,
      ailments: { ignite: 62.5, chill: 62.5, freeze: 62.5, shock: 41.666667, scorch: 62.5, brittle: 62.5, sap: 62.5, bleed: 41.666667, poison: 75 },
    })
  })
  it('addiert mehrere Raten fuer schnelleres Ablaufen statt Prozentwerte direkt abzuziehen', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['debuff-expiry-a', 'debuff-expiry-b']) })
    expect(result.debuffDurationOnSelf?.debuffExpirationRate).toBe(30)
    expect(result.debuffDurationOnSelf?.debuffDurationMultiplierPercent).toBe(76.923077)
    expect(result.debuffDurationOnSelf?.ailments.ignite).toBe(76.923077)
  })
  it('verrechnet technisch bestaetigte Gegenstandswerte fuer Beeintraechtigungsdauer', () => {
    const durationEquipment: EquipmentEntry[] = [{ id: 'body', slotId: 'slot-body-armour', modifierValues: [{ id: 'duration', modifierId: 'duration', value: 0, statValues: [
      { statId: 'self_elemental_status_duration_-%', value: 15 }, { statId: 'base_self_shock_duration_-%', value: 40 },
      { statId: 'self_bleed_duration_+%', value: -50 }, { statId: 'self_poison_duration_+%', value: -45 },
    ] }] }]
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: durationEquipment, weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning([]) })
    expect(result.debuffDurationOnSelf?.ailments).toEqual({ ignite: 85, chill: 85, freeze: 85, shock: 45, scorch: 85, brittle: 85, sap: 85, bleed: 50, poison: 55 })
  })
  it('begrenzt negative Dauern bei null', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['shock-duration-overcap']) })
    expect(result.debuffDurationOnSelf?.ailments.shock).toBe(0)
  })
  it('blockiert bedingte Dauermodifikatoren ohne bestaetigten Zustand', () => {
    const result = resolveCharacterSurvivabilityModel({ classId: 'class-official-1', characterLevel: 10, equipment: [], weaponSet: 'set-1', passiveTree: tree, realPassivePlanning: planning(['conditional-shock-duration']) })
    expect(result.status).toBe('partial-blocked-special-cases')
    expect(result.blockedLines).toContain('25% reduced Shock Duration on you while on Low Life')
    expect(result.debuffDurationOnSelf?.ailments.shock).toBe(100)
  })
})
