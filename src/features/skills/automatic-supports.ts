import {
  supportExclusiveKeys,
  type EquipmentEntry,
  type SkillGemDefinition,
  type SkillSetup,
  type SupportGemDefinition,
} from '../../domain'
import { resolveResourceSpiritModel } from '../../engine/damage-estimation/resource-spirit-model'

export interface RankedSupportForSkill {
  skillId: string
  supportId: string
}

export interface ResourceAwareSupportContext {
  equipment: EquipmentEntry[]
  setups: SkillSetup[]
  skills: SkillGemDefinition[]
  characterLevel?: number
}

function resourceRisk(
  setup: SkillSetup,
  supportIds: string[],
  definitions: SupportGemDefinition[],
  context: ResourceAwareSupportContext,
) {
  const trialSetups = context.setups.map(value =>
    value.id === setup.id ? { ...value, supportGemIds: supportIds } : value,
  )
  const model = resolveResourceSpiritModel({
    equipment: context.equipment,
    setups: trialSetups,
    skills: context.skills,
    supports: definitions,
    characterLevel: context.characterLevel,
  })
  const chain = model.skillCostChains.find(value => value.setupId === setup.id)
  const relevantSets = setup.weaponSet === 'both' ? ['set-1', 'set-2'] : [setup.weaponSet]
  const capacityStates = model.spiritCapacityByWeaponSet.filter(value =>
    relevantSets.includes(value.weaponSet),
  )
  const hardBlocked = chain?.sustainStatus === 'unusable-confirmed-zero-mana'
    || capacityStates.some(value => value.status === 'exceeds-level-derived-quest-estimate')
  const effectiveManaPool = chain?.effectiveManaPool
  const manaRatio = effectiveManaPool && chain.baseCosts.length
    ? Math.max(...chain.baseCosts.map(value =>
      value.resource === 'mana'
        ? value.resourceAdjustedAmount / effectiveManaPool
        : 0,
    ))
    : 0
  const sustainRisk = chain?.sustainStatus === 'burst-affordable-on-confirmed-minimum' ? 18
    : chain?.sustainStatus === 'blocked-missing-action-frequency' ? 8
      : 0
  const spiritRisk = capacityStates.some(value => value.status === 'exceeds-confirmed-minimum') ? 12
    : capacityStates.some(value => value.status === 'fits-level-derived-quest-estimate') ? 4
      : 0
  return {
    hardBlocked,
    penalty: sustainRisk + spiritRisk + Math.round(manaRatio * 100),
  }
}

export function fillRecommendedSupportSlots(
  setup: SkillSetup,
  ranked: RankedSupportForSkill[],
  definitions: SupportGemDefinition[],
  limit = 5,
  resourceContext?: ResourceAwareSupportContext,
): SkillSetup {
  if (!setup.skillId || setup.supportGemIds.length >= limit) return setup

  const byId = new Map(definitions.map(item => [item.id, item]))
  const selected = [...setup.supportGemIds]
  const usedKeys = new Set(selected.flatMap(id => {
    const definition = byId.get(id)
    return definition ? supportExclusiveKeys(definition) : [id]
  }))

  const candidates = ranked.filter(candidate => candidate.skillId === setup.skillId)
  while (selected.length < limit) {
    const available = candidates.flatMap((candidate, rankIndex) => {
      if (selected.includes(candidate.supportId)) return []
      const definition = byId.get(candidate.supportId)
      if (!definition) return []
      const keys = supportExclusiveKeys(definition)
      if (keys.some(key => usedKeys.has(key))) return []
      const risk = resourceContext
        ? resourceRisk(setup, [...selected, candidate.supportId], definitions, resourceContext)
        : { hardBlocked: false, penalty: 0 }
      return [{ candidate, definition, keys, rankIndex, ...risk }]
    }).sort((left, right) =>
      Number(left.hardBlocked) - Number(right.hardBlocked)
      || left.rankIndex * 4 + left.penalty - (right.rankIndex * 4 + right.penalty)
      || left.candidate.supportId.localeCompare(right.candidate.supportId),
    )
    const choice = available.find(value => !value.hardBlocked)
    if (!choice) break
    selected.push(choice.candidate.supportId)
    choice.keys.forEach(key => usedKeys.add(key))
  }

  return selected.length === setup.supportGemIds.length
    ? setup
    : { ...setup, supportGemIds: selected }
}
