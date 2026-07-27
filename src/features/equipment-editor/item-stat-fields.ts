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

export function weaponStatsAreValid(value:EquipmentWeaponStats){
  const ranges=[value.physicalDamage,value.fireDamage,value.coldDamage,value.lightningDamage,value.chaosDamage]
  if(ranges.some(range=>range&&(!Number.isFinite(range.minimum)||!Number.isFinite(range.maximum)||range.minimum<0||range.maximum<range.minimum)))return false
  if(value.attacksPerSecond!==undefined&&(!Number.isFinite(value.attacksPerSecond)||value.attacksPerSecond<=0))return false
  if(value.criticalHitChance!==undefined&&(!Number.isFinite(value.criticalHitChance)||value.criticalHitChance<0))return false
  if(value.range!==undefined&&(!Number.isFinite(value.range)||value.range<0))return false
  return true
}
import type { EquipmentWeaponStats } from '../../domain'
