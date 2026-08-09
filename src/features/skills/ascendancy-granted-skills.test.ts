import { describe, expect, it } from 'vitest'
import type { RealPassivePlanningIntegrationResult } from '../../engine'
import { createEmptySkillSetups } from './initial-state'
import {
  addAllocatedAscendancyGrantedSkills,
  clearAutomaticallyGrantedAscendancySkills,
  officialAscendancyGrantedSkills,
} from './ascendancy-granted-skills'

describe('offiziell gewährte Aszendenzfertigkeiten', () => {
  it('übernimmt ausschließlich die 53 expliziten Grants-Skill-Zeilen des gepinnten Baums', () => {
    expect(officialAscendancyGrantedSkills).toHaveLength(53)
    expect(officialAscendancyGrantedSkills.every(skill =>
      skill.source === 'official'
      && skill.status === 'verified'
      && skill.allowedAscendancyIds?.length === 1
      && skill.tags.length === 0,
    )).toBe(true)
  })

  it('fügt eine Fertigkeit erst nach tatsächlicher Belegung ihres Knotens hinzu', () => {
    const setups = createEmptySkillSetups()
    const withoutAllocation = addAllocatedAscendancyGrantedSkills(setups, {
      ascendancyPlanning: { allocatedNodeIds: [] },
    } as unknown as RealPassivePlanningIntegrationResult)
    expect(withoutAllocation.every(setup => !setup.skillId)).toBe(true)

    const withAllocation = addAllocatedAscendancyGrantedSkills(setups, {
      ascendancyPlanning: { allocatedNodeIds: ['12882'] },
    } as unknown as RealPassivePlanningIntegrationResult)
    expect(withAllocation[0]).toMatchObject({
      origin: 'ascendancy',
      locked: true,
      role: 'utility',
      weaponSet: 'both',
    })
    expect(officialAscendancyGrantedSkills.find(skill => skill.id === withAllocation[0].skillId)?.nameEn)
      .toBe('Elemental Storm')
  })

  it('entfernt automatisch gewährte Fertigkeiten bei einem Aszendenzwechsel ohne manuelle Slots anzutasten', () => {
    const setups = createEmptySkillSetups()
    setups[0] = { ...setups[0], skillId: 'manual-skill' }
    setups[1] = { ...setups[1], skillId: 'asc-skill', origin: 'ascendancy', locked: true }
    const cleared = clearAutomaticallyGrantedAscendancySkills(setups)
    expect(cleared[0].skillId).toBe('manual-skill')
    expect(cleared[1]).toMatchObject({ skillId: '', origin: 'manual', locked: false })
  })
})
