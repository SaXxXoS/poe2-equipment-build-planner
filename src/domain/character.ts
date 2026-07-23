import type { EntityId, GameDataMetadata } from './common'

export type GoalProfile = 'balanced' | 'mapping' | 'boss'

export type ClassDefinition = GameDataMetadata

export interface AscendancyDefinition extends GameDataMetadata {
  classId: EntityId
}

export interface CharacterConfiguration {
  classId: EntityId
  ascendancyId: EntityId
  level: number
  additionalPassivePoints?: number
  goalProfile: GoalProfile
  desiredMainSkillId?: EntityId
}
