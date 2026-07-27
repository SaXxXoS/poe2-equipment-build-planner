import {
  supportExclusiveKeys,
  type EquipmentEntry,
  type SkillGemDefinition,
  type SkillSetup,
  type SupportGemDefinition,
  type SyntheticWeaponType,
} from '../../domain'
import { estimateHitDamage } from '../../engine'
import { technicalItemClasses } from '../../affixes/registry'
import { planSynergisticSkills, type SkillSynergyScore } from './synergy-planner'
import { scoreCharacterSkillAffinity } from './character-skill-affinity'

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

const meleeWeapons = new Set<SyntheticWeaponType>(['axe', 'claw', 'dagger', 'flail', 'mace', 'quarterstaff', 'spear', 'sword'])
const rangedWeapons = new Set<SyntheticWeaponType>(['bow', 'crossbow', 'wand'])

export interface BuildVariantCandidate {
  skillId: string
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
  totalScore: number
  reasons: string[]
}

export interface BuildVariantOptimization {
  evaluatedSkillCount: number
  evaluatedCombinationCount: number
  blockedCombinationCount: number
  equipmentFirst: boolean
  selected: BuildVariantCandidate | null
  alternatives: BuildVariantCandidate[]
  status: 'selected' | 'no-compatible-variant'
}

