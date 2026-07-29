import { describe, expect, it } from 'vitest'
import type { EquipmentEntry } from '../../domain'
import { resolveConditionalAilmentEffects } from './conditional-ailment-effects'

const entry = (overrides: Partial<EquipmentEntry>): EquipmentEntry => ({
  id: 'helmet',
  slotId: 'helmet',
  modifierValues: [],
  ...overrides,
})

describe('bedingte Zustandschancen aus gepinnten Unique-Zeilen', () => {
  it('setzt Atsaks Giftchance kritischer Treffer exakt auf 100 Prozent', () => {
    const result = resolveConditionalAilmentEffects([
      entry({ uniqueItemId: 'pob2:src/Data/Uniques/helmet.lua#45' }),
    ])
    expect(result.poisonChanceOnCriticalHitPercent).toBe(100)
    expect(result.sourceReferences).toContain(
      'pob2:src/Data/Uniques/helmet.lua#45:src/Data/Uniques/helmet.lua#45:line:6',
    )
  })

  it('verwendet weder OCR-Zeilen noch freie manuelle Texte als technische Quelle', () => {
    const result = resolveConditionalAilmentEffects([
      entry({
        observedUniqueLines: ['Critical Hits Poison the enemy'],
        properties: [{
          id: 'ocr',
          kind: 'unique-property',
          text: 'Critical Hits Poison the enemy',
          values: [],
          source: 'ocr',
          confirmed: true,
        }],
      }),
    ])
    expect(result).toEqual({ sourceReferences: [] })
  })
})
