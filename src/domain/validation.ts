import type { EntityId } from './common'
import type { AscendancyDefinition, ClassDefinition } from './character'
import type { EquipmentSlotDefinition } from './equipment'
import type { AppliedModifier, ModifierDefinition } from './modifiers'
import type { PassiveConnection, PassiveNodeDefinition } from './passive-tree'
import type { SkillGemDefinition, SkillSetup, SupportGemDefinition } from './skills'
import type { BuildResult } from './build'

export interface PlaceholderDataSet {
  classes: ClassDefinition[]
  ascendancies: AscendancyDefinition[]
  equipmentSlots: EquipmentSlotDefinition[]
  modifierDefinitions: ModifierDefinition[]
  appliedModifiers: AppliedModifier[]
  skillDefinitions: SkillGemDefinition[]
  supportDefinitions: SupportGemDefinition[]
  skillSetups: SkillSetup[]
  passiveNodes: PassiveNodeDefinition[]
  passiveConnections: PassiveConnection[]
  buildResult: BuildResult
}

export function findDuplicateIds(ids: EntityId[]): EntityId[] {
  const seen = new Set<EntityId>()
  return [...new Set(ids.filter(id => seen.has(id) || !seen.add(id)))]
}

export function validateUniqueIds<T extends { id: EntityId }>(kind: string, values: T[]): string[] {
  return findDuplicateIds(values.map(value => value.id)).map(id => `${kind}: doppelte ID ${id}`)
}

export function validateAscendancyReferences(classes: ClassDefinition[], ascendancies: AscendancyDefinition[]): string[] {
  const classIds = new Set(classes.map(value => value.id))
  return ascendancies.filter(value => !classIds.has(value.classId)).map(value => `Aszendenz ${value.id}: unbekannte Klasse ${value.classId}`)
}

export function validateSkillReferences(skills: SkillGemDefinition[], supports: SupportGemDefinition[], setups: SkillSetup[]): string[] {
  const skillIds = new Set(skills.map(value => value.id)); const supportIds = new Set(supports.map(value => value.id))
  return setups.flatMap(setup => [
    ...(!skillIds.has(setup.skillId) ? [`SkillSetup ${setup.id}: unbekannter Skill ${setup.skillId}`] : []),
    ...setup.supportGemIds.filter(id => !supportIds.has(id)).map(id => `SkillSetup ${setup.id}: unbekannter Support ${id}`),
  ])
}

export function validatePassiveConnections(nodes: PassiveNodeDefinition[], connections: PassiveConnection[]): string[] {
  const nodeIds = new Set(nodes.map(value => value.id))
  return connections.flatMap(connection => [connection.fromNodeId, connection.toNodeId]
    .filter(id => !nodeIds.has(id)).map(id => `Verbindung ${connection.id}: unbekannter Knoten ${id}`))
}

export function validateModifierValues(definitions: ModifierDefinition[], values: AppliedModifier[]): string[] {
  const definitionsById = new Map(definitions.map(value => [value.id, value]))
  return values.flatMap(value => {
    const definition = definitionsById.get(value.modifierId)
    if (!definition) return [`Modifierwert ${value.id}: unbekannter Modifier ${value.modifierId}`]
    const candidates = typeof value.value === 'number' ? [value.value] : [value.value.min, value.value.max]
    return candidates.flatMap(candidate => [
      ...(definition.minValue !== undefined && candidate < definition.minValue ? [`Modifierwert ${value.id}: ${candidate} unter Minimum ${definition.minValue}`] : []),
      ...(definition.maxValue !== undefined && candidate > definition.maxValue ? [`Modifierwert ${value.id}: ${candidate} über Maximum ${definition.maxValue}`] : []),
    ])
  })
}

export function validatePlaceholderData(data: PlaceholderDataSet): string[] {
  return [
    ...validateUniqueIds('Klasse', data.classes), ...validateUniqueIds('Aszendenz', data.ascendancies),
    ...validateUniqueIds('EquipmentSlot', data.equipmentSlots), ...validateUniqueIds('Modifier', data.modifierDefinitions),
    ...validateUniqueIds('Skill', data.skillDefinitions), ...validateUniqueIds('Support', data.supportDefinitions),
    ...validateUniqueIds('SkillSetup', data.skillSetups), ...validateUniqueIds('Passiver Knoten', data.passiveNodes),
    ...validateUniqueIds('Passive Verbindung', data.passiveConnections),
    ...validateAscendancyReferences(data.classes, data.ascendancies),
    ...validateSkillReferences(data.skillDefinitions, data.supportDefinitions, data.skillSetups),
    ...validatePassiveConnections(data.passiveNodes, data.passiveConnections),
    ...validateModifierValues(data.modifierDefinitions, data.appliedModifiers),
    ...(!data.buildResult.isPlaceholder ? ['BuildResult muss als Platzhalter gekennzeichnet sein'] : []),
  ]
}
