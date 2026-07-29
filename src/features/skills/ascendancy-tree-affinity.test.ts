import { describe, expect, it } from 'vitest'
import type { SkillGemDefinition } from '../../domain'
import { ascendancyAffinityCoverage, derivedAscendancyAffinity } from './ascendancy-tree-affinity'

const skill = (id: string, tags: SkillGemDefinition['tags']): SkillGemDefinition => ({
  id,
  displayNameDe: id,
  dataVersion: 'test',
  source: 'local-placeholder',
  status: 'placeholder',
  tags,
})

describe('strukturierte Aszendenz-Skill-Passung', () => {
  it('erschließt alle 36 Aszendenzen aus dem gepinnten offiziellen Baum', () => {
    expect(ascendancyAffinityCoverage()).toMatchObject({
      ascendancyCount: 36,
      ascendanciesWithProductiveTags: 22,
    })
  })

  it('liefert nur tatsächlich in klassifizierten Aszendenzknoten belegte Tags', () => {
    const result = derivedAscendancyAffinity(
      skill('lightning-spell', ['spell', 'lightning']),
      'ascendancy-official-Sorceress1',
    )
    expect(result.sourceNodeCount).toBeGreaterThan(0)
    expect(result.evidence).toBe('structured-derived')
    expect(result.matches.length).toBeGreaterThan(0)
  })

  it('bleibt bei unbekannter Aszendenz unresolved', () => {
    expect(derivedAscendancyAffinity(skill('unknown', ['spell']), 'missing')).toMatchObject({
      evidence: 'unresolved',
      score: 0,
      sourceNodeCount: 0,
    })
  })
})
