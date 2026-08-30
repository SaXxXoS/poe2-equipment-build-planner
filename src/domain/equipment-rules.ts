const weaponItemClasses = new Set([
  'axes', 'bows', 'claws', 'crossbows', 'daggers', 'flails', 'foci',
  'maces', 'quarterstaves', 'sceptres', 'spears', 'staves', 'swords', 'wands',
  'one hand axes', 'one hand maces', 'one hand swords',
  'two hand axes', 'two hand maces', 'two hand swords',
])

const oneHandedWeaponItemClasses = new Set([
  'claws', 'daggers', 'flails', 'sceptres', 'spears', 'wands',
  'one hand axes', 'one hand maces', 'one hand swords',
])

/** Fail-closed pairing rule for generated equipment recommendations. */
export const canEquipOffhandWithMainWeapon = (
  mainHandItemClassId?: string,
  offhandItemClassId?: string,
): boolean => {
  if (!mainHandItemClassId || !offhandItemClassId) return false
  const main = mainHandItemClassId.trim().toLocaleLowerCase('en')
  const offhand = offhandItemClassId.trim().toLocaleLowerCase('en')
  if (offhand === 'quivers') return main === 'bows'
  if (offhand === 'foci') return main === 'wands' || main === 'sceptres'
  if (offhand === 'bucklers' || offhand === 'shields') {
    return oneHandedWeaponItemClasses.has(main)
  }
  return false
}

export const isWeaponItemClass = (itemClassId?: string): boolean =>
  itemClassId ? weaponItemClasses.has(itemClassId.trim().toLocaleLowerCase('en')) : false

export const supportsDisplayedDefences = (itemClassId?: string): boolean =>
  !isWeaponItemClass(itemClassId)
