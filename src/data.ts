import {
  placeholderMetadata,
  type AppliedModifier,
  type AscendancyDefinition,
  type BuildResult,
  type ClassDefinition,
  type ClusterJewelDefinition,
  type EquipmentEntry,
  type EquipmentSlotDefinition,
  type JewelDefinition,
  type ModifierCategory,
  type ModifierDefinition,
  type PassiveConnection,
  type PassiveNodeDefinition,
  type SkillGemDefinition,
  type SkillSetup,
  type SupportGemDefinition,
  type UniqueClusterJewelDefinition,
} from './domain'
import classRegistry from '../generated/poe2-tree/class-registry.json'
import { allTechnicalAffixes } from './affixes/registry'
import { classifyTechnicalAffix } from './affixes/analyzer-semantics'
export { pob2UniqueAnalyzerCandidates, pob2UniquePlannerRegistry } from './uniques'

export interface TreeAscendancyRegistryEntry { ascendancyId:string; officialExportId:string; displayName:string; selectableInCurrentUi:boolean }
export interface TreeClassRegistryEntry { classId:string; officialClassIndex:number; displayName:string; selectableInCurrentUi:boolean; classStartNodeId?:string|null; ascendancies:TreeAscendancyRegistryEntry[] }

export const treeClassRegistry = classRegistry.classes as unknown as TreeClassRegistryEntry[]
export const findTreeAscendancy=(id:string)=>{for(const item of treeClassRegistry){const found=item.ascendancies.find(value=>value.ascendancyId===id);if(found)return found}return undefined}
export const classDefinitions: ClassDefinition[] = treeClassRegistry.map(item => placeholderMetadata(item.classId, item.displayName))
export const ascendancyDefinitions: AscendancyDefinition[] = treeClassRegistry.flatMap(item => item.ascendancies.map(ascendancy => ({ ...placeholderMetadata(ascendancy.ascendancyId, ascendancy.displayName), classId: item.classId })))

const slotSeed = [
  ['slot-helmet', 'Helm', 'not-applicable', 'not-applicable'], ['slot-body-armour', 'Brust', 'not-applicable', 'not-applicable'],
  ['slot-gloves', 'Handschuhe', 'not-applicable', 'not-applicable'], ['slot-boots', 'Schuhe', 'not-applicable', 'not-applicable'],
  ['slot-amulet', 'Amulett', 'not-applicable', 'not-applicable'], ['slot-ring-1', 'Ring 1', 'not-applicable', 'not-applicable'],
  ['slot-ring-2', 'Ring 2', 'not-applicable', 'not-applicable'], ['slot-belt', 'Gürtel', 'not-applicable', 'not-applicable'],
  ['slot-weapon-set-1-left', 'Waffe Set 1 links', 'set-1', 'left'], ['slot-weapon-set-1-right', 'Waffe Set 1 rechts', 'set-1', 'right'],
  ['slot-weapon-set-2-left', 'Waffe Set 2 links', 'set-2', 'left'], ['slot-weapon-set-2-right', 'Waffe Set 2 rechts', 'set-2', 'right'],
  ['slot-jewel-1', 'Normales Juwel 1', 'not-applicable', 'not-applicable'], ['slot-jewel-2', 'Normales Juwel 2', 'not-applicable', 'not-applicable'],
  ['slot-charm-1', 'Charm 1', 'not-applicable', 'not-applicable'], ['slot-charm-2', 'Charm 2', 'not-applicable', 'not-applicable'],
  ['slot-charm-3', 'Charm 3', 'not-applicable', 'not-applicable'],
  ['slot-life-flask', 'Lebensfläschchen', 'not-applicable', 'not-applicable'], ['slot-mana-flask', 'Manafläschchen', 'not-applicable', 'not-applicable'],
] as const
export const equipmentSlotDefinitions: EquipmentSlotDefinition[] = slotSeed.map(([id, name, weaponSet, hand]) => ({ ...placeholderMetadata(id, name), weaponSet, hand }))
export const initialEquipment: EquipmentEntry[] = equipmentSlotDefinitions.map(slot => ({ id: `equipment-${slot.id}`, slotId: slot.id, modifierValues: [] }))

