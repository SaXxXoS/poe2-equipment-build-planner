import type { MetaSocketRule, SkillGemDefinition, SkillSetup } from '../../domain'

const elementalDamage = new Set(['fire', 'cold', 'lightning'])
const knownTriggerRules: Record<string, MetaSocketRule> = {
  'Elemental Invocation': 'spell',
  "Reaper's Invocation": 'spell',
  'Barrier Invocation': 'spell',
  'Cast on Critical': 'spell',
  'Cast on Dodge': 'spell',
  'Cast on Elemental Ailment': 'spell',
  'Cast on Minion Death': 'spell',
  'Mirage Archer': 'projectile-attack',
  'Pounce': 'attack',
}

export function metaSocketRuleFor(nameEn: string | undefined, rawTags: string[]): MetaSocketRule | undefined {
  if (!rawTags.includes('meta') || !rawTags.includes('trigger') || !nameEn) return undefined
  return knownTriggerRules[nameEn]
}

export function resolvedMetaSocketRule(skill: SkillGemDefinition): MetaSocketRule | undefined {
  return skill.metaSocketRule ?? (skill.nameEn ? knownTriggerRules[skill.nameEn] : undefined)
}

export function isCompatibleEmbeddedSkill(meta: SkillGemDefinition, candidate: SkillGemDefinition): boolean {
  const rule = resolvedMetaSocketRule(meta)
  if (!rule || candidate.id === meta.id || resolvedMetaSocketRule(candidate) || candidate.enabled === false) return false
  if (meta.nameEn === 'Elemental Invocation' || meta.nameEn === 'Cast on Elemental Ailment') {
    return candidate.tags.includes('spell') && candidate.tags.some(tag => elementalDamage.has(tag))
  }
  if (rule === 'spell') return candidate.tags.includes('spell')
  if (rule === 'attack') return candidate.tags.includes('attack')
  if (rule === 'projectile-attack') return candidate.tags.includes('attack') && candidate.tags.includes('projectile')
  if (rule === 'debuff') return candidate.tags.includes('debuff')
  if (rule === 'warcry') return candidate.nameEn?.toLocaleLowerCase('en').includes('cry') ?? false
  return true
}

export function compatibleEmbeddedSkills(meta: SkillGemDefinition, skills: SkillGemDefinition[]): SkillGemDefinition[] {
  const damageTags = new Set(meta.tags.filter(tag => elementalDamage.has(tag)))
  return skills.filter(candidate => isCompatibleEmbeddedSkill(meta, candidate)).sort((left, right) => {
    const leftOverlap = left.tags.filter(tag => damageTags.has(tag)).length
    const rightOverlap = right.tags.filter(tag => damageTags.has(tag)).length
    return rightOverlap - leftOverlap || left.displayNameDe.localeCompare(right.displayNameDe, 'de')
  })
}

export function ensureRequiredEmbeddedSkill(setup: SkillSetup, skills: SkillGemDefinition[]): SkillSetup {
  const meta = skills.find(value => value.id === setup.skillId)
  if (!meta || !resolvedMetaSocketRule(meta)) return setup
  if (setup.embeddedSkillIds?.length) {
    return { ...setup, supportGemIds: setup.supportGemIds.slice(0, supportCapacityFor(setup)) }
  }
  const first = compatibleEmbeddedSkills(meta, skills)[0]
  return first ? { ...setup, embeddedSkillIds: [first.id], supportGemIds: setup.supportGemIds.slice(0, 4) } : setup
}

export function supportCapacityFor(setup: SkillSetup): number {
  return Math.max(0, 5 - (setup.embeddedSkillIds?.length ?? 0))
}
