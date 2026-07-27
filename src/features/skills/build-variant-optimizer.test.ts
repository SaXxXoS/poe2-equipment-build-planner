import { describe, expect, it } from 'vitest'
import type { SkillGemDefinition, SupportGemDefinition } from '../../domain'
import { initialEquipment } from '../../data'
import { createEmptySkillSetups } from './initial-state'
import { optimizeBuildVariants, type VariantSkillScore } from './build-variant-optimizer'

const skill = (
  id: string,
  tags: SkillGemDefinition['tags'],
  extra: Partial<SkillGemDefinition> = {},
): SkillGemDefinition => ({
  id,
  nameEn: id,
  displayNameDe: id,
  dataVersion: 'test',
  source: 'local-placeholder',
  status: 'placeholder',
  tags,
  enabled: true,
  possibleRoles: ['main'],
  ...extra,
})

const support = (
  id: string,
  requiredTags: SupportGemDefinition['requiredTags'],
): SupportGemDefinition => ({
  id,
  nameEn: id,
  displayNameDe: id,
  dataVersion: 'test',
  source: 'local-placeholder',
  status: 'placeholder',
  tags: [],
  requiredTags,
  excludedTags: [],
  ownTags: requiredTags,
  enabled: true,
})

const score = (skillId: string, totalScore = 10): VariantSkillScore => ({
  skillId,
  valid: true,
  possibleRoles: ['main'],
  totalScore,
  damageScore: totalScore,
})

describe('vollständige Build-Variantenoptimierung', () => {
  it('prüft Skill, Waffe, Supports, Aszendenz und Set-2-Setup als gemeinsame Variante', () => {
    const spark = skill('spark', ['spell', 'projectile', 'lightning'])
    const orb = skill('orb', ['spell', 'area', 'lightning'], {
      possibleRoles: ['utility'],
      rotationRoles: ['setup'],
      persistsAfterWeaponSwap: true,
      preferredWeaponSet: 'set-2',
    })
    const physical = skill('physical', ['attack', 'melee', 'physical'], {
      requiredWeaponTypes: ['mace'],
    })
    const result = optimizeBuildVariants({
      classId: 'class-official-7',
      ascendancyId: 'ascendancy-official-Sorceress1',
      equipment: initialEquipment,
      setups: createEmptySkillSetups(),
      skills: [spark, orb, physical],
      supports: [
        support('spell-support', ['spell']),
        support('attack-support', ['attack']),
      ],
      skillScores: [score('spark'), score('orb'), score('physical')],
    })

    expect(result.selected).toMatchObject({
      skillId: 'spark',
      weaponType: 'wand',
      mainWeaponSet: 'set-1',
      setupSkillId: 'orb',
      setupWeaponType: 'wand',
    })
    expect(result.selected?.compatibleSupportIds).toEqual(['spell-support'])
    expect(result.evaluatedSkillCount).toBe(2)
  })

  it('wählt für einen physisch orientierten Krieger eine belegte Nahkampfvariante', () => {
    const lightning = skill('lightning', ['spell', 'lightning'])
    const physical = skill('physical', ['attack', 'melee', 'physical'], {
      requiredWeaponTypes: ['mace'],
    })
    const result = optimizeBuildVariants({
      classId: 'class-official-6',
      ascendancyId: 'ascendancy-official-Warrior1',
      equipment: initialEquipment,
      setups: createEmptySkillSetups(),
      skills: [lightning, physical],
      supports: [],
      skillScores: [score('lightning'), score('physical')],
    })

    expect(result.selected).toMatchObject({ skillId: 'physical', weaponType: 'mace' })
  })

  it('bleibt bei gleicher Eingabe deterministisch', () => {
    const input = {
      classId: 'class-official-7',
      ascendancyId: 'ascendancy-official-Sorceress1',
      equipment: initialEquipment,
      setups: createEmptySkillSetups(),
      skills: [skill('lightning', ['spell', 'lightning'])],
      supports: [] as SupportGemDefinition[],
      skillScores: [score('lightning')],
    }
    expect(optimizeBuildVariants(input)).toEqual(optimizeBuildVariants(input))
  })
})
