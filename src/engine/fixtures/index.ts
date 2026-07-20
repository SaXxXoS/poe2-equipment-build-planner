import { placeholderMetadata, type AnyJewelDefinition, type AppliedModifier, type BuildInput, type MechanicTag, type ModifierCategory, type ModifierDefinition, type PassiveNodeDefinition, type SkillGemDefinition, type SupportGemDefinition } from '../../domain'
import type { EngineCandidates, EngineRequest, PassiveCandidate, UniqueCandidate } from '../common/types'

const character = { classId: 'fixture-class', ascendancyId: 'fixture-ascendancy-storm', level: 80, goalProfile: 'balanced' as const }
export interface SyntheticEquipmentSpec { modifierId: string; value: number; weaponSet?: 'set-1' | 'set-2'; slotId?: string }
export const syntheticInput = (specs: SyntheticEquipmentSpec[], goalProfile: BuildInput['goalProfile'] = 'balanced'): BuildInput => {
  const groups = new Map<string, SyntheticEquipmentSpec[]>()
  for (const spec of specs) { const slotId = spec.slotId ?? `slot-weapon-${spec.weaponSet ?? 'set-1'}-left`; groups.set(slotId, [...(groups.get(slotId) ?? []), spec]) }
  const equipment = [...groups]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([slotId, values], entryIndex) => ({
      id: `fixture-equipment-${entryIndex}`,
      slotId,
      modifierValues: values.map((spec, index): AppliedModifier => ({
        id: `fixture-applied-${entryIndex}-${index}`,
        modifierId: spec.modifierId,
        value: spec.value,
      })),
    }))
  return { character: { ...character, goalProfile }, goalProfile, equipment, skillSetups: [], selectedJewels: [] }
}
const modifier = (id: string, tags: ModifierDefinition['relevantTags'], category: ModifierCategory = 'damage'): ModifierDefinition => ({ ...placeholderMetadata(id, id, tags), category, valueType: 'number', unit: 'percent', scope: 'global', relevantTags: tags, allowedEquipmentSlotIds: [] })
export const engineModifierFixtures: ModifierDefinition[] = [
  modifier('fixture-physical-damage', ['physical']), modifier('fixture-fire-damage', ['fire']), modifier('fixture-cold-damage', ['cold']), modifier('fixture-lightning-damage', ['lightning']), modifier('fixture-chaos-damage', ['chaos']),
  modifier('fixture-attack-speed', ['attack'], 'speed'), modifier('fixture-cast-speed', ['spell'], 'speed'), modifier('fixture-movement-speed', ['movement'], 'speed'),
  modifier('fixture-critical-chance', ['critical'], 'critical'), modifier('fixture-critical-multiplier', ['critical'], 'critical'),
  modifier('fixture-maximum-life', ['defensive'], 'resource'), modifier('fixture-armour', ['defensive'], 'defence'), modifier('fixture-evasion', ['defensive'], 'defence'), modifier('fixture-energy-shield', ['defensive'], 'defence'),
  modifier('fixture-fire-resistance', ['fire', 'defensive'], 'resistance'), modifier('fixture-cold-resistance', ['cold', 'defensive'], 'resistance'), modifier('fixture-lightning-resistance', ['lightning', 'defensive'], 'resistance'), modifier('fixture-chaos-resistance', ['chaos', 'defensive'], 'resistance'),
  modifier('fixture-strength', [], 'attribute'), modifier('fixture-dexterity', [], 'attribute'), modifier('fixture-intelligence', [], 'attribute'),
  modifier('fixture-projectile-damage', ['projectile']), modifier('fixture-melee-damage', ['melee']), modifier('fixture-area-damage', ['area']), modifier('fixture-minion-damage', ['minion']), modifier('fixture-damage-over-time', ['damage-over-time']), modifier('fixture-buff-effect', ['buff'], 'utility'), modifier('fixture-debuff-effect', ['debuff'], 'utility'),
]
const skill = (id: string, tags: MechanicTag[], values: Partial<SkillGemDefinition> = {}): SkillGemDefinition => ({ ...placeholderMetadata(id, id, tags), damageTypes: tags.filter(tag => ['physical', 'fire', 'cold', 'lightning', 'chaos'].includes(tag)) as SkillGemDefinition['damageTypes'], possibleRoles: tags.includes('movement') ? ['movement'] : tags.includes('buff') || tags.includes('debuff') ? ['utility'] : ['main', 'secondary'], mappingBase: 50, bossBase: 50, resourceAffinity: 20, enabled: true, ...values })
const support = (id: string, requiredTags: MechanicTag[], values: Partial<SupportGemDefinition> = {}): SupportGemDefinition => ({ ...placeholderMetadata(id, id), requiredTags, excludedTags: [], ownTags: requiredTags, mappingBase: 50, bossBase: 50, utilityBase: 10, enabled: true, ...values })
const jewel = (id: string, jewelType: 'normal' | 'cluster' | 'unique-cluster', tags: Parameters<typeof placeholderMetadata>[2], values: Record<string, unknown> = {}): AnyJewelDefinition => (jewelType === 'cluster' ? ({ ...placeholderMetadata(id, id, tags), jewelType, description: 'synthetic fixture', modifiers: [], clusterSize: 'medium' as const, possiblePassiveNodeIds: [], additionalPathCost: 2, ...values }) : ({ ...placeholderMetadata(id, id, tags), jewelType, description: 'synthetic fixture', modifiers: [], ...values })) as AnyJewelDefinition
const unique = (id: string, tags: Parameters<typeof placeholderMetadata>[2], ascendancyIds: string[]): UniqueCandidate => ({ ...placeholderMetadata(id, id, tags), itemType: 'synthetic-fixture', modifiers: [], ascendancyIds, buildEnabler: true })
export const syntheticSkillFixtures: SkillGemDefinition[] = [
  skill('fixture-main', ['attack', 'projectile', 'lightning', 'critical'], { mappingBase: 75, bossBase: 65, requiredWeaponTypes: ['ranged-weapon'], preferredClassIds: ['fixture-class'], preferredAscendancyIds: ['fixture-ascendancy-storm'] }),
  skill('fixture-spell', ['spell', 'cold', 'area'], { mappingBase: 68, bossBase: 62, requiredWeaponTypes: ['focus'] }),
  skill('fixture-melee-physical', ['attack', 'melee', 'physical'], { mappingBase: 50, bossBase: 70, requiredWeaponTypes: ['melee-weapon'] }),
  skill('fixture-movement', ['movement'], { possibleRoles: ['movement', 'utility'], mappingBase: 90, bossBase: 25 }),
  skill('fixture-buff', ['buff'], { possibleRoles: ['utility'], mappingBase: 42, bossBase: 55 }),
  skill('fixture-debuff', ['debuff'], { possibleRoles: ['utility'], mappingBase: 38, bossBase: 78 }),
  skill('fixture-invalid', ['attack', 'physical'], { excludedClassIds: ['fixture-class'], requiredWeaponTypes: ['melee-weapon'] }),
  skill('fixture-mixed', ['attack', 'spell', 'fire', 'cold'], { mappingBase: 55, bossBase: 55 }),
  skill('fixture-dot', ['spell', 'damage-over-time', 'chaos'], { mappingBase: 58, bossBase: 64 }),
  skill('fixture-minion', ['minion', 'physical'], { mappingBase: 60, bossBase: 60 }),
]
export const syntheticSupportFixtures: SupportGemDefinition[] = [
  support('fixture-support-compatible', ['attack', 'projectile'], { ownTags: ['attack', 'projectile'], supportedMechanics: ['attack', 'projectile'], mappingBase: 72 }),
  support('fixture-support-lightning', ['lightning'], { ownTags: ['lightning'], supportedDamageTypes: ['lightning'] }),
  support('fixture-support-cold-spell', ['spell', 'cold'], { ownTags: ['spell', 'cold'], supportedDamageTypes: ['cold'], supportedMechanics: ['spell'] }),
  support('fixture-support-critical', ['critical'], { ownTags: ['critical'], supportedMechanics: ['critical'], bossBase: 70 }),
  support('fixture-support-area', ['area'], { ownTags: ['area'], mappingBase: 85, bossBase: 30 }),
  support('fixture-support-boss', [], { ownTags: ['debuff'], bossBase: 88, reducedSpeed: 15 }),
  support('fixture-support-resource', [], { ownTags: ['attack'], resourceCost: 30 }),
  support('fixture-support-utility', [], { ownTags: ['buff'], utilityBase: 75 }),
  support('fixture-support-incompatible', [], { ownTags: ['melee'], excludedTags: ['attack'], requiredWeaponTypes: ['melee-weapon'], allowedSkillRoles: ['secondary'] }),
  support('fixture-support-experimental', [], { ownTags: ['lightning'], experimental: true, preferredAscendancyIds: ['fixture-ascendancy-storm'] }),
]
const passiveNode = (id: string, nodeType: PassiveNodeDefinition['nodeType'], tags: MechanicTag[], values: Partial<PassiveNodeDefinition> = {}): PassiveNodeDefinition => ({ ...placeholderMetadata(id, id, tags), nodeType, position: { x: 0, y: 0 }, modifiers: [], connectedNodeIds: [], pointCost: 1, enabled: true, selected: false, ...values })
const nodeCandidate = (id: string, node: PassiveNodeDefinition, values: Partial<PassiveCandidate> = {}): PassiveCandidate => ({ id, candidateType: 'node', nodeId: node.id, nodes: [node], connections: [], reachable: true, availablePointBudget: 20, ...values })
const clusterCandidate = (id: string, tags: MechanicTag[], pathCost: number, values: Partial<PassiveCandidate> = {}): PassiveCandidate => { const entry = passiveNode(`${id}-entry`, 'normal', []); const path = passiveNode(`${id}-path`, 'normal', []); const target = passiveNode(`${id}-target`, 'notable', tags); return { id, candidateType: 'cluster', cluster: { clusterId: id, entryNodeId: entry.id, requiredPathNodeIds: [path.id], targetNodeIds: [target.id] }, nodes: [entry, path, target], connections: [{ id: `${id}-edge-1`, fromNodeId: entry.id, toNodeId: path.id, selected: false }, { id: `${id}-edge-2`, fromNodeId: path.id, toNodeId: target.id, selected: false }], pathCost, reachable: true, availablePointBudget: 20, tags, ...values } }
export const syntheticPassiveFixtures: PassiveCandidate[] = [
  clusterCandidate('fixture-passive-lightning-projectile', ['lightning', 'projectile'], 1), clusterCandidate('fixture-passive-cold-spell', ['cold', 'spell'], 1), clusterCandidate('fixture-passive-defensive-life', ['defensive'], 1),
  nodeCandidate('fixture-passive-energy-shield', passiveNode('fixture-node-energy-shield', 'notable', ['defensive'], { positiveProfileFields: ['defence.energyShieldAffinity'] })), clusterCandidate('fixture-passive-attribute-path', ['strength'], 1),
  nodeCandidate('fixture-passive-keystone', passiveNode('fixture-node-keystone', 'keystone', ['lightning'], { gainedMechanics: ['synthetic-power'], lostMechanics: ['speed'], negativeProfileFields: ['speed.attackSpeedAffinity'], tradeOffs: ['reduced-speed'] })),
  nodeCandidate('fixture-passive-wrong-ascendancy', passiveNode('fixture-node-wrong-ascendancy', 'ascendancy', ['lightning'], { requiredAscendancyId: 'fixture-other-ascendancy' })), clusterCandidate('fixture-passive-unreachable', ['lightning'], 1, { reachable: false }),
  clusterCandidate('fixture-passive-expensive', ['lightning', 'projectile'], 8), clusterCandidate('fixture-passive-efficient', ['lightning', 'projectile'], 0), clusterCandidate('fixture-passive-cheap', ['lightning', 'projectile'], 1), nodeCandidate('fixture-passive-set-1', passiveNode('fixture-node-set-1', 'notable', ['lightning'], { weaponSet: 'set-1' })), clusterCandidate('fixture-passive-redundant', ['lightning', 'projectile'], 2),
]
export const syntheticJewelFixtures: AnyJewelDefinition[] = [jewel('fixture-jewel-normal','normal',['lightning','projectile']),jewel('fixture-jewel-cold-spell','normal',['cold','spell']),jewel('fixture-jewel-defence','normal',['defensive']),jewel('fixture-jewel-resistance','normal',['resistance']),jewel('fixture-jewel-attribute','normal',['strength']),jewel('fixture-jewel-cluster','cluster',['lightning','projectile'],{clusterSize:'small',additionalPathCost:1,entryPointCost:1,internalPathCost:1}),jewel('fixture-jewel-expensive','cluster',['lightning','projectile'],{clusterSize:'large',additionalPathCost:8,entryPointCost:3,internalPathCost:8}),jewel('fixture-jewel-socket-cluster','cluster',['lightning'],{clusterSize:'medium',additionalPathCost:3,addedSocketCount:2}),jewel('fixture-jewel-enabler','unique-cluster',['lightning'],{buildEnabler:true,experimental:true,uniqueMechanicIds:['synthetic-mechanic'],tradeOffs:['reduced-defence']}),jewel('fixture-jewel-hard-conflict','unique-cluster',['lightning'],{restrictions:['attack']}),jewel('fixture-jewel-wrong-socket','normal',['lightning'],{requiredSocketType:'cluster-socket'}),jewel('fixture-jewel-missing-socket','cluster',['lightning'],{requiredSocketType:'cluster-socket',clusterSize:'small',additionalPathCost:1}),jewel('fixture-jewel-set-1','normal',['lightning'],{weaponSet:'set-1'}),jewel('fixture-jewel-redundant','normal',['lightning','projectile'])]
export const engineCandidatesFixture: EngineCandidates = { skills: syntheticSkillFixtures, supports: syntheticSupportFixtures, passives: syntheticPassiveFixtures, jewels: syntheticJewelFixtures, uniques: [unique('fixture-unique-synergy', ['lightning'], ['fixture-ascendancy-storm']), unique('fixture-unique-neutral', ['cold'], [])] }

