import { describe, expect, it } from 'vitest'
import type { SkillGemDefinition } from '../../domain'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'
import { resolveMultipleDamageEffect } from './multiple-damage-effects'

const skill = (tags: string[]): SkillGemDefinition => ({
  id: 'skill',
  displayNameDe: 'Test',
  nameEn: 'Test',
  tags: tags as SkillGemDefinition['tags'],
  damageTypes: tags.filter(value => ['physical', 'fire', 'cold', 'lightning', 'chaos'].includes(value)) as SkillGemDefinition['damageTypes'],
  dataVersion: 'test',
  source: 'local-placeholder',
  status: 'verified',
})
const tree = {
  metadata: { releaseTag: 'test' },
  connections: [],
  nodes: [
    { id: 'double', name: { sourceText: 'Double' }, stats: [{ sourceText: '20% chance to deal Double Damage' }], nodeType: 'normal', isClassStart: false, classStartIndex: null, isAscendancyStart: false, ascendancyId: null, isJewelSocket: false },
    { id: 'triple', name: { sourceText: 'Triple' }, stats: [{ sourceText: '10% chance to deal Triple Damage' }], nodeType: 'normal', isClassStart: false, classStartIndex: null, isAscendancyStart: false, ascendancyId: null, isJewelSocket: false },
    { id: 'crit', name: { sourceText: 'Critical' }, stats: [{ sourceText: 'Your Critical Hits have a 50% chance to deal Double Damage' }], nodeType: 'normal', isClassStart: false, classStartIndex: null, isAscendancyStart: false, ascendancyId: null, isJewelSocket: false },
    { id: 'elemental', name: { sourceText: 'Elemental' }, stats: [{ sourceText: 'Elemental Skills deal Triple Damage' }], nodeType: 'normal', isClassStart: false, classStartIndex: null, isAscendancyStart: false, ascendancyId: null, isJewelSocket: false },
    { id: 'conditional', name: { sourceText: 'Conditional' }, stats: [{ sourceText: '20% chance to deal Double Damage while Focused' }], nodeType: 'normal', isClassStart: false, classStartIndex: null, isAscendancyStart: false, ascendancyId: null, isJewelSocket: false },
  ],
} as RealPassiveTree
const planning = (ids: string[]) => ({
  pipelineResult: { allocatedNodeIds: ids },
}) as unknown as RealPassivePlanningIntegrationResult

describe('Doppel- und Dreifachschaden', () => {
  it('bildet die PoB2-Überlappungsreihenfolge im Erwartungswert ab', () => {
    const result = resolveMultipleDamageEffect({
      passiveTree: tree,
      planning: planning(['double', 'triple']),
      weaponSet: 'set-1',
      skill: skill(['attack', 'physical']),
    })
    expect(result).toMatchObject({
      doubleDamageChancePercent: 20,
      tripleDamageChancePercent: 10,
      effectiveDoubleDamageChancePercent: 18,
      expectedDamageMultiplier: 1.38,
    })
  })

  it('gewichtet eine exakt belegte Krit-Bedingung mit der effektiven Kritchance', () => {
    expect(resolveMultipleDamageEffect({
      passiveTree: tree,
      planning: planning(['crit']),
      weaponSet: 'set-1',
      skill: skill(['spell', 'lightning']),
      criticalChancePercent: 40,
    })).toMatchObject({
      doubleDamageChancePercent: 20,
      expectedDamageMultiplier: 1.2,
    })
  })

  it('wendet garantierten Elementar-Dreifachschaden nur auf Elementarfertigkeiten an', () => {
    expect(resolveMultipleDamageEffect({
      passiveTree: tree,
      planning: planning(['elemental']),
      weaponSet: 'set-1',
      skill: skill(['spell', 'lightning']),
    }).expectedDamageMultiplier).toBe(3)
    expect(resolveMultipleDamageEffect({
      passiveTree: tree,
      planning: planning(['elemental']),
      weaponSet: 'set-1',
      skill: skill(['attack', 'physical']),
    }).expectedDamageMultiplier).toBe(1)
  })

  it('ignoriert nicht modellierte Bedingungen fail-closed', () => {
    expect(resolveMultipleDamageEffect({
      passiveTree: tree,
      planning: planning(['conditional']),
      weaponSet: 'set-1',
      skill: skill(['attack', 'physical']),
    }).sources).toEqual([])
  })
})