const modifierSeed: [string, string, ModifierCategory, ModifierDefinition['unit'], ModifierDefinition['scope'], ModifierDefinition['relevantTags']][] = [
  ['modifier-increased-physical-damage', 'Erhöhter physischer Schaden', 'damage', 'percent', 'local', ['attack', 'physical']],
  ['modifier-added-fire-damage', 'Zusätzlicher Feuerschaden', 'damage', 'flat', 'local', ['attack', 'fire']],
  ['modifier-added-cold-damage', 'Zusätzlicher Kälteschaden', 'damage', 'flat', 'local', ['attack', 'cold']],
  ['modifier-added-lightning-damage', 'Zusätzlicher Blitzschaden', 'damage', 'flat', 'local', ['attack', 'lightning']],
  ['modifier-attack-speed', 'Angriffsgeschwindigkeit', 'speed', 'percent', 'local', ['attack']],
  ['modifier-cast-speed', 'Zaubergeschwindigkeit', 'speed', 'percent', 'global', ['spell']],
  ['modifier-critical-chance', 'Kritische Trefferchance', 'critical', 'percent', 'global', ['critical']],
  ['modifier-critical-multiplier', 'Kritischer Treffermultiplikator', 'critical', 'percent', 'global', ['critical']],
  ['modifier-maximum-life', 'Maximales Leben', 'resource', 'flat', 'global', ['defensive']],
  ['modifier-energy-shield', 'Energieschild', 'defence', 'flat', 'local', ['defensive']],
  ['modifier-armour', 'Rüstung', 'defence', 'flat', 'local', ['defensive']],
  ['modifier-evasion', 'Ausweichwert', 'defence', 'flat', 'local', ['defensive']],
  ['modifier-fire-resistance', 'Feuerwiderstand', 'resistance', 'percent', 'global', ['fire', 'defensive']],
  ['modifier-cold-resistance', 'Kältewiderstand', 'resistance', 'percent', 'global', ['cold', 'defensive']],
  ['modifier-lightning-resistance', 'Blitzwiderstand', 'resistance', 'percent', 'global', ['lightning', 'defensive']],
  ['modifier-strength', 'Stärke', 'attribute', 'flat', 'global', []], ['modifier-dexterity', 'Geschick', 'attribute', 'flat', 'global', []],
  ['modifier-intelligence', 'Intelligenz', 'attribute', 'flat', 'global', []],
]
const legacyModifierDefinitions: ModifierDefinition[] = modifierSeed.map(([id, name, category, unit, scope, tags]) => ({
  ...placeholderMetadata(id, name, tags), category, valueType: 'number', unit, minValue: 0, maxValue: 200,
  scope, relevantTags: tags, allowedEquipmentSlotIds: equipmentSlotDefinitions.map(slot => slot.id),
}))
export const modifierDefinitions: ModifierDefinition[] = legacyModifierDefinitions.concat(allTechnicalAffixes.map(affix => ({
  ...placeholderMetadata(affix.affixId, 'Deutsche Übersetzung noch nicht verfügbar'), category: 'utility' as const,
  valueType: affix.statLines.length > 1 ? 'range' as const : 'number' as const, unit: affix.statLines.some(line => line.isPercent) ? 'percent' as const : 'flat' as const,
  minValue: affix.statLines[0]?.minimum, maxValue: affix.statLines[0]?.maximum, scope: affix.isLocal ? 'local' as const : 'global' as const,
  relevantTags: classifyTechnicalAffix(affix).tags, allowedEquipmentSlotIds: equipmentSlotDefinitions.map(slot => slot.id),
})))

