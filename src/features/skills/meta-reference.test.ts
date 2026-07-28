import { describe, expect, it } from 'vitest'
import type { SkillGemDefinition } from '../../domain'
import { ascendancyMetaReferences, metaReferenceSnapshot, scoreMetaReference } from './meta-reference'
import profileReferences from '../../../docs/audits/poe2-current-meta-reference-profiles.json'

const skill = (nameEn: string): SkillGemDefinition => ({
  id: `skill:${nameEn}`,
  displayNameDe: nameEn,
  nameEn,
  dataVersion: 'test',
  source: 'local-placeholder',
  status: 'placeholder',
  tags: ['spell'],
  requiredWeaponTypes: [],
  possibleRoles: ['main'],
  enabled: true,
})

describe('seasonal meta reference', () => {
  it('covers every currently selectable ascendancy with a versioned snapshot', () => {
    expect(Object.keys(ascendancyMetaReferences)).toHaveLength(23)
    expect(metaReferenceSnapshot).toMatchObject({
      league: 'Runes of Aldur',
      patchFamily: '0.5.x',
      population: 124306,
    })
  })

  it('keeps twenty concrete audit references per ascendancy out of direct ranking', () => {
    expect(profileReferences.ascendancyCount).toBe(23)
    expect(profileReferences.profilesPerAscendancy).toBe(20)
    expect(profileReferences.totalProfileReferences).toBe(460)
    expect(profileReferences.usageStatus).toBe('audit-reference-not-direct-ranking-input')
    for (const entry of profileReferences.ascendancies) {
      expect(entry.profiles).toHaveLength(20)
      expect(new Set(entry.profiles.map(profile => profile.url)).size).toBe(20)
      expect(entry.profiles.every(profile =>
        profile.validationStatus === 'unvalidated-correlated-profile'
        && profile.url.startsWith('https://poe.ninja/poe2/builds/runesofaldur/character/'),
      )).toBe(true)
    }
  })

  it('adds bounded secondary evidence for an observed skill and weapon', () => {
    const observed = scoreMetaReference(skill('Spark'), 'wand', 'ascendancy-official-Sorceress1')
    const unobserved = scoreMetaReference(skill('Essence Drain'), 'wand', 'ascendancy-official-Sorceress1')
    expect(observed.observedSkillShare).toBe(94)
    expect(observed.score).toBeGreaterThan(unobserved.score)
    expect(observed.score).toBeLessThanOrEqual(100)
  })

  it('never creates evidence for an unknown ascendancy', () => {
    expect(scoreMetaReference(skill('Spark'), 'wand', 'unknown')).toMatchObject({
      score: 0,
      sampleSize: 0,
    })
  })
})
