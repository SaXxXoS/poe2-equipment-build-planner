import { describe, expect, it } from 'vitest'
import catalog from '../../generated/poe2-gems/catalog.json'
import approval from '../../data-sources/source-approval.json'
import { buildAssistantCandidates } from '../features/build-assistant-v1'
import { repoeGemCatalogCoverage, repoeSkillCatalog, repoeSupportCatalog } from './repoe-catalog'

describe('vollständiger lokaler RePoE Skill-/Supportkatalog', () => {
  it('verwendet den gepinnten und gehashten lokalen Export', () => {
    expect(catalog.sourceCommit).toBe('b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c')
    expect(catalog.sourceVersion).toBe('4.5.4.4.4')
    expect(catalog.sourceSha256).toBe('2c5a481f1147a87c844b1734a8fd2c660e4e13922145470ac72bca75095a69e3')
    const scope = approval.categoryAssignments.find(item => item.categoryId === 'poe2-repoe-skill-support-catalog')
    expect(scope?.status).toBe('conditionally-approved')
    expect(scope?.constraints?.sourceSha256).toBe(catalog.sourceSha256)
  })

  it('klassifiziert alle sicher herstellbaren Gem-Datensätze', () => {
    expect(repoeGemCatalogCoverage).toEqual({ skills: 235, activeSkills: 219, spiritSkills: 16, supports: 451 })
    expect(repoeSkillCatalog).toHaveLength(235)
    expect(repoeSupportCatalog).toHaveLength(451)
    expect(repoeSkillCatalog.every(item => item.id.startsWith('repoe:'))).toBe(true)
    expect(repoeSupportCatalog.every(item => item.id.startsWith('repoe:'))).toBe(true)
  })

  it('entfernt interne und nicht herstellbare Rohdatensätze fail-closed', () => {
    expect(repoeSkillCatalog.some(item => item.displayNameDe === 'Coming Soon')).toBe(false)
    expect(repoeSupportCatalog.some(item => item.displayNameDe === 'Coming Soon')).toBe(false)
    expect(repoeSkillCatalog.some(item => item.sourceReference?.includes('SkillGemAscendancy'))).toBe(false)
  })

  it('macht den Katalog produktiv durchsuchbar und lässt unbekannte Semantik leer', () => {
    expect(buildAssistantCandidates.skills.length).toBeGreaterThanOrEqual(235)
    expect(buildAssistantCandidates.supports.length).toBeGreaterThanOrEqual(451)
    expect(buildAssistantCandidates.skills.some(item => item.nameEn === 'Arc')).toBe(true)
    expect(buildAssistantCandidates.supports.some(item => item.nameEn === 'Abiding Hex')).toBe(true)
    const unknown = repoeSupportCatalog.find(item => item.nameEn === 'Abiding Hex')
    expect(unknown?.requiredTags).toEqual([])
    expect(unknown?.experimental).toBe(true)
  })

  it('behält Supportstufen als getrennte Quellidentitäten', () => {
    const bleed = repoeSupportCatalog.filter(item => item.nameEn?.startsWith('Bleed '))
    expect(bleed.map(item => item.nameEn)).toEqual(expect.arrayContaining(['Bleed I', 'Bleed II', 'Bleed III', 'Bleed IV']))
    expect(new Set(bleed.map(item => item.id)).size).toBe(bleed.length)
  })

  it('löst die gepinnten Recommended-Support-Referenzen ohne Namensheuristik auf', () => {
    const supportIds = new Set(repoeSupportCatalog.map(item => item.id))
    const references = repoeSkillCatalog.flatMap(item => item.recommendedSupportIds ?? [])
    expect(references).toHaveLength(2984)
    expect(references.filter(id => supportIds.has(id))).toHaveLength(2952)
  })
})
