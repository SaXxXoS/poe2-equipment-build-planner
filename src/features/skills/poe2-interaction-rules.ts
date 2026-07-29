import type {
  SkillGemDefinition,
  SkillRole,
  SkillWeaponSet,
  SupportGemDefinition,
  SyntheticWeaponType,
} from '../../domain'

export type SkillInteractionEvidence =
  | 'structured-exact'
  | 'structured-derived'
  | 'explicit-rule'
  | 'multi-profile-correlated-exact'
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
const meleeWeapons = new Set<SyntheticWeaponType>(['axe', 'claw', 'dagger', 'flail', 'mace', 'quarterstaff', 'spear', 'sword'])
const rangedWeapons = new Set<SyntheticWeaponType>(['bow', 'crossbow', 'wand'])
const hasAny = (skill: SkillGemDefinition, tags: Set<string>) =>
  skill.tags.some(tag => tags.has(tag))

export function weaponTypeMatches(
  required: SyntheticWeaponType[] | undefined,
  weapon: SyntheticWeaponType,
) {
  if (!required?.length || required.includes('any')) return true
  return required.some(value =>
    value === weapon
    || value === 'melee-weapon' && meleeWeapons.has(weapon)
    || value === 'ranged-weapon' && rangedWeapons.has(weapon),
  )
}

export function evaluateSkillWeaponCompatibility(
  skill: SkillGemDefinition,
  weapon: SyntheticWeaponType,
): SkillInteraction {
  if (skill.excludedWeaponTypes?.some(type => weaponTypeMatches([type], weapon))) {
    return { status: 'blocked', evidence: 'blocked', score: 0, reason: 'Die Waffenart ist für diese Fertigkeit ausdrücklich ausgeschlossen.', ruleId: 'skill-weapon.excluded' }
  }
  if (!weaponTypeMatches(skill.requiredWeaponTypes, weapon)) {
    return { status: 'blocked', evidence: 'blocked', score: 0, reason: 'Die belegte Waffenanforderung der Fertigkeit wird nicht erfüllt.', ruleId: 'skill-weapon.required-missing' }
  }
  return {
    status: 'productive',
    evidence: skill.requiredWeaponTypes?.length ? 'structured-exact' : 'structured-derived',
    score: skill.requiredWeaponTypes?.length ? 100 : 20,
    reason: skill.requiredWeaponTypes?.length
      ? 'Die Waffenart erfüllt die strukturierte Waffenanforderung der Fertigkeit.'
      : 'Für die Fertigkeit ist keine einschränkende Waffenart belegt.',
    ruleId: skill.requiredWeaponTypes?.length ? 'skill-weapon.required-match' : 'skill-weapon.no-restriction',
  }
}

export function evaluateSupportInteraction(
  skill: SkillGemDefinition,
  support: SupportGemDefinition,
  weapon: SyntheticWeaponType,
  role: SkillRole = 'main',
): SkillInteraction {
  if (support.enabled === false) return { status: 'blocked', evidence: 'blocked', score: 0, reason: 'Der Support ist deaktiviert.', ruleId: 'support.disabled' }
  const recommended = skill.recommendedSupportIds?.includes(support.id) === true
  if (support.selectionOnly && !recommended) return { status: 'blocked', evidence: 'blocked', score: 0, reason: 'Für diesen Support fehlt die strukturierte Skill-Zuordnung.', ruleId: 'support.not-recommended-for-skill' }
  if (skill.recommendedSupportIds?.length && !recommended) return { status: 'blocked', evidence: 'blocked', score: 0, reason: 'Der gepinnte Skilldatensatz ordnet diesen Support nicht zu.', ruleId: 'support.not-in-skill-chain' }
  if (support.requiredTags.some(tag => !skill.tags.includes(tag))) return { status: 'blocked', evidence: 'blocked', score: 0, reason: 'Ein erforderliches Fertigkeitsmerkmal fehlt.', ruleId: 'support.required-tag-missing' }
  if (support.excludedTags.some(tag => skill.tags.includes(tag))) return { status: 'blocked', evidence: 'blocked', score: 0, reason: 'Der Support schließt ein Merkmal der Fertigkeit aus.', ruleId: 'support.excluded-tag' }
  if (support.supportedDamageTypes?.some(tag => !skill.tags.includes(tag))) return { status: 'blocked', evidence: 'blocked', score: 0, reason: 'Die erforderliche Schadensart fehlt.', ruleId: 'support.damage-type-missing' }
  if (support.supportedMechanics?.some(tag => !skill.tags.includes(tag))) return { status: 'blocked', evidence: 'blocked', score: 0, reason: 'Die erforderliche Mechanik fehlt.', ruleId: 'support.mechanic-missing' }
  if (support.excludedDamageTypes?.some(tag => skill.tags.includes(tag))) return { status: 'blocked', evidence: 'blocked', score: 0, reason: 'Die Schadensart ist für diesen Support ausgeschlossen.', ruleId: 'support.damage-type-excluded' }
  if (!weaponTypeMatches(support.requiredWeaponTypes, weapon)) return { status: 'blocked', evidence: 'blocked', score: 0, reason: 'Die Waffenanforderung des Supports wird nicht erfüllt.', ruleId: 'support.weapon-required-missing' }
  if (support.excludedWeaponTypes?.some(type => weaponTypeMatches([type], weapon))) return { status: 'blocked', evidence: 'blocked', score: 0, reason: 'Die Waffenart ist für diesen Support ausgeschlossen.', ruleId: 'support.weapon-excluded' }
  if (support.allowedSkillRoles?.length && !support.allowedSkillRoles.includes(role)) return { status: 'blocked', evidence: 'blocked', score: 0, reason: 'Der Support ist für diese Skillrolle nicht zugelassen.', ruleId: 'support.role-not-allowed' }
  if (support.excludedSkillRoles?.includes(role)) return { status: 'blocked', evidence: 'blocked', score: 0, reason: 'Der Support schließt diese Skillrolle aus.', ruleId: 'support.role-excluded' }
  return {
    status: 'productive',
    evidence: recommended ? 'structured-exact' : 'structured-derived',
    score: recommended ? 100 : 25,
    reason: recommended
      ? 'Der gepinnte Skilldatensatz ordnet diesen Support der Fertigkeit zu; alle harten Regeln sind erfüllt.'
      : 'Alle vorhandenen strukturierten Kompatibilitätsregeln sind erfüllt.',
    ruleId: recommended ? 'support.recommended-chain-valid' : 'support.structured-rules-valid',
  }
}

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
