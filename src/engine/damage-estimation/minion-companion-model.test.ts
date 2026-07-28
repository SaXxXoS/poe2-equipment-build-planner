import { describe, expect, it } from 'vitest'
import type { SkillGemDefinition, SkillSetup } from '../../domain'
import { resolveMinionCompanionModel } from './minion-companion-model'

const skill = (id: string, nameEn: string): SkillGemDefinition => ({
  id,
  nameEn,
  displayNameDe: nameEn,
  tags: [],
  dataVersion: 'test',
  source: 'local-placeholder',
  status: 'verified',
})
const setup = (skillId: string, id = skillId): SkillSetup => ({
  id,
  skillId,
  role: 'main',
  weaponSet: 'both',
  supportGemIds: [],
})

describe('fail-closed Minion- und Begleitermodell', () => {
  it('erkennt eine Minion-Hauptfertigkeit, berechnet aber keinen erfundenen Schaden', () => {
    const raging = skill('raging', 'Raging Spirits')
    const model = resolveMinionCompanionModel({ primarySkill: raging, setups: [setup(raging.id)], skills: [raging] })
    expect(model.primarySkillMinion).toBe(true)
    expect(model.productive).toBe(false)
    expect(model.sources[0]).toMatchObject({
      sourceSkillId: raging.id,
      kind: 'minion',
      reservationRequired: true,
      status: 'blocked-missing-count-and-uptime',
    })
  })

  it('weist eine strukturierte Maximalanzahl aus, verwendet sie aber nicht als aktive Anzahl', () => {
    const unearth = skill('unearth', 'Unearth')
    const model = resolveMinionCompanionModel({ primarySkill: unearth, setups: [setup(unearth.id)], skills: [unearth] })
    expect(model.sources[0]).toMatchObject({
      maximumCount: 20,
      status: 'blocked-missing-offence',
    })
    expect(model.productive).toBe(false)
  })

  it('erfasst einen Offering-Bonus nur als unverknüpfte Unterstützungswirkung', () => {
    const arc = skill('arc', 'Arc')
    const offering = skill('offering', 'Pain Offering')
    const model = resolveMinionCompanionModel({
      primarySkill: arc,
      setups: [setup(arc.id), { ...setup(offering.id), id: 'offering', role: 'utility' }],
      skills: [arc, offering],
    })
    expect(model.sources[0]).toMatchObject({
      kind: 'offering',
      damageBonusPercent: 58,
      speedBonusPercent: 29,
      status: 'support-only',
    })
  })

  it('führt eine belegte Begleiterdauer getrennt auf', () => {
    const tame = skill('tame', 'Tame Beast')
    const model = resolveMinionCompanionModel({ primarySkill: tame, setups: [setup(tame.id)], skills: [tame] })
    expect(model.sources[0]).toMatchObject({
      kind: 'companion',
      durationMs: 11800,
    })
  })

  it('bleibt bei identischer Eingabe deterministisch', () => {
    const wolf = skill('wolf', 'Summon Wolf')
    const input = { primarySkill: wolf, setups: [setup(wolf.id)], skills: [wolf] }
    expect(resolveMinionCompanionModel(input)).toEqual(resolveMinionCompanionModel(input))
  })
})
