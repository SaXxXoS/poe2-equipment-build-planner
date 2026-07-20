import type { EntityId, GameDataMetadata, MechanicTag } from './common'
import type { ModifierDefinition } from './modifiers'
import type { SkillWeaponSet, SyntheticWeaponType } from './skills'
export type UniqueItemSlot = 'weapon' | 'offhand' | 'helmet' | 'body-armour' | 'gloves' | 'boots' | 'amulet' | 'ring' | 'belt' | 'jewel' | 'special'

export interface UniqueItemDefinition extends GameDataMetadata {
  itemType: string
  modifiers: ModifierDefinition[]
  itemSlot?: UniqueItemSlot
  requiredClassId?: EntityId
  allowedAscendancyIds?: EntityId[]
  excludedAscendancyIds?: EntityId[]
  requiredSkillTags?: MechanicTag[]
  excludedSkillTags?: MechanicTag[]
  requiredWeaponTypes?: SyntheticWeaponType[]
  excludedWeaponTypes?: SyntheticWeaponType[]
  attributeRequirements?: Partial<Record<'strength' | 'dexterity' | 'intelligence', number>>
  levelRequirement?: number
  weaponSet?: SkillWeaponSet
  enabled?: boolean
  experimental?: boolean
  uniqueMechanicIds?: string[]
  requiredMechanicIds?: string[]
  gainedMechanics?: string[]
  lostMechanics?: string[]
  restrictions?: string[]
  tradeOffs?: string[]
  buildEnabler?: boolean
  ascendancyFocusTags?: string[]
  replacementSlotId?: EntityId
  currentSlotUtility?: number
  uniqueSlotUtility?: number
  nonReplaceable?: boolean
}