export const fixtureA: EngineRequest = { input: syntheticInput([{ modifierId: 'fixture-lightning-damage', value: 60 }, { modifierId: 'fixture-attack-speed', value: 60 }, { modifierId: 'fixture-projectile-damage', value: 60 }, { modifierId: 'fixture-critical-chance', value: 40 }, { modifierId: 'fixture-critical-multiplier', value: 40 }], 'mapping'), candidates: engineCandidatesFixture }
export const fixtureB: EngineRequest = { input: syntheticInput([{ modifierId: 'fixture-cold-damage', value: 60 }, { modifierId: 'fixture-cast-speed', value: 60 }, { modifierId: 'fixture-energy-shield', value: 60 }], 'boss'), candidates: engineCandidatesFixture }
export const fixtureC: EngineRequest = { input: syntheticInput([{ modifierId: 'fixture-attack-speed', value: 60 }, { modifierId: 'fixture-cast-speed', value: 60 }, { modifierId: 'fixture-melee-damage', value: 60 }, { modifierId: 'fixture-projectile-damage', value: 60 }, { modifierId: 'fixture-fire-damage', value: 50 }, { modifierId: 'fixture-cold-damage', value: 50 }, { modifierId: 'fixture-unused-one', value: 10 }, { modifierId: 'fixture-unused-two', value: 10 }]), candidates: engineCandidatesFixture }
export const fixtureD: EngineRequest = { input: syntheticInput([{ modifierId: 'fixture-movement-speed', value: 20 }]), candidates: engineCandidatesFixture }
export const fixtureE: EngineRequest = { input: syntheticInput([{ modifierId: 'fixture-lightning-damage', value: 60, weaponSet: 'set-1' }, { modifierId: 'fixture-attack-speed', value: 60, weaponSet: 'set-1' }, { modifierId: 'fixture-projectile-damage', value: 60, weaponSet: 'set-1' }, { modifierId: 'fixture-buff-effect', value: 40, weaponSet: 'set-2' }, { modifierId: 'fixture-debuff-effect', value: 40, weaponSet: 'set-2' }]), candidates: engineCandidatesFixture }
