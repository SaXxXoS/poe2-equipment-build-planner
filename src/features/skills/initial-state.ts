import type { SkillSetup } from '../../domain'

export const emptySkillSetup = (index: number): SkillSetup => ({
  id: `skill-setup-${index + 1}`,
  skillId: '',
  role: index === 0 ? 'main' : 'utility',
  weaponSet: 'both',
  supportGemIds: [],
  origin: 'manual',
})
export const DEFAULT_SKILL_SLOT_COUNT = 9
export const createEmptySkillSetups = () => Array.from({ length: DEFAULT_SKILL_SLOT_COUNT }, (_, index) => emptySkillSetup(index))
