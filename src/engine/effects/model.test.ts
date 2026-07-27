import { describe, expect, it } from 'vitest'
import { analyzeBuild } from '../orchestration/analyze-build'
import { engineCandidatesFixture, engineModifierFixtures, fixtureA, syntheticInput } from '../fixtures'
import { createBuildEffectModel } from './model'

const context = { engineVersion: 'effect-model-test', fixtureMode: true as const }

describe('einheitliches Build-Wirkungsmodell', () => {
  it('trennt tatsächlichen Waffenschaden strikt von defensiven Gegenstandswerten', () => {
    const input = syntheticInput([])
    input.equipment = [{
      id: 'weapon',
      slotId: 'slot-weapon-set-1-left',
      itemClassId: 'Spears',
      modifierValues: [],
      weaponStats: {
        physicalDamage: { minimum: 40, maximum: 80 },
        attacksPerSecond: 1.5,
        criticalHitChance: 6,
      },
      defences: { armour: 500 },
    }]
    input.skillSetups = [{ id: 'main', skillId: 'fixture-main', role: 'main', weaponSet: 'set-1', supportGemIds: [] }]
    input.character.desiredMainSkillId = 'fixture-main'
    const result = createBuildEffectModel({
      input,
      skills: engineCandidatesFixture.skills,
      supports: engineCandidatesFixture.supports,
      modifiers: engineModifierFixtures,
      buildProfile: analyzeBuild({ input, candidates: engineCandidatesFixture }, context, engineModifierFixtures).buildProfile,
    })
    expect(result.offenceEffects).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'base-damage', tags: ['attack', 'physical'], range: { minimum: 40, maximum: 80 } }),
      expect.objectContaining({ kind: 'speed', value: 1.5 }),
    ]))
    expect(result.defenceEffects).toEqual([])
    expect(result.offenceEffects.some(effect => effect.value === 500)).toBe(false)
  })

  it('blockiert angezeigte Rüstungswerte auf einer Waffenklasse im Equipment Analyzer', () => {
    const input = syntheticInput([])
    input.equipment = [{ id: 'wand', slotId: 'slot-weapon-set-1-left', itemClassId: 'Wands', modifierValues: [], defences: { energyShield: 900 } }]
    const result = analyzeBuild({ input, candidates: engineCandidatesFixture }, context, engineModifierFixtures)
    expect(result.buildProfile.defence.energyShieldAffinity).toBe(0)
    expect(result.warnings.map(value => value.code)).toContain('weapon-cannot-provide-displayed-defences')
  })

  it('verwendet nur kompatible Supports als produktive Wirkung', () => {
    const request = structuredClone(fixtureA)
    request.input.character.desiredMainSkillId = 'fixture-main'
    request.input.skillSetups = [{
      id: 'main',
      skillId: 'fixture-main',
      role: 'main',
      weaponSet: 'set-1',
      supportGemIds: ['fixture-support-lightning', 'fixture-support-cold-spell'],
    }]
    const result = analyzeBuild(request, context, engineModifierFixtures).effectModel!
    expect(result.effects.find(effect => effect.sourceId === 'fixture-support-lightning')).toMatchObject({
      productive: true,
      kind: 'compatibility',
    })
    expect(result.effects.find(effect => effect.sourceId === 'fixture-support-cold-spell')).toMatchObject({
      productive: false,
      kind: 'restriction',
    })
  })

  it('führt Schadensarten nicht ohne bestätigte Umwandlung zusammen', () => {
    const request = structuredClone(fixtureA)
    request.input.character.desiredMainSkillId = 'fixture-main'
    request.input.skillSetups = [{ id: 'main', skillId: 'fixture-main', role: 'main', weaponSet: 'set-1', supportGemIds: [] }]
    const result = analyzeBuild(request, context, engineModifierFixtures).effectModel!
    expect(result.activeDamageTypes).toEqual(['lightning'])
    expect(result.effects.filter(effect => effect.kind === 'conversion')).toEqual([])
    expect(result.warnings).toContain('Keine bestätigte Schadensumwandlung vorhanden; Schadensarten werden nicht automatisch miteinander verrechnet.')
    expect(result.scalingAdvice.some(value => value.startsWith('Feuerschaden'))).toBe(false)
  })

  it('übernimmt ausschließlich eine technisch bestätigte Schadensumwandlung', () => {
    const request = structuredClone(fixtureA)
    request.input.equipment = [{
      id: 'ring',
      slotId: 'slot-ring-left',
      itemClassId: 'Rings',
      modifierValues: [{
        id: 'conversion',
        modifierId: 'confirmed-conversion',
        value: 25,
        statValues: [{ statId: 'physical_damage_%_to_convert_to_fire', value: 25 }],
      }],
    }]
    request.input.character.desiredMainSkillId = 'fixture-main'
    request.input.skillSetups = [{ id: 'main', skillId: 'fixture-main', role: 'main', weaponSet: 'set-1', supportGemIds: [] }]
    const result = analyzeBuild(request, context, engineModifierFixtures).effectModel!
    expect(result.offenceEffects).toContainEqual(expect.objectContaining({
      kind: 'conversion',
      conversion: { from: 'physical', to: 'fire', percent: 25 },
      evidence: 'structured-exact',
      productive: true,
    }))
    expect(result.warnings).not.toContain('Keine bestätigte Schadensumwandlung vorhanden; Schadensarten werden nicht automatisch miteinander verrechnet.')
  })

  it('liefert bei identischer Eingabe eine deterministisch identische Wirkungskette', () => {
    const first = analyzeBuild(fixtureA, context, engineModifierFixtures).effectModel
    const second = analyzeBuild(fixtureA, context, engineModifierFixtures).effectModel
    expect(second).toEqual(first)
  })
})
