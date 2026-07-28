import { describe, expect, it } from 'vitest'
import type { SkillSetup } from '../../domain'
import { buildAssistantCandidates, createBuildAssistantRequest } from '../build-assistant-v1'
import { compatibleEmbeddedSkills, ensureRequiredEmbeddedSkill, supportCapacityFor } from './meta-skills'

const byName = (name: string) => buildAssistantCandidates.skills.find(value => value.nameEn === name)!

describe('Meta-Fertigkeiten', () => {
  it('erkennt Zaubern bei elementarer Beeinträchtigung als Container für elementare Zauber', () => {
    const meta = byName('Cast on Elemental Ailment')
    const candidates = compatibleEmbeddedSkills(meta, buildAssistantCandidates.skills)
    expect(meta.metaSocketRule).toBe('spell')
    expect(candidates.length).toBeGreaterThan(0)
    expect(candidates.every(value => value.tags.includes('spell'))).toBe(true)
    expect(candidates.every(value => value.tags.some(tag => ['fire', 'cold', 'lightning'].includes(tag)))).toBe(true)
  })

  it('setzt automatisch eine eingebettete Fertigkeit ein und reduziert die Supportplätze', () => {
    const setup: SkillSetup = {
      id: 'meta',
      skillId: byName('Cast on Elemental Ailment').id,
      role: 'utility',
      weaponSet: 'both',
      supportGemIds: ['a', 'b', 'c', 'd', 'e'],
    }
    const filled = ensureRequiredEmbeddedSkill(setup, buildAssistantCandidates.skills)
    expect(filled.embeddedSkillIds).toHaveLength(1)
    expect(filled.supportGemIds).toEqual(['a', 'b', 'c', 'd'])
    expect(supportCapacityFor(filled)).toBe(4)
  })

  it('behandelt Meta-Fertigkeiten ohne Trigger-Tag nicht als auslösenden Skillcontainer', () => {
    expect(byName('Hand of Chayula').metaSocketRule).toBeUndefined()
  })

  it('transportiert eingebettete Fertigkeiten als eigene Analyzer-Eingaben', () => {
    const meta = byName('Elemental Invocation')
    const embedded = compatibleEmbeddedSkills(meta, buildAssistantCandidates.skills)[0]
    const request = createBuildAssistantRequest({
      character: { classId: 'class-official-6', ascendancyId: '', level: 80, goalProfile: 'balanced' },
      equipment: [],
      setups: [{
        id: 'invocation',
        skillId: meta.id,
        role: 'utility',
        weaponSet: 'both',
        supportGemIds: [],
        embeddedSkillIds: [embedded.id],
      }],
    })
    expect(request.input.skillSetups).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'invocation', skillId: meta.id }),
      expect.objectContaining({ id: 'invocation:embedded:1', skillId: embedded.id, role: 'secondary' }),
    ]))
  })
})
