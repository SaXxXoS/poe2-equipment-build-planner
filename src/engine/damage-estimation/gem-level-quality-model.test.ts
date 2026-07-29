import { describe, expect, it } from 'vitest'
import type { SkillGemDefinition, SkillSetup } from '../../domain'
import { resolveGemLevelQualityModel } from './gem-level-quality-model'

const skill = (nameEn = 'Arc'): SkillGemDefinition => ({
  id: 'skill', nameEn, displayNameDe: nameEn, tags: [], dataVersion: 'test', source: 'local-placeholder', status: 'verified',
})
const setup = (level?: number): SkillSetup => ({
  id: 'setup', skillId: 'skill', role: 'main', weaponSet: 'both', supportGemIds: [], ...(level == null ? {} : { level }),
})

describe('fail-closed Gemmenstufen- und Qualitätsmodell', () => {
  it('wendet eine exakt vorhandene Stufe 20 an', () => {
    expect(resolveGemLevelQualityModel({ setup: setup(20), skill: skill(), supports: [] })).toMatchObject({
      requestedSkillLevel: 20, availableSkillLevel: 20, appliedSkillLevel: 20, skillLevelStatus: 'exact', productive: true,
    })
  })
  it('verwendet ohne Eingabestufe transparent die einzige Referenzstufe', () => {
    expect(resolveGemLevelQualityModel({ setup: setup(), skill: skill(), supports: [] })).toMatchObject({
      availableSkillLevel: 20, appliedSkillLevel: 20, skillLevelStatus: 'default-reference-level', productive: true,
    })
  })
  it('wendet eine weitere exakt vorhandene Stufe an', () => {
    expect(resolveGemLevelQualityModel({ setup: setup(19), skill: skill(), supports: [] })).toMatchObject({
      requestedSkillLevel: 19, availableSkillLevel: 19, appliedSkillLevel: 19, skillLevelStatus: 'exact', productive: true,
    })
  })
  it('blockiert eine nicht vorhandene Stufe statt Werte zu interpolieren', () => {
    expect(resolveGemLevelQualityModel({ setup: setup(99), skill: skill(), supports: [] })).toMatchObject({
      requestedSkillLevel: 99, skillLevelStatus: 'blocked-level-mismatch', productive: false,
    })
  })
  it('weist Qualität und Supportstufen ausdrücklich als nicht belegt aus', () => {
    expect(resolveGemLevelQualityModel({ setup: setup(20), skill: skill(), supports: [] })).toMatchObject({
      skillQualityStatus: 'blocked-not-transported-and-no-reference',
      supportLevelStatus: 'blocked-not-transported',
      supportQualityStatus: 'blocked-not-transported-and-no-reference',
    })
  })
  it('bleibt deterministisch', () => {
    const input = { setup: setup(20), skill: skill(), supports: [] }
    expect(resolveGemLevelQualityModel(input)).toEqual(resolveGemLevelQualityModel(input))
  })
})
