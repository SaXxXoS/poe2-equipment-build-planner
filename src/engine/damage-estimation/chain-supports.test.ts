import { describe, expect, it } from 'vitest'
import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain/skills'
import { applyChainHitDamageMultiplier, resolveChainSupports } from './chain-supports'

const support = (id: string, nameEn = 'Chain I'): SupportGemDefinition => ({ id, nameEn, displayNameDe: 'Verkettung I', tags: [], requiredTags: [], excludedTags: [], ownTags: [], dataVersion: 'test', source: 'local-placeholder', status: 'verified' })
const setup = (ids: string[]): SkillSetup => ({ id: 'main', skillId: 'skill', role: 'main', weaponSet: 'set-1', supportGemIds: ids })
const compatibleSkill = reference.skills.find(value => value.skillTypes.includes('Chains') && value.skillTypes.includes('Projectile') && !value.skillTypes.includes('CannotChain') && !value.skillTypes.includes('ProjectileNoCollision'))!
const incompatibleSkill = reference.skills.find(value => !value.skillTypes.includes('Chains'))!

describe('strukturierter Verkettungs-Support', () => {
  it('wendet Trefferfaktor und zusätzliche Verkettung getrennt an', () => {
    const definition = support('chain')
    const model = resolveChainSupports({ skill: compatibleSkill, setup: setup([definition.id]), supports: [definition] })
    expect(model).toMatchObject({ status: 'applied', hitDamageMultiplier: .7, additionalChains: 1, singleTargetHitMultiplier: 1 })
    expect(applyChainHitDamageMultiplier([{ type: 'lightning', minimum: 100, maximum: 200 }], model)).toEqual([{ type: 'lightning', minimum: 70, maximum: 140 }])
  })
  it('blockiert eine inkompatible Fertigkeit', () => {
    const definition = support('chain')
    expect(resolveChainSupports({ skill: incompatibleSkill, setup: setup([definition.id]), supports: [definition] })).toMatchObject({ status: 'blocked-incompatible-skill', hitDamageMultiplier: 1, additionalChains: 0 })
  })
  it('blockiert mehrere Stufen derselben Familie', () => {
    const first = support('first', 'Chain I'), second = support('second', 'Chain III')
    expect(resolveChainSupports({ skill: compatibleSkill, setup: setup([first.id, second.id]), supports: [first, second] })).toMatchObject({ status: 'blocked-duplicate-family', blockedSupportIds: ['first', 'second'] })
  })
})

