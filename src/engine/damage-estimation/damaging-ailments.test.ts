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

  it('gewichtet auch Blutung aus normalen und kritischen Treffern nach der PoB2-Quellschadensformel', () => {
    const result = collectDamagingAilments({
      skill: record('Rake'),
      components: [{ type: 'physical', minimum: 100, maximum: 200 }],
      actionsPerSecond: 1,
      hitChancePercent: 100,
      criticalChancePercent: 50,
      criticalHitDamageMultiplier: 2,
      setup: setup(),
      supports: [],
    })
    expect(result.effects[0]).toMatchObject({
      kind: 'bleeding',
      chanceOnHitPercent: 100,
      chanceOnCriticalHitPercent: 100,
      ailmentCriticalChancePercent: 96.88,
      weightedSourceDamage: 275,
      damagePerSecond: 82.5,
      totalDamagePerApplication: 412.5,
    })
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

  it('berechnet Entzünden mit der gepinnten Schwelle und der skill-eigenen Dauer', () => {
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
      durationMs: 8000,
      maximumStacks: 1,
      expectedActiveStacks: 1,
      damagePerSecond: 30,
      totalDamagePerApplication: 240,
    })])
    expect(result.blockedEffects).toEqual([])
  })

  it('wendet schneller verursachten Schaden auf DPS und Dauer invers an, ohne den Gesamtschaden zu verändern', () => {
    const result = collectDamagingAilments({
      skill: record('Molten Blast'),
      components: [{ type: 'fire', minimum: 100, maximum: 200 }],
      actionsPerSecond: 1,
      hitChancePercent: 100,
      enemyLevel: 1,
      setup: setup(),
      supports: [],
      rateEffects: {
        fasterPercent: { bleeding: 0, poison: 0, ignite: 50 },
        slowerPercent: { bleeding: 0, poison: 0, ignite: 0 },
        sourceReferences: { bleeding: [], poison: [], ignite: ['passive-node:test-ignite-rate'] },
      },
    })
    expect(result.effects[0]).toMatchObject({
      kind: 'ignite',
      damagePerSecond: 45,
      totalDamagePerApplication: 240,
      rateMultiplier: 1.5,
    })
    expect(result.effects[0].durationMs).toBeCloseTo(5333.33, 2)
    expect(result.effects[0].sourceReferences).toContain('passive-node:test-ignite-rate')
  })

  it('verbindet belegte Ignite-Dauer und -Magnitude aus ausgewählten Supports', () => {
    const supports = [
      support('duration', 'Eternal Flame I'),
      support('magnitude', 'Searing Flame I'),
    ]
    const result = collectDamagingAilments({
      skill: record('Molten Blast'),
      components: [{ type: 'fire', minimum: 100, maximum: 200 }],
      actionsPerSecond: 1,
      hitChancePercent: 100,
      enemyLevel: 1,
      setup: setup(supports.map(value => value.id)),
      supports,
    })
    expect(result.effects[0]).toMatchObject({
      kind: 'ignite',
      durationMs: 16000,
      effectMultiplier: 1.75,
      damagePerSecond: 52.5,
      totalDamagePerApplication: 840,
    })
    expect(result.effects[0].sourceReferences).toEqual(expect.arrayContaining([
      'active_skill_ignite_duration_+%_final',
      'ignite_duration_+%',
      'support_stronger_ignites_ignite_effect_+%_final',
    ]))
  })

  it('wendet belegte Swift-Affliction-Dauer auf schädigende Zustände an', () => {
    const supports = [
      support('poison', 'Poison I'),
      support('swift', 'Swift Affliction I'),
    ]
    const result = collectDamagingAilments({
      skill: record('Arc'),
      components: [{ type: 'chaos', minimum: 100, maximum: 100 }],
      actionsPerSecond: 1,
      hitChancePercent: 100,
      setup: setup(supports.map(value => value.id)),
      supports,
    })
    expect(result.effects[0]).toMatchObject({
      kind: 'poison',
      durationMs: 1600,
      maximumStacks: 1,
      expectedActiveStacks: 0.64,
      damagePerSecond: 12.8,
    })
    expect(result.effects[0].sourceReferences).toContain(
      'support_swift_affliction_skill_effect_and_damaging_ailment_duration_+%_final',
    )
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
      ailmentCriticalChancePercent: 76.7,
      weightedSourceDamage: 1666.67,
      damagePerSecond: 333.33,
      totalDamagePerApplication: 2666.67,
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

  it('wendet erhöhten erlittenen Chaosschaden auf Gift nach dem Widerstand an', () => {
    const result = collectDamagingAilments({
      skill: record('Arc'),
      components: [{ type: 'chaos', minimum: 100, maximum: 100 }],
      actionsPerSecond: 1, hitChancePercent: 100, enemyLevel: 1,
      enemyProfile: {
        id: 'withered-target', label: 'Withered-Ziel', source: 'manual-comparison-profile',
        resistances: { chaos: 25 }, damageTakenIncreased: { chaos: 60 },
      },
      setup: setup(['poison']), supports: [support('poison', 'Poison I')],
    })
    expect(result.effects[0]).toMatchObject({kind:'poison',damagePerSecond:16,damagePerSecondAfterMitigation:19.2})
  })

  it('trennt eine exakt belegte kritische Giftchance von der normalen Trefferchance', () => {
    const supports = [support('poison', 'Poison I')]
    const result = collectDamagingAilments({
      skill: record('Arc'),
      components: [{ type: 'chaos', minimum: 100, maximum: 100 }],
      actionsPerSecond: 1,
      hitChancePercent: 100,
      criticalChancePercent: 50,
      criticalHitDamageMultiplier: 2,
      poisonChanceOnCriticalHitPercent: 100,
      conditionalAilmentSourceReferences: ['pob2:test:critical-poison'],
      setup: setup(['poison']),
      supports,
    })
    expect(result.effects[0]).toMatchObject({
      kind: 'poison',
      chanceOnHitPercent: 40,
      chanceOnCriticalHitPercent: 100,
      chancePercent: 70,
      expectedActiveStacks: 1,
      weightedSourceDamage: 171.43,
    })
    expect(result.effects[0].sourceReferences).toContain('pob2:test:critical-poison')
  })

  it('verschärft bei exakter Unique-Bedingung nur Blutung aus kritischen Angriffstreffern', () => {
    const result = collectDamagingAilments({
      skill: record('Rake'),
      components: [{ type: 'physical', minimum: 100, maximum: 100 }],
      actionsPerSecond: 1,
      hitChancePercent: 100,
      criticalChancePercent: 50,
      criticalHitDamageMultiplier: 2,
      aggravateBleedingOnCriticalAttack: true,
      conditionalAilmentSourceReferences: ['pob2:test:critical-aggravation'],
      setup: setup(),
      supports: [],
    })
    expect(result.effects[0]).toMatchObject({
      kind: 'bleeding',
      aggravated: true,
      weightedSourceDamage: 250,
      damagePerSecond: 75,
      totalDamagePerApplication: 375,
    })
    expect(result.effects[0].sourceReferences).toContain('pob2:test:critical-aggravation')
  })

  it('wendet die kritische Angriffs-Aggravation nicht auf Zaubertreffer an', () => {
    const result = collectDamagingAilments({
      skill: { ...record('Rake'), kind: 'spell' },
      components: [{ type: 'physical', minimum: 100, maximum: 100 }],
      actionsPerSecond: 1,
      hitChancePercent: 100,
      criticalChancePercent: 50,
      criticalHitDamageMultiplier: 2,
      aggravateBleedingOnCriticalAttack: true,
      setup: setup(),
      supports: [],
    })
    expect(result.effects[0]).toMatchObject({
      kind: 'bleeding',
      weightedSourceDamage: 150,
      damagePerSecond: 45,
    })
    expect(result.effects[0].aggravated).toBeUndefined()
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
