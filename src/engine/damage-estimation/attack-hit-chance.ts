import type { EquipmentEntry } from '../../domain'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'
import { resolveCharacterAttributes } from '../character-attributes/model'

export const ATTACK_HIT_CHANCE_MODEL_VERSION = 'pob2-c5300ccd-accuracy-v1'
export const DEFAULT_COMPARISON_DISTANCE_METRES = 2

const monsterEvasionByLevel = [
  24,30,36,43,49,56,63,70,77,84,91,98,105,113,120,128,136,144,152,160,
  168,176,185,193,202,211,220,229,238,247,257,266,276,286,296,306,316,326,337,347,
  358,369,380,391,403,414,426,438,449,462,474,486,499,511,524,537,551,564,578,591,
  605,619,634,648,663,677,692,708,723,738,754,770,786,803,819,836,853,870,887,905,
  923,941,959,977,996,1015,1034,1053,1073,1093,1113,1133,1154,1174,1195,1217,1238,1260,1282,1304,
] as const

const baseDexterityByClassId: Record<string, number> = {
  'class-official-1': 7, // Witch
  'class-official-2': 15, // Ranger
  'class-official-6': 7, // Warrior
  'class-official-7': 7, // Sorceress
  'class-official-8': 15, // Huntress
  'class-official-9': 11, // Mercenary
  'class-official-10': 11, // Monk
  'class-official-11': 7, // Druid
}

export interface AttackHitChanceResolution {
  modelVersion: typeof ATTACK_HIT_CHANCE_MODEL_VERSION
  status: 'exact' | 'blocked-missing-character-level' | 'blocked-unknown-class'
  playerAccuracy?: number
  enemyLevel?: number
  enemyEvasion?: number
  hitChancePercent?: number
  baseAccuracyFromLevel?: number
  baseDexterity?: number
  additionalDexterity?: number
  accuracyFromDexterity?: number
  flatAccuracy?: number
  increasedAccuracyPercent?: number
  comparisonDistanceMetres: typeof DEFAULT_COMPARISON_DISTANCE_METRES
  sourceReferences: readonly string[]
  limitations: readonly string[]
}

const clampLevel = (value: number) => Math.max(1, Math.min(100, Math.trunc(value)))
export const monsterEvasionAtLevel = (level: number) => monsterEvasionByLevel[clampLevel(level) - 1]

/** Exact PoB2 calcs.hitChance formula, including PoB's integer rounding and 5–100% caps. */
export function poe2HitChance(accuracy: number, evasion: number, uncapped = false) {
  if (accuracy < 0) return 5
  const rounded = Math.round((accuracy * 1.25) / (accuracy + evasion * 0.3) * 100)
  return uncapped ? Math.max(rounded, 5) : Math.max(Math.min(rounded, 100), 5)
}

const statSum = (equipment: EquipmentEntry[], ids: Set<string>, activeSet: 'set-1' | 'set-2') =>
  equipment.flatMap(entry => entry.modifierValues.flatMap(modifier =>
    (modifier.statValues ?? []).filter(stat => {
      if (!ids.has(stat.statId)) return false
      if (!modifier.isLocal) return true
      return entry.slotId.includes(`weapon-${activeSet}`)
    }),
  )).reduce((sum, stat) => sum + stat.value, 0)

const allocatedNodes = (
  tree: RealPassiveTree | undefined,
  planning: RealPassivePlanningIntegrationResult | undefined,
  activeSet: 'set-1' | 'set-2',
) => {
  if (!tree || !planning) return []
  const ids = new Set([
    ...(planning.weaponSetPlanning?.[activeSet]?.allocatedNodeIds ?? planning.pipelineResult?.allocatedNodeIds ?? []),
    ...(planning.ascendancyPlanning?.allocatedNodeIds ?? []),
  ])
  return tree.nodes.filter(node => ids.has(node.id))
}

