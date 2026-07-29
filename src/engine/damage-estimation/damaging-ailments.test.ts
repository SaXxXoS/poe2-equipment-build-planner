import { describe, expect, it } from 'vitest'
import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain'
import { collectDamagingAilments } from './damaging-ailments'

const record = (name: string) => {
  const value = reference.skills.find(skill => skill.name === name)
  if (!value) throw new Error(`Testreferenz fehlt: ${name}`)
  return value
}
const setup = (supportGemIds: string[] = []): SkillSetup => ({
  id: 'setup',
  skillId: 'skill',
  role: 'main',
  weaponSet: 'set-1',
  supportGemIds,
})
const support = (id: string, nameEn: string): SupportGemDefinition => ({
  id,
  nameEn,
  displayNameDe: nameEn,
  tags: [],
  dataVersion: 'test',
  source: 'local-placeholder',
  status: 'verified',
  requiredTags: [],
  excludedTags: [],
  ownTags: [],
})

describe('belegte schädigende Zustände', () => {
  it('berechnet Rakes garantierte Blutung mit PoB2-Grundwert und Effekt', () => {
    const result = collectDamagingAilments({
      skill: record('Rake'),
      components: [{ type: 'physical', minimum: 100, maximum: 200 }],
      actionsPerSecond: 1,
      hitChancePercent: 100,
      setup: setup(),
      supports: [],
    })
    expect(result.effects).toEqual([expect.objectContaining({
      kind: 'bleeding',
      chancePercent: 100,
      durationMs: 5000,
      maximumStacks: 1,
      expectedActiveStacks: 1,
      effectMultiplier: 2,
      damagePerSecond: 55,
      totalDamagePerApplication: 275,
    })])
  })

  it('wendet die vollständig belegte passive Aggravation mit Dauer und Magnitude gemeinsam an', () => {
    const result = collectDamagingAilments({
      skill: record('Rake'),
      components: [{ type: 'physical', minimum: 100, maximum: 200 }],
      actionsPerSecond: 1,
      hitChancePercent: 100,
      setup: setup(),
      supports: [],
      bleedingPassiveEffect: {
        aggravated: true,
        durationMs: 1000,
        magnitudeMultiplier: 1.5,
        aggravatedMultiplier: reference.ailmentConstants.bloodstainedMultiplierWhenMovingOrBleedingAggravated,
        sourceReferences: ['passive-node:test'],
      },
    })
    expect(result.effects).toEqual([expect.objectContaining({
      kind: 'bleeding',
      aggravated: true,
      durationMs: 1000,
      expectedActiveStacks: 1,
      effectMultiplier: 6,
      damagePerSecond: 135,
      totalDamagePerApplication: 135,
    })])
  })

  it('übernimmt belegte Giftchance, Effekt, Dauer und Zusatzstapel aus ausgewählten Supports', () => {
    const supports = [
      support('poison', 'Poison I'),
      support('deadly', 'Deadly Poison I'),
      support('stacks', 'Escalating Poison'),
    ]
    const result = collectDamagingAilments({
      skill: record('Arc'),
      components: [
        { type: 'physical', minimum: 100, maximum: 100 },
        { type: 'chaos', minimum: 50, maximum: 50 },
        { type: 'lightning', minimum: 999, maximum: 999 },
      ],
      actionsPerSecond: 2,
      hitChancePercent: 100,
      setup: setup(supports.map(value => value.id)),
      supports,
    })
    expect(result.effects).toEqual([expect.objectContaining({
      kind: 'poison',
      chancePercent: 40,
      durationMs: 1600,
      maximumStacks: 2,
      expectedActiveStacks: 1.28,
      effectMultiplier: 1.75,
      damagePerSecond: 67.2,
    })])
  })

  it('berechnet Entzünden mit der gepinnten levelabhängigen PoB2-Gegnerschwelle', () => {
    const result = collectDamagingAilments({
      skill: record('Molten Blast'),
      components: [{ type: 'fire', minimum: 100, maximum: 200 }],
      actionsPerSecond: 1,
      hitChancePercent: 100,
      enemyLevel: 1,
      setup: setup(),
      supports: [],
    })
    expect(result.effects).toEqual([expect.objectContaining({
      kind: 'ignite',
      chancePercent: 100,
      durationMs: 4000,
      maximumStacks: 1,
      expectedActiveStacks: 1,
      damagePerSecond: 30,
      totalDamagePerApplication: 120,
    })])
    expect(result.blockedEffects).toEqual([])
  })

  it('blockiert Entzünden weiterhin ohne Gegnerlevel', () => {
    const result = collectDamagingAilments({
      skill: record('Molten Blast'),
      components: [{ type: 'fire', minimum: 100, maximum: 200 }],
      actionsPerSecond: 1,
      hitChancePercent: 100,
      setup: setup(),
      supports: [],
    })
    expect(result.effects).toEqual([])
    expect(result.blockedEffects).toEqual([expect.objectContaining({
      kind: 'ignite',
      status: 'blocked',
    })])
  })

  it('gewichtet Entzünden aus normalen und kritischen Treffern nach der gepinnten PoB2-Formel', () => {
    const result = collectDamagingAilments({
      skill: record('Molten Blast'),
      components: [{ type: 'fire', minimum: 1000, maximum: 1000 }],
      actionsPerSecond: 1,
      hitChancePercent: 100,
      criticalChancePercent: 50,
      criticalHitDamageMultiplier: 2,
      enemyLevel: 50,
      setup: setup(),
      supports: [],
    })
    const ignite = result.effects[0]
    expect(ignite).toMatchObject({
      kind: 'ignite',
      chanceOnHitPercent: 17.51,
      chanceOnCriticalHitPercent: 35.03,
      chancePercent: 26.27,
      ailmentCriticalChancePercent: 51.73,
      weightedSourceDamage: 1666.67,
      damagePerSecond: 333.33,
      totalDamagePerApplication: 1333.33,
    })
    expect(ignite.sourceReferences).toContain('CalcOffence.calcAilmentDamage')
    expect(ignite.sourceReferences).toContain('CalcOffence.ailmentCritChance')
  })

  it('wendet gegnerischen Feuerwiderstand auf Entzünden an, aber keine Trefferpenetration', () => {
    const result = collectDamagingAilments({
      skill: record('Molten Blast'),
      components: [{ type: 'fire', minimum: 100, maximum: 200 }],
      actionsPerSecond: 1,
      hitChancePercent: 100,
      enemyLevel: 1,
      enemyProfile: {
        id: 'target',
        label: 'Ziel',
        source: 'manual-comparison-profile',
        resistances: { fire: 50 },
        penetration: { fire: 20 },
      },
      setup: setup(),
      supports: [],
    })
    expect(result.effects[0]).toMatchObject({
      kind: 'ignite',
      damagePerSecond: 30,
      damagePerSecondAfterMitigation: 15,
    })
  })

  it('blockiert Angriffs-Zustände ohne belegte Trefferchance', () => {
    const result = collectDamagingAilments({
      skill: record('Rake'),
      components: [{ type: 'physical', minimum: 100, maximum: 200 }],
      actionsPerSecond: 1,
      setup: setup(),
      supports: [],
    })
    expect(result.effects).toEqual([])
    expect(result.blockedEffects).toEqual([expect.objectContaining({
      kind: 'bleeding',
      status: 'blocked',
    })])
  })
})
