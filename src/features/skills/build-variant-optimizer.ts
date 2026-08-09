import {
  type EquipmentEntry,
  type MechanicTag,
  type SkillGemDefinition,
  type SkillSetup,
  type SupportGemDefinition,
  type SyntheticWeaponType,
} from '../../domain'
import { estimateHitDamage } from '../../engine'
import type { CharacterAttributeModel, CharacterAttributeValues } from '../../engine/character-attributes/model'
import { technicalItemClasses } from '../../affixes/registry'
import {
  planSynergisticSkills,
  type PlannedSynergySkill,
  type SkillSynergyScore,
} from './synergy-planner'
import { scoreCharacterSkillAffinity } from './character-skill-affinity'
import { fillRecommendedSupportSlots } from './automatic-supports'
import { correlatedMetaSupportNames, scoreMetaReference } from './meta-reference'
import {
  evaluateSkillWeaponCompatibility,
  evaluateSupportInteraction,
  syntheticWeaponTypeFromTechnicalName,
  weaponTypeMatches,
} from './poe2-interaction-rules'
import { buildEffectGraph } from './build-effect-graph'
import {
  utilityBaseValuesFor,
  weaponBaseValuesFor,
  weaponStatsFromBase,
  type WeaponBaseValue,
} from '../equipment-editor/weapon-base-values'
import { baseRequirementsMet } from '../equipment-editor/base-requirements'

const weaponLabels: Record<SyntheticWeaponType, string> = {
  unarmed: 'Unbewaffnet',
  'melee-weapon': 'Nahkampfwaffe',
  'ranged-weapon': 'Fernkampfwaffe',
  focus: 'Fokus',
  bow: 'Bogen',
  crossbow: 'Armbrust',
  wand: 'Zauberstab',
  staff: 'Stab',
  sceptre: 'Zepter',
  claw: 'Klaue',
  dagger: 'Dolch',
  flail: 'Flegel',
  mace: 'Streitkolben',
  quarterstaff: 'Viertelstab',
  spear: 'Speer',
  sword: 'Schwert',
  axe: 'Axt',
  any: 'Keine belegte Waffenbindung',
}

export const weaponLabelFor = (weapon: SyntheticWeaponType): string =>
  weaponLabels[weapon]

const meleeWeapons = new Set<SyntheticWeaponType>(['axe', 'claw', 'dagger', 'flail', 'mace', 'quarterstaff', 'spear', 'sword'])
const rangedWeapons = new Set<SyntheticWeaponType>(['bow', 'crossbow', 'wand'])

export interface BuildVariantCandidate {
  skillId: string
  skillName: string
  skillTags?: MechanicTag[]
  weaponType: SyntheticWeaponType
  weaponLabel: string
  mainWeaponSet: 'set-1' | 'set-2'
  setupSkillId?: string
  setupSkillName?: string
  setupSkillTags?: MechanicTag[]
  setupWeaponType?: SyntheticWeaponType
  setupWeaponSet?: 'set-1' | 'set-2'
  setupReason?: string
  plannedSkillSetups?: Array<PlannedSynergySkill & {
    skillName: string
    weaponType: SyntheticWeaponType
  }>
  compatibleSupportIds: string[]
  affinityScore: number
  passiveAffinityScore: number
  analyzerScore: number
  modeledDps: number | null
  damageObjectiveScore: number
  numericCoverageStatus: 'comparable' | 'partial' | 'unavailable'
  resourceStatus?: 'confirmed-usable' | 'usable-with-limited-sustain' | 'resource-chain-unknown'
  resourcePenalty?: number
  totalScore: number
  metaReferenceScore?: number
  metaReferenceProfileCount?: number
  metaReferenceEvidenceClass?: string
  packageScore?: number
  packageStatus?: 'coherent' | 'limited' | 'blocked'
  packageComponents?: {
    equipment: number
    skill: number
    supports: number
    passives: number
    jewels: number
    uniques: number
    resources: number
    rotation: number
  }
  packageEvidence?: string[]
  packageBlockers?: string[]
  ruleGraphStatus?: 'coherent' | 'limited' | 'blocked'
  ruleGraphEvidence?: string[]
  reasons: string[]
}

export interface BuildVariantOptimization {
  evaluatedSkillCount: number
  evaluatedCombinationCount: number
  blockedCombinationCount: number
  blockedReasonCounts?: Record<string, number>
  equipmentFirst: boolean
  selected: BuildVariantCandidate | null
  alternatives: BuildVariantCandidate[]
  numericallyComparableCombinationCount: number
  optimizationStatus: 'quantitatively-compared' | 'mixed-evidence' | 'structural-only'
  status: 'selected' | 'no-compatible-variant'
}

