import type { MechanicTag } from '../../domain'
import type { ScoreCategory } from '../common/types'

export interface SkillRule {
  ruleId: string
  descriptionKey: string
  requiredSkillTags?: MechanicTag[]
  excludedSkillTags?: MechanicTag[]
  requiredProfileFields?: string[]
  affectedScoreCategory: Exclude<ScoreCategory, 'path-efficiency'>
  weight: number
  threshold?: number
  maximumContribution?: number
  reasonCode: string
  enabled: boolean
}
const mechanic = (tag: MechanicTag): SkillRule => ({ ruleId: `skill-rule-mechanic-${tag}`, descriptionKey: `engine.skill.rule.mechanic.${tag}`, requiredSkillTags: [tag], requiredProfileFields: [`mechanics.${tag}`], affectedScoreCategory: ['buff', 'debuff', 'movement'].includes(tag) ? 'utility' : 'equipment-synergy', weight: 0.28, maximumContribution: 28, reasonCode: `skill-mechanic-${tag}`, enabled: true })
export const SKILL_RULES: SkillRule[] = [
  mechanic('attack'), mechanic('spell'), mechanic('projectile'), mechanic('melee'), mechanic('area'), mechanic('critical'), mechanic('damage-over-time'), mechanic('minion'), mechanic('movement'), mechanic('buff'), mechanic('debuff'),
  { ruleId: 'skill-rule-attack-speed', descriptionKey: 'engine.skill.rule.attackSpeed', requiredSkillTags: ['attack'], requiredProfileFields: ['speed.attackSpeedAffinity'], affectedScoreCategory: 'speed', weight: 0.22, maximumContribution: 22, reasonCode: 'skill-attack-speed', enabled: true },
  { ruleId: 'skill-rule-cast-speed', descriptionKey: 'engine.skill.rule.castSpeed', requiredSkillTags: ['spell'], requiredProfileFields: ['speed.castSpeedAffinity'], affectedScoreCategory: 'speed', weight: 0.22, maximumContribution: 22, reasonCode: 'skill-cast-speed', enabled: true },
  { ruleId: 'skill-rule-movement-speed', descriptionKey: 'engine.skill.rule.movementSpeed', requiredSkillTags: ['movement'], requiredProfileFields: ['speed.movementAffinity'], affectedScoreCategory: 'speed', weight: 0.22, maximumContribution: 22, reasonCode: 'skill-movement-speed', enabled: true },
]
export const HARD_SKILL_RULE_CODES = ['skill-disabled', 'skill-invalid-reference', 'skill-attack-in-spell-only-profile', 'skill-spell-in-attack-only-profile', 'skill-wrong-weapon', 'skill-excluded-weapon', 'skill-required-class', 'skill-excluded-class', 'skill-ascendancy-not-allowed', 'skill-excluded-ascendancy', 'skill-required-tag-missing', 'skill-excluded-tag-present', 'skill-attribute-deficit'] as const
