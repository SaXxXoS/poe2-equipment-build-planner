import { describe, expect, it } from 'vitest'
import type { SkillGemDefinition } from '../../domain'
import { planSynergisticSkills } from './synergy-planner'

const skill = (id: string, nameEn: string, tags: SkillGemDefinition['tags'], extra: Partial<SkillGemDefinition> = {}): SkillGemDefinition => ({
  id,
  nameEn,
  displayNameDe: nameEn,
  dataVersion: 'test',
  source: 'local-placeholder',
  status: 'placeholder',
  tags,
  enabled: true,
  ...extra,
})

describe('zusammenhängende Skillplanung', () => {
  it('plant Orb of Storms als Set-2-Vorbereitung für Spark auf Set 1', () => {
    const spark = skill('spark', 'Spark', ['spell', 'projectile', 'lightning'])
    const orb = skill('orb', 'Orb of Storms', ['spell', 'area', 'lightning'], {
      rotationRoles: ['setup'],
      persistsAfterWeaponSwap: true,
      preferredWeaponSet: 'set-2',
    })
    expect(planSynergisticSkills(spark, [spark, orb], [], 8)[0]).toMatchObject({
      skillId: 'orb',
      role: 'utility',
      weaponSet: 'set-2',
    })
  })

  it('füllt keine unverbundene zweite Schadensfertigkeit ein', () => {
    const spark = skill('spark', 'Spark', ['spell', 'projectile', 'lightning'])
    const unrelated = skill('fire-attack', 'Fire Attack', ['attack', 'melee', 'fire'])
    expect(planSynergisticSkills(spark, [spark, unrelated], [{ skillId: 'fire-attack', totalScore: 999, damageScore: 999 }], 8)).toEqual([])
  })

  it('lässt Slots leer, wenn keine belegte Synergie vorhanden ist', () => {
    const main = skill('main', 'Main', ['attack', 'physical'])
    expect(planSynergisticSkills(main, [main], [], 8)).toEqual([])
  })

  it('bleibt bei identischer Eingabe deterministisch', () => {
    const main = skill('main', 'Main', ['spell', 'lightning'])
    const candidates = [
      skill('move-b', 'Move B', ['movement']),
      skill('move-a', 'Move A', ['movement']),
    ]
    expect(planSynergisticSkills(main, [main, ...candidates], [], 8)).toEqual(planSynergisticSkills(main, [main, ...candidates], [], 8))
  })
})
