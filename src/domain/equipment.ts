import type { EntityId, GameDataMetadata } from './common'
import type { AppliedModifier } from './modifiers'

export type WeaponSet = 'set-1' | 'set-2' | 'not-applicable'
export type Hand = 'left' | 'right' | 'not-applicable'
export type ItemRarity = 'normal' | 'magic' | 'rare' | 'unique'
export interface EquipmentSocket { id: EntityId; contentId?: EntityId }
export interface EquipmentDefences {
  armour?: number
  evasion?: number
  energyShield?: number
}

export interface EquipmentSlotDefinition extends GameDataMetadata {
  weaponSet: WeaponSet
  hand: Hand
}

export interface EquipmentEntry {
  id: EntityId
  slotId: EntityId
  modifierValues: AppliedModifier[]
  rarity?: ItemRarity
  sockets?: EquipmentSocket[]
  itemDefinitionId?: EntityId
  itemClassId?: EntityId
  baseDisplayName?: string
  itemLevel?: number
  quality?: number
  defences?: EquipmentDefences
  uniqueItemId?: EntityId
  uniqueVariantId?: EntityId
  observedUniqueLines?: string[]
}
