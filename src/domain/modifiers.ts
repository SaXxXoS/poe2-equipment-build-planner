import type { EntityId, GameDataMetadata, MechanicTag } from './common'

export const MODIFIER_CATEGORIES = ['damage', 'defence', 'resistance', 'attribute', 'speed', 'critical', 'resource', 'utility'] as const
export type ModifierCategory = (typeof MODIFIER_CATEGORIES)[number]
export const MODIFIER_UNITS = ['flat', 'percent', 'range'] as const
export type ModifierUnit = (typeof MODIFIER_UNITS)[number]
export type ModifierScope = 'local' | 'global'
export interface NumericRange { min: number; max: number }

export interface ModifierDefinition extends GameDataMetadata {
  category: ModifierCategory
  valueType: 'number' | 'range'
  unit: ModifierUnit
  minValue?: number
  maxValue?: number
  scope: ModifierScope
  relevantTags: MechanicTag[]
  allowedEquipmentSlotIds: EntityId[]
}

export interface AppliedModifier {
  id: EntityId
  modifierId: EntityId
  value: number | NumericRange
}