export interface VariantSkillScore extends SkillSynergyScore {
  valid: boolean
  possibleRoles: string[]
}

export interface BuildPackageEvaluation {
  status: 'coherent' | 'limited' | 'blocked'
  totalScore: number
  components: NonNullable<BuildVariantCandidate['packageComponents']>
  evidence: string[]
  blockers: string[]
}

function equipmentWeaponSets(equipment: EquipmentEntry[]) {
  const result: Record<'set-1' | 'set-2', Set<SyntheticWeaponType>> = {
    'set-1': new Set(),
    'set-2': new Set(),
  }
  for (const entry of equipment) {
    const set = entry.slotId.includes('weapon-set-1') ? 'set-1'
      : entry.slotId.includes('weapon-set-2') ? 'set-2'
        : null
    if (!set || !entry.itemClassId) continue
    const itemClass = technicalItemClasses.find(value => value.itemClassId === entry.itemClassId)
    const type = syntheticWeaponTypeFromTechnicalName(itemClass?.weaponType)
    if (type) result[set].add(type)
  }
  return result
}

function candidateWeapons(skill: SkillGemDefinition, equipped: ReturnType<typeof equipmentWeaponSets>) {
  const equippedTypes = [...new Set([...equipped['set-1'], ...equipped['set-2']])]
  const compatibleEquipped = equippedTypes.filter(type =>
    evaluateSkillWeaponCompatibility(skill, type).status === 'productive')
  if (compatibleEquipped.length) return compatibleEquipped
  if (skill.requiredWeaponTypes?.length) {
    return skill.requiredWeaponTypes.flatMap(type =>
      type === 'melee-weapon' ? [...meleeWeapons]
        : type === 'ranged-weapon' ? [...rangedWeapons]
          : type === 'any' ? []
            : [type],
    ).filter((value, index, all) => all.indexOf(value) === index)
  }
  if (skill.tags.includes('spell')) return ['wand', 'staff', 'sceptre'] satisfies SyntheticWeaponType[]
  return []
}

const weaponBaseClasses: Partial<Record<SyntheticWeaponType, string[]>> = {
  axe: ['One Hand Axes', 'Two Hand Axes'], bow: ['Bows'], claw: ['Claws'],
  crossbow: ['Crossbows'], dagger: ['Daggers'], flail: ['Flails'],
  mace: ['One Hand Maces', 'Two Hand Maces'], quarterstaff: ['Quarterstaves'],
  spear: ['Spears'], sword: ['One Hand Swords', 'Two Hand Swords'],
}

function rawWeaponOutput(base: WeaponBaseValue): number {
  const stats = weaponStatsFromBase(base)
  return [
    stats.physicalDamage, stats.fireDamage, stats.coldDamage,
    stats.lightningDamage, stats.chaosDamage,
  ].reduce((sum, range) => sum + (range ? (range.minimum + range.maximum) / 2 : 0), 0)
    * (stats.attacksPerSecond ?? 0)
}

function referenceWeapon(
  weapon: SyntheticWeaponType,
  characterLevel: number | undefined,
  attributes: CharacterAttributeValues | undefined,
  set: 'set-1' | 'set-2',
): EquipmentEntry | null {
  const utilityClass = weapon === 'wand' ? 'Wands'
    : weapon === 'staff' ? 'Staves'
      : weapon === 'sceptre' ? 'Sceptres'
        : null
  if (utilityClass) {
    const base = utilityBaseValuesFor(utilityClass)
      .filter(value => baseRequirementsMet(value, characterLevel, attributes))
      .sort((left, right) =>
        (right.requiredLevel ?? 0) - (left.requiredLevel ?? 0)
        || left.id.localeCompare(right.id))[0]
    return base ? {
      id: `optimizer-reference-${set}-${base.id}`,
      slotId: `slot-weapon-${set}-left`,
      itemClassId: base.itemClassId,
      itemDefinitionId: base.id,
      baseDisplayName: base.nameEn,
      modifierValues: [],
    } : null
  }
  const base = (weaponBaseClasses[weapon] ?? [])
    .flatMap(itemClassId => weaponBaseValuesFor(itemClassId))
    .filter(value => baseRequirementsMet(value, characterLevel, attributes))
    .sort((left, right) => rawWeaponOutput(right) - rawWeaponOutput(left) || left.id.localeCompare(right.id))[0]
  if (!base) return null
  return {
    id: `optimizer-reference-${set}-${base.id}`,
    slotId: `slot-weapon-${set}-left`,
    itemClassId: base.itemClassId,
    itemDefinitionId: base.id,
    baseDisplayName: base.nameEn,
    weaponStats: weaponStatsFromBase(base),
    weaponStatsSource: 'pinned-base',
    modifierValues: [],
  }
}

