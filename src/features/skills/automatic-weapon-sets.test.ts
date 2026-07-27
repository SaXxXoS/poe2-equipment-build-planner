import { describe, expect, it } from 'vitest'
import type { SkillSetup } from '../../domain'
import { assignRecommendedWeaponSets } from './automatic-weapon-sets'

const setup = (id: string, role: SkillSetup['role'], origin: SkillSetup['origin'] = 'recommended'): SkillSetup => ({
  id,
  skillId: `skill-${id}`,
  role,
  origin,
  weaponSet: 'both',
  supportGemIds: [],
})

describe('automatische Waffenset-Zuordnung', () => {
  it('legt Hauptschaden auf Set 1 und zusätzlichen Schaden auf Set 2', () => {
    const result = assignRecommendedWeaponSets([
      setup('main', 'main'),
      setup('secondary', 'secondary'),
      setup('utility', 'utility'),
    ])
    expect(result.map(item => item.weaponSet)).toEqual(['set-1', 'set-2', 'both'])
  })

  it('verändert weder manuelle noch bereits set-spezifische Entscheidungen', () => {
    const manual = setup('manual', 'main', 'manual')
    const fixed = { ...setup('fixed', 'secondary'), weaponSet: 'set-2' as const }
    expect(assignRecommendedWeaponSets([manual, fixed])).toEqual([manual, fixed])
  })
})
