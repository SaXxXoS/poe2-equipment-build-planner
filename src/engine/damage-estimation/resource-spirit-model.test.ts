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
  it('klassifiziert jede belegte Fertigkeit als unvollständige Kostenkette', () => {
    const definition = skill('arc', 'Arc')
    const model = resolveResourceSpiritModel({ setups: [setup(definition.id)], skills: [definition], supports: [] })
    expect(model.skillCostChains).toEqual([expect.objectContaining({
      skillId: definition.id,
      baseCostStatus: 'blocked-missing-exact-base-cost',
      poolStatus: 'blocked-missing-complete-character-pool',
      sustainStatus: 'blocked-incomplete-cost-pool-and-recovery-chain',
    })])
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