const hasWeaponInSet = (equipment: EquipmentEntry[], set: 'set-1' | 'set-2') =>
  equipment.some(entry => entry.slotId.includes(`weapon-${set}`)
    && Boolean(entry.itemClassId || entry.itemDefinitionId || entry.uniqueItemId))

/** Evaluation-only weapon context built from pinned local base data. */
export function plannedEquipmentForVariant(
  equipment: EquipmentEntry[],
  candidate: Pick<BuildVariantCandidate,
    'weaponType' | 'mainWeaponSet' | 'setupSkillId' | 'setupWeaponType' | 'setupWeaponSet'>,
  characterLevel?: number,
  characterAttributes?: Record<'set-1' | 'set-2', CharacterAttributeModel>,
): EquipmentEntry[] {
  const planned = [...equipment]
  const add = (weapon: SyntheticWeaponType | undefined, set: 'set-1' | 'set-2') => {
    if (!weapon || hasWeaponInSet(planned, set)) return
    const reference = referenceWeapon(weapon, characterLevel, characterAttributes?.[set].total, set)
    if (!reference) return
    const emptySlotIndex = planned.findIndex(entry => entry.slotId === reference.slotId)
    if (emptySlotIndex >= 0) planned[emptySlotIndex] = reference
    else planned.push(reference)
  }
  add(candidate.weaponType, candidate.mainWeaponSet)
  if (candidate.setupSkillId) {
    add(
      candidate.setupWeaponType,
      candidate.setupWeaponSet ?? (candidate.mainWeaponSet === 'set-1' ? 'set-2' : 'set-1'),
    )
  }
  return planned
}

function equipmentForEstimate(
  equipment: EquipmentEntry[],
  skill: SkillGemDefinition,
  weapon: SyntheticWeaponType,
  set: 'set-1' | 'set-2',
  characterLevel: number | undefined,
  attributes: CharacterAttributeValues | undefined,
): EquipmentEntry[] {
  if (!skill.tags.includes('attack')) return equipment
  const hasCompatibleWeapon = equipment.some(entry => {
    if (!entry.slotId.includes(`weapon-${set}`) || !entry.itemClassId) return false
    const itemClass = technicalItemClasses.find(value => value.itemClassId === entry.itemClassId)
    const equippedType = syntheticWeaponTypeFromTechnicalName(itemClass?.weaponType)
    return equippedType === weapon
  })
  if (hasCompatibleWeapon) return equipment
  const reference = referenceWeapon(weapon, characterLevel, attributes, set)
  return reference ? [...equipment, reference] : equipment
}

function supportCompatible(skill: SkillGemDefinition, support: SupportGemDefinition, weapon: SyntheticWeaponType) {
  return evaluateSupportInteraction(skill, support, weapon, 'main').status === 'productive'
}

function preferredSet(weapon: SyntheticWeaponType, equipped: ReturnType<typeof equipmentWeaponSets>) {
  if (equipped['set-1'].has(weapon)) return 'set-1' as const
  if (equipped['set-2'].has(weapon)) return 'set-2' as const
  return 'set-1' as const
}

function characterAllowsSkill(skill: SkillGemDefinition, classId: string, ascendancyId: string) {
  if (skill.requiredClassId && skill.requiredClassId !== classId) return false
  if (skill.excludedClassIds?.includes(classId)) return false
  if (skill.allowedAscendancyIds?.length && !skill.allowedAscendancyIds.includes(ascendancyId)) return false
  return !skill.excludedAscendancyIds?.includes(ascendancyId)
}

function setupWeapon(
  skill: SkillGemDefinition | undefined,
  mainWeapon: SyntheticWeaponType,
  equipped: ReturnType<typeof equipmentWeaponSets>,
  setupSet: 'set-1' | 'set-2',
) {
  if (!skill) return undefined
  const equippedSetupWeapon = [...equipped[setupSet]].find(type =>
    weaponTypeMatches(skill.requiredWeaponTypes, type))
  if (equippedSetupWeapon) return equippedSetupWeapon
  if (weaponTypeMatches(skill.requiredWeaponTypes, mainWeapon)) return mainWeapon
  return candidateWeapons(skill, { 'set-1': new Set(), 'set-2': new Set() })[0]
}