export interface VariantSkillScore extends SkillSynergyScore {
  valid: boolean
  possibleRoles: string[]
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

function weaponMatches(required: SyntheticWeaponType[] | undefined, weapon: SyntheticWeaponType) {
  if (!required?.length || required.includes('any')) return true
  return required.some(value =>
    value === weapon
    || value === 'melee-weapon' && meleeWeapons.has(weapon)
    || value === 'ranged-weapon' && rangedWeapons.has(weapon),
  )
}

function candidateWeapons(skill: SkillGemDefinition, equipped: ReturnType<typeof equipmentWeaponSets>) {
  const equippedTypes = [...new Set([...equipped['set-1'], ...equipped['set-2']])]
  if (equippedTypes.length) return equippedTypes.filter(type => weaponMatches(skill.requiredWeaponTypes, type))
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

function supportCompatible(skill: SkillGemDefinition, support: SupportGemDefinition, weapon: SyntheticWeaponType) {
  if (support.enabled === false) return false
  if (support.selectionOnly && !skill.recommendedSupportIds?.includes(support.id)) return false
  if (support.requiredTags.some(tag => !skill.tags.includes(tag))) return false
  if (support.excludedTags.some(tag => skill.tags.includes(tag))) return false
  if (support.supportedDamageTypes?.some(tag => !skill.tags.includes(tag))) return false
  if (support.supportedMechanics?.some(tag => !skill.tags.includes(tag))) return false
  if (support.excludedDamageTypes?.some(tag => skill.tags.includes(tag))) return false
  if (support.requiredWeaponTypes?.length && !weaponMatches(support.requiredWeaponTypes, weapon)) return false
  if (support.excludedWeaponTypes?.some(type => weaponMatches([type], weapon))) return false
  if (support.allowedSkillRoles?.length && !support.allowedSkillRoles.includes('main')) return false
  return true
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
  const equippedSetTwo = [...equipped['set-2']].find(type => weaponMatches(skill.requiredWeaponTypes, type))
  if (equippedSetTwo) return equippedSetTwo
  if (weaponMatches(skill.requiredWeaponTypes, mainWeapon)) return mainWeapon
  return candidateWeapons(skill, { 'set-1': new Set(), 'set-2': new Set() })[0]
}

export function optimizeBuildVariants(input: {
  classId: string
  ascendancyId: string
  equipment: EquipmentEntry[]
  setups: SkillSetup[]
  skills: SkillGemDefinition[]
  supports: SupportGemDefinition[]
  skillScores: VariantSkillScore[]
}): BuildVariantOptimization {
  const equipped = equipmentWeaponSets(input.equipment)
  const equipmentFirst = equipped['set-1'].size + equipped['set-2'].size > 0
  const scores = new Map(input.skillScores.map(value => [value.skillId, value]))
  const eligibleSkills = input.skills.filter(skill => {
    const score = scores.get(skill.id)
    if (skill.enabled === false || !score?.valid || !score.possibleRoles.includes('main')) return false
    if (skill.possibleRoles?.length && !skill.possibleRoles.includes('main')) return false
    return characterAllowsSkill(skill, input.classId, input.ascendancyId)
  })
  const characterSkills = input.skills.filter(skill =>
    skill.enabled !== false && characterAllowsSkill(skill, input.classId, input.ascendancyId),
  )
  let blockedCombinationCount = 0
  const variants = eligibleSkills.flatMap((skill): BuildVariantCandidate[] => {
    const weapons = candidateWeapons(skill, equipped)
    if (!weapons.length) {
      blockedCombinationCount += 1
      return []
    }
    return weapons.flatMap(weapon => {
      if (!weaponMatches(skill.requiredWeaponTypes, weapon)) {
        blockedCombinationCount += 1
        return []
      }
      const score = scores.get(skill.id)!
      const affinity = scoreCharacterSkillAffinity(skill, input.classId, input.ascendancyId)
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
      const usedSupportKeys = new Set<string>()
      const supportIds = compatibleSupports
        .filter(support => {
          const keys = supportExclusiveKeys(support)
          if (keys.some(key => usedSupportKeys.has(key))) return false
          keys.forEach(key => usedSupportKeys.add(key))
          return true
        })
        .slice(0, 5)
        .map(value => value.id)
      const setup = planSynergisticSkills(skill, characterSkills, input.skillScores, 1)[0]
      const setupDefinition = characterSkills.find(value => value.id === setup?.skillId)
      const setupWeaponType = setupWeapon(setupDefinition, weapon, equipped)
      const usableSetup = setup && setupDefinition && setupWeaponType
        && weaponMatches(setupDefinition.requiredWeaponTypes, setupWeaponType)
        ? setup
        : undefined
      const mainWeaponSet = preferredSet(weapon, equipped)
      const mainSetup = input.setups.find(value => value.role === 'main') ?? input.setups[0]
      if (!mainSetup) return []
      const estimate = estimateHitDamage({
        equipment: input.equipment,
        setups: [{ ...mainSetup, skillId: skill.id, role: 'main', weaponSet: mainWeaponSet, supportGemIds: supportIds }],
        skills: input.skills,
        fallbackSkillId: skill.id,
      })
      const modeledDps = estimate.hitDamagePerSecond ?? null
      const passiveAffinityScore = affinity.score
      const weaponEvidenceScore = skill.requiredWeaponTypes?.length ? 80 : skill.tags.includes('spell') && weapon === 'wand' ? 25 : 0
      const setupScore = usableSetup ? 35 : 0
      const totalScore = Math.round(
        score.totalScore * 2
        + affinity.score * 3
        + passiveAffinityScore * 2
        + weaponEvidenceScore
        + supportIds.length * 4
        + setupScore
        + Math.min(250, modeledDps ?? 0),
      )
      const reasons = [
        `${weaponLabels[weapon]} ist mit der Fertigkeit technisch kompatibel.`,
        ...(affinity.classMatches.length ? [`Klassenbezug: ${affinity.classMatches.join(', ')}.`] : []),
        ...(affinity.ascendancyMatches.length ? [`Aszendenzbezug: ${affinity.ascendancyMatches.join(', ')}.`] : []),
        ...(usableSetup ? [`Waffenset 2: ${usableSetup.reason}`] : []),
      ]
      return [{
        skillId: skill.id,
        weaponType: weapon,
        weaponLabel: weaponLabels[weapon],
        mainWeaponSet,
        setupSkillId: usableSetup?.skillId,
        setupWeaponType: usableSetup ? setupWeaponType : undefined,
        setupReason: usableSetup?.reason,
        compatibleSupportIds: supportIds,
        affinityScore: affinity.score,
        passiveAffinityScore,
        analyzerScore: score.totalScore,
        modeledDps,
        totalScore,
        reasons,
      }]
    })
  }).sort((left, right) =>
    right.totalScore - left.totalScore
    || (right.modeledDps ?? -1) - (left.modeledDps ?? -1)
    || left.skillId.localeCompare(right.skillId)
    || left.weaponType.localeCompare(right.weaponType),
  )
  return {
    evaluatedSkillCount: eligibleSkills.length,
    evaluatedCombinationCount: variants.length,
    blockedCombinationCount,
    equipmentFirst,
    selected: variants[0] ?? null,
    alternatives: variants.slice(1, 6),
    status: variants.length ? 'selected' : 'no-compatible-variant',
  }
}
