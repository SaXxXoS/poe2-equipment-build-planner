import type { BuildInput, CharacterConfiguration, EquipmentEntry, MechanicTag, SkillGemDefinition, SkillSetup, SupportGemDefinition } from '../../domain'
import { clusterJewelDefinitions, jewelDefinitions, modifierDefinitions, passiveNodeDefinitions, skillDefinitions, supportDefinitions, uniqueClusterJewelDefinitions } from '../../data'
import { analyzeBuild, type BuildAnalysis, type EngineCandidates, type EngineRequest, type PassiveCandidate, type RealPassivePlanningIntegrationResult } from '../../engine'
import { localizedPob2UniquesDe } from '../../localization/pob2-uniques-de'
import { pob2UniqueAnalyzerCandidates } from '../../uniques'
import { expandedJewelCandidates, expandedSkillCandidates, expandedSupportCandidates } from './semantic-candidates'
import { technicalItemClasses } from '../../affixes/registry'
import { repoeSkillCatalog, repoeSupportCatalog } from '../../gems/repoe-catalog'
import type { SyntheticWeaponType } from '../../domain'
import { migrateEquipmentEntry } from '../equipment-editor/model'
import officialPassiveTree from '../../../generated/poe2-tree/tree.json'

export const BUILD_ASSISTANT_V1_VERSION = '1.0.0'

const localizedUniqueNames = new Map(localizedPob2UniquesDe.map(item => [item.id, item.name]))
const damageTags = new Set<MechanicTag>(['physical', 'fire', 'cold', 'lightning', 'chaos'])

const curatedSkills = [...skillDefinitions, ...expandedSkillCandidates]
const curatedSkillByEnglishName = new Map(curatedSkills.filter(item => item.nameEn).map(item => [item.nameEn!.toLocaleLowerCase('en'), item]))
const skills: SkillGemDefinition[] = repoeSkillCatalog.map(imported => {
  const curated = curatedSkillByEnglishName.get(imported.nameEn?.toLocaleLowerCase('en') ?? '')
  return {
    ...curated,
    ...imported,
    requiredWeaponTypes: imported.requiredWeaponTypes ?? curated?.requiredWeaponTypes,
    recommendedSupportIds: imported.recommendedSupportIds ?? curated?.recommendedSupportIds,
  }
}).map((skill): SkillGemDefinition => ({
  ...skill,
  damageTypes: skill.tags.filter(tag => damageTags.has(tag)) as SkillGemDefinition['damageTypes'],
  possibleRoles: skill.tags.includes('movement') ? ['movement', 'utility']
    : skill.gemType === 'spirit'
      || skill.sourceTags?.some(tag => ['aura', 'buff', 'curse', 'debuff', 'mark', 'meta', 'persistent', 'trigger'].includes(tag))
      || skill.tags.some(tag => ['buff', 'debuff', 'defensive'].includes(tag))
      ? ['utility']
      : ['main', 'secondary'],
  mappingBase: skill.tags.some(tag => ['projectile', 'area', 'movement'].includes(tag)) ? 65 : 50,
  bossBase: skill.tags.includes('debuff') ? 70 : 55,
  enabled: true,
})).map(skill => {
  if (skill.nameEn === 'Orb of Storms') return {
    ...skill,
    possibleRoles: ['utility'] as SkillGemDefinition['possibleRoles'],
    rotationRoles: ['setup'] as SkillGemDefinition['rotationRoles'],
    preferredWeaponSet: 'set-2' as const,
    persistsAfterWeaponSwap: true,
    durationCategory: 'long' as const,
    affectsTarget: true,
  }
  if (skill.nameEn === 'Spark') return {
    ...skill,
    rotationRoles: ['main-damage'] as SkillGemDefinition['rotationRoles'],
    preferredWeaponSet: 'set-1' as const,
  }
  if (['Emergency Reload', 'Infernal Cry', 'Mantra of Destruction'].includes(skill.nameEn ?? '')) return {
    ...skill,
    possibleRoles: ['utility'] as SkillGemDefinition['possibleRoles'],
    rotationRoles: ['setup'] as SkillGemDefinition['rotationRoles'],
    affectsNextSkill: true,
  }
  return skill
})

const curatedSupports = [...supportDefinitions, ...expandedSupportCandidates]
const curatedSupportByEnglishName = new Map(curatedSupports.filter(item => item.nameEn).map(item => [item.nameEn!.toLocaleLowerCase('en'), item]))
const supports: SupportGemDefinition[] = repoeSupportCatalog.map(imported => {
  const englishName = imported.nameEn?.replace(/\s+[IVX]+$/u, '').toLocaleLowerCase('en') ?? ''
  const curated = curatedSupportByEnglishName.get(englishName)
  return {
    ...curated,
    ...imported,
    requiredTags: curated?.requiredTags ?? imported.requiredTags,
    excludedTags: curated?.excludedTags ?? imported.excludedTags,
    requiredWeaponTypes: curated?.requiredWeaponTypes ?? imported.requiredWeaponTypes,
    supportedDamageTypes: curated?.supportedDamageTypes ?? imported.supportedDamageTypes,
    supportedMechanics: curated?.supportedMechanics ?? imported.supportedMechanics,
  }
}).map(support => ({
  ...support,
  ownTags: support.ownTags ?? support.requiredTags,
  supportedMechanics: support.supportedMechanics ?? support.requiredTags,
  mappingBase: (support.ownTags ?? support.requiredTags).includes('projectile') ? 70 : 55,
  bossBase: support.id.includes('penetration') || support.id.includes('critical') ? 70 : 55,
  utilityBase: 10,
  enabled: true,
}))

