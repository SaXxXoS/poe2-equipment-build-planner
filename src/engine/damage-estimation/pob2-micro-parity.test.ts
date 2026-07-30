import { describe, expect, it } from 'vitest'
import cases from '../../../docs/audits/pob2-damage-micro-parity-cases.json'
import type { EquipmentEntry, SkillGemDefinition, SkillSetup } from '../../domain'
import { estimateHitDamage } from './estimate'

const skill = (id: string, nameEn: string): SkillGemDefinition => ({
  id,
  displayNameDe: nameEn,
  nameEn,
  tags: [],
  dataVersion: 'pob2-micro-parity',
  source: 'local-placeholder',
  status: 'verified',
})

const setup = (skillId: string): SkillSetup => ({
  id: `setup:${skillId}`,
  skillId,
  role: 'main',
  weaponSet: 'set-1',
  supportGemIds: [],
  level: 20,
})

const shortbow: EquipmentEntry = {
  id: 'weapon:shortbow',
  slotId: 'slot-weapon-set-1-left',
  baseDisplayName: 'Shortbow',
  itemClassId: 'Bows',
  rarity: 'normal',
  modifierValues: [],
}

const byId = new Map(cases.cases.map(value => [value.id, value]))
const requiredNumber = (value: number | undefined, label: string): number => {
  if (value == null) throw new Error(`Fehlender numerischer Erwartungswert: ${label}`)
  return value
}

describe('PoB2-Mikro-Parität am gepinnten Commit', () => {
  it('bindet jeden Erwartungsfall an den freigegebenen PoB2-Pin', () => {
    expect(cases.sourceCommit).toBe('c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0')
    expect(cases.cases).toHaveLength(5)
    expect(new Set(cases.cases.map(value => value.id)).size).toBe(cases.cases.length)
    for (const value of cases.cases) {
      expect(value.sourceReferences.length).toBeGreaterThan(0)
    }
  })

  it('reproduziert die unabhängige Ball-Lightning-Basis- und Krit-Erwartung', () => {
    const reference = byId.get('spell-base-ball-lightning-l20')!
    const result = estimateHitDamage({
      equipment: [],
      setups: [setup('ball-lightning')],
      skills: [skill('ball-lightning', 'Ball Lightning')],
    })

    expect(result.hitDamage).toEqual({
      minimum: reference.expected.minimumHit,
      maximum: reference.expected.maximumHit,
      average: reference.expected.averageHit,
    })
    expect(result.actionsPerSecond).toBe(reference.expected.actionsPerSecond)
    expect(result.criticalExpectationMultiplier).toBe(reference.expected.criticalExpectationMultiplier)
    expect(result.expectedCriticalHitDamagePerSecond).toBeCloseTo(
      requiredNumber(reference.expected.expectedCriticalDamagePerSecond, reference.id),
      cases.publishedOutputPrecision,
    )
  })

  it('reproduziert die PoB2-Reihenfolge für Widerstandsreduktion und Durchdringung', () => {
    const reference = byId.get('enemy-resistance-ball-lightning-l20')!
    const result = estimateHitDamage({
      equipment: [],
      setups: [setup('ball-lightning')],
      skills: [skill('ball-lightning', 'Ball Lightning')],
      enemyProfile: {
        id: reference.id,
        label: 'Mikro-Paritätsziel',
        source: 'manual-comparison-profile',
        resistances: { lightning: reference.inputs.baseResistancePercent },
        penetration: { lightning: reference.inputs.penetrationPercent },
        resistanceReduction: { lightning: reference.inputs.resistanceReductionPercent },
      },
    })

    expect(result.mitigatedComponents?.[0]?.effectiveDefence).toBe(
      reference.expected.effectiveResistancePercent,
    )
    expect(result.expectedDamagePerSecondAfterMitigation).toBeCloseTo(
      requiredNumber(reference.expected.expectedDamagePerSecondAfterMitigation, reference.id),
      cases.publishedOutputPrecision,
    )
  })

  it('reproduziert Flameblasts belegtes Vollstufenszenario', () => {
    const reference = byId.get('channelled-full-stage-flameblast-l20')!
    const result = estimateHitDamage({
      equipment: [],
      setups: [setup('flameblast')],
      skills: [skill('flameblast', 'Flameblast')],
    })

    expect(result.channelledStageState?.skills[0]).toMatchObject({
      maximumStages: reference.inputs.maximumStages,
      fullStageDamageMultiplier: reference.expected.fullStageDamageMultiplier,
      minimumChannelTimeMs: reference.expected.minimumChannelTimeMs,
    })
    expect(result.maximumChannelledHitDamage).toBeCloseTo(
      requiredNumber(reference.expected.maximumPreparedHitWithCriticalExpectation, reference.id),
      2,
    )
  })

  it('reproduziert Detonating Arrows Waffen-, Tempo- und Vollstufenwerte', () => {
    const reference = byId.get('charged-detonating-arrow-shortbow-l20')!
    const result = estimateHitDamage({
      equipment: [shortbow],
      setups: [setup('detonating-arrow')],
      skills: [skill('detonating-arrow', 'Detonating Arrow')],
    })

    expect(result.hitDamage).toEqual({
      minimum: reference.expected.minimumBaseHit,
      maximum: reference.expected.maximumBaseHit,
      average: reference.expected.averageBaseHit,
    })
    expect(result.actionsPerSecond).toBe(reference.expected.actionsPerSecond)
    expect(result.chargedSkillState?.skills[0]?.fullStageGainAsFirePercent).toBe(
      reference.expected.fullStageGainAsFirePercent,
    )
    expect(result.maximumChargedHitDamage).toBeCloseTo(
      requiredNumber(reference.expected.maximumPreparedHit, reference.id),
      cases.publishedOutputPrecision,
    )
  })

  it('reproduziert Volcanos Vollstufenfaktor ohne Projektil-Mehrfachtreffer zu erfinden', () => {
    const reference = byId.get('charged-volcano-l20')!
    const result = estimateHitDamage({
      equipment: [],
      setups: [setup('volcano')],
      skills: [skill('volcano', 'Volcano')],
    })

    expect(result.chargedSkillState?.skills[0]).toMatchObject({
      maximumStages: reference.inputs.maximumStages,
      fullStageDamageMultiplier: reference.expected.fullStageDamageMultiplier,
      fullStageAdditionalProjectiles: reference.expected.fullStageAdditionalProjectiles,
    })
    expect(result.maximumChargedHitDamage).toBeCloseTo(
      requiredNumber(reference.expected.maximumPreparedHitWithCriticalExpectation, reference.id),
      2,
    )
    expect(result.projectileHitModel?.singleTargetHitMultiplier).toBe(1)
  })
})
