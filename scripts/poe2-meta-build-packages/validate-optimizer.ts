import { writeFile } from 'node:fs/promises'
import { supportExclusiveKeys } from '../../src/domain'
import { initialEquipment, treeClassRegistry } from '../../src/data'
import {
  buildAssistantCandidates,
  deriveWeaponContext,
  runBuildAssistantV1,
} from '../../src/features/build-assistant-v1'
import { evaluateAnalyzedBuildPackage } from '../../src/features/skills/build-package-evaluation'
import {
  hasCoherentWeaponSetSpecialization,
  optimizeBuildVariants,
  plannedEquipmentForVariant,
} from '../../src/features/skills/build-variant-optimizer'
import { createEmptySkillSetups } from '../../src/features/skills/initial-state'
import {
  fillRecommendedSupportSlots,
  rankedSupportsForSkill,
} from '../../src/features/skills/automatic-supports'
import { supportCapacityFor } from '../../src/features/skills/meta-skills'
import { planSynergisticSkills } from '../../src/features/skills/synergy-planner'
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
      goalProfile: character.goalProfile,
      characterLevel: character.level,
      characterAttributes: analysis.characterAttributes,
      evaluatePackage: candidate => {
        const plannedQueue = [...(candidate.plannedSkillSetups ?? [])]
        if (!plannedQueue.length && candidate.setupSkillId) plannedQueue.push({
          skillId: candidate.setupSkillId,
          skillName: candidate.setupSkillName ?? candidate.setupSkillId,
          role: 'utility',
          weaponSet: candidate.setupWeaponSet
            ?? (candidate.mainWeaponSet === 'set-1' ? 'set-2' as const : 'set-1' as const),
          weaponType: candidate.setupWeaponType ?? candidate.weaponType,
          reason: candidate.setupReason ?? 'Belegte Ergänzung des Hauptskills.',
          score: 0,
          evidence: 'structured-derived',
          ruleId: 'optimizer.setup-fallback',
        })
        const packageSetups = setups.map((setup, index) => {
          if (index === 0) return {
              ...setup,
              skillId: candidate.skillId,
              role: 'main' as const,
              weaponSet: candidate.mainWeaponSet,
              supportGemIds: candidate.compatibleSupportIds,
            }
          const planned = plannedQueue.shift()
          return planned
            ? {
                ...setup,
                skillId: planned.skillId,
                role: planned.role,
                weaponSet: planned.weaponSet,
                supportGemIds: planned.supportGemIds ?? [],
                embeddedSkillIds: planned.embeddedSkillIds,
                origin: 'recommended' as const,
                synergyReason: planned.reason,
              }
            : setup
        })
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
    const plannedQueue = [...(result.selected?.plannedSkillSetups ?? [])]
    if (!plannedQueue.length && result.selected?.setupSkillId) plannedQueue.push({
      skillId: result.selected.setupSkillId,
      skillName: result.selected.setupSkillName ?? result.selected.setupSkillId,
      role: 'utility',
      weaponSet: result.selected.setupWeaponSet
        ?? (result.selected.mainWeaponSet === 'set-1' ? 'set-2' as const : 'set-1' as const),
      weaponType: result.selected.setupWeaponType ?? result.selected.weaponType,
      reason: result.selected.setupReason ?? 'Belegte Ergänzung des Hauptskills.',
      score: 0,
      evidence: 'structured-derived',
      ruleId: 'optimizer.setup-fallback',
    })
    if (!plannedQueue.length && result.selected && selectedSkill) {
      const allowedDefinitions = buildAssistantCandidates.skills.filter(definition => {
        if (definition.requiredClassId && definition.requiredClassId !== character.classId) return false
        if (definition.excludedClassIds?.includes(character.classId)) return false
        if (definition.allowedAscendancyIds?.length
          && !definition.allowedAscendancyIds.includes(character.ascendancyId)) return false
        return !definition.excludedAscendancyIds?.includes(character.ascendancyId)
      })
      plannedQueue.push(...planSynergisticSkills(
        selectedSkill,
        allowedDefinitions,
        skillScores,
        setups.length - 1,
        {
          ascendancyId: character.ascendancyId,
          mainWeaponSet: result.selected.mainWeaponSet === 'set-2' ? 'set-2' : 'set-1',
        },
      ).map(planned => ({
        ...planned,
        skillName: allowedDefinitions.find(value => value.id === planned.skillId)?.displayNameDe
          ?? planned.skillId,
        weaponType: result.selected!.weaponType,
      })))
    }
    const effectivePlannedSkills = [...plannedQueue]
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
          const planned = plannedQueue.shift()
          if (planned) {
            return {
              ...setup,
              skillId: planned.skillId,
              role: planned.role,
              weaponSet: planned.weaponSet,
              origin: 'recommended' as const,
              supportGemIds: planned.supportGemIds ?? [],
              embeddedSkillIds: planned.embeddedSkillIds,
              synergyReason: planned.reason,
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
      const preferredSupportIds = setup.skillId === result.selected?.skillId
        ? result.selected.compatibleSupportIds
        : result.selected?.plannedSkillSetups?.find(planned => planned.skillId === setup.skillId)?.supportGemIds ?? []
      const preferred = preferredSupportIds.map(supportId => ({ skillId: setup.skillId, supportId }))
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
    const selectedSupportDefinitions = (result.selected?.compatibleSupportIds ?? [])
      .map(id => buildAssistantCandidates.supports.find(value => value.id === id))
      .filter((value): value is (typeof buildAssistantCandidates.supports)[number] => Boolean(value))
    const supportKeys = selectedSupportDefinitions.flatMap(supportExclusiveKeys)
    const duplicateSupportFamilies = [...new Set(supportKeys.filter(
      (key, index) => supportKeys.indexOf(key) !== index,
    ))]
    const coherentWeaponSetPackage = result.selected?.corePackageStatus === 'coherent-two-set'
    const oppositeSet = result.selected?.mainWeaponSet === 'set-1' ? 'set-2' : 'set-1'
    const oppositeSetSkillCount = oppositeSet === 'set-1'
      ? populatedSetups.filter(setup => setup.weaponSet === 'set-1').length
      : populatedSetups.filter(setup => setup.weaponSet === 'set-2').length
    const phantomWeaponSetPackage = coherentWeaponSetPackage && (
      !result.selected?.setupSkillId
      || !result.selected.setupWeaponType
      || result.selected.setupWeaponSet !== oppositeSet
      || oppositeSetSkillCount === 0
      || !hasCoherentWeaponSetSpecialization(
        initialEquipment,
        result.selected,
        character.level,
        analysis.characterAttributes,
      )
    )

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
      setupSkill: result.selected?.setupSkillName ?? effectivePlannedSkills[0]?.skillName ?? null,
      actualSetupSkill: result.selected?.setupSkillName ?? null,
      plannedSkillCount: effectivePlannedSkills.length,
      setupWeapon: result.selected?.setupWeaponType ?? null,
      supportCount: result.selected?.compatibleSupportIds.length ?? 0,
      plannedSupportCount: result.selected?.plannedSkillSetups?.reduce(
        (sum, planned) => sum + (planned.supportGemIds?.length ?? 0), 0,
      ) ?? 0,
      embeddedSkillCount: result.selected?.plannedSkillSetups?.reduce(
        (sum, planned) => sum + (planned.embeddedSkillIds?.length ?? 0), 0,
      ) ?? 0,
      supportSelectionBasis: result.selected?.supportSelectionBasis ?? null,
      supportBaselineModeledDps: result.selected?.supportBaselineModeledDps ?? null,
      visibleSkillCount: populatedSetups.length,
      visibleSupportCount: populatedSetups.reduce((sum, setup) => sum + setup.supportGemIds.length, 0),
      mainSupportCount: mainSetup?.supportGemIds.length ?? 0,
      setupSupportCount: secondarySetups.reduce((sum, setup) => sum + setup.supportGemIds.length, 0),
      set1SkillCount: populatedSetups.filter(setup => setup.weaponSet === 'set-1').length,
      set2SkillCount: populatedSetups.filter(setup => setup.weaponSet === 'set-2').length,
      bothSkillCount: populatedSetups.filter(setup => setup.weaponSet === 'both').length,
      packageStatus: result.selected?.packageStatus ?? null,
      corePackageStatus: result.selected?.corePackageStatus ?? null,
      coherentWeaponSetPackage,
      phantomWeaponSetPackage,
      duplicateSupportFamilies,
      packageScore: result.selected?.packageScore ?? null,
      modeledDamagePerSecond: result.selected?.modeledDps ?? null,
      modeledDamageBasis: result.selected?.modeledDpsBasis ?? null,
      modeledDamageComponents: result.selected?.modeledDpsComponents ?? null,
      damageObjectiveScore: result.selected?.damageObjectiveScore ?? null,
      numericCoverageStatus: result.selected?.numericCoverageStatus ?? 'unavailable',
      numericallyComparableCombinationCount: result.numericallyComparableCombinationCount,
      evaluatedCombinationCount: result.evaluatedCombinationCount,
      metaScore: result.selected?.metaReferenceScore ?? null,
      correlatedProfileCount: result.selected?.metaReferenceProfileCount ?? 0,
      correlatedEvidenceClass: result.selected?.metaReferenceEvidenceClass ?? null,
      selectionEvidenceMode: result.selected?.selectionEvidenceMode ?? null,
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
  profilesWithCorrelatedCurrentPackage: rows.filter(row => row.correlatedProfileCount > 0).length,
  profilesUsingBroadAscendancyOverview: rows.filter(row => row.selectionEvidenceMode === 'broad-ascendancy-overview').length,
  profilesUsingCorrelatedPackageFallback: rows.filter(row => row.selectionEvidenceMode === 'correlated-package-fallback').length,
  profilesUsingAscendancyAffinityFallback: rows.filter(row => row.selectionEvidenceMode === 'ascendancy-affinity-fallback').length,
  profilesUsingStructuralFallback: rows.filter(row => row.selectionEvidenceMode === 'structural-fallback').length,
  distinctSkills: new Set(rows.map(row => row.selectedSkillEn).filter(Boolean)).size,
  distinctWeapons: new Set(rows.map(row => row.weapon).filter(Boolean)).size,
  profilesWithFilledMainSupports: rows.filter(row => row.mainSupportCount > 0).length,
  profilesWithOptimizerFilledSetupSupports: rows.filter(row => row.plannedSupportCount > 0).length,
  optimizerPlannedSupportCount: rows.reduce((sum, row) => sum + row.plannedSupportCount, 0),
  optimizerEmbeddedSkillCount: rows.reduce((sum, row) => sum + row.embeddedSkillCount, 0),
  profilesWithSetupSkill: rows.filter(row => row.setupSkill).length,
  profilesWithActualSetupSkill: rows.filter(row => row.actualSetupSkill).length,
  coherentSingleSetPackages: rows.filter(row => row.corePackageStatus === 'coherent-single-set').length,
  coherentTwoSetPackages: rows.filter(row => row.corePackageStatus === 'coherent-two-set').length,
  phantomWeaponSetPackages: rows.filter(row => row.phantomWeaponSetPackage).length,
  profilesWithDuplicateMainSupportFamilies: rows.filter(row => row.duplicateSupportFamilies.length > 0).length,
  profilesWithPlannedSkillGroup: rows.filter(row => row.plannedSkillCount > 0).length,
  profilesWithSet1Skill: rows.filter(row => row.set1SkillCount > 0).length,
  profilesWithSet2Skill: rows.filter(row => row.set2SkillCount > 0).length,
  profilesUsingSemanticMetaSupportSelection: rows.filter(row => row.supportSelectionBasis === 'semantic-meta').length,
  profilesUsingEquipmentDamageSupportSelection: rows.filter(row => row.supportSelectionBasis === 'equipment-damage-objective').length,
  profilesWithComparableDamageObjective: rows.filter(row => row.numericCoverageStatus === 'comparable').length,
  profilesUsingUnifiedDamageBasis: rows.filter(row => row.modeledDamageBasis === 'sustained-after-mitigation-v1').length,
  comparableCombinations: rows.reduce((sum, row) => sum + row.numericallyComparableCombinationCount, 0),
  evaluatedCombinations: rows.reduce((sum, row) => sum + row.evaluatedCombinationCount, 0),
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
    correlatedCurrentPackage: 'Saisonaler PlausibilitÃ¤tsbeleg: Aszendenz, Hauptskill, Waffe, Supports und weitere Fertigkeiten wurden gemeinsam in einem lokal gepinnten Profil beobachtet.',
    plannedWeaponContextMatches: 'Die technisch geplante Waffenklasse erreicht nach Normalisierung wieder denselben Analyzer-Waffentyp.',
    selectionEvidenceMode: 'Kennzeichnet explizit, ob die Auswahl aus realer Ausrüstung, der breiten Aszendenz-Saisonübersicht oder nur aus einem engeren, offen ausgewiesenen Fallback stammt.',
    coherentSingleSetPackage: 'Ein technisch vollständiges Ein-Set-Paket erzeugt absichtlich keine Waffenset-Punkte.',
    coherentTwoSetPackage: 'Ein Zwei-Set-Paket besitzt eine belegte Setup-Fertigkeit, eine konkrete kompatible zweite Waffe und einen Skill im gegenüberliegenden Set.',
  },
  limitations: [
    'Die poe.ninja-Statistik Main Skills kann Utility-, Herald- und Setup-Fertigkeiten enthalten.',
    'Skill- und Waffenhäufigkeiten sind marginale Statistiken und nicht zwingend innerhalb desselben Charakters korreliert.',
    'Fehlende produktive Skillmodelle bleiben eine Coverage-Lücke; sie werden nicht durch erfundene Regeln ersetzt.',
    'Die Matrix belegt lokale Kohärenz und Referenznähe, nicht den weltweit höchsten erreichbaren Schaden.',
  ],
}

await writeFile(OUTPUT, `${JSON.stringify(report, null, 2)}\n`)

if (totals.selected !== totals.profiles
  || totals.coherent !== totals.profiles
  || totals.plannedWeaponContextMatches !== totals.profiles
  || totals.profilesWithFilledMainSupports !== totals.profiles
  || totals.coherentSingleSetPackages + totals.coherentTwoSetPackages !== totals.profiles
  || totals.phantomWeaponSetPackages !== 0
  || totals.profilesWithDuplicateMainSupportFamilies !== 0) {
  const failures = {
    notSelected: rows.filter(row => row.status !== 'selected'),
    notCoherent: rows.filter(row => row.packageStatus !== 'coherent'),
    weaponContextMismatch: rows.filter(row => !row.plannedWeaponContextMatches),
    missingMainSupports: rows.filter(row => row.mainSupportCount === 0),
    missingPlannedSkillGroup: rows.filter(row => row.plannedSkillCount === 0),
    missingCoreStatus: rows.filter(row => !['coherent-single-set', 'coherent-two-set'].includes(row.corePackageStatus ?? '')),
    phantomWeaponSetPackages: rows.filter(row => row.phantomWeaponSetPackage),
    duplicateMainSupportFamilies: rows.filter(row => row.duplicateSupportFamilies.length > 0),
  }
  throw new Error(`Produktive Paketmatrix unvollständig: ${JSON.stringify({ totals, failures })}`)
}

console.log(JSON.stringify(totals, null, 2))