const skillSeed = [
  ['skill-lightning-arrow', 'Blitzpfeil', ['attack', 'projectile', 'lightning']], ['skill-ball-lightning', 'Kugelblitz', ['spell', 'projectile', 'lightning']],
  ['skill-storm-caller', 'Sturmrufer', ['spell', 'area', 'lightning']], ['skill-flame-wall', 'Flammenwand', ['spell', 'area', 'fire']],
  ['skill-time-warp', 'Zeitverzerrung', ['spell', 'buff']], ['skill-leap-slam', 'Sprungschlag', ['attack', 'melee', 'movement']],
] as const
export const skillDefinitions: SkillGemDefinition[] = skillSeed.map(([id, name, tags]) => placeholderMetadata(id, name, [...tags]))
const supportSeed = [
  ['support-multiple-projectiles', 'Mehrfachprojektil', ['projectile']], ['support-elemental-focus', 'Elementarfokus', []],
  ['support-faster-attacks', 'Schnellere Angriffe', ['attack']], ['support-critical-damage', 'Kritischer Schaden', ['critical']],
  ['support-penetration', 'Durchdringung', []],
] as const
export const supportDefinitions: SupportGemDefinition[] = supportSeed.map(([id, name, requiredTags]) => ({
  ...placeholderMetadata(id, name), requiredTags: [...requiredTags], excludedTags: [], ownTags: [],
}))
export const skillSetups: SkillSetup[] = skillDefinitions.map((skill, index) => ({
  id: `skill-setup-${index + 1}`, skillId: skill.id, role: index === 0 ? 'main' : index === 4 ? 'utility' : index === 5 ? 'movement' : 'secondary',
  weaponSet: index < 2 ? 'set-1' : index < 4 ? 'set-2' : 'both', supportGemIds: supportDefinitions.map(support => support.id),
}))

export const jewelDefinitions: JewelDefinition[] = [
  ['jewel-ruby', 'Rubinjuwel', 'Mehr Feuerschaden', ['fire']], ['jewel-sapphire', 'Saphirjuwel', 'Mehr Kälteschaden', ['cold']],
  ['jewel-emerald', 'Smaragdjuwel', 'Mehr Geschick', []],
].map(([id, name, description, tags]) => ({ ...placeholderMetadata(id as string, name as string, tags as JewelDefinition['tags']), jewelType: 'normal', description: description as string, modifiers: [] }))
export const clusterJewelDefinitions: ClusterJewelDefinition[] = [
  { ...placeholderMetadata('cluster-storm', 'Sturm-Cluster', ['lightning']), jewelType: 'cluster', description: 'Blitz-Knoten', modifiers: [], clusterSize: 'large', possiblePassiveNodeIds: [], additionalPathCost: 3 },
  { ...placeholderMetadata('cluster-life', 'Lebens-Cluster', ['defensive']), jewelType: 'cluster', description: 'Defensive Knoten', modifiers: [], clusterSize: 'medium', possiblePassiveNodeIds: [], additionalPathCost: 2 },
]
export const uniqueClusterJewelDefinitions: UniqueClusterJewelDefinition[] = [
  { ...placeholderMetadata('unique-cluster-eye-of-storm', 'Auge des Sturms', ['lightning']), jewelType: 'unique-cluster', description: 'Einzigartige Blitz-Synergie', modifiers: [] },
  { ...placeholderMetadata('unique-cluster-indomitable-core', 'Unbeugsamer Kern', ['defensive']), jewelType: 'unique-cluster', description: 'Einzigartige Defensive', modifiers: [] },
]

const passiveSeed = [
  ['passive-start', 'Start', 'normal', 70, 150, true], ['passive-dexterity', 'Geschick', 'normal', 150, 110, true],
  ['passive-storm-grip', 'Sturmgriff', 'notable', 240, 90, true], ['passive-overcharge', 'Überladung', 'keystone', 335, 130, true],
  ['passive-life', 'Leben', 'normal', 155, 205, false], ['passive-jewel-socket', 'Juwel', 'jewel-socket', 250, 220, false],
  ['passive-cluster-socket', 'Cluster', 'cluster-socket', 350, 230, false],
] as const
const connectionSeed = [
  ['connection-start-dexterity', 0, 1], ['connection-dexterity-storm', 1, 2], ['connection-storm-overcharge', 2, 3],
  ['connection-dexterity-life', 1, 4], ['connection-life-jewel', 4, 5], ['connection-jewel-cluster', 5, 6],
] as const
export const passiveConnections: PassiveConnection[] = connectionSeed.map(([id, from, to]) => ({ id, fromNodeId: passiveSeed[from][0], toNodeId: passiveSeed[to][0], selected: Boolean(passiveSeed[from][5] && passiveSeed[to][5]) }))
export const passiveNodeDefinitions: PassiveNodeDefinition[] = passiveSeed.map(([id, name, nodeType, x, y, selected], index) => ({
  ...placeholderMetadata(id, name), nodeType, position: { x, y }, modifiers: [], selected,
  connectedNodeIds: passiveConnections.flatMap(connection => connection.fromNodeId === id ? [connection.toNodeId] : connection.toNodeId === id ? [connection.fromNodeId] : []),
  ...(index === 0 ? { requiredClassId: 'class-warrior' } : {}),
}))

