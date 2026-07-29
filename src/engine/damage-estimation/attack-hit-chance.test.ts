import { describe, expect, it } from 'vitest'
import type { EquipmentEntry } from '../../domain'
import { monsterEvasionAtLevel, poe2HitChance, resolveAttackHitChance } from './attack-hit-chance'

const item = (
  id: string,
  slotId: string,
  stats: Array<{ statId: string; value: number }>,
  isLocal = false,
): EquipmentEntry => ({
  id,
  slotId,
  modifierValues: [{ id: `${id}-modifier`, modifierId: `${id}-modifier`, value: 0, isLocal, statValues: stats }],
})

describe('PoB2-Angriffstrefferchance', () => {
  it('verwendet die gepinnte PoB2-Formel mit Rundung und Grenzen', () => {
    expect(poe2HitChance(1000, 1000)).toBe(96)
    expect(poe2HitChance(0, 1000)).toBe(5)
    expect(poe2HitChance(-1, 1000)).toBe(5)
    expect(poe2HitChance(1000, 0)).toBe(100)
  })

  it('verwendet die gepinnte Gegner-Ausweichtabelle', () => {
    expect(monsterEvasionAtLevel(1)).toBe(24)
    expect(monsterEvasionAtLevel(80)).toBe(905)
    expect(monsterEvasionAtLevel(100)).toBe(1304)
  })

  it('berechnet Level-, Klassen-, Attribut- und Genauigkeitswerte reproduzierbar', () => {
    const result = resolveAttackHitChance({
      characterLevel: 80,
      characterClassId: 'class-official-8',
      activeSet: 'set-1',
      equipment: [
        item('global', 'slot-helmet', [
          { statId: 'additional_dexterity', value: 10 },
          { statId: 'accuracy_rating', value: 100 },
          { statId: 'accuracy_rating_+%', value: 20 },
        ]),
      ],
    })
    expect(result).toMatchObject({
      status: 'exact',
      baseAccuracyFromLevel: 474,
      baseDexterity: 15,
      additionalDexterity: 10,
      accuracyFromDexterity: 150,
      flatAccuracy: 100,
      increasedAccuracyPercent: 20,
      playerAccuracy: 868,
      enemyLevel: 80,
      enemyEvasion: 905,
      hitChancePercent: 95,
    })
  })

  it('wendet lokale Genauigkeit ausschließlich auf das aktive Waffenset an', () => {
    const equipment = [
      item('set-1', 'slot-weapon-set-1-left', [{ statId: 'accuracy_rating', value: 500 }], true),
      item('set-2', 'slot-weapon-set-2-left', [{ statId: 'accuracy_rating', value: 1000 }], true),
    ]
    const set1 = resolveAttackHitChance({ characterLevel: 80, characterClassId: 'class-official-6', activeSet: 'set-1', equipment })
    const set2 = resolveAttackHitChance({ characterLevel: 80, characterClassId: 'class-official-6', activeSet: 'set-2', equipment })
    expect(set1.flatAccuracy).toBe(500)
    expect(set2.flatAccuracy).toBe(1000)
    expect(set2.playerAccuracy).toBeGreaterThan(set1.playerAccuracy!)
  })

  it('blockiert ohne belegtes Level oder bekannte Klasse', () => {
    expect(resolveAttackHitChance({ characterClassId: 'class-official-8', activeSet: 'set-1', equipment: [] }).status)
      .toBe('blocked-missing-character-level')
    expect(resolveAttackHitChance({ characterLevel: 80, characterClassId: 'unknown', activeSet: 'set-1', equipment: [] }).status)
      .toBe('blocked-unknown-class')
  })
})
