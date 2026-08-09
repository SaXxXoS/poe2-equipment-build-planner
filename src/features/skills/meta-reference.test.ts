import { describe, expect, it } from 'vitest'
import type { SkillGemDefinition } from '../../domain'
import {
  ascendancyMetaReferences,
  correlatedMetaSupportNamesForLinkedSkill,
  metaReferenceSnapshot,
  scoreMetaReference,
} from './meta-reference'
import profileReferences from '../../../docs/audits/poe2-current-meta-reference-profiles.json'
import profileValidation from '../../../docs/audits/poe2-current-meta-build-profile-validation.json'
import correlatedPackages from '../../../generated/meta/poe2-build-packages.json'
import packageCoverage from '../../../docs/audits/poe2-meta-skill-weapon-package-coverage.json'

const skill = (
  nameEn: string,
  requiredWeaponTypes: SkillGemDefinition['requiredWeaponTypes'] = [],
): SkillGemDefinition => ({
  id: `skill:${nameEn}`,
  displayNameDe: nameEn,
  nameEn,
  dataVersion: 'test',
  source: 'local-placeholder',
  status: 'placeholder',
  tags: ['spell'],
  requiredWeaponTypes,
  possibleRoles: ['main'],
  enabled: true,
})

describe('seasonal meta reference', () => {
  it('covers every currently selectable ascendancy with a versioned snapshot', () => {
    expect(Object.keys(ascendancyMetaReferences)).toHaveLength(23)
    expect(metaReferenceSnapshot).toMatchObject({
      league: 'Runes of Aldur',
      patchFamily: '0.5.x',
      exactVersion: correlatedPackages.source.version,
      snapshotDate: '2026-07-28',
      overviewExactVersion: '1924-20260728-10654',
      correlatedPackageSnapshotDate: correlatedPackages.source.snapshotDate,
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

  it('uses only multi-profile correlated packages as additional evidence', () => {
    expect(correlatedPackages.packages.length).toBeGreaterThan(0)
    expect(correlatedPackages.packages.every(item =>
      item.productive
      && item.profileCount >= correlatedPackages.policy.minimumProductiveProfiles,
    )).toBe(true)
    const first = correlatedPackages.packages.find(item => item.mainSkill === 'Ice Shot' && item.weapon === 'bow')!
    const result = scoreMetaReference(
      skill(first.mainSkill, ['bow']),
      first.weapon as Parameters<typeof scoreMetaReference>[1],
      first.ascendancyId,
    )
    expect(result.correlatedProfileCount).toBe(first.profileCount)
    expect(result.correlatedPackageScore).toBeGreaterThan(0)
    expect(result.correlatedPackageScore).toBeGreaterThan(result.overviewScore)
  })

  it('does not treat a profile-wide secondary weapon as a main-skill correlation', () => {
    expect(correlatedPackages.packages.some(item =>
      item.mainSkill === 'Ice Shot' && item.weapon === 'wand',
    )).toBe(false)
    expect(packageCoverage.blockedPackages.some(item =>
      item.mainSkill === 'Ice Shot'
      && item.weapon === 'wand'
      && item.status === 'blocked-incompatible-weapon',
    )).toBe(true)
    expect(scoreMetaReference(
      skill('Ice Shot', ['bow']),
      'wand',
      'ascendancy-official-Ranger1',
    )).toMatchObject({
      correlatedPackageScore: 0,
      correlatedProfileCount: 0,
    })
  })

  it('keeps correlated profile evidence anonymized and reduced', () => {
    expect(profileValidation).toMatchObject({
      requestedProfiles: 460,
    })
    expect(profileValidation.validatedProfiles).toBeGreaterThan(100)
    expect(profileValidation.blockedProfiles).toBe(
      profileValidation.requestedProfiles - profileValidation.validatedProfiles,
    )
    expect(profileValidation.policy).toMatchObject({
      rawProfilesStored: false,
      accountNamesStored: false,
      characterNamesStored: false,
      pathOfBuildingExportsStored: false,
    })
    for (const observation of profileValidation.observations) {
      expect(observation.profileId).toMatch(/^[a-f0-9]{20}$/)
      expect(observation.observationSchemaVersion).toBe(2)
      expect(observation.skillGroups).toBeInstanceOf(Array)
      expect(observation).not.toHaveProperty('account')
      expect(observation).not.toHaveProperty('name')
      expect(observation).not.toHaveProperty('url')
      expect(observation).not.toHaveProperty('pathOfBuildingExport')
    }
  })

  it('keeps full-loadout group evidence bounded and exposes only same-group supports', () => {
    const packageWithGroup = correlatedPackages.packages.find(item =>
      item.linkedSkillGroups?.some(group => group.supports.length > 0),
    )
    expect(packageWithGroup).toBeDefined()
    expect(correlatedPackages.packages.flatMap(item => item.linkedSkillGroups ?? [])
      .every(group => group.share >= 0 && group.share <= 100)).toBe(true)
    const group = packageWithGroup!.linkedSkillGroups.find(item => item.supports.length > 0)!
    const linkedSupports = correlatedMetaSupportNamesForLinkedSkill(
      skill(packageWithGroup!.mainSkill, packageWithGroup!.localRequiredWeaponTypes as never),
      group.activeSkills[0],
      packageWithGroup!.ascendancyId,
    )
    expect(linkedSupports.map(item => item.name)).toEqual(expect.arrayContaining(group.supports))
  })

  it('does not create a package bonus for an uncorrelated pair', () => {
    expect(scoreMetaReference(
      skill('Nicht beobachtete Fertigkeit'),
      'wand',
      'ascendancy-official-Sorceress1',
    ).correlatedPackageScore).toBe(0)
  })

  it('never creates evidence for an unknown ascendancy', () => {
    expect(scoreMetaReference(skill('Spark'), 'wand', 'unknown')).toMatchObject({
      score: 0,
      sampleSize: 0,
    })
  })
})
