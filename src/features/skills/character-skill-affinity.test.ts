import { describe, expect, it } from 'vitest'
import type { SkillGemDefinition } from '../../domain'
import { scoreCharacterSkillAffinity } from './character-skill-affinity'

const skill = (id: string, tags: SkillGemDefinition['tags']): SkillGemDefinition => ({
  id,
  displayNameDe: id,
  nameEn: id,
  dataVersion: 'test',
  source: 'local-placeholder',
  status: 'placeholder',
  tags,
  enabled: true,
})

describe('Charakterabhängige Skillpräferenz', () => {
  it('bevorzugt bei Sturmweberin belegte Blitzzauber gegenüber Feuerzaubern', () => {
    const lightning = scoreCharacterSkillAffinity(skill('lightning', ['spell', 'lightning']), 'class-official-7', 'ascendancy-official-Sorceress1')
    const fire = scoreCharacterSkillAffinity(skill('fire', ['spell', 'fire']), 'class-official-7', 'ascendancy-official-Sorceress1')
    expect(lightning.score).toBeGreaterThan(fire.score)
  })

  it('bevorzugt beim Krieger physische Nahkampfangriffe gegenüber Zaubern', () => {
    const melee = scoreCharacterSkillAffinity(skill('melee', ['attack', 'melee', 'physical']), 'class-official-6', 'ascendancy-official-Warrior1')
    const spell = scoreCharacterSkillAffinity(skill('spell', ['spell', 'fire']), 'class-official-6', 'ascendancy-official-Warrior1')
    expect(melee.score).toBeGreaterThan(spell.score)
  })
})
