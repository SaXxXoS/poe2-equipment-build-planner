const exactWeaponTypes = new Set([
  'bow',
  'crossbow',
  'claw',
  'dagger',
  'flail',
  'focus',
  'mace',
  'quarterstaff',
  'spear',
  'sword',
  'axe',
])

const normalizeWeaponType = value => String(value ?? '').trim().toLowerCase()

export function exactRequiredWeaponTypes(skill) {
  if (!skill) return []
  return [...new Set((skill.craftingTypes ?? [])
    .map(normalizeWeaponType)
    .filter(value => exactWeaponTypes.has(value)))]
    .sort()
}

/**
 * A profile-wide weapon list does not prove which weapon set was used by its
 * highest-DPS skill. Only an exact local gem weapon requirement can make that
 * pair productive. Unrestricted skills remain audit-only until the source
 * exposes a structured skill-to-weapon-set link.
 */
export function classifySkillWeaponPair(skillName, weapon, skills) {
  const skill = skills.find(value => value.nameEn === skillName)
  if (!skill) {
    return {
      status: 'unresolved-skill',
      productive: false,
      requiredWeaponTypes: [],
    }
  }
  const requiredWeaponTypes = exactRequiredWeaponTypes(skill)
  if (!requiredWeaponTypes.length) {
    return {
      status: 'unresolved-no-exact-weapon-requirement',
      productive: false,
      requiredWeaponTypes,
    }
  }
  const normalizedWeapon = normalizeWeaponType(weapon)
  if (!requiredWeaponTypes.includes(normalizedWeapon)) {
    return {
      status: 'blocked-incompatible-weapon',
      productive: false,
      requiredWeaponTypes,
    }
  }
  return {
    status: 'structured-exact-compatible',
    productive: true,
    requiredWeaponTypes,
  }
}
