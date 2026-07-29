import { describe, expect, it } from 'vitest'
import type { SkillGemDefinition, SkillSetup, SupportGemDefinition } from '../../domain'
import { resolveResourceSpiritModel } from './resource-spirit-model'

const skill = (id: string, nameEn: string): SkillGemDefinition => ({
  id, nameEn, displayNameDe: nameEn, tags: [], dataVersion: 'test', source: 'local-placeholder', status: 'verified',
})
const setup = (skillId: string, supportGemIds: string[] = [], weaponSet: SkillSetup['weaponSet'] = 'both'): SkillSetup => ({
  id: skillId, skillId, role: 'main', weaponSet, supportGemIds,
})

describe('fail-closed Ressourcen- und Geistmodell', () => {
  it('erkennt Reservierung ohne Geistbetrag zu erfinden', () => {
    const definition = skill('archmage', 'Archmage')
    const model = resolveResourceSpiritModel({ setups: [setup(definition.id)], skills: [definition], supports: [] })
    expect(model.sources[0]).toMatchObject({ kind: 'spirit-reservation', reservationCount: 1, status: 'blocked-missing-reservation-amount-and-capacity' })
    expect(model.spiritCapacityKnown).toBe(false)
    expect(model.productive).toBe(false)
  })
  it('klassifiziert Mehrfachreservierung getrennt', () => {
    const definition = skill('arsonist', 'Skeletal Arsonist Minion')
    const model = resolveResourceSpiritModel({ setups: [setup(definition.id)], skills: [definition], supports: [] })
    expect(model.sources[0]).toMatchObject({ kind: 'multiple-spirit-reservations', reservationCount: 2 })
  })
  it('verbindet den exakten Geistbetrag und prüft beide Waffensets getrennt', () => {
    const archmage = { ...skill('archmage', 'Archmage'), spiritReservation: 100 }
    const barkskin = { ...skill('barkskin', 'Barkskin'), spiritReservation: 30 }
    const model = resolveResourceSpiritModel({
      equipment: [{
        id: 'amulet',
        slotId: 'slot-amulet',
        modifierValues: [{ id: 'spirit', modifierId: 'spirit', value: 120, statValues: [{ statId: 'base_maximum_spirit', value: 120 }] }],
      }],
      setups: [setup(archmage.id, [], 'set-1'), setup(barkskin.id, [], 'set-2')],
      skills: [archmage, barkskin],
      supports: [],
    })
    expect(model.sources.find(source => source.sourceSkillId === archmage.id)).toMatchObject({
      reservationAmount: 100,
      status: 'structured-exact-reservation',
    })
    expect(model.spiritReservations).toEqual([
      expect.objectContaining({ setupId: 'archmage', reservationAmount: 100, weaponSet: 'set-1' }),
      expect.objectContaining({ setupId: 'barkskin', reservationAmount: 30, weaponSet: 'set-2' }),
    ])
    expect(model.spiritCapacityByWeaponSet).toEqual([
      expect.objectContaining({ weaponSet: 'set-1', confirmedMinimumCapacity: 120, reservedSpirit: 100, remainingSpirit: 20, status: 'fits-confirmed-minimum' }),
      expect.objectContaining({ weaponSet: 'set-2', confirmedMinimumCapacity: 120, reservedSpirit: 30, remainingSpirit: 90, status: 'fits-confirmed-minimum' }),
    ])
    expect(model.productive).toBe(true)
  })
  it('zählt beidseitig aktive Reservierungen in beiden Waffensets', () => {
    const definition = { ...skill('barkskin', 'Barkskin'), spiritReservation: 30 }
    const model = resolveResourceSpiritModel({
      setups: [setup(definition.id, [], 'both')],
      skills: [definition],
      supports: [],
    })
    expect(model.spiritCapacityByWeaponSet.map(value => value.reservedSpirit)).toEqual([30, 30])
    expect(model.spiritCapacityByWeaponSet.every(value => value.status === 'exceeds-confirmed-minimum')).toBe(true)
  })
  it('wendet bestätigte Geistwirkungen aus Baum und Aszendenz auf die Mindestkapazität an', () => {
    const definition = { ...skill('barkskin', 'Barkskin'), spiritReservation: 30 }
    const model = resolveResourceSpiritModel({
      setups: [setup(definition.id, [], 'set-1')],
      skills: [definition],
      supports: [],
      passiveTree: {
        metadata: { releaseTag: 'test' },
        connections: [],
        nodes: [
          { id: 'flat-spirit', stats: [{ sourceText: '+40 to Spirit' }], ascendancyId: null },
          { id: 'more-spirit', stats: [{ sourceText: '25% increased Spirit' }], ascendancyId: 'test-ascendancy' },
        ],
      } as never,
      realPassivePlanning: {
        pipelineResult: { allocatedNodeIds: ['flat-spirit'] },
        ascendancyPlanning: { allocatedNodeIds: ['more-spirit'] },
      } as never,
    })
    expect(model.spiritCapacityByWeaponSet[0]).toMatchObject({
      confirmedMinimumCapacity: 50,
      reservedSpirit: 30,
      remainingSpirit: 20,
      status: 'fits-confirmed-minimum',
    })
  })
  it('nutzt Quest-Geist nur als levelbasierte Planungsschätzung und wendet allgemeine Reservierungseffizienz an', () => {
    const definition = { ...skill('barkskin', 'Barkskin'), spiritReservation: 100 }
    const model = resolveResourceSpiritModel({
      characterLevel: 61,
      setups: [setup(definition.id, [], 'set-1')],
      skills: [definition],
      supports: [],
      passiveTree: {
        metadata: { releaseTag: 'test' },
        connections: [],
        nodes: [{ id: 'efficiency', stats: [{ sourceText: '25% increased Reservation Efficiency of Skills' }], ascendancyId: null }],
      } as never,
      realPassivePlanning: {
        pipelineResult: { allocatedNodeIds: ['efficiency'] },
        ascendancyPlanning: { allocatedNodeIds: [] },
      } as never,
    })
    expect(model.questSpiritEstimate).toMatchObject({
      characterLevel: 61,
      amount: 100,
      status: 'level-derived-upper-bound-not-completion-proof',
    })
    expect(model.questSpiritEstimate?.eligibleRewards).toHaveLength(3)
    expect(model.spiritCapacityByWeaponSet[0]).toMatchObject({
      confirmedMinimumCapacity: 0,
      levelDerivedQuestSpirit: 100,
      planningCapacity: 100,
      reservationEfficiencyPercent: 25,
      reservedSpirit: 100,
      effectiveReservedSpirit: 80,
      remainingSpirit: 20,
      status: 'fits-level-derived-quest-estimate',
      capacityEvidence: 'level-derived-quest-upper-bound',
    })
  })
  it('erfasst eine Manawechselwirkung, aber keine erfundene Aufrechterhaltbarkeit', () => {
    const definition = skill('archmage', 'Archmage')
    const model = resolveResourceSpiritModel({ setups: [setup(definition.id)], skills: [definition], supports: [] })
    expect(model.sources[0].numericEffects).toContainEqual({ statId: 'archmage_max_mana_permyriad_to_add_to_non_channelled_spell_mana_cost', value: 610 })
    expect(model.exactSkillCostsKnown).toBe(false)
    expect(model.manaPoolKnown).toBe(false)
  })
  it('trennt semantische Supportkosten von technischen Kosten', () => {
    const definition = skill('arc', 'Arc')
    const support = { id: 'costly', resourceCost: 30 } as SupportGemDefinition
    const model = resolveResourceSpiritModel({ setups: [setup(definition.id, [support.id])], skills: [definition], supports: [support] })
    expect(model.semanticSupportCostHints).toEqual([{ supportId: support.id, value: 30 }])
    expect(model.exactSkillCostsKnown).toBe(false)
  })
  it('transportiert belegte Ausrüstungsbeiträge ohne einen vollständigen Pool zu behaupten', () => {
    const definition = skill('arc', 'Arc')
    const model = resolveResourceSpiritModel({
      equipment: [{
        id: 'helmet',
        slotId: 'slot-helmet',
        modifierValues: [{
          id: 'applied-mana',
          modifierId: 'mana-mod',
          value: 42,
          statValues: [{ statId: 'base_maximum_mana', value: 42 }],
        }],
      }],
      setups: [setup(definition.id)],
      skills: [definition],
      supports: [],
    })
    expect(model.equipmentContributions).toEqual([
      expect.objectContaining({ resource: 'mana', value: 42, sourceItemId: 'helmet' }),
    ])
    expect(model.manaPoolKnown).toBe(false)
    expect(model.productive).toBe(false)
  })
  it('übernimmt die exakten Stufe-20-Grundkosten ohne Supports', () => {
    const definition = skill('arc', 'Arc')
    const model = resolveResourceSpiritModel({ setups: [setup(definition.id)], skills: [definition], supports: [] })
    expect(model.skillCostChains).toEqual([expect.objectContaining({
      skillId: definition.id,
      baseCostStatus: 'structured-exact-level',
      supportMultiplierStatus: 'structured-exact-no-supports',
      combinedSupportMultiplier: 1,
      baseCosts: [{ resource: 'mana', cadence: 'per-use', baseAmount: 81, supportAdjustedAmount: 81, resourceAdjustedAmount: 81, sourceResource: 'Mana' }],
      poolStatus: 'blocked-missing-character-level',
      sustainStatus: 'blocked-missing-character-level',
    })])
  })
  it('berechnet den gepinnten Mindestpool und die natürliche Regeneration automatisch aus dem Charakterlevel', () => {
    const definition = skill('arc', 'Arc')
    const model = resolveResourceSpiritModel({ characterLevel: 100, setups: [setup(definition.id)], skills: [definition], supports: [] })
    expect(model.confirmedMinimumPools).toEqual({
      characterLevel: 100,
      baseLife: 1392,
      baseMana: 520,
      life: 1392,
      mana: 520,
      manaRegenerationPerSecond: 20.8,
      status: 'confirmed-minimum-only',
    })
    expect(model.skillCostChains[0]).toMatchObject({
      actionFrequencyPerSecond: 0.9091,
      manaDemandPerSecond: 73.64,
      poolStatus: 'confirmed-minimum-pool',
      sustainStatus: 'burst-affordable-on-confirmed-minimum',
    })
  })
  it('bestätigt dauerhafte Nutzbarkeit nur wenn bereits der konservative Mindestwert reicht', () => {
    const definition = skill('arc', 'Arc')
    const model = resolveResourceSpiritModel({
      characterLevel: 100,
      equipment: [{
        id: 'ring',
        slotId: 'slot-ring-left',
        modifierValues: [{ id: 'regen', modifierId: 'regen', value: 300, statValues: [{ statId: 'mana_regeneration_rate_+%', value: 300 }] }],
      }],
      setups: [setup(definition.id)],
      skills: [definition],
      supports: [],
    })
    expect(model.confirmedMinimumPools?.manaRegenerationPerSecond).toBe(83.2)
    expect(model.skillCostChains[0].sustainStatus).toBe('sustainable-on-confirmed-minimum')
    expect(model.productive).toBe(true)
  })
  it('verknüpft alle belegten Supportmultiplikatoren deterministisch', () => {
    const definition = skill('arc', 'Arc')
    const supports = [
      { id: 'support-a', displayNameDe: 'Support A', costMultiplierPercent: 120, sourceReference: 'skills.json#a' },
      { id: 'support-b', displayNameDe: 'Support B', costMultiplierPercent: 130, sourceReference: 'skills.json#b' },
    ] as SupportGemDefinition[]
    const model = resolveResourceSpiritModel({
      setups: [setup(definition.id, supports.map(value => value.id))],
      skills: [definition],
      supports,
    })
    expect(model.skillCostChains[0]).toMatchObject({
      combinedSupportMultiplier: 1.56,
      supportMultiplierStatus: 'structured-exact-all-selected-supports',
      baseCosts: [{ baseAmount: 81, supportAdjustedAmount: 126 }],
    })
    expect(model.exactSkillCostsKnown).toBe(true)
  })
  it('blockiert die Kostenkette bei einem fehlenden Supportmultiplikator', () => {
    const definition = skill('arc', 'Arc')
    const support = { id: 'unknown-support', displayNameDe: 'Unbekannt' } as SupportGemDefinition
    const model = resolveResourceSpiritModel({
      setups: [setup(definition.id, [support.id])],
      skills: [definition],
      supports: [support],
    })
    expect(model.skillCostChains[0]).toMatchObject({
      combinedSupportMultiplier: null,
      supportMultiplierStatus: 'blocked-missing-exact-support-cost-multipliers',
      sustainStatus: 'blocked-missing-exact-cost-chain',
    })
    expect(model.exactSkillCostsKnown).toBe(false)
  })
  it('wendet unbedingte Mana- und Kostenwirkungen vergebener Passive exakt an', () => {
    const definition = skill('arc', 'Arc')
    const passiveTree = {
      metadata: { releaseTag: 'test' },
      connections: [],
      nodes: [
        { id: 'flat', stats: [{ sourceText: '+30 to maximum Mana' }], ascendancyId: null },
        { id: 'maximum', stats: [{ sourceText: '20% increased maximum Mana' }], ascendancyId: null },
        { id: 'regen', stats: [{ sourceText: '25% increased Mana Regeneration Rate' }], ascendancyId: null },
        { id: 'cost', stats: [{ sourceText: '10% increased Mana Cost of Skills' }], ascendancyId: null },
      ],
    } as never
    const realPassivePlanning = {
      pipelineResult: { allocatedNodeIds: ['flat', 'maximum', 'regen', 'cost'] },
      ascendancyPlanning: { allocatedNodeIds: [] },
    } as never
    const model = resolveResourceSpiritModel({
      characterLevel: 100,
      setups: [setup(definition.id)],
      skills: [definition],
      supports: [],
      passiveTree,
      realPassivePlanning,
    })
    expect(model.skillCostChains[0]).toMatchObject({
      effectiveManaPool: 660,
      effectiveManaRegenerationPerSecond: 33,
      combinedResourceCostMultiplier: 1.1,
      manaDemandPerSecond: 80.91,
      poolStatus: 'confirmed-pool-with-passive-effects',
      baseCosts: [{ supportAdjustedAmount: 81, resourceAdjustedAmount: 89 }],
    })
    expect(model.skillCostChains[0].passiveResourceEffects).toHaveLength(4)
  })
  it('wendet verringerte, weniger und effiziente Manakosten in der gepinnten PoB2-Reihenfolge an', () => {
    const definition = skill('arc', 'Arc')
    const passiveTree = {
      metadata: { releaseTag: 'test' },
      connections: [],
      nodes: [
        { id: 'reduced', stats: [{ sourceText: '20% reduced Mana Cost of Skills' }], ascendancyId: null },
        { id: 'less', stats: [{ sourceText: '25% less Mana Cost of Skills' }], ascendancyId: null },
        { id: 'mana-efficiency', stats: [{ sourceText: '20% increased Mana Cost [Efficiency]' }], ascendancyId: null },
        { id: 'general-efficiency', stats: [{ sourceText: '10% increased Cost Efficiency' }], ascendancyId: 'TestAscendancy' },
      ],
    } as never
    const realPassivePlanning = {
      pipelineResult: { allocatedNodeIds: ['reduced', 'less', 'mana-efficiency'] },
      ascendancyPlanning: { allocatedNodeIds: ['general-efficiency'] },
    } as never
    const model = resolveResourceSpiritModel({
      characterLevel: 100,
      setups: [setup(definition.id)],
      skills: [definition],
      supports: [],
      passiveTree,
      realPassivePlanning,
    })
    expect(model.skillCostChains[0]).toMatchObject({
      combinedResourceCostMultiplier: 0.6,
      combinedResourceCostEfficiency: 1.3,
      baseCosts: [{ supportAdjustedAmount: 81, resourceAdjustedAmount: 37 }],
    })
    expect(model.skillCostChains[0].passiveResourceEffects.map(effect => effect.kind)).toEqual([
      'cost-efficiency-increased',
      'mana-cost-less',
      'mana-cost-efficiency-increased',
      'mana-cost-reduced',
    ])
  })
  it('wendet den strukturierten fertigkeitseigenen Kostenaufschlag von Toxic Domain an', () => {
    const definition = skill('toxic-domain', 'Toxic Domain')
    const model = resolveResourceSpiritModel({
      characterLevel: 100,
      setups: [setup(definition.id)],
      skills: [definition],
      supports: [],
    })
    expect(model.skillCostChains[0]).toMatchObject({
      intrinsicSkillCostEffects: [{
        statId: 'toxic_domain_mana_cost_+%',
        kind: 'cost-increased',
        value: 25,
        evidence: 'structured-exact',
      }],
      blockedIntrinsicSkillCostEffects: [],
      combinedResourceCostMultiplier: 1.25,
      baseCosts: [{ baseAmount: 106, supportAdjustedAmount: 106, resourceAdjustedAmount: 132 }],
    })
  })
  it('weist dynamische Mana-Tempest-Kosten fail-closed aus', () => {
    const definition = skill('mana-tempest', 'Mana Tempest')
    const model = resolveResourceSpiritModel({
      characterLevel: 100,
      setups: [setup(definition.id)],
      skills: [definition],
      supports: [],
    })
    expect(model.skillCostChains[0]).toMatchObject({
      intrinsicSkillCostEffects: [],
      blockedIntrinsicSkillCostEffects: [{
        statId: 'mana_tempest_mana_cost_%_to_add_to_cost_per_second',
        value: 30,
        reason: 'requires-runtime-spend-rate',
      }],
      combinedResourceCostMultiplier: 1,
      sustainStatus: 'blocked-missing-exact-cost-chain',
    })
    expect(model.exactSkillCostsKnown).toBe(false)
  })
  it('wendet Archmage auf einen nicht-kanalisierten Zauber im selben Waffenset an', () => {
    const arc = skill('arc', 'Arc')
    const archmage = skill('archmage', 'Archmage')
    const model = resolveResourceSpiritModel({
      characterLevel: 100,
      setups: [
        setup(arc.id, [], 'set-1'),
        { ...setup(archmage.id, [], 'set-1'), id: 'archmage-setup', role: 'utility' },
      ],
      skills: [arc, archmage],
      supports: [],
    })
    expect(model.skillCostChains.find(value => value.skillId === arc.id)).toMatchObject({
      intrinsicSkillCostEffects: [{
        statId: 'archmage_max_mana_permyriad_to_add_to_non_channelled_spell_mana_cost',
        kind: 'archmage-max-mana-cost',
        value: 6.1,
        additionalBaseManaCost: 31,
        gainAsLightningPercent: 20.8,
        sourceSkillId: archmage.id,
        evidence: 'structured-exact',
      }],
      blockedIntrinsicSkillCostEffects: [],
      effectiveManaPool: 520,
      baseCosts: [{ baseAmount: 112, supportAdjustedAmount: 112, resourceAdjustedAmount: 112 }],
    })
  })
  it('überträgt Archmage nicht zwischen getrennten Waffensets', () => {
    const arc = skill('arc', 'Arc')
    const archmage = skill('archmage', 'Archmage')
    const model = resolveResourceSpiritModel({
      characterLevel: 100,
      setups: [
        setup(arc.id, [], 'set-1'),
        { ...setup(archmage.id, [], 'set-2'), id: 'archmage-setup', role: 'utility' },
      ],
      skills: [arc, archmage],
      supports: [],
    })
    expect(model.skillCostChains.find(value => value.skillId === arc.id)).toMatchObject({
      intrinsicSkillCostEffects: [],
      blockedIntrinsicSkillCostEffects: [],
      baseCosts: [{ baseAmount: 81, supportAdjustedAmount: 81, resourceAdjustedAmount: 81 }],
    })
  })
  it('trennt Waffenset-Passive und verbindet Aszendenzwirkungen mit beiden Sets', () => {
    const definition = skill('arc', 'Arc')
    const passiveTree = {
      metadata: { releaseTag: 'test' },
      connections: [],
      nodes: [
        { id: 'shared', stats: [{ sourceText: '+20 to maximum Mana' }], ascendancyId: null },
        { id: 'set-1', stats: [{ sourceText: '20% increased Mana Regeneration Rate' }], ascendancyId: null },
        { id: 'set-2', stats: [{ sourceText: '15% increased Mana Cost of Skills' }], ascendancyId: null },
        { id: 'asc', stats: [{ sourceText: '+10 to Spirit' }], ascendancyId: 'Stormweaver' },
      ],
    } as never
    const realPassivePlanning = {
      pipelineResult: { allocatedNodeIds: ['shared'] },
      weaponSetPlanning: {
        set1: { allocatedNodeIds: ['shared', 'set-1'] },
        set2: { allocatedNodeIds: ['shared', 'set-2'] },
      },
      ascendancyPlanning: { allocatedNodeIds: ['asc'] },
    } as never
    const model = resolveResourceSpiritModel({
      characterLevel: 100,
      setups: [setup(definition.id, [], 'set-1'), { ...setup(definition.id, [], 'set-2'), id: 'arc-set-2' }],
      skills: [definition],
      supports: [],
      passiveTree,
      realPassivePlanning,
    })
    expect(model.skillCostChains[0].passiveResourceEffects.map(effect => effect.sourceNodeId)).toEqual(['asc', 'set-1', 'shared'])
    expect(model.skillCostChains[1].passiveResourceEffects.map(effect => effect.sourceNodeId)).toEqual(['asc', 'set-2', 'shared'])
    expect(model.skillCostChains[0].combinedResourceCostMultiplier).toBe(1)
    expect(model.skillCostChains[1].combinedResourceCostMultiplier).toBe(1.15)
  })
  it('ignoriert bedingte Ressourcenwirkungen weiterhin fail-closed', () => {
    const definition = skill('arc', 'Arc')
    const model = resolveResourceSpiritModel({
      characterLevel: 100,
      setups: [setup(definition.id)],
      skills: [definition],
      supports: [],
      passiveTree: {
        metadata: { releaseTag: 'test' },
        connections: [],
        nodes: [{ id: 'conditional', stats: [{ sourceText: '25% increased Mana Regeneration Rate if you have Shocked an Enemy Recently' }], ascendancyId: null }],
      } as never,
      realPassivePlanning: { pipelineResult: { allocatedNodeIds: ['conditional'] }, ascendancyPlanning: { allocatedNodeIds: [] } } as never,
    })
    expect(model.skillCostChains[0].passiveResourceEffects).toEqual([])
    expect(model.skillCostChains[0].effectiveManaRegenerationPerSecond).toBe(20.8)
  })
  it('blockiert eine Manafertigkeit bei einem vergebenen Knoten mit bestätigt null Mana', () => {
    const definition = skill('arc', 'Arc')
    const model = resolveResourceSpiritModel({
      characterLevel: 100,
      setups: [setup(definition.id)],
      skills: [definition],
      supports: [],
      passiveTree: {
        metadata: { releaseTag: 'test' },
        connections: [],
        nodes: [{ id: 'blood-magic', stats: [{ sourceText: 'You have no Mana' }], ascendancyId: null }],
      } as never,
      realPassivePlanning: { pipelineResult: { allocatedNodeIds: ['blood-magic'] }, ascendancyPlanning: { allocatedNodeIds: [] } } as never,
    })
    expect(model.skillCostChains[0]).toMatchObject({
      effectiveManaPool: 0,
      effectiveManaRegenerationPerSecond: 0,
      sustainStatus: 'unusable-confirmed-zero-mana',
    })
  })
  it('ignoriert ähnlich benannte, aber nicht freigegebene Ressourcen-Stat-IDs', () => {
    const definition = skill('arc', 'Arc')
    const model = resolveResourceSpiritModel({
      equipment: [{
        id: 'helmet',
        slotId: 'slot-helmet',
        modifierValues: [{
          id: 'unknown',
          modifierId: 'unknown',
          value: 999,
          statValues: [{ statId: 'maximum_mana_guess', value: 999 }],
        }],
      }],
      setups: [setup(definition.id)],
      skills: [definition],
      supports: [],
    })
    expect(model.equipmentContributions).toEqual([])
  })
  it('berechnet das qualitaetsabhaengige kostenfreie Raserei-Fenster von Flame Breath', () => {
    const definition = skill('flame-breath', 'Flame Breath')
    const model = resolveResourceSpiritModel({
      characterLevel: 100,
      setups: [{ ...setup(definition.id), level: 20, quality: 20 }],
      skills: [definition],
      supports: [],
    })
    expect(model.skillCostChains[0]).toMatchObject({
      rageDemandPerSecond: 6,
      rageSuppressionDurationMs: 5000,
      rageSustainStatus: 'initially-suppressed-then-requires-rage-pool',
      blockedIntrinsicSkillCostEffects: [],
    })
    expect(model.skillCostChains[0].intrinsicSkillCostEffects).toContainEqual(expect.objectContaining({
      kind: 'rage-cost-suppressed-window',
      suppressionDurationMs: 5000,
      ongoingRageCostPerSecond: 6,
    }))
  })
  it('berechnet Rampage nach dem anfaenglichen Fenster mit 5 Raserei pro Sekunde', () => {
    const definition = skill('rampage', 'Rampage')
    const model = resolveResourceSpiritModel({
      characterLevel: 100,
      setups: [{ ...setup(definition.id), level: 20 }],
      skills: [definition],
      supports: [],
    })
    expect(model.skillCostChains[0]).toMatchObject({
      rageDemandPerSecond: 5,
      rageSuppressionDurationMs: 2500,
      rageSustainStatus: 'initially-suppressed-then-requires-rage-pool',
    })
  })
  it('blockiert ein ungueltiges Qualitaetslevel statt das Raserei-Fenster zu schaetzen', () => {
    const definition = skill('rampage', 'Rampage')
    const model = resolveResourceSpiritModel({
      characterLevel: 100,
      setups: [{ ...setup(definition.id), level: 20, quality: 24 }],
      skills: [definition],
      supports: [],
    })
    expect(model.skillCostChains[0]).toMatchObject({
      rageDemandPerSecond: null,
      rageSuppressionDurationMs: null,
      rageSustainStatus: 'blocked-missing-exact-cost-chain',
    })
    expect(model.skillCostChains[0].blockedIntrinsicSkillCostEffects).toContainEqual(expect.objectContaining({
      reason: 'requires-valid-normal-quality',
    }))
  })
  it('verbindet Rage-Supports mit exakter Erzeugung pro Treffer ohne Trefferfrequenz zu erfinden', () => {
    const definition = skill('rampage', 'Rampage')
    const rageSupport = {
      id: 'rage-three',
      nameEn: 'Rage III',
      displayNameDe: 'Raserei III',
      costMultiplierPercent: 100,
    } as SupportGemDefinition
    const model = resolveResourceSpiritModel({
      characterLevel: 100,
      setups: [{ ...setup(definition.id, [rageSupport.id]), level: 20 }],
      skills: [definition],
      supports: [rageSupport],
    })
    expect(model.skillCostChains[0]).toMatchObject({
      rageGenerationPerHit: 5,
      rageGenerationPerSecond: null,
      rageNetDemandPerSecond: null,
      rageSustainStatus: 'requires-hit-frequency-and-rage-pool',
    })
  })
  it('leitet die Aktionsfrequenz aus beobachteter Waffengeschwindigkeit und Skillmultiplikator ab, aber erfindet keine Trefferfrequenz', () => {
    const definition = skill('rampage', 'Rampage')
    const rageSupport = {
      id: 'rage-three',
      nameEn: 'Rage III',
      displayNameDe: 'Raserei III',
      costMultiplierPercent: 100,
    } as SupportGemDefinition
    const model = resolveResourceSpiritModel({
      characterLevel: 100,
      equipment: [{
        id: 'observed-weapon',
        slotId: 'slot-weapon-set-1-left',
        modifierValues: [],
        weaponStatsSource: 'observed-final',
        weaponStats: { attacksPerSecond: 1.5 },
      }],
      setups: [{ ...setup(definition.id, [rageSupport.id], 'set-1'), level: 20 }],
      skills: [definition],
      supports: [rageSupport],
    })
    expect(model.skillCostChains[0]).toMatchObject({
      actionFrequencyPerSecond: 1.05,
      rageGenerationPerHit: 5,
      rageGenerationPerSecond: null,
      rageNetDemandPerSecond: null,
      rageSustainStatus: 'requires-hit-frequency-and-rage-pool',
    })
  })
  it('verrechnet Raserei pro Treffer erst mit einer extern belegten erfolgreichen Trefferfrequenz', () => {
    const definition = skill('rampage', 'Rampage')
    const rageSupport = {
      id: 'rage-three',
      nameEn: 'Rage III',
      displayNameDe: 'Raserei III',
      costMultiplierPercent: 100,
    } as SupportGemDefinition
    const selectedSetup = { ...setup(definition.id, [rageSupport.id], 'set-1'), level: 20 }
    const model = resolveResourceSpiritModel({
      characterLevel: 100,
      setups: [selectedSetup],
      skills: [definition],
      supports: [rageSupport],
      resolvedActionFrequencyPerSecondBySetup: { [selectedSetup.id]: 1.05 },
      resolvedSuccessfulHitFrequencyPerSecondBySetup: { [selectedSetup.id]: 0.84 },
    })
    expect(model.skillCostChains[0]).toMatchObject({
      actionFrequencyPerSecond: 1.05,
      rageGenerationPerHit: 5,
      rageGenerationPerSecond: 4.2,
      rageNetDemandPerSecond: 0.8,
      rageSustainStatus: 'initially-suppressed-then-requires-rage-pool',
    })
  })
  it('vermischt unterschiedliche Waffenset-Geschwindigkeiten bei beidseitigen Skills nicht', () => {
    const definition = skill('rampage', 'Rampage')
    const model = resolveResourceSpiritModel({
      characterLevel: 100,
      equipment: [
        { id: 'set-1', slotId: 'slot-weapon-set-1-left', modifierValues: [], weaponStatsSource: 'observed-final', weaponStats: { attacksPerSecond: 1.5 } },
        { id: 'set-2', slotId: 'slot-weapon-set-2-left', modifierValues: [], weaponStatsSource: 'observed-final', weaponStats: { attacksPerSecond: 1.2 } },
      ],
      setups: [{ ...setup(definition.id, [], 'both'), level: 20 }],
      skills: [definition],
      supports: [],
    })
    expect(model.skillCostChains[0].actionFrequencyPerSecond).toBeNull()
  })
  it('bleibt deterministisch', () => {
    const definition = skill('barkskin', 'Barkskin')
    const input = { setups: [setup(definition.id)], skills: [definition], supports: [] }
    expect(resolveResourceSpiritModel(input)).toEqual(resolveResourceSpiritModel(input))
  })
})
