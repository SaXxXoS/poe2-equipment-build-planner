import { describe, expect, it } from 'vitest'
import type { SkillGemDefinition, SupportGemDefinition } from '../../domain'
import { initialEquipment, treeClassRegistry } from '../../data'
import { createEmptySkillSetups } from './initial-state'
import {
  buildAssistantCandidates,
  deriveWeaponContext,
  runBuildAssistantV1,
} from '../build-assistant-v1'
import { evaluateAnalyzedBuildPackage } from './build-package-evaluation'
import {
  normalizeDamageObjective,
  optimizeBuildVariants,
  plannedEquipmentForVariant,
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
  skillName: skillId,
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
  it('liefert für jede produktive Klasse und Aszendenz ein regelkonformes Startpaket', () => {
    const selections = treeClassRegistry
      .filter(entry => entry.selectableInCurrentUi)
      .flatMap(entry => entry.ascendancies
        .filter(ascendancy => ascendancy.selectableInCurrentUi)
        .map(ascendancy => ({ classId: entry.classId, ascendancyId: ascendancy.ascendancyId })))
      .map(character => {
        const setups = createEmptySkillSetups()
        const analysis = runBuildAssistantV1({
          character: {
            classId: character.classId,
            ascendancyId: character.ascendancyId,
            level: 90,
            additionalPassivePoints: 24,
            goalProfile: 'balanced',
            desiredMainSkillId: '',
          },
          equipment: initialEquipment,
          setups,
        })
        const scores = [
          ...analysis.skillAnalysis.topMainCandidates,
          ...analysis.skillAnalysis.eligibleCandidates.filter(value => value.possibleRoles.includes('main')),
          ...analysis.skillAnalysis.allCandidates.filter(value => value.possibleRoles.includes('main')),
        ].filter((value, index, all) => all.findIndex(candidate => candidate.skillId === value.skillId) === index)
        const optimization = optimizeBuildVariants({
          ...character,
          equipment: initialEquipment,
          setups,
          skills: buildAssistantCandidates.skills,
          supports: buildAssistantCandidates.supports,
          skillScores: scores,
          characterLevel: 90,
          characterAttributes: analysis.characterAttributes,
        })
        expect(optimization.selected, `${character.classId}/${character.ascendancyId}`).not.toBeNull()
        expect(optimization.selected?.compatibleSupportIds.length, character.ascendancyId).toBeGreaterThan(0)
        expect(optimization.selected?.ruleGraphStatus, character.ascendancyId).not.toBe('blocked')
        const planned = plannedEquipmentForVariant(
          initialEquipment,
          optimization.selected!,
          90,
          analysis.characterAttributes,
        )
        expect(
          deriveWeaponContext(planned).availableWeaponTypes,
          `${character.ascendancyId}/${optimization.selected?.weaponType}`,
        ).toContain(optimization.selected?.weaponType)
        return `${optimization.selected?.skillId}:${optimization.selected?.weaponType}`
      })

    expect(new Set(selections).size, selections.join(', ')).toBeGreaterThanOrEqual(4)
  }, 30_000)

  it('prüft ein leeres Zwei-Set-Paket mit geplanten Waffen aus gepinnten Basen', () => {
    const planned = plannedEquipmentForVariant(initialEquipment, {
      weaponType: 'wand',
      mainWeaponSet: 'set-1',
      setupSkillId: 'orb-of-storms',
      setupWeaponType: 'wand',
    }, 90)

    expect(planned.find(item => item.slotId === 'slot-weapon-set-1-left')).toMatchObject({
      itemClassId: 'Wands',
    })
    expect(planned.find(item => item.slotId === 'slot-weapon-set-2-left')).toMatchObject({
      itemClassId: 'Wands',
    })
    expect(initialEquipment.every(item => !item.itemClassId)).toBe(true)
  })
  it('plant auch lokal belegte Stab- und Zepterbasen statt jeden Zauber auf Zauberstab zu zwingen', () => {
    const planned = plannedEquipmentForVariant(initialEquipment, {
      weaponType: 'staff',
      mainWeaponSet: 'set-1',
      setupSkillId: 'persistent-setup',
      setupWeaponType: 'sceptre',
    }, 90)

    expect(planned.find(item => item.slotId === 'slot-weapon-set-1-left')).toMatchObject({
      itemClassId: 'Staves',
    })
    expect(planned.find(item => item.slotId === 'slot-weapon-set-2-left')).toMatchObject({
      itemClassId: 'Sceptres',
    })
  })

  it('schlägt bei inkompatibler Ausrüstung eine kompatible Ersatzwaffe vor', () => {
    const equipped = initialEquipment.map(entry =>
      entry.slotId === 'slot-weapon-set-1-left'
        ? { ...entry, itemClassId: 'Bows' }
        : entry)
    const result = optimizeBuildVariants({
      classId: 'class-official-6',
      ascendancyId: 'ascendancy-official-Warrior1',
      equipment: equipped,
      setups: createEmptySkillSetups(),
      skills: [skill('mace-attack', ['attack', 'melee', 'physical'], {
        displayNameDe: 'Streitkolbenangriff',
        requiredWeaponTypes: ['mace'],
      })],
      supports: [],
      skillScores: [score('mace-attack')],
      characterLevel: 60,
    })
    expect(result.equipmentFirst).toBe(true)
    expect(result.selected).toMatchObject({
      skillId: 'mace-attack',
      skillName: 'Streitkolbenangriff',
      weaponType: 'mace',
    })
  })

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
      mainWeaponSet: 'set-1',
      setupSkillId: 'orb',
      setupWeaponSet: 'set-2',
    })
    expect(['wand','staff','sceptre']).toContain(result.selected?.weaponType)
    expect(['wand','staff','sceptre']).toContain(result.selected?.setupWeaponType)
    expect(result.selected?.compatibleSupportIds).toEqual(['spell-support'])
    expect(result.evaluatedSkillCount).toBe(2)
  })

  it('nimmt die Setup-Waffe aus dem gegenüberliegenden Set statt fest aus Set 2', () => {
    const equipped = initialEquipment.map(entry => {
      if (entry.slotId === 'slot-weapon-set-1-left') return { ...entry, itemClassId: 'Staves' }
      if (entry.slotId === 'slot-weapon-set-2-left') return { ...entry, itemClassId: 'Wands' }
      if (entry.slotId === 'slot-weapon-set-2-right') return { ...entry, itemClassId: 'Sceptres' }
      return entry
    })
    const spark = skill('spark', ['spell', 'projectile', 'lightning'], {
      nameEn: 'Spark',
      requiredWeaponTypes: ['wand'],
    })
    const orb = skill('orb', ['spell', 'area', 'lightning'], {
      nameEn: 'Orb of Storms',
      possibleRoles: ['utility'],
      rotationRoles: ['setup'],
      persistsAfterWeaponSwap: true,
      affectsTarget: true,
      requiredWeaponTypes: ['staff', 'sceptre'],
    })

    const result = optimizeBuildVariants({
      classId: 'class-official-7',
      ascendancyId: 'ascendancy-official-Sorceress1',
      equipment: equipped,
      setups: createEmptySkillSetups(),
      skills: [spark, orb],
      supports: [],
      skillScores: [score('spark'), score('orb')],
    })

    expect(result.selected).toMatchObject({
      skillId: 'spark',
      mainWeaponSet: 'set-2',
      setupSkillId: 'orb',
      setupWeaponSet: 'set-1',
      setupWeaponType: 'staff',
    })
    expect(result.selected?.reasons.some(reason => reason.startsWith('Waffenset 1:'))).toBe(true)
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

  it('bevorzugt ohne Ausrüstung die gepinnte ascendancy-spezifische Hauptskillreferenz', () => {
    const character = {
      classId: 'class-official-7',
      ascendancyId: 'ascendancy-official-Sorceress1',
      level: 90,
      goalProfile: 'balanced' as const,
    }
    const setups = createEmptySkillSetups()
    const analysis = runBuildAssistantV1({ character, equipment: initialEquipment, setups })
    const result = optimizeBuildVariants({
      classId: character.classId,
      ascendancyId: character.ascendancyId,
      equipment: initialEquipment,
      setups,
      skills: buildAssistantCandidates.skills,
      supports: buildAssistantCandidates.supports,
      skillScores: [
        ...analysis.skillAnalysis.topMainCandidates,
        ...analysis.skillAnalysis.eligibleCandidates,
        ...analysis.skillAnalysis.allCandidates,
      ].filter((value, index, all) =>
        all.findIndex(candidate => candidate.skillId === value.skillId) === index),
      characterLevel: character.level,
      evaluatePackage: candidate => {
        const packageSetups = setups.map((setup, index) => index === 0
          ? {
              ...setup,
              skillId: candidate.skillId,
              role: 'main' as const,
              weaponSet: candidate.mainWeaponSet,
              supportGemIds: candidate.compatibleSupportIds,
            }
          : setup)
        const packageEquipment = plannedEquipmentForVariant(
          initialEquipment,
          candidate,
          character.level,
          analysis.characterAttributes,
        )
        return evaluateAnalyzedBuildPackage(candidate, runBuildAssistantV1({
          character: { ...character, desiredMainSkillId: candidate.skillId },
          equipment: packageEquipment,
          setups: packageSetups,
        }), { allowPlannedEquipmentRequirements: true })
      },
    })
    expect(result.selected?.skillName).toBe('Funken')
    expect(result.selected?.packageComponents?.skill).toBeGreaterThan(0)
    expect(result.selected?.compatibleSupportIds.length).toBeGreaterThan(0)
  }, 15_000)

  it('schneidet saisonal beobachtete Kandidaten nicht vor der Meta-Wertung durch die Tag-Heuristik ab', () => {
    const character = {
      classId: 'class-official-1',
      ascendancyId: 'ascendancy-official-Witch1',
      level: 90,
      goalProfile: 'balanced' as const,
    }
    const setups = createEmptySkillSetups()
    const analysis = runBuildAssistantV1({ character, equipment: initialEquipment, setups })
    const result = optimizeBuildVariants({
      classId: character.classId,
      ascendancyId: character.ascendancyId,
      equipment: initialEquipment,
      setups,
      skills: buildAssistantCandidates.skills,
      supports: buildAssistantCandidates.supports,
      skillScores: [
        ...analysis.skillAnalysis.topMainCandidates,
        ...analysis.skillAnalysis.eligibleCandidates,
        ...analysis.skillAnalysis.allCandidates,
      ].filter((value, index, all) =>
        all.findIndex(candidate => candidate.skillId === value.skillId) === index),
      characterLevel: character.level,
      characterAttributes: analysis.characterAttributes,
    })

    const selectedName = buildAssistantCandidates.skills.find(
      value => value.id === result.selected?.skillId,
    )?.nameEn
    expect(['Comet', 'Spark', 'Living Bomb']).toContain(selectedName)
    expect(result.selected?.metaReferenceScore).toBeGreaterThan(0)
  }, 15_000)

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
