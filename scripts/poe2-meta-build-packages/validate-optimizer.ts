import { writeFile } from 'node:fs/promises'
import { initialEquipment, treeClassRegistry } from '../../src/data'
import {
  buildAssistantCandidates,
  deriveWeaponContext,
  runBuildAssistantV1,
} from '../../src/features/build-assistant-v1'
import { evaluateAnalyzedBuildPackage } from '../../src/features/skills/build-package-evaluation'
import {
  optimizeBuildVariants,
  plannedEquipmentForVariant,
} from '../../src/features/skills/build-variant-optimizer'
import { createEmptySkillSetups } from '../../src/features/skills/initial-state'
import {
  fillRecommendedSupportSlots,
  rankedSupportsForSkill,
} from '../../src/features/skills/automatic-supports'
import { supportCapacityFor } from '../../src/features/skills/meta-skills'
import {
  ascendancyMetaReferences,
  metaReferenceSnapshot,
} from '../../src/features/skills/meta-reference'

const OUTPUT = 'docs/audits/build-assistant-current-meta-matrix.json'
const BASELINE_COMMIT = '4408d607606756a65cb0b6a08df7b96907b4a5e1'

const rows = []
for (const entry of treeClassRegistry.filter(value => value.selectableInCurrentUi)) {
  for (const ascendancy of entry.ascendancies.filter(value => value.selectableInCurrentUi)) {
    const character = {
      classId: entry.classId,
      ascendancyId: ascendancy.ascendancyId,
      level: 90,
      additionalPassivePoints: 24,
      goalProfile: 'balanced' as const,
      desiredMainSkillId: '',
    }
    const setups = createEmptySkillSetups()
    const analysis = runBuildAssistantV1({ character, equipment: initialEquipment, setups })
    const skillScores = [
      ...analysis.skillAnalysis.topMainCandidates,
      ...analysis.skillAnalysis.eligibleCandidates,
      ...analysis.skillAnalysis.allCandidates,
    ].filter((value, index, all) =>
      all.findIndex(candidate => candidate.skillId === value.skillId) === index)
    const result = optimizeBuildVariants({
      classId: character.classId,
      ascendancyId: character.ascendancyId,
      equipment: initialEquipment,
      setups,
      skills: buildAssistantCandidates.skills,
      supports: buildAssistantCandidates.supports,
      skillScores,
      characterLevel: character.level,
      characterAttributes: analysis.characterAttributes,
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
        const equipment = plannedEquipmentForVariant(
          initialEquipment,
          candidate,
          character.level,
          analysis.characterAttributes,
        )
        return evaluateAnalyzedBuildPackage(candidate, runBuildAssistantV1({
          character: { ...character, desiredMainSkillId: candidate.skillId },
          equipment,
          setups: packageSetups,
        }), { allowPlannedEquipmentRequirements: true })
      },
    })
    const selectedSkill = buildAssistantCandidates.skills.find(
      value => value.id === result.selected?.skillId,
    )
    const reference = ascendancyMetaReferences[ascendancy.ascendancyId]
    const plannedEquipment = result.selected
      ? plannedEquipmentForVariant(
          initialEquipment,
          result.selected,
          character.level,
          analysis.characterAttributes,
        )
      : initialEquipment
    const plannedWeaponTypes = deriveWeaponContext(plannedEquipment).availableWeaponTypes
    let setupAssigned = false
    const packageSetups = result.selected
      ? setups.map((setup, index) => {
          if (index === 0) return {
            ...setup,
            skillId: result.selected!.skillId,
            role: 'main' as const,
            weaponSet: result.selected!.mainWeaponSet,
            origin: 'recommended' as const,
            supportGemIds: [],
          }
          if (!setupAssigned && result.selected!.setupSkillId) {
            setupAssigned = true
            return {
              ...setup,
              skillId: result.selected!.setupSkillId,
              role: 'utility' as const,
              weaponSet: result.selected!.setupWeaponSet
                ?? (result.selected!.mainWeaponSet === 'set-1' ? 'set-2' as const : 'set-1' as const),
              origin: 'recommended' as const,
              supportGemIds: [],
              synergyReason: result.selected!.setupReason,
            }
          }
          return setup
        })
      : setups
    const visibleSetups = packageSetups.reduce<typeof packageSetups>((filled, setup) => {
      if (!setup.skillId) return [...filled, setup]
      const currentSetups = [...filled, ...packageSetups.slice(filled.length)]
      const supportAnalysis = runBuildAssistantV1({
        character: { ...character, desiredMainSkillId: setup.skillId },
        equipment: plannedEquipment,
        setups: currentSetups,
      }).supportAnalysis
      const preferred = setup.skillId === result.selected?.skillId
        ? result.selected.compatibleSupportIds.map(supportId => ({ skillId: setup.skillId, supportId }))
        : []
      return [...filled, fillRecommendedSupportSlots(
        setup,
        rankedSupportsForSkill(
          setup.skillId,
          preferred,
          supportAnalysis.topCandidates,
          supportAnalysis.eligibleCandidates,
        ),
        buildAssistantCandidates.supports,
        supportCapacityFor(setup),
        {
          equipment: plannedEquipment,
          setups: currentSetups,
          skills: buildAssistantCandidates.skills,
          characterLevel: character.level,
        },
      )]
    }, [])
    const populatedSetups = visibleSetups.filter(setup => setup.skillId)
    const mainSetup = populatedSetups.find(setup => setup.role === 'main')
    const secondarySetups = populatedSetups.filter(setup => setup.role !== 'main')

    rows.push({
      classId: entry.classId,
      className: entry.displayName,
      ascendancyId: ascendancy.ascendancyId,
      ascendancyName: ascendancy.displayName,
      status: result.status,
      selectedSkillId: result.selected?.skillId ?? null,
      selectedSkill: result.selected?.skillName ?? null,
      selectedSkillEn: selectedSkill?.nameEn ?? null,
      weapon: result.selected?.weaponType ?? null,
      setupSkill: result.selected?.setupSkillName ?? null,
      setupWeapon: result.selected?.setupWeaponType ?? null,
      supportCount: result.selected?.compatibleSupportIds.length ?? 0,
      visibleSkillCount: populatedSetups.length,
      visibleSupportCount: populatedSetups.reduce((sum, setup) => sum + setup.supportGemIds.length, 0),
      mainSupportCount: mainSetup?.supportGemIds.length ?? 0,
      setupSupportCount: secondarySetups.reduce((sum, setup) => sum + setup.supportGemIds.length, 0),
      set1SkillCount: populatedSetups.filter(setup => setup.weaponSet === 'set-1').length,
      set2SkillCount: populatedSetups.filter(setup => setup.weaponSet === 'set-2').length,
      bothSkillCount: populatedSetups.filter(setup => setup.weaponSet === 'both').length,
      packageStatus: result.selected?.packageStatus ?? null,
      packageScore: result.selected?.packageScore ?? null,
      metaScore: result.selected?.metaReferenceScore ?? null,
      plannedWeaponTypes,
      plannedWeaponContextMatches: result.selected
        ? plannedWeaponTypes.includes(result.selected.weaponType)
        : false,
      observedReference: {
        skills: reference?.mainSkills ?? [],
        weapons: reference?.weapons ?? [],
      },
      selectionIntersectsObservedSkill: reference?.mainSkills.some(
        value => value.name === selectedSkill?.nameEn,
      ) ?? false,
      selectionIntersectsObservedWeapon: reference?.weapons.some(
        value => value.name.toLowerCase() === result.selected?.weaponType,
      ) ?? false,
    })
  }
}

