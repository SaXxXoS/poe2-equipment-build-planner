import type { EntityId, GameDataMetadata, MechanicTag } from './common'

export type SkillRole = 'main' | 'secondary' | 'utility' | 'movement' | 'defensive'
export type SkillWeaponSet = 'set-1' | 'set-2' | 'both'

export type SkillGemDefinition = GameDataMetadata

export interface SupportGemDefinition extends GameDataMetadata {
  requiredTags: MechanicTag[]
  excludedTags: MechanicTag[]
  ownTags: MechanicTag[]
}

export interface SkillSetup {
  id: EntityId
  skillId: EntityId
  role: SkillRole
  weaponSet: SkillWeaponSet
  supportGemIds: EntityId[]
}