export function resolveAttackHitChance(input: {
  characterLevel?: number
  characterClassId?: string
  equipment: EquipmentEntry[]
  activeSet: 'set-1' | 'set-2'
  passiveTree?: RealPassiveTree
  realPassivePlanning?: RealPassivePlanningIntegrationResult
  enemyLevel?: number
  enemyEvasion?: number
}): AttackHitChanceResolution {
  const common = {
    modelVersion: ATTACK_HIT_CHANCE_MODEL_VERSION,
    comparisonDistanceMetres: DEFAULT_COMPARISON_DISTANCE_METRES,
    sourceReferences: [
      'PathOfBuilding-PoE2 src/Modules/CalcDefence.lua:calcs.hitChance',
      'PathOfBuilding-PoE2 src/Modules/CalcSetup.lua:accuracy_rating_per_level',
      'PathOfBuilding-PoE2 src/Modules/Data.lua:AccuracyPerDexBase',
      'PathOfBuilding-PoE2 src/Data/Misc.lua:monsterEvasionTable',
    ],
    limitations: [
      'Der Vergleich verwendet die PoB2-Standarddistanz von 2 m; distanzabhängige Genauigkeits-Sonderfälle sind nicht enthalten.',
      'Bedingte Genauigkeit gegen bestimmte Gegnerzustände oder Waffenklassen wird nur berücksichtigt, wenn sie als exakter Statwert vorliegt.',
      'Gegnerblocken ist noch nicht in der Trefferchance enthalten.',
    ],
  } as const
  if (!Number.isFinite(input.characterLevel)) return { ...common, status: 'blocked-missing-character-level' }
  const baseDexterity = input.characterClassId ? baseDexterityByClassId[input.characterClassId] : undefined
  if (baseDexterity == null) return { ...common, status: 'blocked-unknown-class' }

  const level = clampLevel(input.characterLevel!)
  const attributeModel = resolveCharacterAttributes({
    classId: input.characterClassId!,
    equipment: input.equipment,
    activeSet: input.activeSet,
    passiveTree: input.passiveTree,
    realPassivePlanning: input.realPassivePlanning,
  })
  const additionalDexterity = attributeModel.total.dexterity - baseDexterity
  let flatAccuracy = statSum(input.equipment, new Set(['accuracy_rating']), input.activeSet)
  let increasedAccuracyPercent = statSum(input.equipment, new Set(['accuracy_rating_+%']), input.activeSet)
  for (const node of allocatedNodes(input.passiveTree, input.realPassivePlanning, input.activeSet)) {
    for (const stat of node.stats) {
      const text = stat.sourceText?.replace(/\[[^|\]]+\|([^\]]+)\]/g, '$1').trim()
      if (!text) continue
      const accuracy = text.match(/^\+?(-?\d+) to Accuracy Rating$/i)
      const increased = text.match(/^(-?\d+(?:\.\d+)?)% increased Accuracy Rating$/i)
      if (accuracy) flatAccuracy += Number(accuracy[1])
      else if (increased) increasedAccuracyPercent += Number(increased[1])
    }
  }
  const baseAccuracyFromLevel = 6 * (level - 1)
  const accuracyFromDexterity = (baseDexterity + additionalDexterity) * 6
  const playerAccuracy = Math.floor((baseAccuracyFromLevel + accuracyFromDexterity + flatAccuracy) * (1 + increasedAccuracyPercent / 100))
  const enemyLevel = clampLevel(input.enemyLevel ?? level)
  const enemyEvasion = input.enemyEvasion ?? monsterEvasionAtLevel(enemyLevel)
  return {
    ...common,
    status: 'exact',
    playerAccuracy,
    enemyLevel,
    enemyEvasion,
    hitChancePercent: poe2HitChance(playerAccuracy, enemyEvasion),
    baseAccuracyFromLevel,
    baseDexterity,
    additionalDexterity,
    accuracyFromDexterity,
    flatAccuracy,
    increasedAccuracyPercent,
  }
}
