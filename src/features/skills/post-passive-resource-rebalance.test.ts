import { describe, expect, it } from 'vitest'
import type { SkillGemDefinition, SkillSetup, SupportGemDefinition } from '../../domain'
import {
  rebalanceSupportsAfterPassivePlanning,
  summarizePostPassiveResourceRisk,
} from './post-passive-resource-rebalance'

const skill: SkillGemDefinition = {
  id: 'skill-main',
  nameEn: 'Ancestral Cry',
  displayNameDe: 'Ahnenschrei',
  dataVersion: 'test',
  source: 'local-placeholder',
  status: 'placeholder',
  tags: ['buff'],
  enabled: true,
}
const support = (id: string, multiplier: number): SupportGemDefinition => ({
  id,
  displayNameDe: id,
  dataVersion: 'test',
  source: 'local-placeholder',
  status: 'placeholder',
  tags: [],
  requiredTags: [],
  excludedTags: [],
  ownTags: [],
  costMultiplierPercent: multiplier,
})
const costly = support('costly', 300)
const efficient = support('efficient', 100)
const setup = (origin: SkillSetup['origin']): SkillSetup => ({
  id: 'setup-main',
  skillId: skill.id,
  role: 'main',
  weaponSet: 'set-1',
  origin,
  supportGemIds: [costly.id],
})
const planning = {
  pipelineResult: { allocatedNodeIds: [] },
  ascendancyPlanning: { allocatedNodeIds: [] },
} as never
const tree = { metadata: { releaseTag: 'test' }, nodes: [], connections: [] } as never

describe('Ressourcen-Nachprüfung nach dem realen Passivplan', () => {
  it('ersetzt nur eine automatisch erzeugte, nachweislich schlechter tragbare Supportkombination', () => {
    const result = rebalanceSupportsAfterPassivePlanning({
      equipment: [],
      setups: [setup('recommended')],
      skills: [skill],
      supports: [costly, efficient],
      rankedSupports: [
        { skillId: skill.id, supportId: costly.id },
        { skillId: skill.id, supportId: efficient.id },
      ],
      characterLevel: 1,
      passiveTree: tree,
      realPassivePlanning: planning,
      limit: 1,
    })
    expect(result.adjustedSetupIds).toEqual(['setup-main'])
    expect(result.setups[0].supportGemIds).toEqual(['efficient'])
    expect(result.setups[0].synergyReason).toContain('realen Ressourcenprüfung')
  })

  it('verändert eine manuelle Auswahl auch bei bestätigtem Null-Mana-Konflikt nicht', () => {
    const noManaTree = {
      metadata: { releaseTag: 'test' },
      nodes: [{ id: 'no-mana', stats: [{ sourceText: 'You have no Mana' }] }],
      connections: [],
    } as never
    const noManaPlanning = {
      pipelineResult: { allocatedNodeIds: ['no-mana'] },
      ascendancyPlanning: { allocatedNodeIds: [] },
    } as never
    const manual = setup('manual')
    const result = rebalanceSupportsAfterPassivePlanning({
      equipment: [],
      setups: [manual],
      skills: [skill],
      supports: [costly, efficient],
      rankedSupports: [{ skillId: skill.id, supportId: efficient.id }],
      characterLevel: 20,
      passiveTree: noManaTree,
      realPassivePlanning: noManaPlanning,
      limit: 1,
    })
    expect(result.setups).toEqual([manual])
    expect(result.adjustedSetupIds).toEqual([])
    expect(result.manualConflictSetupIds).toEqual(['setup-main'])
  })

  it('fasst belegte Ressourcenrisiken deterministisch zusammen', () => {
    const noManaTree = {
      metadata: { releaseTag: 'test' },
      nodes: [{ id: 'no-mana', stats: [{ sourceText: 'You have no Mana' }] }],
      connections: [],
    } as never
    const noManaPlanning = {
      pipelineResult: { allocatedNodeIds: ['no-mana'] },
      ascendancyPlanning: { allocatedNodeIds: [] },
    } as never
    const result = summarizePostPassiveResourceRisk({
      equipment: [],
      setups: [setup('manual')],
      skills: [skill],
      supports: [costly],
      characterLevel: 20,
      passiveTree: noManaTree,
      realPassivePlanning: noManaPlanning,
    })
    expect(result.hardConflictSetupIds).toEqual(['setup-main'])
    expect(result.totalPenalty).toBeGreaterThanOrEqual(0)
  })
})
