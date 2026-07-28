import { describe, expect, it } from 'vitest'
import type { SkillGemDefinition, SkillSetup, SupportGemDefinition } from '../../domain'
import { resolveResourceSpiritModel } from './resource-spirit-model'

const skill = (id: string, nameEn: string): SkillGemDefinition => ({
  id, nameEn, displayNameDe: nameEn, tags: [], dataVersion: 'test', source: 'local-placeholder', status: 'verified',
})
const setup = (skillId: string, supportGemIds: string[] = []): SkillSetup => ({
  id: skillId, skillId, role: 'main', weaponSet: 'both', supportGemIds,
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
      baseCostStatus: 'structured-exact-level-20',
      supportMultiplierStatus: 'structured-exact-no-supports',
      combinedSupportMultiplier: 1,
      baseCosts: [{ resource: 'mana', cadence: 'per-use', baseAmount: 81, supportAdjustedAmount: 81, sourceResource: 'Mana' }],
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
  it('bleibt deterministisch', () => {
    const definition = skill('barkskin', 'Barkskin')
    const input = { setups: [setup(definition.id)], skills: [definition], supports: [] }
    expect(resolveResourceSpiritModel(input)).toEqual(resolveResourceSpiritModel(input))
  })
})
