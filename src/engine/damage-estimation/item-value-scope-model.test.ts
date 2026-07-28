import { describe, expect, it } from 'vitest'
import type { EquipmentEntry } from '../../domain'
import { resolveItemValueScopeModel } from './item-value-scope-model'

const item = (overrides: Partial<EquipmentEntry> = {}): EquipmentEntry => ({
  id: 'item',
  slotId: 'slot-weapon-set-1-left',
  modifierValues: [],
  ...overrides,
})

describe('Gegenstandswert-, Qualitäts- und Scope-Modell', () => {
  it('behandelt eingegebene Tooltipwerte als qualitätsbereinigte Endwerte', () => {
    const result = resolveItemValueScopeModel([item({
      quality: 20,
      weaponStats: { physicalDamage: { minimum: 100, maximum: 200 }, attacksPerSecond: 1.5 },
    })])
    expect(result.entries[0]).toMatchObject({
      valueBasis: 'observed-final-values',
      qualityStatus: 'included-in-observed-final-values',
      productive: true,
    })
  })

  it('schließt lokale Affixe bei Endwerten von einer zweiten Anwendung aus', () => {
    const result = resolveItemValueScopeModel([item({
      weaponStats: { physicalDamage: { minimum: 100, maximum: 200 }, attacksPerSecond: 1.5 },
      modifierValues: [{ id: 'local', modifierId: 'local-physical', value: 50, isLocal: true }],
    })])
    expect(result.entries[0]).toMatchObject({
      localModifierStatus: 'excluded-already-in-observed-final-values',
      localModifierIds: ['local'],
    })
    expect(result.localModifiersExcludedFromGlobalScaling).toBe(1)
  })

  it('erlaubt lokale Affixe genau einmal auf einer gepinnten Waffenbasis', () => {
    const result = resolveItemValueScopeModel([item({
      baseDisplayName: 'Crude Bow',
      modifierValues: [{ id: 'local', modifierId: 'local-physical', value: 50, isLocal: true }],
    })])
    expect(result.entries[0]).toMatchObject({
      valueBasis: 'pinned-base-values',
      qualityStatus: 'not-provided',
      localModifierStatus: 'applied-to-pinned-base-values',
      productive: true,
    })
  })

  it('blockiert Qualität auf einer Basis ohne exakte Qualitätsformel', () => {
    const result = resolveItemValueScopeModel([item({ baseDisplayName: 'Crude Bow', quality: 20 })])
    expect(result.entries[0]).toMatchObject({
      qualityStatus: 'blocked-missing-exact-quality-formula',
      productive: false,
    })
    expect(result.blockedItemIds).toEqual(['item'])
  })

  it('hält globale Affixe getrennt von lokalen Affixen', () => {
    const result = resolveItemValueScopeModel([item({
      modifierValues: [
        { id: 'local', modifierId: 'local', value: 10, isLocal: true },
        { id: 'global', modifierId: 'global', value: 20, isLocal: false },
      ],
    })])
    expect(result.entries[0]).toMatchObject({
      localModifierIds: ['local'],
      globalModifierIds: ['global'],
    })
  })

  it('bleibt deterministisch sortiert', () => {
    const equipment = [
      item({ id: 'b', slotId: 'slot-weapon-set-2-left', quality: 20 }),
      item({ id: 'a', slotId: 'slot-weapon-set-1-left', quality: 20 }),
    ]
    expect(resolveItemValueScopeModel(equipment)).toEqual(resolveItemValueScopeModel(equipment))
    expect(resolveItemValueScopeModel(equipment).entries.map(entry => entry.itemId)).toEqual(['a', 'b'])
  })
})
