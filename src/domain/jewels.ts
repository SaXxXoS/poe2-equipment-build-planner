import type { EntityId, GameDataMetadata } from './common'
import type { ModifierDefinition } from './modifiers'

export type JewelType = 'normal' | 'cluster' | 'unique-cluster'
export type ClusterSize = 'small' | 'medium' | 'large'

export interface JewelDefinition extends GameDataMetadata {
  jewelType: 'normal'
  description: string
  modifiers: ModifierDefinition[]
  socketRequirement?: string
}

export interface ClusterJewelDefinition extends GameDataMetadata {
  jewelType: 'cluster'
  description: string
  modifiers: ModifierDefinition[]
  socketRequirement?: string
  clusterSize: ClusterSize
  possiblePassiveNodeIds: EntityId[]
  additionalPathCost: number
}

export interface UniqueClusterJewelDefinition extends GameDataMetadata {
  jewelType: 'unique-cluster'
  description: string
  modifiers: ModifierDefinition[]
  socketRequirement?: string
}

export type AnyJewelDefinition = JewelDefinition | ClusterJewelDefinition | UniqueClusterJewelDefinition
