import { describe, expect, it } from 'vitest'
import product from '../../../generated/pob2/uniques.json'
import { allTechnicalAffixes } from '../../affixes/registry'
import { classifyTechnicalAffix } from '../../affixes/analyzer-semantics'
import { classifyPob2Unique } from '../../uniques/pob2-semantics'
import { pob2UniqueAnalyzerCandidates } from '../../uniques'
import { buildAssistantCandidates, runBuildAssistantV1 } from '.'
import type { CharacterConfiguration } from '../../domain'
import { initialEquipment, skillSetups } from '../../data'

const initialCharacter: CharacterConfiguration = { classId: 'class-official-6', ascendancyId: 'ascendancy-official-6-1', level: 80, goalProfile: 'balanced', desiredMainSkillId: 'skill-lightning-arrow' }

describe('Build Assistant V1.1 semantic expansion', () => {
  it('expands productive candidate breadth without fixtures', () => {
    expect(buildAssistantCandidates.skills.length).toBe(241)
    expect(buildAssistantCandidates.supports.length).toBe(463)
    expect(buildAssistantCandidates.jewels.length).toBe(13)
    expect(buildAssistantCandidates.skills.some(item => item.id.startsWith('fixture:'))).toBe(false)
  })

  it('keeps hard support compatibility rules', () => {
    const result = runBuildAssistantV1({
      character: { ...initialCharacter, desiredMainSkillId: 'skill-contagion' },
      equipment: initialEquipment,
      setups: skillSetups,
    })
    expect(result.supportAnalysis.blockedCandidates.find(item => item.supportId === 'support-brutality')).toBeDefined()
    expect(result.supportAnalysis.eligibleCandidates.some(item => item.supportId === 'support-swift-affliction')).toBe(true)
  })

  it('classifies technical affixes from stat IDs and leaves ambiguity unresolved', () => {
    const life = allTechnicalAffixes.find(item => item.statLines.some(line => line.statId === 'base_maximum_life'))!
    expect(classifyTechnicalAffix(life)).toMatchObject({ tags: expect.arrayContaining(['defensive']) })
    expect(classifyTechnicalAffix({ ...life, statLines: [{ ...life.statLines[0], statId: 'unknown_semantic_stat' }] })).toEqual({ tags: [], evidence: 'unresolved' })
  })

  it('separates exact, ambiguous and unresolved PoB2 text evidence', () => {
    const base = { slot: 'ring', itemCategory: 'ring', requiredLevel: null, variants: [] }
    expect(classifyPob2Unique({ ...base, visibleModifiers: [{ sourceLineId: 'a', normalizedPlannerLine: '+20% to Fire Resistance' }] }).evidence).toBe('text-pattern-exact')
    expect(classifyPob2Unique({ ...base, visibleModifiers: [{ sourceLineId: 'a', normalizedPlannerLine: '20% increased Damage' }] }).evidence).toBe('text-pattern-ambiguous')
    expect(classifyPob2Unique({ ...base, visibleModifiers: [{ sourceLineId: 'a', normalizedPlannerLine: 'A complex unsupported mechanic' }] }).tags).toEqual([])
  })

  it('uses only common variant lines for item-wide semantics', () => {
    const semantics = classifyPob2Unique({
      slot: 'weapon', itemCategory: 'bow', requiredLevel: 10,
      variants: [{ modifierSet: ['common', 'legacy'] }, { modifierSet: ['common', 'current'] }],
      visibleModifiers: [
        { sourceLineId: 'common', normalizedPlannerLine: '20% increased Projectile Speed' },
        { sourceLineId: 'legacy', normalizedPlannerLine: '30% increased Fire Damage' },
      ],
    })
    expect(semantics.tags).toContain('projectile')
    expect(semantics.tags).not.toContain('fire')
    expect(semantics.requiredWeaponTypes).toEqual(['ranged-weapon'])
  })

  it('adds productive semantics without inventing GGG IDs', () => {
    expect(pob2UniqueAnalyzerCandidates).toHaveLength(product.recordCount)
    expect(pob2UniqueAnalyzerCandidates.some(item => item.tags.length > 0)).toBe(true)
    expect(pob2UniqueAnalyzerCandidates.every(item => !('gggModId' in item) && !('gggStatId' in item))).toBe(true)
    expect(pob2UniqueAnalyzerCandidates.flatMap(item => item.variantSemantics ?? [])).toHaveLength(product.variantCount)
  })

  it('remains deterministic', () => {
    const input = { character: { ...initialCharacter, desiredMainSkillId: 'skill-spark' }, equipment: initialEquipment, setups: skillSetups }
    expect(runBuildAssistantV1(input)).toEqual(runBuildAssistantV1(input))
  })
})