export const buildResult: BuildResult = {
  id: 'build-result-placeholder-balanced', isPlaceholder: true, mainSkillId: 'skill-lightning-arrow',
  additionalSkillIds: ['skill-storm-caller', 'skill-flame-wall', 'skill-time-warp'], supportGemIds: supportDefinitions.map(value => value.id),
  weaponSetRecommendations: [{ weaponSet: 'set-1', skillIds: ['skill-lightning-arrow', 'skill-leap-slam'] }, { weaponSet: 'set-2', skillIds: ['skill-flame-wall', 'skill-storm-caller'] }],
  passivePathNodeIds: ['passive-start', 'passive-dexterity', 'passive-storm-grip', 'passive-overcharge'], jewelRecommendationIds: ['jewel-emerald'],
  clusterRecommendationIds: ['cluster-storm'], uniqueClusterRecommendationIds: ['unique-cluster-eye-of-storm'],
  uniqueRecommendations: [{ id: 'recommendation-unique-storm-crown', title: 'Gewitterkrone (Test-Unique)', itemIds: ['unique-storm-crown'] }],
  affixRecommendations: [
    { id: 'recommendation-affix-lightning', title: 'Mehr Blitzschaden auf Waffe', itemIds: ['modifier-added-lightning-damage'] },
    { id: 'recommendation-affix-life', title: 'Mehr maximales Leben auf Brust', itemIds: ['modifier-maximum-life'] },
    { id: 'recommendation-affix-fire-resistance', title: 'Feuerwiderstand auf Ring ergänzen', itemIds: ['modifier-fire-resistance'] },
  ],
  mappingRotation: [
    { id: 'rotation-mapping-1', order: 1, action: 'Flammenwand (Set 2)', reason: 'Bereitet Bonusprojektilschaden vor' },
    { id: 'rotation-mapping-2', order: 2, action: 'Waffenwechsel zu Set 1', reason: 'Wechselt zur Hauptwaffe' },
    { id: 'rotation-mapping-3', order: 3, action: 'Blitzpfeil', reason: 'Räumt Gegnergruppen' },
  ],
  bossRotation: [
    { id: 'rotation-boss-1', order: 1, action: 'Sturmrufer (Set 2)', reason: 'Markiert das Ziel' },
    { id: 'rotation-boss-2', order: 2, action: 'Flammenwand', reason: 'Bereitet den Angriff vor' },
    { id: 'rotation-boss-3', order: 3, action: 'Waffenwechsel + Blitzpfeil', reason: 'Hauptschadensfenster' },
  ],
  explanation: 'Der Test-Build kombiniert schnelle Blitzangriffe mit vorbereitenden Effekten und einer soliden Lebensbasis.',
  skillOrderExplanation: 'Vorbereitungseffekte werden zuerst gesetzt, damit der anschließende Hauptangriff von ihnen profitiert.',
  weaponSwapExplanation: 'Set 2 legt anhaltende Effekte. Diese bleiben in dieser Platzhalterlogik nach dem Wechsel bestehen; Set 1 liefert danach den Hauptschaden.',
}

export const appliedPlaceholderModifiers: AppliedModifier[] = []
export const placeholderDataSet = {
  classes: classDefinitions, ascendancies: ascendancyDefinitions, equipmentSlots: equipmentSlotDefinitions,
  modifierDefinitions, appliedModifiers: appliedPlaceholderModifiers, skillDefinitions, supportDefinitions, skillSetups,
  passiveNodes: passiveNodeDefinitions, passiveConnections, buildResult,
}
