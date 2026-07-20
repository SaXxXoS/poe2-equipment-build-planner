import type { EntityId, GameDataMetadata } from './common'
import type { AppliedModifier } from './modifiers'

export type WeaponSet = 'set-1' | 'set-2' | 'not-applicable'
export type Hand = 'left' | 'right' | 'not-applicable'

export interface EquipmentSlotDefinition extends GameDataMetadata {
  weaponSet: WeaponSet
  hand: Hand
}

export interface EquipmentEntry {
  id: EntityId
  slotId: EntityId
  modifierValues: AppliedModifier[]
  itemDefinitionId?: EntityId
}
