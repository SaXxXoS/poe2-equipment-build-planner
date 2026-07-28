import type { MetaSocketRule, SkillGemDefinition, SkillSetup } from '../../domain'

const elementalDamage = new Set(['fire', 'cold', 'lightning'])

export function metaSocketRuleFor(nameEn: string | undefined, rawTags: string[]): MetaSocketRule | undefined {
  if (!rawTags.includes('meta')) return undefined
  if (nameEn === 'Mirage Archer') return 'projectile-attack'
  if (nameEn === 'Mortar Cannon' || nameEn === 'Ancestral Warrior Totem' || nameEn === 'Pounce') return 'attack'
  if (nameEn === 'Blasphemy' || nameEn === 'Hand of Chayula') return 'debuff'
  if (nameEn === 'Ferocious Roar') return 'warcry'
  if (nameEn === 'Spell Totem' || nameEn?.includes('Invocation') || nameEn?.startsWith('Cast on ')) return 'spell'
  return 'any-skill'
}

export function isCompatibleEmbeddedSkill(meta: SkillGemDefinition, candidate: SkillGemDefinition): boolean {
  if (!meta.metaSocketRule || candidate.id === meta.id || candidate.metaSocketRule || candidate.enabled === false) return false
  if (meta.nameEn === 'Elemental Invocation' || meta.nameEn === 'Cast on Elemental Ailment') {
    return candidate.tags.includes('spell') && candidate.tags.some(tag => elementalDamage.has(tag))
  }
  if (meta.metaSocketRule === 'spell') return candidate.tags.includes('spell')
  if (meta.metaSocketRule === 'attack') return candidate.tags.includes('attack')
  if (meta.metaSocketRule === 'projectile-attack') return candidate.tags.includes('attack') && candidate.tags.includes('projectile')
  if (meta.metaSocketRule === 'debuff') return candidate.tags.includes('debuff')
  if (meta.metaSocketRule === 'warcry') return candidate.nameEn?.toLocaleLowerCase('en').includes('cry') ?? false
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
  if (!meta?.metaSocketRule || setup.embeddedSkillIds?.length) return setup
  const first = compatibleEmbeddedSkills(meta, skills)[0]
  return first ? { ...setup, embeddedSkillIds: [first.id] } : setup
}

export function supportCapacityFor(setup: SkillSetup): number {
  return Math.max(0, 5 - (setup.embeddedSkillIds?.length ?? 0))
}
