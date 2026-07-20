import type { EntityId, GameDataMetadata } from './common'
import type { ModifierDefinition } from './modifiers'
import type { SkillWeaponSet } from './skills'

export const PASSIVE_NODE_TYPES = ['normal', 'notable', 'keystone', 'jewel-socket', 'cluster-socket', 'ascendancy'] as const
export type PassiveNodeType = (typeof PASSIVE_NODE_TYPES)[number]
export interface Position { x: number; y: number }

export interface PassiveNodeDefinition extends GameDataMetadata {
  nodeType: PassiveNodeType
  position: Position
  modifiers: ModifierDefinition[]
  connectedNodeIds: EntityId[]
  requiredClassId?: EntityId
  requiredAscendancyId?: EntityId
  weaponSet?: SkillWeaponSet
  selected: boolean
}

export interface PassiveConnection {
  id: EntityId
  fromNodeId: EntityId
  toNodeId: EntityId
  selected: boolean
}