const passives: PassiveCandidate[] = passiveNodeDefinitions.map(node => ({
  id: `candidate:${node.id}`,
  candidateType: 'node',
  nodeId: node.id,
  nodes: [node],
  connections: [],
  tags: node.tags,
  reachable: true,
  availablePointBudget: 20,
}))

export const buildAssistantCandidates: EngineCandidates = {
  skills,
  supports,
  passives,
  jewels: [...jewelDefinitions, ...clusterJewelDefinitions, ...uniqueClusterJewelDefinitions, ...expandedJewelCandidates],
  uniques: pob2UniqueAnalyzerCandidates.map(candidate => ({
    ...candidate,
    displayNameDe: localizedUniqueNames.get(candidate.id) ?? candidate.nameEn ?? 'Unbekanntes Unique',
  })),
}

export interface BuildAssistantInput {
  character: CharacterConfiguration
  equipment: EquipmentEntry[]
  setups: SkillSetup[]
}

const isOccupied = (entry: EquipmentEntry) =>
  Boolean(entry.itemClassId || entry.itemDefinitionId || entry.uniqueItemId || entry.modifierValues.length)

const syntheticWeaponType = (technicalName: string): SyntheticWeaponType | undefined => {
  const value = technicalName.toLowerCase()
  if (value.includes('staves')) return 'staff'
  if (value.includes('sceptre')) return 'sceptre'
  for(const type of ['crossbow','quarterstaff','bow','wand','claw','dagger','flail','mace','spear','sword','axe'] as const)if(value.includes(type))return type
  if (value.includes('focus')) return 'focus'
  return undefined
}

export function deriveWeaponContext(equipment: EquipmentEntry[]) {
  const occupied = equipment.filter(isOccupied)
  const availableWeaponSets = (['set-1', 'set-2'] as const).filter(set =>
    occupied.some(entry => entry.slotId.includes(set)),
  )
  const types = new Set<SyntheticWeaponType>()
  for (const entry of occupied) {
    if (!entry.slotId.includes('weapon-set')) continue
    const itemClass = technicalItemClasses.find(value => value.itemClassId === entry.itemClassId)
    const technicalType = itemClass && itemClass.weaponType !== 'not-applicable'
      ? syntheticWeaponType(itemClass.weaponType)
      : undefined
    if (technicalType) types.add(technicalType)
    if (entry.uniqueItemId) {
      const unique = buildAssistantCandidates.uniques.find(value => value.id === entry.uniqueItemId)
      for (const required of unique?.requiredWeaponTypes ?? []) types.add(required)
    }
  }
  return {
    availableWeaponTypes: types.size ? [...types].sort() : ['any'] as SyntheticWeaponType[],
    availableWeaponSets: availableWeaponSets.length ? [...availableWeaponSets] : ['set-1'] as ('set-1' | 'set-2')[],
  }
}

export function createBuildAssistantRequest(input: BuildAssistantInput): EngineRequest & { weaponContext: NonNullable<EngineRequest['weaponContext']> } {
  const analyzerSetups = input.setups.flatMap(setup => [
    setup,
    ...(setup.embeddedSkillIds ?? []).map((skillId, index): SkillSetup => {
      const embedded = buildAssistantCandidates.skills.find(value => value.id === skillId)
      return {
        id: `${setup.id}:embedded:${index + 1}`,
        skillId,
        role: 'secondary',
        weaponSet: setup.weaponSet,
        supportGemIds: setup.supportGemIds.filter(id => embedded?.recommendedSupportIds?.includes(id)),
        origin: setup.origin,
        synergyReason: `In ${buildAssistantCandidates.skills.find(value => value.id === setup.skillId)?.displayNameDe ?? 'Meta-Fertigkeit'} eingebettet`,
      }
    }),
  ])
  const buildInput: BuildInput = {
    character: input.character,
    equipment: input.equipment.map(migrateEquipmentEntry),
    skillSetups: analyzerSetups,
    selectedJewels: [],
    goalProfile: input.character.goalProfile,
  }
  return { input: buildInput, candidates: buildAssistantCandidates, weaponContext: deriveWeaponContext(input.equipment) }
}

export function runBuildAssistantV1(input: BuildAssistantInput, precomputedRealPassivePlanning?: RealPassivePlanningIntegrationResult): BuildAnalysis {
  const request = createBuildAssistantRequest(input)
  request.precomputedRealPassivePlanning = precomputedRealPassivePlanning
  if (precomputedRealPassivePlanning) {
    request.realPassivePlanning = {
      enabled: true,
      passiveTree: officialPassiveTree,
    }
  }
  return analyzeBuild(
    request,
    { engineVersion: BUILD_ASSISTANT_V1_VERSION, fixtureMode: true },
    modifierDefinitions,
  )
}

export function validateBuildAssistantInput(input: BuildAssistantInput): string[] {
  const errors: string[] = []
  if (!input.character.classId) errors.push('Bitte wähle eine Klasse.')
  if (!Number.isInteger(input.character.level) || input.character.level < 1 || input.character.level > 100) errors.push('Bitte gib ein gültiges Charakterlevel ein.')
  if (input.character.additionalPassivePoints != null && (!Number.isInteger(input.character.additionalPassivePoints) || input.character.additionalPassivePoints < 0)) errors.push('Bitte gib gültige Story-Passivpunkte ein.')
  if (!input.character.goalProfile) errors.push('Bitte wähle ein Zielprofil.')
  return errors
}
