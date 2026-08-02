import { describe, expect, it } from 'vitest'
import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain'
import { resolveForkSupports } from './fork-supports'

const support = (id: string, nameEn: string): SupportGemDefinition => ({
  id, nameEn, displayNameDe: nameEn, tags: [], requiredTags: [], excludedTags: [], ownTags: [],
  dataVersion: 'test', source: 'local-placeholder', status: 'verified',
})
const setup = (ids: string[]): SkillSetup => ({ id: 'setup', skillId: 'skill', role: 'main', weaponSet: 'set-1', supportGemIds: ids })
const spark = reference.skills.find(value => value.name === 'Spark')!
const freezingSalvo = reference.skills.find(value => value.name === 'Freezing Salvo')!

describe('PoB2-Gabelungsunterstützungen', () => {
  it('modelliert Fork mit Folgeschaden, aber ohne erfundenen Einzelzieltreffer', () => {
    const fork = support('fork', 'Fork')
    expect(resolveForkSupports({ skill: spark, setup: setup([fork.id]), supports: [fork] })).toMatchObject({
      status: 'applied-coverage-only', forkEnabled: true, forkedProjectileDamageMultiplier: 0.7, singleTargetHitMultiplier: 1,
    })
  })

  it('blockiert ProjectileNoCollision fail-closed', () => {
    const fork = support('fork', 'Fork')
    expect(resolveForkSupports({ skill: freezingSalvo, setup: setup([fork.id]), supports: [fork] })).toMatchObject({
      status: 'blocked-incompatible-skill', forkEnabled: false, blockedSupportIds: ['fork'],
    })
  })

  it('blockiert doppelte Gemmenfamilien', () => {
    const first = support('fork-a', 'Fork')
    const second = support('fork-b', 'Fork')
    expect(resolveForkSupports({ skill: spark, setup: setup([first.id, second.id]), supports: [first, second] })).toMatchObject({
      status: 'blocked-duplicate-family', forkEnabled: false, blockedSupportIds: ['fork-a', 'fork-b'],
    })
  })
})
