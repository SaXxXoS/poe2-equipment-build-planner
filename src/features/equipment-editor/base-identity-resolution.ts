import {
  defenceBaseValues,
  type DefenceBaseValue,
  utilityBaseValues,
  type UtilityBaseValue,
  weaponBaseValues,
  type WeaponBaseValue,
} from './weapon-base-values'

export type ResolvedBaseIdentity =
  | { kind: 'weapon'; base: WeaponBaseValue }
  | { kind: 'defence'; base: DefenceBaseValue }
  | { kind: 'utility'; base: UtilityBaseValue }

const normalize = (value: string) => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/gi, '')
  .toLocaleLowerCase('en')

const allBases: ResolvedBaseIdentity[] = [
  ...weaponBaseValues.map(base => ({ kind: 'weapon' as const, base })),
  ...defenceBaseValues.map(base => ({ kind: 'defence' as const, base })),
  ...utilityBaseValues.map(base => ({ kind: 'utility' as const, base })),
]

/**
 * Resolves only an exact normalized German or English display name. Duplicate
 * names and mismatching item classes remain unresolved; no fuzzy OCR guess is
 * promoted to technical identity.
 */
export function resolveExactBaseIdentity(displayName: string | undefined, itemClassId?: string): ResolvedBaseIdentity | undefined {
  if (!displayName?.trim()) return undefined
  const key = normalize(displayName)
  const matches = allBases.filter(candidate => {
    if (itemClassId && candidate.base.itemClassId !== itemClassId) return false
    return [candidate.base.nameEn, candidate.base.displayNameDe]
      .filter((value): value is string => Boolean(value))
      .some(value => normalize(value) === key)
  })
  return matches.length === 1 ? matches[0] : undefined
}
