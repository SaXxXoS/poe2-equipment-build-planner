import type { MechanicTag, SyntheticWeaponType } from '../domain'

export type Pob2SemanticEvidence = 'structured-exact' | 'structured-derived' | 'text-pattern-exact' | 'text-pattern-ambiguous' | 'unresolved'
export interface Pob2SemanticLine { sourceLineId: string; normalizedPlannerLine: string }
export interface Pob2SemanticVariant { modifierSet: string[] }
export interface Pob2SemanticRecord { slot: string; itemCategory: string; requiredLevel: number | null; variants: Pob2SemanticVariant[]; visibleModifiers: Pob2SemanticLine[] }
export interface Pob2UniqueSemantics {
  tags: MechanicTag[]
  evidence: Pob2SemanticEvidence
  evidenceLineIds: string[]
  tradeOffs: string[]
  buildEnabler: boolean
  requiredWeaponTypes: SyntheticWeaponType[]
  resolutionStatus: 'productive' | 'unresolved'
}

const exactPatterns: Array<{ pattern: RegExp; tags: MechanicTag[] }> = [
  { pattern: /\b(?:Fire Damage|Fire Resistance|Ignite)\b/i, tags: ['fire'] },
  { pattern: /\b(?:Cold Damage|Cold Resistance|Chill|Freeze)\b/i, tags: ['cold'] },
  { pattern: /\b(?:Lightning Damage|Lightning Resistance|Shock)\b/i, tags: ['lightning'] },
  { pattern: /\b(?:Chaos Damage|Chaos Resistance|Poison)\b/i, tags: ['chaos'] },
  { pattern: /\bPhysical Damage\b/i, tags: ['physical'] },
  { pattern: /\bAttack(?:s| Damage| Speed| Hits?)\b/i, tags: ['attack'] },
  { pattern: /\bSpell(?:s| Damage| Critical| Skill)\b/i, tags: ['spell'] },
  { pattern: /\bProjectile(?:s| Damage| Speed)?\b/i, tags: ['projectile'] },
  { pattern: /\bMelee(?: Damage| Skills?)?\b/i, tags: ['melee'] },
  { pattern: /\bArea of Effect\b|\bArea Damage\b/i, tags: ['area'] },
  { pattern: /\bCritical Hit Chance\b|\bCritical Damage Bonus\b/i, tags: ['critical'] },
  { pattern: /\bDamage over Time\b/i, tags: ['damage-over-time'] },
  { pattern: /\bMinions?\b|\bAllies in your Presence\b/i, tags: ['minion'] },
  { pattern: /\bmaximum Life\b|\bLife Regeneration\b|\bArmour\b|\bEvasion Rating\b|\bEnergy Shield\b|\bBlock Chance\b/i, tags: ['defensive'] },
  { pattern: /\bResistance(?:s)?\b/i, tags: ['resistance', 'defensive'] },
  { pattern: /\bmaximum Mana\b|\bMana Regeneration\b|\bSkills Cost\b|\bSpirit\b/i, tags: ['resource'] },
  { pattern: /\bMovement Speed\b|\bSkill Speed\b/i, tags: ['movement'] },
]
const negativePattern = /\b(?:reduced|less|Cannot|Lose|You have no|is not applied|instead of Mana or Life)\b/i
const enablerPattern = /\b(?:Skills Cost \w+ instead of Mana or Life|Can have \d+ additional|Trigger \w+ Skill)\b/i
const ambiguousPattern = /\b(?:increased Damage|more Damage|Gain \w+ Damage)\b/i

function linesSharedByEveryVariant(record: Pob2SemanticRecord): Pob2SemanticLine[] {
  if (!record.variants.length) return record.visibleModifiers
  const common = record.variants.map(variant => new Set(variant.modifierSet)).reduce((left, right) => new Set([...left].filter(id => right.has(id))))
  return record.visibleModifiers.filter(line => common.has(line.sourceLineId))
}

export function classifyPob2Unique(record: Pob2SemanticRecord): Pob2UniqueSemantics {
  const tags = new Set<MechanicTag>()
  const evidenceLineIds = new Set<string>()
  const tradeOffs = new Set<string>()
  let buildEnabler = false
  let ambiguous = false
  for (const line of linesSharedByEveryVariant(record)) {
    let matched = false
    for (const rule of exactPatterns) if (rule.pattern.test(line.normalizedPlannerLine)) {
      rule.tags.forEach(tag => tags.add(tag))
      matched = true
    }
    if (negativePattern.test(line.normalizedPlannerLine)) tradeOffs.add(`source-line:${line.sourceLineId}`)
    if (enablerPattern.test(line.normalizedPlannerLine)) buildEnabler = true
    if (!matched && ambiguousPattern.test(line.normalizedPlannerLine)) ambiguous = true
    if (matched || negativePattern.test(line.normalizedPlannerLine) || enablerPattern.test(line.normalizedPlannerLine)) evidenceLineIds.add(line.sourceLineId)
  }
  const productive = tags.size > 0 || tradeOffs.size > 0 || buildEnabler
  const requiredWeaponTypes: SyntheticWeaponType[] = ['bow', 'crossbow'].includes(record.itemCategory) ? ['ranged-weapon'] : ['mace', 'spear'].includes(record.itemCategory) ? ['melee-weapon'] : []
  return {
    tags: [...tags].sort(),
    evidence: productive ? 'text-pattern-exact' : requiredWeaponTypes.length ? 'structured-derived' : ambiguous ? 'text-pattern-ambiguous' : record.slot && record.itemCategory ? 'structured-exact' : 'unresolved',
    evidenceLineIds: [...evidenceLineIds].sort(),
    tradeOffs: [...tradeOffs].sort(),
    buildEnabler,
    requiredWeaponTypes,
    resolutionStatus: productive ? 'productive' : 'unresolved',
  }
}
