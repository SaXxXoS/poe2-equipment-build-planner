import type { EquipmentEntry } from '../../domain'

export const activeWeaponSlotIds = (weaponSet: 'set-1'|'set-2') =>
  [`slot-weapon-${weaponSet}-left`, `slot-weapon-${weaponSet}-right`]

const jewelNumber = (slotId: string) => Number(slotId.match(/^slot-jewel-(\d+)$/)?.[1] ?? 0)
export const jewelEntries = (entries: EquipmentEntry[]) =>
  entries.filter(entry => /^slot-jewel-\d+$/.test(entry.slotId)).sort((a, b) => jewelNumber(a.slotId) - jewelNumber(b.slotId))
export const createNextJewelEntry = (entries: EquipmentEntry[]): EquipmentEntry => {
  const number = Math.max(0, ...jewelEntries(entries).map(entry => jewelNumber(entry.slotId))) + 1
  return { id: `equipment-slot-jewel-${number}`, slotId: `slot-jewel-${number}`, modifierValues: [] }
}
export const canRemoveJewelEntry = (entry: EquipmentEntry | undefined) =>
  Boolean(entry && !entry.itemClassId && !entry.itemDefinitionId && !entry.uniqueItemId && entry.modifierValues.length === 0)
