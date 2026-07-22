import type { EntityId } from './common'
import type { CharacterConfiguration, GoalProfile } from './character'
import type { EquipmentEntry } from './equipment'
import type { SkillSetup } from './skills'
import type { Recommendation, RotationStep } from './recommendations'

export interface JewelSelection {
  slotId: EntityId
  jewelId: EntityId
  baseItemId?: EntityId
  itemClassId?: EntityId
  itemLevel?: number
  sourceVersion?: string
  dataStatus?: string
  modifiers?: { modifierId:EntityId; tierId?:EntityId; statValues:{statId:EntityId;value:number}[] }[]
}

export interface BuildInput {
  character: CharacterConfiguration
  equipment: EquipmentEntry[]
  skillSetups: SkillSetup[]
  selectedJewels: JewelSelection[]
  goalProfile: GoalProfile
}

export interface BuildResult {
  id: EntityId
  isPlaceholder: boolean
  mainSkillId: EntityId
  additionalSkillIds: EntityId[]
  supportGemIds: EntityId[]
  weaponSetRecommendations: { weaponSet: 'set-1' | 'set-2'; skillIds: EntityId[] }[]
  passivePathNodeIds: EntityId[]
  jewelRecommendationIds: EntityId[]
  clusterRecommendationIds: EntityId[]
  uniqueClusterRecommendationIds: EntityId[]
  uniqueRecommendations: Recommendation[]
  affixRecommendations: Recommendation[]
  mappingRotation: RotationStep[]
  bossRotation: RotationStep[]
  explanation: string
  skillOrderExplanation: string
  weaponSwapExplanation: string
}
