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

await writeFile(OUTPUT, `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify(totals, null, 2))
