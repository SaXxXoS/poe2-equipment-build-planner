import type { EquipmentEntry } from '../../domain'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'

export const CHARACTER_ATTRIBUTE_MODEL_VERSION = 'pinned-tree-0.5.2-v1'
export type CharacterAttribute = 'strength' | 'dexterity' | 'intelligence'
export type CharacterAttributeValues = Record<CharacterAttribute, number>

const baseByClassId: Record<string, CharacterAttributeValues> = {
  'class-official-1': { strength: 7, dexterity: 7, intelligence: 15 },
  'class-official-2': { strength: 7, dexterity: 15, intelligence: 7 },
  'class-official-6': { strength: 15, dexterity: 7, intelligence: 7 },
  'class-official-7': { strength: 7, dexterity: 7, intelligence: 15 },
  'class-official-8': { strength: 7, dexterity: 15, intelligence: 7 },
  'class-official-9': { strength: 11, dexterity: 11, intelligence: 7 },
  'class-official-10': { strength: 7, dexterity: 11, intelligence: 11 },
  'class-official-11': { strength: 11, dexterity: 7, intelligence: 11 },
}

export interface CharacterAttributeModel {
  modelVersion: typeof CHARACTER_ATTRIBUTE_MODEL_VERSION
  activeSet: 'set-1' | 'set-2'
  status: 'exact-confirmed-sources' | 'blocked-unknown-class'
  base: CharacterAttributeValues
  equipment: CharacterAttributeValues
  passives: CharacterAttributeValues
  total: CharacterAttributeValues
  blockedPassiveLines: string[]
  sourceReferences: string[]
}

const zero = (): CharacterAttributeValues => ({ strength: 0, dexterity: 0, intelligence: 0 })
const appliesToSet = (entry: EquipmentEntry, activeSet: 'set-1' | 'set-2') => {
  if (entry.slotId.includes('weapon-set-1')) return activeSet === 'set-1'
  if (entry.slotId.includes('weapon-set-2')) return activeSet === 'set-2'
  return true
}

const allocatedNodes = (tree: RealPassiveTree | undefined, planning: RealPassivePlanningIntegrationResult | undefined, activeSet: 'set-1' | 'set-2') => {
  if (!tree || !planning) return []
  const ids = new Set([
    ...(planning.weaponSetPlanning?.[activeSet]?.allocatedNodeIds ?? planning.pipelineResult?.allocatedNodeIds ?? []),
    ...(planning.ascendancyPlanning?.allocatedNodeIds ?? []),
  ])
  return tree.nodes.filter(node => ids.has(node.id))
}

const clean = (value: string) => value.replace(/\[[^|\]]+\|([^\]]+)\]/g, '$1').trim()

export function resolveCharacterAttributes(input: {
  classId: string
  equipment: EquipmentEntry[]
  activeSet: 'set-1' | 'set-2'
  passiveTree?: RealPassiveTree
  realPassivePlanning?: RealPassivePlanningIntegrationResult
}): CharacterAttributeModel {
  const base = baseByClassId[input.classId] ? { ...baseByClassId[input.classId] } : zero()
  const equipment = zero()
  const passives = zero()
  const blockedPassiveLines: string[] = []
  for (const entry of input.equipment.filter(value => appliesToSet(value, input.activeSet))) {
    for (const modifier of entry.modifierValues) {
      for (const stat of modifier.statValues ?? []) {
        if (stat.statId === 'additional_strength') equipment.strength += stat.value
        else if (stat.statId === 'additional_dexterity') equipment.dexterity += stat.value
        else if (stat.statId === 'additional_intelligence') equipment.intelligence += stat.value
        else if (stat.statId === 'additional_all_attributes') for (const attribute of Object.keys(equipment) as CharacterAttribute[]) equipment[attribute] += stat.value
      }
    }
  }
  for (const node of allocatedNodes(input.passiveTree, input.realPassivePlanning, input.activeSet)) {
    for (const raw of node.stats.map(stat => stat.sourceText).filter((value): value is string => Boolean(value))) {
      const text = clean(raw)
      const single = text.match(/^\+?(-?\d+) to (Strength|Dexterity|Intelligence)$/i)
      const all = text.match(/^\+?(-?\d+) to all Attributes$/i)
      if (single) passives[single[2].toLowerCase() as CharacterAttribute] += Number(single[1])
      else if (all) for (const attribute of Object.keys(passives) as CharacterAttribute[]) passives[attribute] += Number(all[1])
      else if (/attributes?|strength|dexterity|intelligence/i.test(text)) blockedPassiveLines.push(text)
    }
  }
  const total = Object.fromEntries((Object.keys(base) as CharacterAttribute[]).map(attribute => [attribute, base[attribute] + equipment[attribute] + passives[attribute]])) as CharacterAttributeValues
  return {
    modelVersion: CHARACTER_ATTRIBUTE_MODEL_VERSION,
    activeSet: input.activeSet,
    status: baseByClassId[input.classId] ? 'exact-confirmed-sources' : 'blocked-unknown-class',
    base,
    equipment,
    passives,
    total,
    blockedPassiveLines: [...new Set(blockedPassiveLines)].sort(),
    sourceReferences: ['data-sources/poe2-tree/raw/0.5.2/data.json:classes', 'generated/poe2-gems/catalog.json:requirements', 'technical affix statValues'],
  }
}

export const attributeDeficits = (requirements: Partial<CharacterAttributeValues> | undefined, values: CharacterAttributeValues) =>
  Object.fromEntries((Object.keys(values) as CharacterAttribute[]).map(attribute => [attribute, Math.max(0, (requirements?.[attribute] ?? 0) - values[attribute])])) as CharacterAttributeValues
