import type { EntityId, GameDataMetadata } from './common'
import type { ModifierDefinition } from './modifiers'
import type { SkillWeaponSet } from './skills'

export type JewelType = 'normal' | 'cluster' | 'unique-cluster'
export type ClusterSize = 'small' | 'medium' | 'large'
export interface JewelRequirements { requiredSocketType?: 'jewel-socket' | 'cluster-socket'; requiredClassId?: EntityId; allowedAscendancyIds?: EntityId[]; excludedAscendancyIds?: EntityId[]; attributeRequirements?: Partial<Record<'strength' | 'dexterity' | 'intelligence', number>>; levelRequirement?: number; weaponSet?: SkillWeaponSet; enabled?: boolean; experimental?: boolean; entryPointCost?: number; internalPathCost?: number; socketPointCost?: number }

export interface JewelDefinition extends GameDataMetadata, JewelRequirements {
  jewelType: 'normal'
  description: string
  modifiers: ModifierDefinition[]
  socketRequirement?: string
  socketRadius?: number
  affectedNodeIds?: EntityId[]
  effectScope?: 'local' | 'global'
}

export interface ClusterJewelDefinition extends GameDataMetadata, JewelRequirements {
  jewelType: 'cluster'
  description: string
  modifiers: ModifierDefinition[]
  socketRequirement?: string
  clusterSize: ClusterSize
  possiblePassiveNodeIds: EntityId[]
  additionalPathCost: number
  passiveNodeIds?: EntityId[]
  notableNodeIds?: EntityId[]
  addedSocketCount?: number
  maximumAllocatedNodes?: number
  clusterTags?: string[]
}

export interface UniqueClusterJewelDefinition extends GameDataMetadata, JewelRequirements {
  jewelType: 'unique-cluster'
  description: string
  modifiers: ModifierDefinition[]
  socketRequirement?: string
  uniqueMechanicIds?: string[]
  requiredMechanicIds?: string[]
  buildEnabler?: boolean
  gainedMechanics?: string[]
  lostMechanics?: string[]
  restrictions?: string[]
  tradeOffs?: string[]
  fixedPassiveStructure?: EntityId[]
}

export type AnyJewelDefinition = JewelDefinition | ClusterJewelDefinition | UniqueClusterJewelDefinition
