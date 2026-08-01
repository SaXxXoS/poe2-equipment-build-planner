import type { EquipmentEntry } from '../../domain'
import { defenceBaseValueById, utilityBaseValueById, weaponBaseValueById } from '../../features/equipment-editor/weapon-base-values'
import { evaluateBaseRequirements, type BaseRequirementInput } from '../../features/equipment-editor/base-requirements'
import { resolveExactBaseIdentity } from '../../features/equipment-editor/base-identity-resolution'
import type { CharacterAttributeModel, CharacterAttributeValues } from '../character-attributes/model'
import type { ConstraintViolation } from '../common/types'

export type EquipmentRequirementStatus = 'met' | 'blocked-level' | 'blocked-attributes' | 'blocked-unknown-attributes' | 'unresolved-base'

export interface EquipmentRequirementItem {
  entryId: string
  slotId: string
  itemDefinitionId?: string
  label: string
  activeSets: ('set-1' | 'set-2')[]
  requiredLevel: number | null
  requirements: BaseRequirementInput['requirements']
  status: EquipmentRequirementStatus
  missing: Partial<CharacterAttributeValues>
}

export interface EquipmentRequirementAssessment {
  modelVersion: 'pinned-item-base-requirements-v1'
  status: 'complete' | 'partial' | 'blocked'
  items: EquipmentRequirementItem[]
  blockedItems: EquipmentRequirementItem[]
  unresolvedItems: EquipmentRequirementItem[]
  violations: ConstraintViolation[]
}

export const baseRequirementById = (id: string | undefined): BaseRequirementInput | undefined => {
  if (!id) return undefined
  const base = weaponBaseValueById.get(id) ?? defenceBaseValueById.get(id) ?? utilityBaseValueById.get(id)
  return base ? { requiredLevel: base.requiredLevel, requirements: { ...base.requirements } } : undefined
}

const baseRequirementForEntry = (entry: EquipmentEntry): BaseRequirementInput | undefined => {
  const byId = baseRequirementById(entry.itemDefinitionId)
  if (byId) return byId
  const exact = resolveExactBaseIdentity(entry.baseDisplayName, entry.itemClassId)
  return exact ? { requiredLevel: exact.base.requiredLevel, requirements: { ...exact.base.requirements } } : undefined
}

export const entryActiveSets = (entry: EquipmentEntry): ('set-1' | 'set-2')[] =>
  entry.slotId.includes('weapon-set-1') ? ['set-1'] : entry.slotId.includes('weapon-set-2') ? ['set-2'] : ['set-1', 'set-2']

const isEnteredNormalItem = (entry: EquipmentEntry) => !entry.uniqueItemId && Boolean(
  entry.itemDefinitionId || entry.baseDisplayName || entry.itemClassId || entry.modifierValues.length || entry.weaponStats || entry.defences,
)

const violation = (code: string, item: EquipmentRequirementItem, blocking = false): ConstraintViolation => ({
  code,
  severity: blocking ? 'error' : 'warning',
  messageKey: `engine.equipment.${code}`,
  sourceId: item.entryId,
  relatedIds: [item.itemDefinitionId ?? item.slotId],
  blocking,
})

export function assessEquipmentBaseRequirements(input: {
  equipment: EquipmentEntry[]
  characterLevel: number | undefined
  attributesWithoutEntry: (entry: EquipmentEntry, activeSet: 'set-1' | 'set-2') => CharacterAttributeModel
}): EquipmentRequirementAssessment {
  const items = input.equipment.filter(isEnteredNormalItem).map(entry => {
    const base = baseRequirementForEntry(entry)
    const activeSets = entryActiveSets(entry)
    if (!base) return {
      entryId: entry.id, slotId: entry.slotId, itemDefinitionId: entry.itemDefinitionId,
      label: entry.baseDisplayName ?? entry.itemClassId ?? entry.itemDefinitionId ?? entry.slotId,
      activeSets, requiredLevel: null, requirements: { strength: null, dexterity: null, intelligence: null },
      status: 'unresolved-base' as const, missing: {},
    }
    const evaluations = activeSets.map(set => evaluateBaseRequirements(base, input.characterLevel, input.attributesWithoutEntry(entry, set).total))
    const status: EquipmentRequirementStatus = evaluations.some(value => value.status === 'blocked-level') ? 'blocked-level'
      : evaluations.some(value => value.status === 'blocked-unknown-attributes') ? 'blocked-unknown-attributes'
        : evaluations.some(value => value.status === 'blocked-attributes') ? 'blocked-attributes' : 'met'
    const missing = Object.fromEntries((['strength', 'dexterity', 'intelligence'] as const).map(attribute => [attribute, Math.max(...evaluations.map(value => value.missing[attribute] ?? 0))]))
    return { entryId: entry.id, slotId: entry.slotId, itemDefinitionId: entry.itemDefinitionId, label: entry.baseDisplayName ?? entry.itemDefinitionId ?? entry.slotId, activeSets, requiredLevel: base.requiredLevel, requirements: base.requirements, status, missing }
  })
  const blockedItems = items.filter(item => item.status.startsWith('blocked-'))
  const unresolvedItems = items.filter(item => item.status === 'unresolved-base')
  const violations = items.flatMap(item => item.status === 'blocked-level' ? [violation('base-level-requirement', item)]
    : item.status === 'blocked-attributes' ? [violation('base-attribute-requirement', item)]
      : item.status === 'blocked-unknown-attributes' ? [violation('base-attributes-unknown', item)]
        : item.status === 'unresolved-base' ? [violation('base-identity-unresolved', item)] : [])
  return { modelVersion: 'pinned-item-base-requirements-v1', status: blockedItems.length ? 'blocked' : unresolvedItems.length ? 'partial' : 'complete', items, blockedItems, unresolvedItems, violations }
}

export function maximumEquipmentRequirements(equipment: EquipmentEntry[], activeSet?: 'set-1' | 'set-2') {
  const applicable = equipment.filter(entry => isEnteredNormalItem(entry) && (!activeSet || entryActiveSets(entry).includes(activeSet)))
  return applicable.reduce((maximum, entry) => {
    const base = baseRequirementForEntry(entry)
    if (!base) return maximum
    for (const attribute of ['strength', 'dexterity', 'intelligence'] as const) maximum[attribute] = Math.max(maximum[attribute], base.requirements[attribute] ?? 0)
    return maximum
  }, { strength: 0, dexterity: 0, intelligence: 0 } as CharacterAttributeValues)
}
