import type { BuildInput, CharacterConfiguration, EquipmentEntry, MechanicTag, SkillGemDefinition, SkillSetup, SupportGemDefinition } from '../../domain'
import { clusterJewelDefinitions, jewelDefinitions, modifierDefinitions, passiveNodeDefinitions, skillDefinitions, supportDefinitions, uniqueClusterJewelDefinitions } from '../../data'
import { analyzeBuild, type BuildAnalysis, type EngineCandidates, type PassiveCandidate } from '../../engine'
import { localizedPob2UniquesDe } from '../../localization/pob2-uniques-de'
import { pob2UniqueAnalyzerCandidates } from '../../uniques'
import { expandedJewelCandidates, expandedSkillCandidates, expandedSupportCandidates } from './semantic-candidates'
import { technicalItemClasses } from '../../affixes/registry'
import type { SyntheticWeaponType } from '../../domain'
import { migrateEquipmentEntry } from '../equipment-editor/model'

export const BUILD_ASSISTANT_V1_VERSION = '1.0.0'

const localizedUniqueNames = new Map(localizedPob2UniquesDe.map(item => [item.id, item.name]))
const damageTags = new Set<MechanicTag>(['physical', 'fire', 'cold', 'lightning', 'chaos'])

const skills: SkillGemDefinition[] = [...skillDefinitions, ...expandedSkillCandidates].map(skill => ({
  ...skill,
  damageTypes: skill.tags.filter(tag => damageTags.has(tag)) as SkillGemDefinition['damageTypes'],
  possibleRoles: skill.tags.includes('movement') ? ['movement', 'utility'] : skill.tags.includes('buff') ? ['utility'] : ['main', 'secondary'],
  mappingBase: skill.tags.some(tag => ['projectile', 'area', 'movement'].includes(tag)) ? 65 : 50,
  bossBase: skill.tags.includes('debuff') ? 70 : 55,
  enabled: true,
}))

const supports: SupportGemDefinition[] = [...supportDefinitions, ...expandedSupportCandidates].map(support => ({
  ...support,
  ownTags: support.requiredTags,
  supportedMechanics: support.requiredTags,
  mappingBase: support.requiredTags.includes('projectile') ? 70 : 55,
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
  if (value.includes('bow') || value.includes('crossbow') || value.includes('wand')) return 'ranged-weapon'
  if (['claw', 'dagger', 'flail', 'mace', 'quarterstaff', 'spear', 'sword', 'axe'].some(token => value.includes(token))) return 'melee-weapon'
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

export function createBuildAssistantRequest(input: BuildAssistantInput) {
  const buildInput: BuildInput = {
    character: input.character,
    equipment: input.equipment.map(migrateEquipmentEntry),
    skillSetups: input.setups,
    selectedJewels: [],
    goalProfile: input.character.goalProfile,
  }
  return { input: buildInput, candidates: buildAssistantCandidates, weaponContext: deriveWeaponContext(input.equipment) }
}

export function runBuildAssistantV1(input: BuildAssistantInput): BuildAnalysis {
  return analyzeBuild(
    createBuildAssistantRequest(input),
    { engineVersion: BUILD_ASSISTANT_V1_VERSION, fixtureMode: true },
    modifierDefinitions,
  )
}

export function validateBuildAssistantInput(input: BuildAssistantInput): string[] {
  const errors: string[] = []
  if (!input.character.classId) errors.push('Bitte wähle eine Klasse.')
  if (!input.character.goalProfile) errors.push('Bitte wähle ein Zielprofil.')
  return errors
}
