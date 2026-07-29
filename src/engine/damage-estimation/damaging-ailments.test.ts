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

  it('blockiert Entzünden ohne vollständige gegnerabhängige Schwellenkette', () => {
    const result = collectDamagingAilments({
      skill: record('Molten Blast'),
      components: [{ type: 'fire', minimum: 100, maximum: 200 }],
      actionsPerSecond: 1,
      setup: setup(),
      supports: [],
    })
    expect(result.effects).toEqual([])
    expect(result.blockedEffects).toEqual([expect.objectContaining({
      kind: 'ignite',
      status: 'blocked',
    })])
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
