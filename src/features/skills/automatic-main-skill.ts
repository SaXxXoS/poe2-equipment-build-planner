import type { EquipmentEntry, SkillGemDefinition, SkillSetup } from '../../domain'
import { estimateHitDamage } from '../../engine'
import { scoreCharacterSkillAffinity } from './character-skill-affinity'

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
    })
    const affinityScore = definition
      ? scoreCharacterSkillAffinity(definition, input.classId, input.ascendancyId).score
      : 0
    return { candidate, modeledDps: estimate.hitDamagePerSecond ?? -1, affinityScore }
  }).sort((left, right) => {
    const primary = equipmentFirst
      ? right.modeledDps - left.modeledDps
      : right.affinityScore - left.affinityScore
    const secondary = equipmentFirst
      ? right.affinityScore - left.affinityScore
      : right.modeledDps - left.modeledDps
    return primary || secondary
      || right.candidate.damageScore - left.candidate.damageScore
      || right.candidate.totalScore - left.candidate.totalScore
      || left.candidate.skillId.localeCompare(right.candidate.skillId)
  })[0]?.candidate
}
