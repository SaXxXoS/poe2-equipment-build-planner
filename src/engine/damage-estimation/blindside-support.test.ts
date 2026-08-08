import { describe, expect, it } from 'vitest'
import type { SkillSetup, SupportGemDefinition } from '../../domain/skills'
import { resolveBlindsideSupport } from './blindside-support'

type NumericSkill = Parameters<typeof resolveBlindsideSupport>[0]['skill']
const skill = { id: 'crossbow-shot', name: 'Crossbow Shot', skillTypes: ['Attack', 'Damage', 'CrossbowSkill'] } as unknown as NumericSkill
const support: SupportGemDefinition = { id: 'blindside', nameEn: 'Blindside', displayNameDe: 'Flankenangriff' } as SupportGemDefinition
const setup: SkillSetup = { id: 'crossbow-setup', skillId: 'crossbow-shot', role: 'main', weaponSet: 'set-1', supportGemIds: ['blindside'] }

describe('Blindside-Unterstützung', () => {
  it('wendet beide kritischen Multiplikatoren nur gegen ein bestätigt geblendetes Ziel an', () => {
    expect(resolveBlindsideSupport({ skill, setup, supports: [support], enemyProfile: { id: 'blind', label: 'Geblendet', source: 'manual-comparison-profile', blinded: true } })).toMatchObject({
      status: 'applied', criticalChanceMultiplier: 1.15, criticalDamageBonusMultiplier: 1.15,
    })
    expect(resolveBlindsideSupport({ skill, setup, supports: [support], enemyProfile: { id: 'not-blind', label: 'Nicht geblendet', source: 'manual-comparison-profile', blinded: false } })).toMatchObject({ status: 'inactive-enemy-not-blinded', criticalChanceMultiplier: 1, criticalDamageBonusMultiplier: 1 })
  })

  it('blockiert unbekannten Blindzustand, inkompatible Skills und doppelte Familien', () => {
    expect(resolveBlindsideSupport({ skill, setup, supports: [support] }).status).toBe('blocked-unknown-enemy-blind-state')
    expect(resolveBlindsideSupport({ skill: { ...skill, skillTypes: ['Spell', 'Damage'] }, setup, supports: [support], enemyProfile: { id: 'blind', label: 'Geblendet', source: 'manual-comparison-profile', blinded: true } }).status).toBe('blocked-incompatible-skill')
    expect(resolveBlindsideSupport({ skill, setup: { ...setup, supportGemIds: ['blindside', 'blindside-2'] }, supports: [support, { ...support, id: 'blindside-2' }], enemyProfile: { id: 'blind', label: 'Geblendet', source: 'manual-comparison-profile', blinded: true } }).status).toBe('blocked-duplicate-family')
  })
})
