import type { MechanicTag } from '../domain'
import type { TechnicalAffix } from './model'

export type AffixSemanticEvidence = 'stat-id-exact' | 'stat-id-derived' | 'unresolved'
export interface AffixAnalyzerSemantics { tags: MechanicTag[]; evidence: AffixSemanticEvidence }

const rules: Array<{ pattern: RegExp; tags: MechanicTag[] }> = [
  { pattern: /physical_damage|physical_damage_reduction_rating/, tags: ['physical'] },
  { pattern: /fire_damage|fire_damage_resistance/, tags: ['fire'] },
  { pattern: /cold_damage|cold_damage_resistance/, tags: ['cold'] },
  { pattern: /lightning_damage|lightning_damage_resistance/, tags: ['lightning'] },
  { pattern: /chaos_damage|chaos_damage_resistance/, tags: ['chaos'] },
  { pattern: /spell_damage|spell_critical|cast_speed|spell_skill/, tags: ['spell'] },
  { pattern: /attack_damage|attack_speed|accuracy_rating|attack_.*damage/, tags: ['attack'] },
  { pattern: /projectile|pierce/, tags: ['projectile'] },
  { pattern: /melee/, tags: ['melee'] },
  { pattern: /area_of_effect|area_damage/, tags: ['area'] },
  { pattern: /critical_strike|critical_damage|critical_multiplier/, tags: ['critical'] },
  { pattern: /damage_over_time|ailment_damage/, tags: ['damage-over-time'] },
  { pattern: /minion|allies_in_presence/, tags: ['minion'] },
  { pattern: /maximum_life|life_regeneration|life_recovery/, tags: ['defensive'] },
  { pattern: /energy_shield|evasion_rating|physical_damage_reduction_rating|block_chance|stun_threshold/, tags: ['defensive'] },
  { pattern: /damage_resistance|resist_all_elements/, tags: ['resistance', 'defensive'] },
  { pattern: /maximum_mana|mana_regeneration|skill_cost|spirit/, tags: ['resource'] },
  { pattern: /movement_velocity/, tags: ['movement'] },
  { pattern: /additional_strength/, tags: ['strength'] },
  { pattern: /additional_dexterity/, tags: ['dexterity'] },
  { pattern: /additional_intelligence/, tags: ['intelligence'] },
]

export function classifyTechnicalAffix(affix: TechnicalAffix): AffixAnalyzerSemantics {
  const tags = new Set<MechanicTag>()
  for (const { statId } of affix.statLines) for (const rule of rules) if (rule.pattern.test(statId)) rule.tags.forEach(tag => tags.add(tag))
  return { tags: [...tags].sort(), evidence: tags.size ? (affix.statLines.length === 1 ? 'stat-id-exact' : 'stat-id-derived') : 'unresolved' }
}
