import { describe, expect, it } from 'vitest'
import type { SkillGemDefinition } from '../../domain'
import { buildAssistantCandidates } from '../build-assistant-v1'
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

  it('verknüpft Kugel der Stürme nicht mit einem Feuerzauber', () => {
    const flameblast = skill('flameblast', 'Flameblast', ['spell', 'area', 'fire'])
    const orb = skill('orb', 'Orb of Storms', ['spell', 'area', 'lightning'])
    expect(planSynergisticSkills(flameblast, [flameblast, orb], [], 8)).toEqual([])
  })

  it('plant einen passenden Fluch als Set-2-Vorbereitung', () => {
    const flameblast = skill('flameblast', 'Flameblast', ['spell', 'area', 'fire'])
    const weakness = skill('weakness', 'Elemental Weakness', ['spell', 'fire', 'cold', 'debuff'])
    expect(planSynergisticSkills(flameblast, [flameblast, weakness], [], 8)[0]).toMatchObject({
      skillId: 'weakness',
      weaponSet: 'set-2',
    })
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

  it('nutzt ein mehrfach beobachtetes lokales Meta-Paket nur für dieselbe Aszendenz', () => {
    const main = skill('skyfall', 'Skyfall', ['spell', 'cold'])
    const trigger = skill('cast-on-critical', 'Cast on Critical', ['spell'], {
      sourceTags: ['meta', 'trigger'],
    })
    expect(planSynergisticSkills(main, [main, trigger], [], 8, {
      ascendancyId: 'ascendancy-official-Witch1',
    })[0]).toMatchObject({
      skillId: 'cast-on-critical',
      evidence: 'multi-profile-correlated-exact',
    })
    expect(planSynergisticSkills(main, [main, trigger], [], 8, {
      ascendancyId: 'ascendancy-official-Ranger1',
    })).toEqual([])
  })

  it('findet im produktiven Katalog für Blitz und Feuer jeweils eine verbundene Set-2-Vorbereitung', () => {
    const spark = buildAssistantCandidates.skills.find(value => value.nameEn === 'Spark')!
    const flameblast = buildAssistantCandidates.skills.find(value => value.nameEn === 'Flameblast')!
    const sparkPlan = planSynergisticSkills(spark, buildAssistantCandidates.skills, [], 8)
    const firePlan = planSynergisticSkills(flameblast, buildAssistantCandidates.skills, [], 8)
    expect(sparkPlan[0]).toMatchObject({ weaponSet: 'set-2' })
    expect(buildAssistantCandidates.skills.find(value => value.id === sparkPlan[0].skillId)?.nameEn).toBe('Orb of Storms')
    expect(firePlan[0]).toMatchObject({ weaponSet: 'set-2' })
    expect(buildAssistantCandidates.skills.find(value => value.id === firePlan[0].skillId)?.nameEn).toBe('Elemental Weakness')
  })
})
