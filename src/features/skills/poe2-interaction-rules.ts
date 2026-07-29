import type { SkillGemDefinition, SkillRole, SkillWeaponSet } from '../../domain'

export type SkillInteractionEvidence =
  | 'structured-exact'
  | 'structured-derived'
  | 'explicit-rule'
  | 'heuristic-only'
  | 'blocked'

export interface SkillInteraction {
  status: 'productive' | 'audit-only' | 'blocked'
  evidence: SkillInteractionEvidence
  role?: SkillRole
  weaponSet?: SkillWeaponSet
  score: number
  reason: string
  ruleId: string
}

const elementalTags = new Set(['fire', 'cold', 'lightning'])
const hasAny = (skill: SkillGemDefinition, tags: Set<string>) =>
  skill.tags.some(tag => tags.has(tag))

/** Fail-closed: gleiche Tags sind nur ein Suchhinweis, kein Wirkungsbeleg. */
export function evaluateSkillInteraction(
  main: SkillGemDefinition,
  candidate: SkillGemDefinition,
): SkillInteraction {
  if (candidate.id === main.id || candidate.enabled === false) {
    return { status: 'blocked', evidence: 'blocked', score: 0, reason: 'Die Fertigkeit kann nicht als eigene Ergänzung verwendet werden.', ruleId: 'skill.same-or-disabled' }
  }

  if (candidate.nameEn === 'Orb of Storms') {
    return main.tags.includes('spell') && main.tags.includes('lightning')
      ? { status: 'productive', evidence: 'explicit-rule', role: 'utility', weaponSet: 'set-2', score: 1_100, reason: 'Die anhaltende Kugel reagiert auf gewirkte Blitzzauber und ergänzt dadurch den Blitz-Hauptskill.', ruleId: 'interaction.orb-of-storms.lightning-spell' }
      : { status: 'blocked', evidence: 'blocked', score: 0, reason: 'Kugel der Stürme benötigt hier einen gewirkten Blitzzauber als belegten Auslöser.', ruleId: 'interaction.orb-of-storms.incompatible' }
  }

  if (candidate.nameEn === 'Elemental Weakness') {
    return hasAny(main, elementalTags)
      ? { status: 'productive', evidence: 'explicit-rule', role: 'utility', weaponSet: 'set-2', score: 1_050, reason: 'Der Fluch senkt Elementarwiderstände für den belegten Feuer-, Kälte- oder Blitzschaden des Hauptskills.', ruleId: 'interaction.elemental-weakness.elemental-damage' }
      : { status: 'blocked', evidence: 'blocked', score: 0, reason: 'Ohne belegten Elementarschaden entsteht keine produktive Beziehung.', ruleId: 'interaction.elemental-weakness.non-elemental' }
  }

  const explicitTargetRules = [
    { name: 'Vulnerability', required: (skill: SkillGemDefinition) => skill.tags.includes('physical'), reason: 'Der Fluch bereitet das Ziel für den belegten physischen Hauptschaden vor.', ruleId: 'interaction.vulnerability.physical' },
    { name: 'Despair', required: (skill: SkillGemDefinition) => skill.tags.includes('chaos'), reason: 'Der Fluch bereitet das Ziel für den belegten Chaosschaden vor.', ruleId: 'interaction.despair.chaos' },
    { name: 'Voltaic Mark', required: (skill: SkillGemDefinition) => skill.tags.includes('attack') && skill.tags.includes('lightning'), reason: 'Die Markierung bereitet das Ziel für den belegten Blitzangriff vor.', ruleId: 'interaction.voltaic-mark.lightning-attack' },
  ]
  const targetRule = explicitTargetRules.find(rule => rule.name === candidate.nameEn)
  if (targetRule) {
    return targetRule.required(main)
      ? { status: 'productive', evidence: 'explicit-rule', role: 'utility', weaponSet: 'set-2', score: 1_050, reason: targetRule.reason, ruleId: targetRule.ruleId }
      : { status: 'blocked', evidence: 'blocked', score: 0, reason: 'Die erforderliche Schadens- oder Angriffsart des Hauptskills ist nicht belegt.', ruleId: `${targetRule.ruleId}.incompatible` }
  }

  const rotationRole = candidate.rotationRoles?.[0]
  if (
    candidate.persistsAfterWeaponSwap
    && (candidate.affectsTarget || candidate.affectsPlayer || candidate.affectsNextSkill)
    && ['setup', 'debuff', 'buff'].includes(rotationRole ?? '')
  ) {
    return { status: 'productive', evidence: 'structured-derived', role: 'utility', weaponSet: 'set-2', score: 700, reason: 'Die strukturierten Daten belegen eine anhaltende Vorbereitung, deren Wirkung nach dem Waffenwechsel erhalten bleibt.', ruleId: 'interaction.persistent-setup.structured' }
  }

  const independentRole: SkillRole | undefined =
    rotationRole === 'movement' && candidate.tags.includes('movement') ? 'movement'
      : rotationRole === 'defensive' && candidate.tags.includes('defensive') && candidate.affectsPlayer ? 'defensive'
        : undefined
  if (independentRole) {
    return {
      status: 'productive', evidence: 'structured-exact', role: independentRole,
      weaponSet: candidate.preferredWeaponSet ?? 'both', score: 450,
      reason: independentRole === 'movement' ? 'Die Fertigkeit besitzt eine strukturierte Bewegungsrolle.' : 'Die Fertigkeit besitzt eine strukturierte defensive Spielerwirkung.',
      ruleId: `interaction.independent-${independentRole}.structured`,
    }
  }

  const sharedTags = main.tags.filter(tag => candidate.tags.includes(tag))
  return {
    status: 'audit-only', evidence: 'heuristic-only', score: 0,
    reason: sharedTags.length ? `Gemeinsame Tags (${sharedTags.join(', ')}) sind nur ein Kandidatenhinweis und kein Wirkungsbeleg.` : 'Zwischen den Fertigkeiten ist keine produktiv belegte Wirkung vorhanden.',
    ruleId: 'interaction.shared-tags-not-proof',
  }
}