function planCompatibleSkillPackage(
  mainSkill: SkillGemDefinition,
  definitions: SkillGemDefinition[],
  recommendationScores: SkillSynergyScore[],
  ascendancyId: string,
  mainWeapon: SyntheticWeaponType,
  mainWeaponSet: 'set-1' | 'set-2',
  equipped: ReturnType<typeof equipmentWeaponSets>,
) {
  const oppositeSet = mainWeaponSet === 'set-1' ? 'set-2' as const : 'set-1' as const
  let oppositeWeapon: SyntheticWeaponType | undefined
  const result: NonNullable<BuildVariantCandidate['plannedSkillSetups']> = []
  for (const planned of planSynergisticSkills(
    mainSkill,
    definitions,
    recommendationScores,
    8,
    { ascendancyId, mainWeaponSet },
  )) {
    const definition = definitions.find(value => value.id === planned.skillId)
    if (!definition) continue
    const targetSet = planned.weaponSet === 'both' ? mainWeaponSet : planned.weaponSet
    let weaponType = mainWeapon
    if (targetSet === oppositeSet) {
      const candidate = oppositeWeapon ?? setupWeapon(definition, mainWeapon, equipped, oppositeSet)
      if (!candidate || evaluateSkillWeaponCompatibility(definition, candidate).status !== 'productive') continue
      oppositeWeapon ??= candidate
      weaponType = candidate
    } else if (evaluateSkillWeaponCompatibility(definition, mainWeapon).status !== 'productive') {
      continue
    }
    result.push({
      ...planned,
      skillName: definition.displayNameDe || definition.nameEn || definition.id,
      weaponType,
    })
  }
  return result
}

export function normalizeDamageObjective(
  variants: BuildVariantCandidate[],
): BuildVariantCandidate[] {
  const positive = variants
    .map(candidate => candidate.modeledDps)
    .filter((value): value is number => value !== null && Number.isFinite(value) && value > 0)
  if (!positive.length) return variants
  const minimum = Math.min(...positive)
  const maximum = Math.max(...positive)
  const denominator = Math.log1p(maximum) - Math.log1p(minimum)
  return variants.map(candidate => {
    if (candidate.modeledDps === null || candidate.modeledDps <= 0) return candidate
    const damageObjectiveScore = denominator === 0
      ? 100
      : Math.round(30 + 70 * (
          (Math.log1p(candidate.modeledDps) - Math.log1p(minimum)) / denominator
        ))
    return {
      ...candidate,
      damageObjectiveScore,
      numericCoverageStatus: 'comparable',
      totalScore: candidate.totalScore + Math.round(damageObjectiveScore * 2.5),
      reasons: [
        ...candidate.reasons,
        `Relativer Schadensvergleich innerhalb derselben Modellgrenze: ${damageObjectiveScore}/100.`,
      ],
    }
  })
}

function compareVariantPriority(
  left: BuildVariantCandidate,
  right: BuildVariantCandidate,
  equipmentFirst: boolean,
) {
  /*
   * Ohne eingegebene Ausrüstung ist die lokale Schadensmodellierung noch
   * nicht vollständig genug, um einen kleineren beobachteten Build allein
   * wegen eines höheren Teil-DPS-Werts zum Saisonpaket zu erklären. In
   * diesem Bootstrap-Fall ist die Anzahl gemeinsam beobachteter Profile das
   * stärkste verfügbare Paket-Signal. Mit realer Ausrüstung bleibt dagegen
   * weiterhin deren fachliche Auswertung maßgeblich.
   */
  if (!equipmentFirst) {
    const profileDifference = (right.metaReferenceProfileCount ?? 0)
      - (left.metaReferenceProfileCount ?? 0)
    if (profileDifference !== 0) return profileDifference
  }
  return right.totalScore - left.totalScore
    || (right.modeledDps ?? -1) - (left.modeledDps ?? -1)
    || left.skillId.localeCompare(right.skillId)
    || left.weaponType.localeCompare(right.weaponType)
}

