import type { SkillGemDefinition, SkillRole, SkillWeaponSet } from '../../domain'

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
}

const damageTags = new Set(['physical', 'fire', 'cold', 'lightning', 'chaos'])
const auxiliaryTags = new Set(['buff', 'debuff', 'defensive', 'movement'])
const shared = (left: string[], right: string[]) => left.filter(value => right.includes(value))

function directSetupScore(main: SkillGemDefinition, candidate: SkillGemDefinition) {
  if (candidate.nameEn === 'Orb of Storms' && main.tags.includes('spell')) {
    return {
      score: 1_000 + (main.tags.includes('lightning') ? 100 : 0),
      reason: main.tags.includes('lightning')
        ? 'Die anhaltende Kugel löst beim Wirken des Blitzzaubers zusätzliche Entladungen aus.'
        : 'Die anhaltende Kugel löst beim Wirken des Zaubers zusätzliche Entladungen aus.',
    }
  }
  return null
}

/**
 * Plant ausschließlich Skills mit belegbarer Beziehung zum Hauptskill.
 * Fehlende Evidenz führt zu einem leeren Slot statt zu einer Füllempfehlung.
 */
export function planSynergisticSkills(
  main: SkillGemDefinition,
  definitions: SkillGemDefinition[],
  recommendationScores: SkillSynergyScore[],
  limit: number,
): PlannedSynergySkill[] {
  const scores = new Map(recommendationScores.map(value => [value.skillId, value]))
  const mainDamage = main.tags.filter(tag => damageTags.has(tag))
  const candidates = definitions.flatMap((candidate): PlannedSynergySkill[] => {
    if (candidate.id === main.id || candidate.enabled === false) return []
    const direct = directSetupScore(main, candidate)
    if (direct) return [{ skillId: candidate.id, role: 'utility', weaponSet: 'set-2', reason: direct.reason, score: direct.score }]

    const rotationRole = candidate.rotationRoles?.[0]
    const isAuxiliary = candidate.tags.some(tag => auxiliaryTags.has(tag))
      || ['buff', 'debuff', 'defensive', 'movement', 'setup'].includes(rotationRole ?? '')
    if (!isAuxiliary) return []

    const overlappingDamage = shared(mainDamage, candidate.tags)
    const genericUtility = candidate.tags.some(tag => ['defensive', 'movement', 'buff'].includes(tag))
    if (!overlappingDamage.length && !genericUtility && !candidate.tags.includes('debuff')) return []

    const recommendation = scores.get(candidate.id)
    const role: SkillRole = candidate.tags.includes('movement') ? 'movement'
      : candidate.tags.includes('defensive') ? 'defensive'
        : 'utility'
    const setupLike = rotationRole === 'setup' || rotationRole === 'debuff' || candidate.tags.includes('debuff')
    return [{
      skillId: candidate.id,
      role,
      weaponSet: setupLike && candidate.persistsAfterWeaponSwap ? 'set-2' : (candidate.preferredWeaponSet ?? 'both'),
      reason: overlappingDamage.length
        ? `Gemeinsame belegte Skalierung: ${overlappingDamage.join(', ')}.`
        : `Belegte ${role === 'movement' ? 'Bewegungs-' : role === 'defensive' ? 'Defensiv-' : 'Hilfs'}funktion.`,
      score: (recommendation?.totalScore ?? 0) + (recommendation?.damageScore ?? 0) + overlappingDamage.length * 50,
    }]
  })

  return candidates
    .sort((a, b) => b.score - a.score || a.skillId.localeCompare(b.skillId))
    .filter((value, index, all) => all.findIndex(candidate => candidate.skillId === value.skillId) === index)
    .slice(0, Math.max(0, limit))
}
