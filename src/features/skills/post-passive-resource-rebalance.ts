import type {
  EquipmentEntry,
  SkillGemDefinition,
  SkillSetup,
  SupportGemDefinition,
} from '../../domain'
import type { RealPassivePlanningIntegrationResult, RealPassiveTree } from '../../engine'
import {
  fillRecommendedSupportSlots,
  supportResourceRisk,
  type RankedSupportForSkill,
  type ResourceAwareSupportContext,
} from './automatic-supports'

export interface PostPassiveResourceRebalanceResult {
  setups: SkillSetup[]
  adjustedSetupIds: string[]
  manualConflictSetupIds: string[]
}

export function rebalanceSupportsAfterPassivePlanning(input: {
  equipment: EquipmentEntry[]
  setups: SkillSetup[]
  skills: SkillGemDefinition[]
  supports: SupportGemDefinition[]
  rankedSupports: RankedSupportForSkill[]
  characterLevel?: number
  passiveTree: RealPassiveTree
  realPassivePlanning: RealPassivePlanningIntegrationResult
  limit?: number
}): PostPassiveResourceRebalanceResult {
  const adjustedSetupIds: string[] = []
  const manualConflictSetupIds: string[] = []
  let nextSetups = input.setups

  for (const original of input.setups) {
    if (!original.skillId) continue
    const context: ResourceAwareSupportContext = {
      equipment: input.equipment,
      setups: nextSetups,
      skills: input.skills,
      characterLevel: input.characterLevel,
      passiveTree: input.passiveTree,
      realPassivePlanning: input.realPassivePlanning,
    }
    const current = supportResourceRisk(original, original.supportGemIds, input.supports, context)
    if (original.origin !== 'recommended') {
      if (current.hardBlocked) manualConflictSetupIds.push(original.id)
      continue
    }

    const empty = { ...original, supportGemIds: [] }
    const alternative = fillRecommendedSupportSlots(
      empty,
      input.rankedSupports,
      input.supports,
      input.limit ?? 5,
      { ...context, setups: nextSetups.map(value => value.id === original.id ? empty : value) },
    )
    const alternativeRisk = supportResourceRisk(
      alternative,
      alternative.supportGemIds,
      input.supports,
      { ...context, setups: nextSetups.map(value => value.id === original.id ? alternative : value) },
    )
    const improves = alternative.supportGemIds.length > 0
      && (current.hardBlocked
        ? !alternativeRisk.hardBlocked
        : !alternativeRisk.hardBlocked && alternativeRisk.penalty < current.penalty)
    if (!improves || alternative.supportGemIds.join('|') === original.supportGemIds.join('|')) continue

    nextSetups = nextSetups.map(value => value.id === original.id
      ? {
          ...alternative,
          synergyReason: [value.synergyReason, 'Supportkombination nach der realen Ressourcenprüfung angepasst.']
            .filter(Boolean)
            .join(' '),
        }
      : value)
    adjustedSetupIds.push(original.id)
  }

  return {
    setups: nextSetups,
    adjustedSetupIds,
    manualConflictSetupIds,
  }
}
