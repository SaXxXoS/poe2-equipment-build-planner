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
  passivePlanAdjusted?: boolean
}

export interface PostPassiveResourceRiskSummary {
  hardConflictSetupIds: string[]
  totalPenalty: number
}

export function summarizePostPassiveResourceRisk(input: {
  equipment: EquipmentEntry[]
  setups: SkillSetup[]
  skills: SkillGemDefinition[]
  supports: SupportGemDefinition[]
  characterLevel?: number
  passiveTree: RealPassiveTree
  realPassivePlanning: RealPassivePlanningIntegrationResult
}): PostPassiveResourceRiskSummary {
  const context: ResourceAwareSupportContext = {
    equipment: input.equipment,
    setups: input.setups,
    skills: input.skills,
    characterLevel: input.characterLevel,
    passiveTree: input.passiveTree,
    realPassivePlanning: input.realPassivePlanning,
  }
  const risks = input.setups
    .filter(setup => Boolean(setup.skillId))
    .map(setup => ({ setup, risk: supportResourceRisk(setup, setup.supportGemIds, input.supports, context, 'absolute') }))
  return {
    hardConflictSetupIds: risks.filter(value => value.risk.hardBlocked).map(value => value.setup.id),
    totalPenalty: risks.reduce((sum, value) => sum + value.risk.penalty, 0),
  }
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
    const current = supportResourceRisk(original, original.supportGemIds, input.supports, context, 'absolute')
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
      'absolute',
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
