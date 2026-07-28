import type { EntityId, GameDataMetadata, MechanicTag } from './common'

export type SkillRole = 'main' | 'secondary' | 'utility' | 'movement' | 'defensive'
export type SkillWeaponSet = 'set-1' | 'set-2' | 'both'
export type SkillOrigin = 'manual' | 'recommended' | 'ascendancy' | 'equipment'
export type RotationDurationCategory = 'short' | 'medium' | 'long' | 'persistent'

export type SyntheticWeaponType = 'unarmed' | 'melee-weapon' | 'ranged-weapon' | 'focus' | 'bow' | 'crossbow' | 'wand' | 'claw' | 'dagger' | 'flail' | 'mace' | 'quarterstaff' | 'spear' | 'sword' | 'axe' | 'any'
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
  recommendedSupportIds?: EntityId[]
  /** Exakte Geistreservierung aus der gepinnten Gem-zu-Fertigkeit-Kette. */
  spiritReservation?: number
}

export interface SupportGemDefinition extends GameDataMetadata {
  /** Gemeinsame Support-Kategorie über alle Stufen hinweg (z. B. Mystizismus I/II). */
  supportFamilyId?: EntityId
  supportCategoryIds?: EntityId[]
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
  /** Exakter Kostenmultiplikator der gepinnten technischen Support-Fertigkeit; 100 bedeutet unverändert. */
  costMultiplierPercent?: number
  reducedSpeed?: number
  reducedDefence?: number
  mappingPenalty?: number
  bossPenalty?: number
  preferredWeaponSet?: SkillWeaponSet
  requiredWeaponSet?: SkillWeaponSet
  enabled?: boolean
  experimental?: boolean
  selectionOnly?: boolean
  /**
   * Numerische Wirkung nur aus einer ausdrücklich versionierten technischen
   * Quelle. Fehlende Werte dürfen nicht aus Name, Tags oder Beschreibung
   * geschätzt werden.
   */
  quantitativeEffects?: SupportQuantitativeEffect[]
}

export interface SupportQuantitativeEffect {
  kind: 'more-damage' | 'action-speed' | 'more-critical-chance' | 'critical-damage-bonus'
  percent: number
  damageTypes?: Extract<MechanicTag, 'physical' | 'fire' | 'cold' | 'lightning' | 'chaos'>[]
  evidence: 'structured-exact'
  sourceReference: string
}

export const supportFamilyKey = (
  support: Pick<SupportGemDefinition, 'id' | 'supportFamilyId'>,
): EntityId => support.supportFamilyId ?? support.id

export const supportExclusiveKeys = (
  support: Pick<SupportGemDefinition, 'id' | 'supportFamilyId' | 'supportCategoryIds'>,
): EntityId[] => [supportFamilyKey(support), ...(support.supportCategoryIds ?? [])]

export interface SkillSetup {
  id: EntityId
  skillId: EntityId
  role: SkillRole
  weaponSet: SkillWeaponSet
  supportGemIds: EntityId[]
  origin?: SkillOrigin
  level?: number
  locked?: boolean
  /** Sichtbare, regelbasierte Begründung einer automatischen Synergiezuordnung. */
  synergyReason?: string
}
