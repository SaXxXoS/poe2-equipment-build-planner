import type { SkillSetup } from '../../domain'

/**
 * Verleiht ausschließlich automatisch empfohlenen Schadensfertigkeiten eine
 * sinnvolle Set-Zuordnung. Manuelle Entscheidungen und Hilfsfertigkeiten
 * bleiben unverändert.
 */
export function assignRecommendedWeaponSets(setups: SkillSetup[]): SkillSetup[] {
  let nextDamageSet: 'set-1' | 'set-2' = 'set-1'
  return setups.map(setup => {
    if (setup.origin !== 'recommended' || setup.weaponSet !== 'both') return setup
    if (setup.role !== 'main' && setup.role !== 'secondary') return setup
    const weaponSet = setup.role === 'main' ? 'set-1' : nextDamageSet
    nextDamageSet = weaponSet === 'set-1' ? 'set-2' : 'set-1'
    return { ...setup, weaponSet }
  })
}
