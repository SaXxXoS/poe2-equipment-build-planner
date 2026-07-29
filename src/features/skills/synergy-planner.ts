import type { SkillGemDefinition, SkillRole, SkillWeaponSet } from '../../domain'
import { evaluateSkillInteraction, type SkillInteractionEvidence } from './poe2-interaction-rules'

export interface SkillSynergyScore {
  skillId: string
  totalScore: number
  damageScore: number
}

export interface PlannedSynergySkill {
  skillId: string
  role: SkillRole
  weaponSet: SkillWeaponSet
  reason: string
  score: number
  evidence: SkillInteractionEvidence
  ruleId: string
}

/** Plant nur Skills mit belegbarer Beziehung; fehlende Evidenz lässt Slots leer. */
export function planSynergisticSkills(
  main: SkillGemDefinition,
  definitions: SkillGemDefinition[],
  recommendationScores: SkillSynergyScore[],
  limit: number,
): PlannedSynergySkill[] {
  const scores = new Map(recommendationScores.map(value => [value.skillId, value]))
  const candidates = definitions.flatMap((candidate): PlannedSynergySkill[] => {
    const interaction = evaluateSkillInteraction(main, candidate)
    if (interaction.status !== 'productive' || !interaction.role || !interaction.weaponSet) return []
    const recommendation = scores.get(candidate.id)
    return [{
      skillId: candidate.id,
      role: interaction.role,
      weaponSet: interaction.weaponSet,
      reason: interaction.reason,
      score: interaction.score + Math.max(0, recommendation?.totalScore ?? 0) * 0.05,
      evidence: interaction.evidence,
      ruleId: interaction.ruleId,
    }]
  })

  return candidates
    .sort((a, b) => b.score - a.score || a.skillId.localeCompare(b.skillId))
    .filter((value, index, all) => all.findIndex(candidate => candidate.skillId === value.skillId) === index)
    .slice(0, Math.max(0, limit))
}
