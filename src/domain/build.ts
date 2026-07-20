import type { EntityId } from './common'
import type { CharacterConfiguration, GoalProfile } from './character'
import type { EquipmentEntry } from './equipment'
import type { SkillSetup } from './skills'
import type { Recommendation, RotationStep } from './recommendations'

export interface JewelSelection {
  slotId: EntityId
  jewelId: EntityId
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
