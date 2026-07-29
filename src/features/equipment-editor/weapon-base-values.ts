import data from '../../../generated/poe2-items/weapon-base-values.json'
import type { EquipmentWeaponStats } from '../../domain'

export interface WeaponBaseValue {
  id: string
  itemClassId: string
  nameEn: string
  displayNameDe: string | null
  physicalDamage: { minimum: number; maximum: number }
  fireDamage: { minimum: number; maximum: number } | null
  coldDamage: { minimum: number; maximum: number } | null
  lightningDamage: { minimum: number; maximum: number } | null
  chaosDamage: { minimum: number; maximum: number } | null
  criticalHitChance: number
  attacksPerSecond: number
  implicit: string | null
  socketLimit: number | null
  requiredLevel: number | null
  requirements: BaseRequirements
}
interface BaseRequirements {
  strength: number | null
  dexterity: number | null
  intelligence: number | null
}
export interface DefenceBaseValue {
  id: string
  itemClassId: string
  nameEn: string
  displayNameDe: string | null
  defences: {
    armour: number | null
    evasion: number | null
    energyShield: number | null
  }
  socketLimit: number | null
  requiredLevel: number | null
  requirements: BaseRequirements
}
export interface UtilityBaseValue {
  id: string
  itemClassId: string
  nameEn: string
  displayNameDe: string | null
  implicit: string | null
  spirit: number | null
  socketLimit: number | null
  requiredLevel: number | null
  requirements: BaseRequirements
}

export const weaponBaseValues = data.items as WeaponBaseValue[]
export const weaponBaseValueById = new Map(weaponBaseValues.map(value => [value.id, value]))
export const weaponBaseValuesFor = (itemClassId: string) => weaponBaseValues.filter(value => value.itemClassId === itemClassId)
export const weaponBaseDisplayName = (value: WeaponBaseValue) => value.displayNameDe ? `${value.displayNameDe} (${value.nameEn})` : value.nameEn
export const defenceBaseValues = data.defenceItems as DefenceBaseValue[]
export const defenceBaseValueById = new Map(defenceBaseValues.map(value => [value.id, value]))
export const defenceBaseValuesFor = (itemClassId: string) => defenceBaseValues.filter(value => value.itemClassId === itemClassId)
export const defenceBaseDisplayName = (value: DefenceBaseValue) => value.displayNameDe ? `${value.displayNameDe} (${value.nameEn})` : value.nameEn
export const utilityBaseValues = data.utilityItems as UtilityBaseValue[]
export const utilityBaseValueById = new Map(utilityBaseValues.map(value => [value.id, value]))
export const utilityBaseValuesFor = (itemClassId: string) => utilityBaseValues.filter(value => value.itemClassId === itemClassId)
export const utilityBaseDisplayName = (value: UtilityBaseValue) => value.displayNameDe ? `${value.displayNameDe} (${value.nameEn})` : value.nameEn

export function weaponStatsFromBase(value: WeaponBaseValue): EquipmentWeaponStats {
  return {
    physicalDamage: { ...value.physicalDamage },
    fireDamage: value.fireDamage ? { ...value.fireDamage } : undefined,
    coldDamage: value.coldDamage ? { ...value.coldDamage } : undefined,
    lightningDamage: value.lightningDamage ? { ...value.lightningDamage } : undefined,
    chaosDamage: value.chaosDamage ? { ...value.chaosDamage } : undefined,
    criticalHitChance: value.criticalHitChance,
    attacksPerSecond: value.attacksPerSecond,
  }
}
