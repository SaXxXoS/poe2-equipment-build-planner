import {
  type EquipmentEntry,
  type MechanicTag,
  type SkillGemDefinition,
  type SkillSetup,
  type SupportGemDefinition,
  type SyntheticWeaponType,
} from '../../domain'
import { estimateHitDamage } from '../../engine'
import { technicalItemClasses } from '../../affixes/registry'
import { planSynergisticSkills, type SkillSynergyScore } from './synergy-planner'
import { scoreCharacterSkillAffinity } from './character-skill-affinity'
import { fillRecommendedSupportSlots } from './automatic-supports'
import { scoreMetaReference } from './meta-reference'
import {
  evaluateSkillWeaponCompatibility,
  evaluateSupportInteraction,
  weaponTypeMatches,
} from './poe2-interaction-rules'
import { buildEffectGraph } from './build-effect-graph'
import {
  weaponBaseValuesFor,
  weaponStatsFromBase,
  type WeaponBaseValue,
} from '../equipment-editor/weapon-base-values'

const concreteWeapons: SyntheticWeaponType[] = [
  'axe', 'bow', 'claw', 'crossbow', 'dagger', 'flail', 'mace',
  'quarterstaff', 'spear', 'sword', 'wand',
]

const weaponLabels: Record<SyntheticWeaponType, string> = {
  unarmed: 'Unbewaffnet',
  'melee-weapon': 'Nahkampfwaffe',
  'ranged-weapon': 'Fernkampfwaffe',
  focus: 'Fokus',
  bow: 'Bogen',
  crossbow: 'Armbrust',
  wand: 'Zauberstab',
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
  setupWeaponType?: SyntheticWeaponType
  setupReason?: string
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
    const technical = itemClass?.weaponType.toLowerCase()
    const type = concreteWeapons.find(value => technical?.includes(value))
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
  if (skill.tags.includes('spell')) return ['wand'] satisfies SyntheticWeaponType[]
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
  set: 'set-1' | 'set-2',
): EquipmentEntry | null {
  const base = (weaponBaseClasses[weapon] ?? [])
    .flatMap(itemClassId => weaponBaseValuesFor(itemClassId))
    .filter(value => value.requiredLevel === null || characterLevel === undefined || value.requiredLevel <= characterLevel)
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

function equipmentForEstimate(
  equipment: EquipmentEntry[],
  skill: SkillGemDefinition,
  weapon: SyntheticWeaponType,
  set: 'set-1' | 'set-2',
  characterLevel: number | undefined,
): EquipmentEntry[] {
  if (!skill.tags.includes('attack')) return equipment
  const hasCompatibleWeapon = equipment.some(entry => {
    if (!entry.slotId.includes(`weapon-${set}`) || !entry.itemClassId) return false
    const itemClass = technicalItemClasses.find(value => value.itemClassId === entry.itemClassId)
    const technical = itemClass?.weaponType.toLowerCase()
    return concreteWeapons.some(type => technical?.includes(type) && type === weapon)
  })
  if (hasCompatibleWeapon) return equipment
  const reference = referenceWeapon(weapon, characterLevel, set)
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
) {
  if (!skill) return undefined
  const equippedSetTwo = [...equipped['set-2']].find(type => weaponTypeMatches(skill.requiredWeaponTypes, type))
  if (equippedSetTwo) return equippedSetTwo
  if (weaponTypeMatches(skill.requiredWeaponTypes, mainWeapon)) return mainWeapon
  return candidateWeapons(skill, { 'set-1': new Set(), 'set-2': new Set() })[0]
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
    (right.metaReferenceScore ?? 0) - (left.metaReferenceScore ?? 0) || left.skillId.localeCompare(right.skillId),
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
  evaluatePackage?: (candidate: BuildVariantCandidate) => BuildPackageEvaluation
  maximumPackageEvaluations?: number
}): BuildVariantOptimization {
  const equipped = equipmentWeaponSets(input.equipment)
  const equipmentFirst = equipped['set-1'].size + equipped['set-2'].size > 0
  const scores = new Map(input.skillScores.map(value => [value.skillId, value]))
  const hasValidMainScore = input.skillScores.some(value =>
    value.valid && value.possibleRoles.includes('main'))
  const eligibleSkills = input.skills.filter(skill => {
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
  const characterSkills = input.skills.filter(skill =>
    skill.enabled !== false && characterAllowsSkill(skill, input.classId, input.ascendancyId),
  )
  let blockedCombinationCount = 0
  let variants = eligibleSkills.flatMap((skill): BuildVariantCandidate[] => {
    const weapons = candidateWeapons(skill, equipped)
    if (!weapons.length) {
      blockedCombinationCount += 1
      return []
    }
    return weapons.flatMap(weapon => {
      if (evaluateSkillWeaponCompatibility(skill, weapon).status !== 'productive') {
        blockedCombinationCount += 1
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
      const compatibleSupports = input.supports
        .filter(support =>
          supportCompatible(skill, support, weapon)
          && !support.excludedClassIds?.includes(input.classId)
          && !support.excludedAscendancyIds?.includes(input.ascendancyId),
        )
        .sort((left, right) => {
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
      const setup = planSynergisticSkills(skill, characterSkills, input.skillScores, 1, {
        ascendancyId: input.ascendancyId,
      })[0]
      const setupDefinition = characterSkills.find(value => value.id === setup?.skillId)
      const setupWeaponType = setupWeapon(setupDefinition, weapon, equipped)
      const usableSetup = setup && setupDefinition && setupWeaponType
        && evaluateSkillWeaponCompatibility(setupDefinition, setupWeaponType).status === 'productive'
        ? setup
        : undefined
      const mainWeaponSet = preferredSet(weapon, equipped)
      const estimateEquipment = equipmentForEstimate(
        input.equipment, skill, weapon, mainWeaponSet, input.characterLevel,
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
        blockedCombinationCount += 1
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
      const weaponEvidenceScore = skill.requiredWeaponTypes?.length ? 80 : skill.tags.includes('spell') && weapon === 'wand' ? 25 : 0
      const setupScore = usableSetup ? 35 : 0
      const ruleGraph = buildEffectGraph({
        mainSkill: skill,
        mainWeapon: weapon,
        supports: supportIds
          .map(id => input.supports.find(value => value.id === id))
          .filter((value): value is SupportGemDefinition => Boolean(value)),
        setupSkill: usableSetup ? setupDefinition : undefined,
        ascendancyId: input.ascendancyId,
        role: 'main',
      })
      if (ruleGraph.status === 'blocked') {
        blockedCombinationCount += 1
        return []
      }
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
        + metaReference.score * (equipmentFirst ? 1 : 40)
        + Math.min(60, ruleGraph.productiveEdgeCount * 6)
        - resourcePenalty,
      )
      const reasons = [
        `${weaponLabels[weapon]} ist mit der Fertigkeit technisch kompatibel.`,
        ...(affinity.classMatches.length ? [`Klassenbezug: ${affinity.classMatches.join(', ')}.`] : []),
        ...(affinity.ascendancyMatches.length ? [`Aszendenzbezug: ${affinity.ascendancyMatches.join(', ')}.`] : []),
        ...(usableSetup ? [`Waffenset 2: ${usableSetup.reason}`] : []),
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
        setupWeaponType: usableSetup ? setupWeaponType : undefined,
        setupReason: usableSetup?.reason,
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
    right.totalScore - left.totalScore
    || (right.modeledDps ?? -1) - (left.modeledDps ?? -1)
    || left.skillId.localeCompare(right.skillId)
    || left.weaponType.localeCompare(right.weaponType),
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
      || right.totalScore - left.totalScore
      || (right.modeledDps ?? -1) - (left.modeledDps ?? -1)
      || left.skillId.localeCompare(right.skillId)
      || left.weaponType.localeCompare(right.weaponType),
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
    evaluatedSkillCount: eligibleSkills.length,
    evaluatedCombinationCount: variants.length,
    blockedCombinationCount,
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
