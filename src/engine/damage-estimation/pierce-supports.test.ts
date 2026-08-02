import { describe, expect, it } from 'vitest'
import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain'
import { resolvePierceSupports } from './pierce-supports'

const support = (id: string, nameEn: string): SupportGemDefinition => ({
  id, nameEn, displayNameDe: nameEn, tags: [], requiredTags: [], excludedTags: [], ownTags: [],
  dataVersion: 'test', source: 'local-placeholder', status: 'verified',
})
const setup = (ids: string[]): SkillSetup => ({ id: 'setup', skillId: 'skill', role: 'main', weaponSet: 'set-1', supportGemIds: ids })
const spark = reference.skills.find(value => value.name === 'Spark')!
const freezingSalvo = reference.skills.find(value => value.name === 'Freezing Salvo')!

describe('PoB2-Durchbohrungsunterstützungen', () => {
  it('modelliert Pierce I als 100 Prozent Chance mit Nachteil nur nach dem Durchbohren', () => {
    const definition = support('pierce-i', 'Pierce I')
    expect(resolvePierceSupports({ skill: spark, setup: setup([definition.id]), supports: [definition] })).toMatchObject({
      status: 'applied', chanceToPiercePercent: 100, postPierceDamageMultiplier: 0.8, singleTargetHitMultiplier: 1,
    })
  })

  it('modelliert Projectile Acceleration II als 40 Prozent Chance ohne erfundenen Trefferzähler', () => {
    const definition = support('acceleration-ii', 'Projectile Acceleration II')
    expect(resolvePierceSupports({ skill: spark, setup: setup([definition.id]), supports: [definition] })).toMatchObject({
      status: 'applied', chanceToPiercePercent: 40, postPierceDamageMultiplier: 1, singleTargetHitMultiplier: 1,
    })
  })

  it('blockiert ProjectileNoCollision fail-closed', () => {
    const definition = support('pierce-i', 'Pierce I')
    expect(resolvePierceSupports({ skill: freezingSalvo, setup: setup([definition.id]), supports: [definition] })).toMatchObject({
      status: 'blocked-incompatible-skill', chanceToPiercePercent: 0, blockedSupportIds: ['pierce-i'],
    })
  })

  it('blockiert mehrere Stufen derselben Familie', () => {
    const first = support('pierce-i', 'Pierce I')
    const second = support('pierce-ii', 'Pierce II')
    expect(resolvePierceSupports({ skill: spark, setup: setup([first.id, second.id]), supports: [first, second] })).toMatchObject({
      status: 'blocked-duplicate-family', chanceToPiercePercent: 0, blockedSupportIds: ['pierce-i', 'pierce-ii'],
    })
  })
})
