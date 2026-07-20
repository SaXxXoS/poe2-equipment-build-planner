import type { EntityId, GameDataMetadata, MechanicTag } from './common'

export type SkillRole = 'main' | 'secondary' | 'utility' | 'movement' | 'defensive'
export type SkillWeaponSet = 'set-1' | 'set-2' | 'both'
export type RotationDurationCategory = 'short' | 'medium' | 'long' | 'persistent'

export type SyntheticWeaponType = 'unarmed' | 'melee-weapon' | 'ranged-weapon' | 'focus' | 'any'
export interface SkillAttributeRequirements { strength?: number; dexterity?: number; intelligence?: number }
export interface SkillGemDefinition extends GameDataMetadata {
  damageTypes?: Extract<MechanicTag, 'physical' | 'fire' | 'cold' | 'lightning' | 'chaos'>[]
  possibleRoles?: SkillRole[]
  requiredWeaponTypes?: SyntheticWeaponType[]
  excludedWeaponTypes?: SyntheticWeaponType[]
  requiredClassId?: EntityId
  excludedClassIds?: EntityId[]
  preferredClassIds?: EntityId[]
  allowedAscendancyIds?: EntityId[]
  excludedAscendancyIds?: EntityId[]
  preferredAscendancyIds?: EntityId[]
  attributeRequirements?: SkillAttributeRequirements
  resourceAffinity?: number
  mappingBase?: number
  bossBase?: number
  preferredWeaponSet?: SkillWeaponSet
  requiredMechanics?: MechanicTag[]
  excludedMechanics?: MechanicTag[]
  enabled?: boolean
  rotationRoles?: ('setup' | 'debuff' | 'buff' | 'main-damage' | 'secondary-damage' | 'movement' | 'defensive')[]
  persistsAfterWeaponSwap?: boolean
  durationCategory?: RotationDurationCategory
  refreshRequired?: boolean
  canBeMaintained?: boolean
  expiresOnWeaponSwap?: boolean
  affectsNextSkill?: boolean
  affectsTarget?: boolean
  affectsPlayer?: boolean
  blockedForRotation?: boolean
}

export interface SupportGemDefinition extends GameDataMetadata {
  requiredTags: MechanicTag[]
  excludedTags: MechanicTag[]
  ownTags: MechanicTag[]
  supportedDamageTypes?: Extract<MechanicTag, 'physical' | 'fire' | 'cold' | 'lightning' | 'chaos'>[]
  supportedMechanics?: MechanicTag[]
  excludedDamageTypes?: Extract<MechanicTag, 'physical' | 'fire' | 'cold' | 'lightning' | 'chaos'>[]
  requiredWeaponTypes?: SyntheticWeaponType[]
  excludedWeaponTypes?: SyntheticWeaponType[]
  allowedSkillRoles?: SkillRole[]
  excludedSkillRoles?: SkillRole[]
  excludedClassIds?: EntityId[]
  excludedAscendancyIds?: EntityId[]
  preferredAscendancyIds?: EntityId[]
  mappingBase?: number
  bossBase?: number
  utilityBase?: number
  resourceCost?: number
  reducedSpeed?: number
  reducedDefence?: number
  mappingPenalty?: number
  bossPenalty?: number
  preferredWeaponSet?: SkillWeaponSet
  requiredWeaponSet?: SkillWeaponSet
  enabled?: boolean
  experimental?: boolean
}

export interface SkillSetup {
  id: EntityId
  skillId: EntityId
  role: SkillRole
  weaponSet: SkillWeaponSet
  supportGemIds: EntityId[]
}
