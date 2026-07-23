import type { SkillSetup } from '../../domain'

export const emptySkillSetup = (index: number): SkillSetup => ({
  id: `skill-setup-${index + 1}`,
  skillId: '',
  role: index === 0 ? 'main' : 'utility',
  weaponSet: 'both',
  supportGemIds: [],
  origin: 'manual',
})
export const createEmptySkillSetups = () => Array.from({ length: 6 }, (_, index) => emptySkillSetup(index))
