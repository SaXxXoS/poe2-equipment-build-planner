import { describe, expect, it } from 'vitest'
import type { SkillGemDefinition } from '../../domain'
import type { SupportGemDefinition } from '../../domain'
import {
  evaluateSkillInteraction,
  evaluateSkillWeaponCompatibility,
  evaluateSupportInteraction,
} from './poe2-interaction-rules'

const skill = (
  id: string,
  nameEn: string,
  tags: SkillGemDefinition['tags'],
  extra: Partial<SkillGemDefinition> = {},
): SkillGemDefinition => ({
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

describe('zentrale PoE2-Interaktionsregeln', () => {
  it('blockiert eine Waffe, die die strukturierte Skillanforderung nicht erfüllt', () => {
    const bowSkill = skill('bow-skill', 'Bow Skill', ['attack', 'projectile'], {
      requiredWeaponTypes: ['bow'],
    })
    expect(evaluateSkillWeaponCompatibility(bowSkill, 'bow')).toMatchObject({
      status: 'productive',
      evidence: 'structured-exact',
    })
    expect(evaluateSkillWeaponCompatibility(bowSkill, 'mace')).toMatchObject({
      status: 'blocked',
      ruleId: 'skill-weapon.required-missing',
    })
  })

  it('lässt nur der Fertigkeit strukturiert zugeordnete importierte Supports zu', () => {
    const support = {
      id: 'support',
      displayNameDe: 'Support',
      dataVersion: 'test',
      source: 'local-placeholder',
      status: 'placeholder',
      tags: [],
      requiredTags: [],
      excludedTags: [],
      ownTags: [],
      selectionOnly: true,
      enabled: true,
    } satisfies SupportGemDefinition
    const main = skill('main', 'Main', ['spell'], {
      recommendedSupportIds: ['support'],
    })
    expect(evaluateSupportInteraction(main, support, 'wand')).toMatchObject({
      status: 'productive',
      evidence: 'structured-exact',
    })
    expect(evaluateSupportInteraction(
      { ...main, recommendedSupportIds: ['different-support'] },
      support,
      'wand',
    )).toMatchObject({ status: 'blocked' })
  })

  it('wertet gleiche Schadens-Tags nicht als produktive Beziehung', () => {
    const main = skill('spark', 'Spark', ['spell', 'projectile', 'lightning'])
    const candidate = skill('other', 'Other Lightning Spell', ['spell', 'area', 'lightning'], {
      rotationRoles: ['setup'],
    })
    expect(evaluateSkillInteraction(main, candidate)).toMatchObject({
      status: 'audit-only',
      evidence: 'heuristic-only',
      score: 0,
      ruleId: 'interaction.shared-tags-not-proof',
    })
  })

  it('behandelt mehrere unterstützte Schadensarten und Mechaniken als erlaubte Alternativen', () => {
    const elementalArea = {
      id: 'elemental-area',
      displayNameDe: 'Elementarer Flächensupport',
      dataVersion: 'test',
      source: 'local-placeholder',
      status: 'placeholder',
      tags: [],
      requiredTags: [],
      excludedTags: [],
      ownTags: [],
      supportedDamageTypes: ['fire', 'cold', 'lightning'],
      supportedMechanics: ['area', 'projectile'],
      enabled: true,
    } satisfies SupportGemDefinition
    expect(evaluateSupportInteraction(
      skill('fire-area', 'Fire Area', ['spell', 'area', 'fire']),
      elementalArea,
      'wand',
    )).toMatchObject({ status: 'productive' })
    expect(evaluateSupportInteraction(
      skill('physical-melee', 'Physical Melee', ['attack', 'melee', 'physical']),
      elementalArea,
      'mace',
    )).toMatchObject({ status: 'blocked' })
  })

  it('belegt Kugel der Stürme nur für einen Blitzzauber', () => {
    const orb = skill('orb', 'Orb of Storms', ['spell', 'area', 'lightning'])
    expect(evaluateSkillInteraction(
      skill('spark', 'Spark', ['spell', 'projectile', 'lightning']),
      orb,
    )).toMatchObject({ status: 'productive', evidence: 'explicit-rule', weaponSet: 'set-2' })
    expect(evaluateSkillInteraction(
      skill('flameblast', 'Flameblast', ['spell', 'area', 'fire']),
      orb,
    )).toMatchObject({ status: 'blocked' })
  })

  it('belegt Elementarschwäche für Feuer, Kälte und Blitz', () => {
    const weakness = skill('weakness', 'Elemental Weakness', ['spell', 'debuff'])
    for (const damageType of ['fire', 'cold', 'lightning'] as const) {
      expect(evaluateSkillInteraction(
        skill(`main-${damageType}`, 'Main', ['spell', damageType]),
        weakness,
      )).toMatchObject({ status: 'productive', weaponSet: 'set-2' })
    }
  })

  it('verlangt für generisches Set-2-Setup anhaltende strukturierte Wirkung', () => {
    const main = skill('main', 'Main', ['attack', 'physical'])
    const incomplete = skill('incomplete', 'Incomplete Setup', ['debuff'], {
      rotationRoles: ['setup'],
      persistsAfterWeaponSwap: true,
    })
    const complete = skill('complete', 'Complete Setup', ['debuff'], {
      rotationRoles: ['setup'],
      persistsAfterWeaponSwap: true,
      affectsTarget: true,
    })
    expect(evaluateSkillInteraction(main, incomplete)).toMatchObject({ status: 'audit-only' })
    expect(evaluateSkillInteraction(main, complete)).toMatchObject({
      status: 'productive',
      evidence: 'structured-derived',
      weaponSet: 'set-2',
    })
  })
})
