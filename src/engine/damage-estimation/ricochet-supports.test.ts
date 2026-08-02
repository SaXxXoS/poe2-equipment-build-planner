import { describe, expect, it } from 'vitest'
import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain'
import { resolveRicochetSupports } from './ricochet-supports'

const support = (id: string, nameEn: string): SupportGemDefinition => ({
  id, nameEn, displayNameDe: nameEn, tags: [], requiredTags: [], excludedTags: [], ownTags: [],
  dataVersion: 'test', source: 'local-placeholder', status: 'verified',
})
const setup = (ids: string[]): SkillSetup => ({ id: 'setup', skillId: 'skill', role: 'main', weaponSet: 'set-1', supportGemIds: ids })
const spark = reference.skills.find(value => value.name === 'Spark')!
const volcanicEruption = reference.skills.find(value => value.name === 'Volcanic Eruption')!

describe('PoB2-Abprallunterstützungen', () => {
  it('modelliert Ricochet I als bedingte Terrain-Abdeckung', () => {
    const ricochet = support('ricochet-i', 'Ricochet I')
    expect(resolveRicochetSupports({ skill: spark, setup: setup([ricochet.id]), supports: [ricochet] })).toMatchObject({
      status: 'applied-coverage-only', terrainChainChancePercent: 40, additionalTerrainChainsOnSuccess: 1, singleTargetHitMultiplier: 1,
    })
  })

  it('modelliert Ricochet II mit 50 Prozent', () => {
    const ricochet = support('ricochet-ii', 'Ricochet II')
    expect(resolveRicochetSupports({ skill: spark, setup: setup([ricochet.id]), supports: [ricochet] })).toMatchObject({
      status: 'applied-coverage-only', terrainChainChancePercent: 50,
    })
  })

  it('blockiert CannotChain fail-closed', () => {
    const ricochet = support('ricochet-i', 'Ricochet I')
    expect(resolveRicochetSupports({ skill: volcanicEruption, setup: setup([ricochet.id]), supports: [ricochet] })).toMatchObject({
      status: 'blocked-incompatible-skill', terrainChainChancePercent: 0, blockedSupportIds: ['ricochet-i'],
    })
  })

  it('blockiert mehrere Stufen derselben Familie', () => {
    const first = support('ricochet-i', 'Ricochet I')
    const second = support('ricochet-ii', 'Ricochet II')
    expect(resolveRicochetSupports({ skill: spark, setup: setup([first.id, second.id]), supports: [first, second] })).toMatchObject({
      status: 'blocked-duplicate-family', blockedSupportIds: ['ricochet-i', 'ricochet-ii'],
    })
  })
})
