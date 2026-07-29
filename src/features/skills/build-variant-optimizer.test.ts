import { describe, expect, it } from 'vitest'
import type { SkillGemDefinition, SupportGemDefinition } from '../../domain'
import { initialEquipment } from '../../data'
import { createEmptySkillSetups } from './initial-state'
import {
  normalizeDamageObjective,
  optimizeBuildVariants,
  type BuildVariantCandidate,
  type VariantSkillScore,
} from './build-variant-optimizer'

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
  extra: Partial<SupportGemDefinition> = {},
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
  ...extra,
})

const score = (skillId: string, totalScore = 10): VariantSkillScore => ({
  skillId,
  valid: true,
  possibleRoles: ['main'],
  totalScore,
  damageScore: totalScore,
})

const damageCandidate = (
  skillId: string,
  modeledDps: number | null,
): BuildVariantCandidate => ({
  skillId,
  weaponType: 'wand',
  weaponLabel: 'Zauberstab',
  mainWeaponSet: 'set-1',
  compatibleSupportIds: [],
  affinityScore: 0,
  passiveAffinityScore: 0,
  analyzerScore: 0,
  modeledDps,
  damageObjectiveScore: 0,
  numericCoverageStatus: modeledDps === null ? 'unavailable' : 'partial',
  totalScore: 100,
  reasons: [],
})

describe('vollständige Build-Variantenoptimierung', () => {
  it('prüft Skill, Waffe, Supports, Aszendenz und Set-2-Setup als gemeinsame Variante', () => {
    const spark = skill('spark', ['spell', 'projectile', 'lightning'])
    const orb = skill('orb', ['spell', 'area', 'lightning'], {
      nameEn: 'Orb of Storms',
      possibleRoles: ['utility'],
      rotationRoles: ['setup'],
      persistsAfterWeaponSwap: true,
      affectsTarget: true,
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

  it('validiert die gesamte Supportkombination nach Schadensart und Ausschlusskategorie', () => {
    const elemental = skill('elemental', ['spell', 'area', 'fire', 'cold', 'lightning'], {
      recommendedSupportIds: ['cold-mastery', 'fire-mastery', 'lightning-mastery', 'area'],
    })
    const mastery = { supportCategoryIds: ['mastery'], selectionOnly: true }
    const result = optimizeBuildVariants({
      classId: 'class-official-7',
      ascendancyId: 'ascendancy-official-Sorceress1',
      equipment: initialEquipment,
      setups: createEmptySkillSetups(),
      skills: [elemental],
      supports: [
        support('cold-mastery', [], { ...mastery, supportedDamageTypes: ['cold'] }),
        support('fire-mastery', [], { ...mastery, supportedDamageTypes: ['fire'] }),
        support('lightning-mastery', [], { ...mastery, supportedDamageTypes: ['lightning'] }),
        support('area', [], { selectionOnly: true, supportedMechanics: ['area'] }),
        support('attack-only', [], { selectionOnly: true, supportedMechanics: ['attack'] }),
      ],
      skillScores: [score('elemental')],
    })
    expect(result.selected?.compatibleSupportIds.filter(id => id.endsWith('mastery'))).toHaveLength(1)
    expect(result.selected?.compatibleSupportIds).toContain('area')
    expect(result.selected?.compatibleSupportIds).not.toContain('attack-only')
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

  it('wählt das zusammenhängende Gesamtpaket statt des höchsten isolierten Skillwerts', () => {
    const isolated = skill('isolated', ['spell', 'fire'])
    const coherent = skill('coherent', ['spell', 'lightning'])
    const result = optimizeBuildVariants({
      classId: 'class-official-7',
      ascendancyId: 'ascendancy-official-Sorceress1',
      equipment: initialEquipment,
      setups: createEmptySkillSetups(),
      skills: [isolated, coherent],
      supports: [],
      skillScores: [score('isolated', 100), score('coherent', 60)],
      evaluatePackage: candidate => candidate.skillId === 'isolated'
        ? {
            status: 'blocked',
            totalScore: 95,
            components: { equipment: 90, skill: 100, supports: 0, passives: 0, jewels: 0, uniques: 0, resources: 20, rotation: 0 },
            evidence: [],
            blockers: ['Kein technisch gültiges Gesamtpaket.'],
          }
        : {
            status: 'coherent',
            totalScore: 78,
            components: { equipment: 70, skill: 75, supports: 80, passives: 85, jewels: 60, uniques: 55, resources: 90, rotation: 75 },
            evidence: ['Alle Analyzer stützen dasselbe Paket.'],
            blockers: [],
          },
    })

    expect(result.selected).toMatchObject({
      skillId: 'coherent',
      packageStatus: 'coherent',
      packageScore: 78,
    })
    expect(result.selected?.reasons).toContain('Alle Analyzer stützen dasselbe Paket.')
    expect(result.alternatives.some(candidate => candidate.skillId === 'isolated')).toBe(false)
  })

  it('wählt keinen ungeprüften Kandidaten, wenn das geprüfte Paket blockiert ist', () => {
    const result = optimizeBuildVariants({
      classId: 'class-official-7',
      ascendancyId: 'ascendancy-official-Sorceress1',
      equipment: initialEquipment,
      setups: createEmptySkillSetups(),
      skills: [skill('first', ['spell', 'fire']), skill('second', ['spell', 'cold'])],
      supports: [],
      skillScores: [score('first', 100), score('second', 50)],
      maximumPackageEvaluations: 1,
      evaluatePackage: () => ({
        status: 'blocked',
        totalScore: 0,
        components: { equipment: 0, skill: 0, supports: 0, passives: 0, jewels: 0, uniques: 0, resources: 0, rotation: 0 },
        evidence: [],
        blockers: ['Blockiert.'],
      }),
    })

    expect(result.status).toBe('no-compatible-variant')
    expect(result.selected).toBeNull()
  })
})

describe('relatives Schadensziel', () => {
  it('unterscheidet 500 und 50.000 DPS statt beide Werte bei 250 zu sättigen', () => {
    const [low, high, unknown] = normalizeDamageObjective([
      damageCandidate('low', 500),
      damageCandidate('high', 50_000),
      damageCandidate('unknown', null),
    ])
    expect(high.damageObjectiveScore).toBe(100)
    expect(low.damageObjectiveScore).toBe(30)
    expect(high.totalScore).toBeGreaterThan(low.totalScore)
    expect(unknown).toMatchObject({
      damageObjectiveScore: 0,
      numericCoverageStatus: 'unavailable',
      totalScore: 100,
    })
  })
})
