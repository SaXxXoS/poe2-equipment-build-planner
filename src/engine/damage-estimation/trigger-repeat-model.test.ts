import { describe, expect, it } from 'vitest'
import type { SkillGemDefinition, SkillSetup } from '../../domain'
import { attachNormalizedTriggeredTargetDamage, resolveTriggerRepeatModel } from './trigger-repeat-model'

const skill = (id: string, nameEn: string): SkillGemDefinition => ({
  id, displayNameDe: nameEn, nameEn, tags: [], dataVersion: 'test', source: 'local-placeholder', status: 'verified',
})
const setup = (skillId: string, role: SkillSetup['role'] = 'secondary'): SkillSetup => ({
  id: `setup:${skillId}`, skillId, role, weaponSet: 'both', supportGemIds: [],
})

describe('Trigger- und Wiederholungsmodell', () => {
  it('blockiert eine eingebaute Triggerfertigkeit ohne belegte Auslöserkette', () => {
    const primary = skill('blood-explosion', 'Blood Explosion')
    const result = resolveTriggerRepeatModel({ primarySkill: primary, setups: [setup(primary.id, 'main')], skills: [primary] })
    expect(result.primarySkillTriggered).toBe(true)
    expect(result.productive).toBe(false)
    expect(result.sources[0]).toMatchObject({ kind: 'inbuilt-trigger', status: 'blocked-missing-trigger-source' })
  })

  it('erkennt Triggerable allein nicht als aktive Auslösung', () => {
    const primary = skill('arc', 'Arc')
    const result = resolveTriggerRepeatModel({ primarySkill: primary, setups: [setup(primary.id, 'main')], skills: [primary] })
    expect(result.primarySkillTriggered).toBe(false)
    expect(result.sources).toEqual([])
  })

  it('weist bei Cast on Critical die Bedingung aus, blockiert aber fehlendes Ziel und Intervall', () => {
    const primary = skill('arc', 'Arc')
    const trigger = skill('coc', 'Cast on Critical')
    const result = resolveTriggerRepeatModel({
      primarySkill: primary, setups: [setup(primary.id, 'main'), setup(trigger.id)], skills: [primary, trigger],
    })
    expect(result.sources[0]).toMatchObject({
      sourceSkillId: 'coc', kind: 'meta-trigger', condition: 'bei einem kritischen Treffer', status: 'blocked-missing-target',
    })
  })

  it('verknüpft eine eingebettete Fertigkeit als Triggerziel, ohne eine unbelegte Frequenz zu erfinden', () => {
    const primary = skill('arc', 'Arc')
    const trigger = skill('coc', 'Cast on Critical')
    const target = skill('comet', 'Comet')
    const triggerSetup = {
      ...setup(trigger.id),
      embeddedSkillIds: [target.id],
    }
    const result = resolveTriggerRepeatModel({
      primarySkill: primary,
      setups: [setup(primary.id, 'main'), triggerSetup],
      skills: [primary, trigger, target],
    })

    expect(result.sources[0]).toMatchObject({
      sourceSkillId: 'coc',
      targetSkillId: 'comet',
      kind: 'meta-trigger',
      condition: 'bei einem kritischen Treffer',
      status: 'blocked-missing-interval',
      energyRequirement: 100,
      baseEnergyPerEvent: 1,
      energyGenerationModifierPercent: 57,
      effectiveEnergyPerEventAtMonsterPowerOne: 1.57,
      eventsRequiredAtMonsterPowerOne: 64,
    })
    expect(result.sources[0]?.sourceReferences).toContain(
      'build-profile:setup:coc:embeddedSkillIds:comet',
    )
    expect(result.productive).toBe(false)
  })

  it('blockiert ein eingebettetes Angriffsziel, das die Triggeranforderung Spell und Triggerable nicht erfüllt', () => {
    const primary = skill('arc', 'Arc')
    const trigger = skill('coc', 'Cast on Critical')
    const target = skill('boneshatter', 'Boneshatter')
    const result = resolveTriggerRepeatModel({
      primarySkill: primary,
      setups: [
        setup(primary.id, 'main'),
        { ...setup(trigger.id), embeddedSkillIds: [target.id] },
      ],
      skills: [primary, trigger, target],
    })

    expect(result.sources[0]).toMatchObject({
      targetSkillId: 'boneshatter',
      status: 'blocked-incompatible-target',
    })
    expect(result.productive).toBe(false)
  })

  it('berechnet für Cast on Critical die kritische Ereignisrate und den normierten Energieaufbau', () => {
    const primary = skill('arc', 'Arc')
    const trigger = skill('coc', 'Cast on Critical')
    const target = skill('comet', 'Comet')
    const result = resolveTriggerRepeatModel({
      primarySkill: primary,
      setups: [
        setup(primary.id, 'main'),
        { ...setup(trigger.id), embeddedSkillIds: [target.id] },
      ],
      skills: [primary, trigger, target],
      primaryActionContext: {
        actionsPerSecond: 2,
        hitChancePercent: 80,
        criticalHitChancePercent: 25,
      },
    })

    expect(result.sources[0]).toMatchObject({
      status: 'normalized-event-rate-only',
      eventRatePerSecond: 0.4,
      energyPerSecondAtMonsterPowerOne: 0.628,
      triggerRatePerSecondAtMonsterPowerOne: 0.00628,
      secondsPerTriggerAtMonsterPowerOne: 159.235669,
    })
    expect(result.productive).toBe(false)
  })

  it('verbindet normierten Triggeraufbau mit Zielschaden und internem Schadensfaktor', () => {
    const primary = skill('arc', 'Arc')
    const trigger = skill('coc', 'Cast on Critical')
    const target = skill('comet', 'Comet')
    const energyModel = resolveTriggerRepeatModel({
      primarySkill: primary,
      setups: [
        setup(primary.id, 'main'),
        { ...setup(trigger.id), embeddedSkillIds: [target.id] },
      ],
      skills: [primary, trigger, target],
      primaryActionContext: {
        actionsPerSecond: 2,
        hitChancePercent: 80,
        criticalHitChancePercent: 25,
      },
    })
    const result = attachNormalizedTriggeredTargetDamage(
      energyModel,
      new Map([['comet', { expectedHitDamage: 1000, expectedHitDamageAfterMitigation: 750 }]]),
    )

    expect(result.sources[0]).toMatchObject({
      status: 'normalized-target-damage-only',
      targetDamageMultiplier: 0.8,
      targetExpectedHitDamage: 800,
      targetExpectedHitDamageAfterMitigation: 600,
      normalizedTriggeredDamagePerSecondAtMonsterPowerOne: 5.024,
      normalizedTriggeredDamagePerSecondAfterMitigationAtMonsterPowerOne: 3.768,
    })
    expect(result.productive).toBe(false)
  })

  it('berechnet Cast on Critical mit Monsterstärke, Rohkrit und Zustands-Schwelle produktiv', () => {
    const primary = skill('arc', 'Arc')
    const trigger = skill('coc', 'Cast on Critical')
    const target = skill('comet', 'Comet')
    const energyModel = resolveTriggerRepeatModel({
      primarySkill: primary,
      setups: [
        setup(primary.id, 'main'),
        { ...setup(trigger.id), embeddedSkillIds: [target.id] },
      ],
      skills: [primary, trigger, target],
      primaryActionContext: {
        actionsPerSecond: 2,
        hitChancePercent: 80,
        criticalHitChancePercent: 25,
        criticalHitDamageBeforeMitigation: 1000,
        monsterPower: 20,
        enemyAilmentThreshold: 100,
      },
    })
    const result = attachNormalizedTriggeredTargetDamage(
      energyModel,
      new Map([['comet', { expectedHitDamage: 1000, expectedHitDamageAfterMitigation: 750 }]]),
    )

    expect(result.sources[0]).toMatchObject({
      status: 'productive-target-damage',
      monsterPower: 20,
      enemyAilmentThreshold: 100,
      criticalHitDamageBeforeMitigation: 1000,
      ailmentThresholdRatio: 10,
      effectiveEnergyPerEvent: 314,
      eventRatePerSecond: 0.4,
      triggerRatePerSecond: 0.4,
      triggeredDamagePerSecond: 320,
      triggeredDamagePerSecondAfterMitigation: 240,
    })
    expect(result.productive).toBe(true)
  })

  it('behandelt eine unbekannte eingebettete ID nicht als belegtes Triggerziel', () => {
    const primary = skill('arc', 'Arc')
    const trigger = skill('coc', 'Cast on Critical')
    const triggerSetup = {
      ...setup(trigger.id),
      embeddedSkillIds: ['unknown-target'],
    }
    const result = resolveTriggerRepeatModel({
      primarySkill: primary,
      setups: [setup(primary.id, 'main'), triggerSetup],
      skills: [primary, trigger],
    })

    expect(result.sources[0]).toMatchObject({
      sourceSkillId: 'coc',
      status: 'blocked-missing-target',
    })
    expect(result.sources[0]?.targetSkillId).toBeUndefined()
  })

  it('verwendet einen Energiebonus nicht als Triggerfrequenz', () => {
    const primary = skill('arc', 'Arc')
    const trigger = skill('invocation', 'Elemental Invocation')
    const result = resolveTriggerRepeatModel({
      primarySkill: primary, setups: [setup(primary.id, 'main'), setup(trigger.id)], skills: [primary, trigger],
    })
    expect(result.sources[0].intervalMs).toBeUndefined()
    expect(result.productive).toBe(false)
  })

  it('liefert bei identischer Eingabe ein identisches Ergebnis', () => {
    const primary = skill('blood-explosion', 'Blood Explosion')
    const input = { primarySkill: primary, setups: [setup(primary.id, 'main')], skills: [primary] }
    expect(resolveTriggerRepeatModel(input)).toEqual(resolveTriggerRepeatModel(input))
  })
})
