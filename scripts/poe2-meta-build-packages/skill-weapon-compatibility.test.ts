import { describe, expect, it } from 'vitest'
import catalog from '../../generated/poe2-gems/catalog.json'
import {
  classifySkillWeaponPair,
  exactRequiredWeaponTypes,
} from './skill-weapon-compatibility.mjs'

describe('meta profile skill/weapon compatibility', () => {
  it('accepts only the exact locally required weapon for weapon-bound skills', () => {
    expect(classifySkillWeaponPair('Ice Shot', 'bow', catalog.skills)).toMatchObject({
      status: 'structured-exact-compatible',
      productive: true,
      requiredWeaponTypes: ['bow'],
    })
    expect(classifySkillWeaponPair('Ice Shot', 'wand', catalog.skills)).toMatchObject({
      status: 'blocked-incompatible-weapon',
      productive: false,
    })
  })

  it('keeps unrestricted spells audit-only because a profile-wide weapon is no set link', () => {
    expect(classifySkillWeaponPair('Spark', 'wand', catalog.skills)).toMatchObject({
      status: 'unresolved-no-exact-weapon-requirement',
      productive: false,
      requiredWeaponTypes: [],
    })
  })

  it('blocks mismatched exact weapon classes and unknown skills', () => {
    expect(classifySkillWeaponPair('Flicker Strike', 'quarterstaff', catalog.skills).productive).toBe(true)
    expect(classifySkillWeaponPair('Flicker Strike', 'spear', catalog.skills).productive).toBe(false)
    expect(classifySkillWeaponPair('Nicht vorhanden', 'bow', catalog.skills)).toMatchObject({
      status: 'unresolved-skill',
      productive: false,
    })
  })

  it('extracts only exact weapon crafting types', () => {
    const spark = catalog.skills.find(value => value.nameEn === 'Spark')
    const iceShot = catalog.skills.find(value => value.nameEn === 'Ice Shot')
    expect(exactRequiredWeaponTypes(spark)).toEqual([])
    expect(exactRequiredWeaponTypes(iceShot)).toEqual(['bow'])
  })
})
