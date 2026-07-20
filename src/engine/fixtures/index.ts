import { placeholderMetadata, type AppliedModifier, type BuildInput, type MechanicTag, type ModifierCategory, type ModifierDefinition, type SkillGemDefinition, type SupportGemDefinition } from '../../domain'
import type { EngineCandidates, EngineRequest, UniqueCandidate } from '../common/types'

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
const support = (id: string, requiredTags: MechanicTag[], excludedTags: MechanicTag[] = []): SupportGemDefinition => ({ ...placeholderMetadata(id, id), requiredTags, excludedTags, ownTags: requiredTags })
const jewel = (id: string, jewelType: 'normal' | 'cluster' | 'unique-cluster', tags: Parameters<typeof placeholderMetadata>[2]) => jewelType === 'cluster' ? ({ ...placeholderMetadata(id, id, tags), jewelType, description: 'synthetic fixture', modifiers: [], clusterSize: 'medium' as const, possiblePassiveNodeIds: [], additionalPathCost: 2 }) : ({ ...placeholderMetadata(id, id, tags), jewelType, description: 'synthetic fixture', modifiers: [] })
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
export const engineCandidatesFixture: EngineCandidates = { skills: syntheticSkillFixtures, supports: [support('fixture-support-compatible', ['attack']), support('fixture-support-incompatible', ['spell'])], passives: [{ id: 'fixture-passive-cheap', tags: ['lightning'], utilityScore: 12, pathCost: 2, reachable: true }, { id: 'fixture-passive-expensive', tags: ['lightning'], utilityScore: 12, pathCost: 6, reachable: true }], jewels: [jewel('fixture-jewel-normal', 'normal', ['lightning']), jewel('fixture-jewel-cluster', 'cluster', ['lightning']), jewel('fixture-jewel-unique', 'unique-cluster', ['defensive'])], uniques: [unique('fixture-unique-synergy', ['lightning'], ['fixture-ascendancy-storm']), unique('fixture-unique-neutral', ['cold'], [])] }

export const fixtureA: EngineRequest = { input: syntheticInput([{ modifierId: 'fixture-lightning-damage', value: 60 }, { modifierId: 'fixture-attack-speed', value: 60 }, { modifierId: 'fixture-projectile-damage', value: 60 }, { modifierId: 'fixture-critical-chance', value: 40 }, { modifierId: 'fixture-critical-multiplier', value: 40 }], 'mapping'), candidates: engineCandidatesFixture }
export const fixtureB: EngineRequest = { input: syntheticInput([{ modifierId: 'fixture-cold-damage', value: 60 }, { modifierId: 'fixture-cast-speed', value: 60 }, { modifierId: 'fixture-energy-shield', value: 60 }], 'boss'), candidates: engineCandidatesFixture }
export const fixtureC: EngineRequest = { input: syntheticInput([{ modifierId: 'fixture-attack-speed', value: 60 }, { modifierId: 'fixture-cast-speed', value: 60 }, { modifierId: 'fixture-melee-damage', value: 60 }, { modifierId: 'fixture-projectile-damage', value: 60 }, { modifierId: 'fixture-fire-damage', value: 50 }, { modifierId: 'fixture-cold-damage', value: 50 }, { modifierId: 'fixture-unused-one', value: 10 }, { modifierId: 'fixture-unused-two', value: 10 }]), candidates: engineCandidatesFixture }
export const fixtureD: EngineRequest = { input: syntheticInput([{ modifierId: 'fixture-movement-speed', value: 20 }]), candidates: engineCandidatesFixture }
export const fixtureE: EngineRequest = { input: syntheticInput([{ modifierId: 'fixture-lightning-damage', value: 60, weaponSet: 'set-1' }, { modifierId: 'fixture-attack-speed', value: 60, weaponSet: 'set-1' }, { modifierId: 'fixture-projectile-damage', value: 60, weaponSet: 'set-1' }, { modifierId: 'fixture-buff-effect', value: 40, weaponSet: 'set-2' }, { modifierId: 'fixture-debuff-effect', value: 40, weaponSet: 'set-2' }]), candidates: engineCandidatesFixture }
