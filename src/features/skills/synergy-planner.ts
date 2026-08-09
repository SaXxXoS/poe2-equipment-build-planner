import type { SkillGemDefinition, SkillRole, SkillWeaponSet } from '../../domain'
import { evaluateSkillInteraction, type SkillInteractionEvidence } from './poe2-interaction-rules'
import { correlatedMetaSkillRelations } from './meta-reference'

type CorrelatedSkillRelations = Map<string, {
  profileCount: number
  share: number
  packageIds: string[]
}>

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
  context?: {
    ascendancyId?: string
    correlatedSkillRelations?: CorrelatedSkillRelations
    mainWeaponSet?: 'set-1' | 'set-2'
  },
): PlannedSynergySkill[] {
  const scores = new Map(recommendationScores.map(value => [value.skillId, value]))
  const explicitCandidates = definitions.flatMap((candidate): PlannedSynergySkill[] => {
    const interaction = evaluateSkillInteraction(main, candidate)
    if (interaction.status !== 'productive' || !interaction.role || !interaction.weaponSet) return []
    const recommendation = scores.get(candidate.id)
    const weaponSet = interaction.weaponSet !== 'both' && context?.mainWeaponSet
      ? (context.mainWeaponSet === 'set-1' ? 'set-2' as const : 'set-1' as const)
      : interaction.weaponSet
    return [{
      skillId: candidate.id,
      role: interaction.role,
      weaponSet,
      reason: interaction.reason,
      score: interaction.score + Math.max(0, recommendation?.totalScore ?? 0) * 0.05,
      evidence: interaction.evidence,
      ruleId: interaction.ruleId,
    }]
  })
  const correlated = context?.correlatedSkillRelations
    ?? (context?.ascendancyId
      ? correlatedMetaSkillRelations(main, context.ascendancyId)
      : new Map())
  const metaCandidates = definitions.flatMap((candidate): PlannedSynergySkill[] => {
    const evidence = correlated.get(candidate.nameEn)
    if (!evidence || candidate.id === main.id) return []
    const recommendation = scores.get(candidate.id)
    const isSetupSkill = Boolean(
      candidate.persistsAfterWeaponSwap
      || candidate.affectsTarget
      || candidate.preferredWeaponSet === 'set-2'
      || candidate.rotationRoles?.some(role => ['setup', 'debuff', 'trigger'].includes(role))
      || candidate.sourceTags?.some(tag => ['curse', 'debuff', 'mark', 'trigger'].includes(tag)),
    )
    const mainWeaponSet = context?.mainWeaponSet ?? 'set-1'
    return [{
      skillId: candidate.id,
      role: candidate.gemType === 'spirit' || candidate.sourceTags?.some(tag =>
        ['aura', 'buff', 'curse', 'debuff', 'mark', 'meta', 'persistent', 'trigger'].includes(tag),
      ) ? 'utility' : 'secondary',
      // Eine saisonale Korrelation allein belegt noch keinen Waffenwechsel.
      // Nur technisch als vorbereitend/anhaltend markierte Fertigkeiten
      // erhalten das Gegen-Set; alle anderen bleiben in beiden Sets aktiv.
      weaponSet: isSetupSkill
        ? (mainWeaponSet === 'set-1' ? 'set-2' : 'set-1')
        : 'both',
      reason: `${evidence.profileCount} lokal gepinnte Profile derselben Aszendenz belegen diese Fertigkeit gemeinsam mit dem Hauptskill.`,
      // Eine innerhalb desselben aktuellen Profils beobachtete Skillgruppe
      // ist für die Paketwahl spezifischer als eine allgemein gültige
      // mechanische Kombination. Die mechanische Regel bleibt der Fallback,
      // wenn für die konkrete Aszendenz kein korreliertes Paket vorliegt.
      score: 1_500
        + Math.min(250, evidence.profileCount * 20)
        + Math.min(100, evidence.share)
        + Math.max(0, recommendation?.totalScore ?? 0) * 0.02,
      evidence: 'multi-profile-correlated-exact',
      ruleId: `meta-package:${evidence.packageIds.join('+')}`,
    }]
  })

  return [...explicitCandidates, ...metaCandidates]
    .sort((a, b) => b.score - a.score || a.skillId.localeCompare(b.skillId))
    .filter((value, index, all) => all.findIndex(candidate => candidate.skillId === value.skillId) === index)
    .slice(0, Math.max(0, limit))
}
