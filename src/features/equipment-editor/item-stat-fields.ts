const defensiveItemClasses = new Set([
  'Helmets',
  'Body Armours',
  'Gloves',
  'Boots',
  'Shields',
  'Bucklers',
  'Foci',
])

const defensiveUniqueCategories = new Set([
  'helmet',
  'body-armour',
  'gloves',
  'boots',
  'shield',
  'focus',
])

export const itemSupportsDefenceValues = (itemClassId?: string, uniqueCategory?: string) =>
  uniqueCategory !== undefined
    ? defensiveUniqueCategories.has(uniqueCategory)
    : defensiveItemClasses.has(itemClassId ?? '')