function packageEvaluationShortlist(
  variants: BuildVariantCandidate[],
  limit: number,
): Set<BuildVariantCandidate> {
  const selected = new Set<BuildVariantCandidate>()
  const take = (values: BuildVariantCandidate[], count: number) => {
    for (const value of values.slice(0, count)) selected.add(value)
  }
  const groupSize = Math.max(1, Math.ceil(limit / 3))
  take([...variants].sort((left, right) =>
    right.totalScore - left.totalScore || left.skillId.localeCompare(right.skillId),
  ), groupSize)
  take([...variants].sort((left, right) =>
    (right.modeledDps ?? -1) - (left.modeledDps ?? -1) || left.skillId.localeCompare(right.skillId),
  ), groupSize)
  take([...variants].sort((left, right) =>
    (right.metaReferenceProfileCount ?? 0) - (left.metaReferenceProfileCount ?? 0)
    || (right.metaReferenceScore ?? 0) - (left.metaReferenceScore ?? 0)
    || left.skillId.localeCompare(right.skillId),
  ), groupSize)
  for (const value of variants) {
    if (selected.size >= limit) break
    selected.add(value)
  }
  return selected
}

export function optimizeBuildVariants(input: {
  classId: string
  ascendancyId: string
  equipment: EquipmentEntry[]
  setups: SkillSetup[]
  skills: SkillGemDefinition[]
  supports: SupportGemDefinition[]
  skillScores: VariantSkillScore[]
  characterLevel?: number
  characterAttributes?: Record<'set-1' | 'set-2', CharacterAttributeModel>
  evaluatePackage?: (candidate: BuildVariantCandidate) => BuildPackageEvaluation
  maximumPackageEvaluations?: number
}): BuildVariantOptimization {
  const equipped = equipmentWeaponSets(input.equipment)
  const equipmentFirst = equipped['set-1'].size + equipped['set-2'].size > 0
  const scores = new Map(input.skillScores.map(value => [value.skillId, value]))
  const hasValidMainScore = input.skillScores.some(value =>
    value.valid && value.possibleRoles.includes('main'))
  let eligibleSkills = input.skills.filter(skill => {
    const score = scores.get(skill.id)
    if (skill.enabled === false) return false
    // Bei einem vollständig leeren Build kann der Skill-Analyzer noch keinen
    // Kandidaten als gültig markieren, weil ihm der Build-Treiber fehlt. In
    // genau diesem Bootstrap-Fall übernimmt der Variantenoptimierer die
    // Vorauswahl anhand der strukturierten Skill-/Waffenregeln. Sobald ein
    // gültiger Analyzer-Kandidat existiert, gelten dessen Ausschlüsse wieder.
    if (hasValidMainScore && score && (!score.valid || !score.possibleRoles.includes('main'))) return false
    if (skill.possibleRoles?.length && !skill.possibleRoles.includes('main')) return false
    return characterAllowsSkill(skill, input.classId, input.ascendancyId)
  })
  const evaluatedSkillCount = eligibleSkills.length
  if (!equipmentFirst) {
    const scoredAffinity = eligibleSkills.map(skill => ({
      skill,
      affinity: scoreCharacterSkillAffinity(skill, input.classId, input.ascendancyId),
    }))
    const correlatedPackageAligned = scoredAffinity
      .filter(({ skill }) => candidateWeapons(skill, equipped).some(weapon =>
        scoreMetaReference(skill, weapon, input.ascendancyId).correlatedProfileCount > 0,
      ))
      .map(value => value.skill)
    const metaAligned = scoredAffinity
      .filter(({ skill }) => candidateWeapons(skill, equipped).some(weapon =>
        scoreMetaReference(skill, weapon, input.ascendancyId).observedSkillShare !== undefined,
      ))
      .map(value => value.skill)
    const maximumAffinity = Math.max(0, ...scoredAffinity.map(value => value.affinity.score))
    const ascendancyAligned = scoredAffinity
      .filter(value => value.affinity.ascendancyMatches.length > 0 && value.affinity.score === maximumAffinity)
      .map(value => value.skill)
    // Ein validiertes, korreliertes Build-Paket ist belastbarer als getrennte
    // Skill- und Waffen-Randstatistiken. Deshalb darf ein loses Top-Skill-
    // Vorkommen keinen Kandidaten mit gemeinsam beobachteter Aszendenz,
    // Hauptskill, Waffe, Supports und verknüpften Skills verdrängen. Rollen-
    // und Waffenregeln bleiben erhalten, weil beide Listen ausschließlich aus
    // den bereits technisch zulässigen Hauptskillkandidaten entstehen.
    if (correlatedPackageAligned.length) eligibleSkills = correlatedPackageAligned
    else if (metaAligned.length) eligibleSkills = metaAligned
    else if (ascendancyAligned.length) eligibleSkills = ascendancyAligned
  }
  const characterSkills = input.skills.filter(skill =>
    skill.enabled !== false && characterAllowsSkill(skill, input.classId, input.ascendancyId),
  )
  let blockedCombinationCount = 0
  const blockedReasonCounts: Record<string, number> = {}
  const block = (reason: string) => {
    blockedCombinationCount += 1
    blockedReasonCounts[reason] = (blockedReasonCounts[reason] ?? 0) + 1
  }
  let variants = eligibleSkills.flatMap((skill): BuildVariantCandidate[] => {
    const weapons = candidateWeapons(skill, equipped)
    if (!weapons.length) {
      block('no-compatible-weapon-candidate')
      return []
    }
    return weapons.flatMap(weapon => {
      if (evaluateSkillWeaponCompatibility(skill, weapon).status !== 'productive') {
        block('skill-weapon-incompatible')
        return []
      }
      const score = scores.get(skill.id) ?? {
        skillId: skill.id,
        valid: true,
        possibleRoles: ['main'],
        totalScore: 0,
        damageScore: 0,
      }
      const affinity = scoreCharacterSkillAffinity(skill, input.classId, input.ascendancyId)
      const mainSetup = input.setups.find(value => value.role === 'main') ?? input.setups[0]
      if (!mainSetup) return []
      const observedSupportOrder = new Map(
        correlatedMetaSupportNames(skill, input.ascendancyId)
          .map((support, index) => [support.name, index]),
      )
      const compatibleSupports = input.supports
        .filter(support =>
          supportCompatible(skill, support, weapon)
          && !support.excludedClassIds?.includes(input.classId)
          && !support.excludedAscendancyIds?.includes(input.ascendancyId),
        )
        .sort((left, right) => {
          const metaDifference = (observedSupportOrder.get(left.nameEn ?? '') ?? Number.MAX_SAFE_INTEGER)
            - (observedSupportOrder.get(right.nameEn ?? '') ?? Number.MAX_SAFE_INTEGER)
          if (metaDifference !== 0) return metaDifference
          const overlap = (support: SupportGemDefinition) =>
            [...(support.ownTags ?? []), ...(support.supportedDamageTypes ?? []), ...(support.supportedMechanics ?? [])]
              .filter(tag => skill.tags.includes(tag)).length
          return overlap(right) - overlap(left) || left.id.localeCompare(right.id)
        })
      const supportIds = fillRecommendedSupportSlots(
        { ...mainSetup, skillId: skill.id, role: 'main', supportGemIds: [] },
        compatibleSupports.map(support => ({ skillId: skill.id, supportId: support.id })),
        input.supports,
        5,
        {
          equipment: input.equipment,
          setups: input.setups,
          skills: input.skills,
          characterLevel: input.characterLevel,
        },
      ).supportGemIds
      const mainWeaponSet = preferredSet(weapon, equipped)
      const setupWeaponSet = mainWeaponSet === 'set-1' ? 'set-2' as const : 'set-1' as const
      const plannedSkillSetups = planCompatibleSkillPackage(
        skill,
        characterSkills,
        input.skillScores,
        input.ascendancyId,
        weapon,
        mainWeaponSet,
        equipped,
      )
      const usableSetup = plannedSkillSetups.find(value => value.weaponSet === setupWeaponSet)
      const setupDefinition = characterSkills.find(value => value.id === usableSetup?.skillId)
      const setupWeaponType = usableSetup?.weaponType
      const estimateEquipment = equipmentForEstimate(
        input.equipment, skill, weapon, mainWeaponSet, input.characterLevel,
        input.characterAttributes?.[mainWeaponSet].total,
      )
      const estimate = estimateHitDamage({
        equipment: estimateEquipment,
        setups: [{ ...mainSetup, skillId: skill.id, role: 'main', weaponSet: mainWeaponSet, supportGemIds: supportIds }],
        skills: input.skills,
        supports: input.supports,
        fallbackSkillId: skill.id,
        characterLevel: input.characterLevel,
      })
      const modeledDps = estimate.hitDamagePerSecond ?? null
      const resourceModel = estimate.resourceSpiritModel
      const costChain = resourceModel?.skillCostChains.find(value => value.setupId === mainSetup.id)
      const capacityState = resourceModel?.spiritCapacityByWeaponSet.find(value => value.weaponSet === mainWeaponSet)
      const resourceBlocked = costChain?.sustainStatus === 'unusable-confirmed-zero-mana'
        || capacityState?.status === 'exceeds-level-derived-quest-estimate'
      if (resourceBlocked) {
        block(costChain?.sustainStatus === 'unusable-confirmed-zero-mana'
          ? 'confirmed-zero-mana'
          : 'spirit-capacity-exceeded')
        return []
      }
      const resourcePenalty = (costChain?.sustainStatus === 'burst-affordable-on-confirmed-minimum' ? 20 : 0)
        + (costChain?.sustainStatus === 'blocked-missing-action-frequency' ? 8 : 0)
        + (capacityState?.status === 'exceeds-confirmed-minimum' ? 12 : 0)
        + (capacityState?.status === 'fits-level-derived-quest-estimate' ? 4 : 0)
      const resourceStatus = costChain?.sustainStatus === 'sustainable-on-confirmed-minimum'
        && (!capacityState || capacityState.status === 'fits-confirmed-minimum' || capacityState.status === 'no-reservations')
        ? 'confirmed-usable' as const
        : costChain?.sustainStatus === 'burst-affordable-on-confirmed-minimum'
          ? 'usable-with-limited-sustain' as const
          : 'resource-chain-unknown' as const
      const passiveAffinityScore = affinity.score
      const metaReference = scoreMetaReference(skill, weapon, input.ascendancyId)
      const weaponEvidenceScore = skill.requiredWeaponTypes?.length
        ? 80
        : skill.tags.includes('spell') && ['wand', 'staff', 'sceptre'].includes(weapon)
          ? 25
          : 0
      const setupScore = Math.min(70, plannedSkillSetups.length * 10 + (usableSetup ? 20 : 0))
      const ruleGraph = buildEffectGraph({
        mainSkill: skill,
        mainWeapon: weapon,
        supports: supportIds
          .map(id => input.supports.find(value => value.id === id))
          .filter((value): value is SupportGemDefinition => Boolean(value)),
        setupSkills: plannedSkillSetups.flatMap(planned => {
          const definition = characterSkills.find(value => value.id === planned.skillId)
          return definition ? [{
            skill: definition,
            relationship: {
              evidence: planned.evidence,
              reason: planned.reason,
              ruleId: planned.ruleId,
            },
          }] : []
        }),
        ascendancyId: input.ascendancyId,
        role: 'main',
      })
      if (ruleGraph.status === 'blocked') {
        block('effect-graph-blocked')
        return []
      }
      /*
       * Meta-Beobachtungen sind ein nachrangiger, gepinnter
       * Plausibilitätsbeleg. Sie dürfen technische Skill-, Waffen-,
       * Ressourcen- und Aszendenzregeln nicht überstimmen.
       */
      const metaReferenceContribution = Math.min(
        equipmentFirst ? 35 : 400,
        Math.round(metaReference.score * (equipmentFirst ? 0.5 : 6)),
      )
      const totalScore = Math.round(
        score.totalScore * 2
        + affinity.score * 3
        + passiveAffinityScore * 2
        + weaponEvidenceScore
        + supportIds.length * 4
        + setupScore
        // Ohne eingegebene Ausrüstung fehlt das vorrangige Equipment-Signal.
        // Dann darf der gepinnte, ascendancy-spezifische Snapshot stärker
        // zwischen bereits hart kompatiblen Kandidaten unterscheiden. Er
        // überstimmt weiterhin keine Waffen-, Skill- oder Supportregel.
        + metaReferenceContribution
        + Math.min(60, ruleGraph.productiveEdgeCount * 6)
        - resourcePenalty,
      )
      const reasons = [
        `${weaponLabels[weapon]} ist mit der Fertigkeit technisch kompatibel.`,
        ...(affinity.classMatches.length ? [`Klassenbezug: ${affinity.classMatches.join(', ')}.`] : []),
        ...(affinity.ascendancyMatches.length ? [`Aszendenzbezug: ${affinity.ascendancyMatches.join(', ')}.`] : []),
        ...(usableSetup
          ? [`Waffenset ${setupWeaponSet === 'set-1' ? '1' : '2'}: ${usableSetup.reason}`]
          : []),
        ...(metaReference.observedSkillShare !== undefined
          ? [`Aktuelle Meta-Referenz: ${skill.nameEn ?? skill.displayNameDe} erscheint bei ${metaReference.observedSkillShare} % von ${metaReference.sampleSize} erfassten Charakteren dieser Aszendenz.`]
          : []),
        ...(metaReference.correlatedProfileCount > 0
          ? [`Validiertes Build-Paket: ${skill.nameEn ?? skill.displayNameDe} und ${weaponLabels[weapon]} sind in ${metaReference.correlatedProfileCount} Profilen derselben Aszendenz gemeinsam belegt.`]
          : []),
        resourceStatus === 'confirmed-usable'
          ? 'Die belegte Ressourcenbilanz deckt die Kombination dauerhaft.'
          : resourceStatus === 'usable-with-limited-sustain'
            ? 'Die Kombination ist einsetzbar; dauerhafte Ressourcendeckung ist noch nicht belegt.'
            : 'Die Ressourcenwirkung ist unvollständig belegt und erzeugt keinen positiven Bonus.',
      ]
      return [{
        skillId: skill.id,
        skillName: skill.displayNameDe || skill.nameEn || skill.id,
        skillTags: [...skill.tags],
        weaponType: weapon,
        weaponLabel: weaponLabelFor(weapon),
        mainWeaponSet,
        setupSkillId: usableSetup?.skillId,
        setupSkillName: usableSetup && setupDefinition
          ? setupDefinition.displayNameDe || setupDefinition.nameEn || setupDefinition.id
          : undefined,
        setupSkillTags: usableSetup && setupDefinition ? [...setupDefinition.tags] : undefined,
        setupWeaponType: usableSetup ? setupWeaponType : undefined,
        setupWeaponSet: usableSetup ? setupWeaponSet : undefined,
        setupReason: usableSetup?.reason,
        plannedSkillSetups,
        compatibleSupportIds: supportIds,
        affinityScore: affinity.score,
        passiveAffinityScore,
        analyzerScore: score.totalScore,
        modeledDps,
        damageObjectiveScore: 0,
        numericCoverageStatus: modeledDps === null ? 'unavailable' : 'partial',
        resourceStatus,
        resourcePenalty,
        totalScore,
        metaReferenceScore: metaReference.score,
        metaReferenceProfileCount: metaReference.correlatedProfileCount,
        metaReferenceEvidenceClass: metaReference.correlatedEvidenceClass,
        ruleGraphStatus: ruleGraph.status,
        ruleGraphEvidence: [
          ...ruleGraph.edges.filter(edge => edge.productive).map(edge => edge.reason),
          ...ruleGraph.unresolved,
        ],
        reasons,
      }]
    })
  })
  variants = normalizeDamageObjective(variants).sort((left, right) =>
    compareVariantPriority(left, right, equipmentFirst),
  )
  if (input.evaluatePackage) {
    const limit = Math.max(1, input.maximumPackageEvaluations ?? 8)
    const shortlist = packageEvaluationShortlist(variants, limit)
    variants = variants.map(candidate => {
      if (!shortlist.has(candidate)) return candidate
      const evaluation = input.evaluatePackage!(candidate)
      return {
        ...candidate,
        packageScore: evaluation.totalScore,
        packageStatus: evaluation.status,
        packageComponents: evaluation.components,
        packageEvidence: evaluation.evidence,
        packageBlockers: evaluation.blockers,
        totalScore: evaluation.status === 'blocked'
          ? Number.NEGATIVE_INFINITY
          : candidate.totalScore + evaluation.totalScore,
        reasons: [...candidate.reasons, ...evaluation.evidence],
      }
    }).sort((left, right) =>
      (left.packageStatus === 'blocked' ? 1 : 0) - (right.packageStatus === 'blocked' ? 1 : 0)
      || (left.packageStatus === 'coherent' ? 0 : 1) - (right.packageStatus === 'coherent' ? 0 : 1)
      || compareVariantPriority(left, right, equipmentFirst),
    )
  }
  const selectable = variants.filter(candidate =>
    input.evaluatePackage
      ? candidate.packageStatus !== undefined && candidate.packageStatus !== 'blocked'
      : true,
  )
  const numericallyComparableCombinationCount = variants.filter(
    candidate => candidate.numericCoverageStatus === 'comparable',
  ).length
  return {
    evaluatedSkillCount,
    evaluatedCombinationCount: variants.length,
    blockedCombinationCount,
    blockedReasonCounts,
    equipmentFirst,
    selected: selectable[0] ?? null,
    alternatives: selectable.slice(1, 6),
    numericallyComparableCombinationCount,
    optimizationStatus: numericallyComparableCombinationCount === variants.length && variants.length > 0
      ? 'quantitatively-compared'
      : numericallyComparableCombinationCount > 0
        ? 'mixed-evidence'
        : 'structural-only',
    status: selectable.length ? 'selected' : 'no-compatible-variant',
  }
}
