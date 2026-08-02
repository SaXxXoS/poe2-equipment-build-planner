import { describe, expect, it } from 'vitest'
import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain'
import { resolveSkillEffectDurationSupports } from './skill-effect-duration-supports'

const skill = (name: string) => {
  const value = reference.skills.find(candidate => candidate.name === name)
  if (!value) throw new Error(`Testreferenz fehlt: ${name}`)
  return value
}
const support = (id: string, nameEn: string): SupportGemDefinition => ({
  id, nameEn, displayNameDe: nameEn, tags: [], requiredTags: [], excludedTags: [], ownTags: [],
  dataVersion: 'test', source: 'local-placeholder', status: 'verified',
})
const setup = (supportGemIds: string[]): SkillSetup => ({
  id: 'duration-setup', skillId: 'flame-wall', role: 'main', weaponSet: 'set-1', supportGemIds,
})

describe('PoB2-Wirkungsdauer-Supports', () => {
  it('wendet verkürzte und verlängerte Dauer aus strukturierten Werten an', () => {
    const compressed = support('compressed', 'Compressed Duration I')
    const prolonged = support('prolonged', 'Prolonged Duration II')
    const result = resolveSkillEffectDurationSupports({
      skill: skill('Flame Wall'), setup: setup([compressed.id, prolonged.id]), supports: [compressed, prolonged],
    })
    expect(result.status).toBe('applied')
    expect(result.durationMultiplier).toBeCloseTo(0.945, 6)
    expect(result.appliedSupports.map(value => value.finalDurationPercent)).toEqual([-30, 35])
  })

  it('blockiert mehrere Stufen derselben Supportfamilie fail-closed', () => {
    const first = support('compressed-i', 'Compressed Duration I')
    const second = support('compressed-ii', 'Compressed Duration II')
    const result = resolveSkillEffectDurationSupports({
      skill: skill('Flame Wall'), setup: setup([first.id, second.id]), supports: [first, second],
    })
    expect(result).toMatchObject({status: 'blocked-duplicate-family', durationMultiplier: 1})
    expect(result.blockedSupportIds).toEqual([first.id, second.id])
  })

  it('wendet Dauer-Supports nicht auf Fertigkeiten ohne Duration-Typ an', () => {
    const prolonged = support('prolonged', 'Prolonged Duration I')
    const result = resolveSkillEffectDurationSupports({
      skill: skill('Arc'), setup: setup([prolonged.id]), supports: [prolonged],
    })
    expect(result).toMatchObject({status: 'blocked-incompatible-skill', durationMultiplier: 1})
  })
})