const totals = {
  profiles: rows.length,
  selected: rows.filter(row => row.status === 'selected').length,
  coherent: rows.filter(row => row.packageStatus === 'coherent').length,
  plannedWeaponContextMatches: rows.filter(row => row.plannedWeaponContextMatches).length,
  observedSkillIntersections: rows.filter(row => row.selectionIntersectsObservedSkill).length,
  observedWeaponIntersections: rows.filter(row => row.selectionIntersectsObservedWeapon).length,
  distinctSkills: new Set(rows.map(row => row.selectedSkillEn).filter(Boolean)).size,
  distinctWeapons: new Set(rows.map(row => row.weapon).filter(Boolean)).size,
  profilesWithFilledMainSupports: rows.filter(row => row.mainSupportCount > 0).length,
  profilesWithSetupSkill: rows.filter(row => row.setupSkill).length,
  profilesWithSet1Skill: rows.filter(row => row.set1SkillCount > 0).length,
  profilesWithSet2Skill: rows.filter(row => row.set2SkillCount > 0).length,
}

const report = {
  schemaVersion: '1.0.0',
  purpose: 'Deterministische Vollmatrix aller produktiv auswählbaren Klassen und Aszendenzen ohne vorgegebene Ausrüstung',
  source: metaReferenceSnapshot,
  inputProfile: {
    level: 90,
    additionalPassivePoints: 24,
    goalProfile: 'balanced',
    equipment: 'empty',
    skillSetups: 'empty',
  },
  baseline: {
    commit: BASELINE_COMMIT,
    totals: {
      profiles: 23,
      selected: 20,
      coherent: 19,
      plannedWeaponContextMatches: null,
      observedSkillIntersections: 2,
      observedWeaponIntersections: 15,
      distinctSkills: 11,
      distinctWeapons: 7,
    },
  },
  totals,
  rows,
  interpretation: {
    coherent: 'Der gemeinsame Paketvalidator akzeptiert Skill, Waffe, Supports und Anforderungen als zusammenhängendes lokales Paket.',
    observedIntersection: 'Sekundärer Plausibilitätsbeleg gegen marginale poe.ninja-Häufigkeiten; kein Beweis für globale Optimalität und keine DPS-Garantie.',
    plannedWeaponContextMatches: 'Die technisch geplante Waffenklasse erreicht nach Normalisierung wieder denselben Analyzer-Waffentyp.',
  },
  limitations: [
    'Die poe.ninja-Statistik Main Skills kann Utility-, Herald- und Setup-Fertigkeiten enthalten.',
    'Skill- und Waffenhäufigkeiten sind marginale Statistiken und nicht zwingend innerhalb desselben Charakters korreliert.',
    'Fehlende produktive Skillmodelle bleiben eine Coverage-Lücke; sie werden nicht durch erfundene Regeln ersetzt.',
    'Die Matrix belegt lokale Kohärenz und Referenznähe, nicht den weltweit höchsten erreichbaren Schaden.',
  ],
}

if (totals.selected !== totals.profiles
  || totals.coherent !== totals.profiles
  || totals.plannedWeaponContextMatches !== totals.profiles
  || totals.profilesWithFilledMainSupports !== totals.profiles) {
  throw new Error(`Produktive Paketmatrix unvollständig: ${JSON.stringify(totals)}`)
}

await writeFile(OUTPUT, `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify(totals, null, 2))
