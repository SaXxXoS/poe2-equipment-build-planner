import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { BuildAnalysis } from '../engine'
import { ResourceBalancePanel } from './ResourceBalancePanel'

type ResourceModel = NonNullable<NonNullable<BuildAnalysis['damageEstimate']>['resourceSpiritModel']>

const model = (): ResourceModel => ({
  modelVersion: 'test',
  productive: true,
  manaPoolKnown: false,
  lifePoolKnown: false,
  spiritCapacityKnown: false,
  exactSkillCostsKnown: true,
  confirmedMinimumPools: {
    characterLevel: 100,
    baseLife: 1392,
    baseMana: 520,
    life: 1392,
    mana: 520,
    manaRegenerationPerSecond: 20.8,
    status: 'confirmed-minimum-only',
  },
  sources: [],
  equipmentContributions: [],
  skillCostChains: [{
    setupId: 'spark-main',
    skillId: 'spark',
    skillName: 'Funken',
    weaponSet: 'set-1',
    selectedSupportIds: ['support'],
    semanticSupportCostHints: [],
    baseCosts: [{
      resource: 'mana',
      cadence: 'per-use',
      baseAmount: 20,
      supportAdjustedAmount: 24,
      resourceAdjustedAmount: 22,
      sourceResource: 'Mana',
    }],
    supportCostMultipliers: [],
    intrinsicSkillCostEffects: [{ statId: 'test_cost_+%', kind: 'cost-increased', value: 10, evidence: 'structured-exact', sourceReference: 'test' }],
    blockedIntrinsicSkillCostEffects: [],
    passiveResourceEffects: [],
    combinedSupportMultiplier: 1.2,
    combinedResourceCostMultiplier: 0.9,
    combinedResourceCostEfficiency: 1,
    effectiveManaPool: 520,
    effectiveManaRegenerationPerSecond: 20.8,
    confirmedFlatSpiritContribution: 0,
    baseCostStatus: 'structured-exact-level',
    supportMultiplierStatus: 'structured-exact-all-selected-supports',
    poolStatus: 'confirmed-pool-with-passive-effects',
    sustainStatus: 'burst-affordable-on-confirmed-minimum',
    actionFrequencyPerSecond: 2,
    manaDemandPerSecond: 44,
    rageDemandPerSecond: 0,
    rageSuppressionDurationMs: null,
    rageSustainStatus: 'no-rage-cost',
  }, {
    setupId: 'unknown',
    skillId: 'unknown',
    skillName: 'Unbekannte Fertigkeit',
    weaponSet: 'set-2',
    selectedSupportIds: [],
    semanticSupportCostHints: [],
    baseCosts: [],
    supportCostMultipliers: [],
    intrinsicSkillCostEffects: [],
    blockedIntrinsicSkillCostEffects: [{ statId: 'dynamic', value: 30, reason: 'requires-runtime-spend-rate', sourceReference: 'test' }],
    passiveResourceEffects: [],
    combinedSupportMultiplier: null,
    combinedResourceCostMultiplier: 1,
    combinedResourceCostEfficiency: 1,
    effectiveManaPool: null,
    effectiveManaRegenerationPerSecond: null,
    confirmedFlatSpiritContribution: 0,
    baseCostStatus: 'blocked-missing-exact-base-cost',
    supportMultiplierStatus: 'structured-exact-no-supports',
    poolStatus: 'blocked-missing-character-level',
    sustainStatus: 'blocked-missing-exact-cost-chain',
    actionFrequencyPerSecond: null,
    manaDemandPerSecond: null,
    rageDemandPerSecond: null,
    rageSuppressionDurationMs: null,
    rageSustainStatus: 'blocked-missing-exact-cost-chain',
  }],
  spiritReservations: [],
  spiritCapacityByWeaponSet: [{
    weaponSet: 'set-1',
    confirmedMinimumCapacity: 60,
    levelDerivedQuestSpirit: 100,
    planningCapacity: 160,
    reservationEfficiencyPercent: 0,
    reservedSpirit: 30,
    effectiveReservedSpirit: 30,
    remainingSpirit: 130,
    status: 'fits-confirmed-minimum',
    capacityEvidence: 'confirmed-minimum',
    passiveResourceEffects: [],
  }, {
    weaponSet: 'set-2',
    confirmedMinimumCapacity: 60,
    levelDerivedQuestSpirit: 100,
    planningCapacity: 160,
    reservationEfficiencyPercent: 0,
    reservedSpirit: null,
    effectiveReservedSpirit: null,
    remainingSpirit: null,
    status: 'blocked-incomplete-reservation-chain',
    capacityEvidence: 'level-derived-quest-upper-bound',
    passiveResourceEffects: [],
  }],
  semanticSupportCostHints: [],
  limitations: ['Keine nicht belegten Werte ergänzt.'],
})

describe('Ressourcenbilanz', () => {
  it('zeigt Kosten, Bedarf, Regeneration, Waffenset und Geist verständlich an', () => {
    const html = renderToStaticMarkup(<ResourceBalancePanel model={model()}/>)
    for (const text of [
      'Ressourcenbilanz je Fertigkeit',
      'Funken',
      'Waffenset 1',
      'Kosten pro Nutzung',
      'Mana-Bedarf pro Sekunde',
      '44',
      'Wirksame Mana-Regeneration',
      '20,8/s',
      'Geistbilanz je Waffenset',
      'Planungskapazität',
    ]) expect(html).toContain(text)
  })

  it('kennzeichnet eine unvollständige Kostenkette sichtbar als unbekannt', () => {
    const html = renderToStaticMarkup(<ResourceBalancePanel model={model()}/>)
    expect(html).toContain('Kosten pro Nutzung/Sekunde: Unbekannt')
    expect(html).toContain('Tragfähigkeit unbekannt: Exakte Kostenkette ist unvollständig')
  })
})
