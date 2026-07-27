const weaponItemClasses = new Set([
  'axes', 'bows', 'claws', 'crossbows', 'daggers', 'flails', 'foci',
  'maces', 'quarterstaves', 'sceptres', 'spears', 'staves', 'swords', 'wands',
  'one hand axes', 'one hand maces', 'one hand swords',
  'two hand axes', 'two hand maces', 'two hand swords',
])

export const isWeaponItemClass = (itemClassId?: string): boolean =>
  itemClassId ? weaponItemClasses.has(itemClassId.trim().toLocaleLowerCase('en')) : false

export const supportsDisplayedDefences = (itemClassId?: string): boolean =>
  !isWeaponItemClass(itemClassId)
