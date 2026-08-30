import type { EquipmentEntry, GoalProfile, SkillGemDefinition, SkillSetup } from '../../domain'
import { automaticEnemyProfile, estimateHitDamage } from '../../engine'
import { scoreCharacterSkillAffinity } from './character-skill-affinity'
import { sustainedDamageObjective } from './build-variant-optimizer'

export interface AutomaticMainCandidate {
  skillId: string
  damageScore: number
  totalScore: number
}

const hasEquipment = (equipment: EquipmentEntry[]) => equipment.some(entry =>
  Boolean(entry.itemClassId || entry.itemDefinitionId || entry.uniqueItemId || entry.modifierValues.length),
)

export function selectAutomaticMainSkill<T extends AutomaticMainCandidate>(input: {
  candidates: T[]
  definitions: SkillGemDefinition[]
  equipment: EquipmentEntry[]
  setups: SkillSetup[]
  classId: string
  ascendancyId: string
  goalProfile?: GoalProfile
  characterLevel?: number
}): T | undefined {
  const equipmentFirst = hasEquipment(input.equipment)
  return input.candidates.map(candidate => {
    const definition = input.definitions.find(value => value.id === candidate.skillId)
    const trialSetup = {
      ...input.setups[0],
      skillId: candidate.skillId,
      role: 'main' as const,
      supportGemIds: [],
    }
    const estimate = estimateHitDamage({
      equipment: input.equipment,
      setups: [trialSetup],
      skills: input.definitions,
      fallbackSkillId: candidate.skillId,
      characterLevel: input.characterLevel,
      enemyProfile: automaticEnemyProfile(input.goalProfile ?? 'balanced', input.characterLevel),
    })
    const affinityScore = definition
      ? scoreCharacterSkillAffinity(definition, input.classId, input.ascendancyId).score
      : 0
    const resourceModel = estimate.resourceSpiritModel
    const chain = resourceModel?.skillCostChains.find(value => value.setupId === trialSetup.id)
    const relevantSets = trialSetup.weaponSet === 'both' ? ['set-1', 'set-2'] : [trialSetup.weaponSet]
    const spiritStates = resourceModel?.spiritCapacityByWeaponSet.filter(value => relevantSets.includes(value.weaponSet)) ?? []
    const resourceBlocked = chain?.sustainStatus === 'unusable-confirmed-zero-mana'
      || spiritStates.some(value => value.status === 'exceeds-level-derived-quest-estimate')
    const resourcePenalty = (chain?.sustainStatus === 'burst-affordable-on-confirmed-minimum' ? 20 : 0)
      + (spiritStates.some(value => value.status === 'exceeds-confirmed-minimum') ? 12 : 0)
    return { candidate, modeledDps: sustainedDamageObjective(estimate).value ?? -1, affinityScore, resourceBlocked, resourcePenalty }
  }).sort((left, right) => {
    const blocked = Number(left.resourceBlocked) - Number(right.resourceBlocked)
    const primary = equipmentFirst
      ? right.modeledDps - left.modeledDps
      : right.affinityScore - left.affinityScore
    const secondary = equipmentFirst
      ? right.affinityScore - left.affinityScore
      : right.modeledDps - left.modeledDps
    return blocked || primary || secondary
      || left.resourcePenalty - right.resourcePenalty
      || right.candidate.damageScore - left.candidate.damageScore
      || right.candidate.totalScore - left.candidate.totalScore
      || left.candidate.skillId.localeCompare(right.candidate.skillId)
  })[0]?.candidate
}
