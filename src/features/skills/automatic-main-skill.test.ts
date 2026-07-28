import { describe, expect, it } from 'vitest'
import type { SkillGemDefinition } from '../../domain'
import { initialEquipment } from '../../data'
import { createEmptySkillSetups } from './initial-state'
import { selectAutomaticMainSkill } from './automatic-main-skill'

const definition = (id: string, tags: SkillGemDefinition['tags']): SkillGemDefinition => ({
  id,
  displayNameDe: id,
  nameEn: id,
  dataVersion: 'test',
  source: 'local-placeholder',
  status: 'placeholder',
  tags,
  enabled: true,
})
const candidate = (skillId: string) => ({ skillId, damageScore: 0, totalScore: 0 })

describe('Automatische Hauptskillwahl', () => {
  it('erzeugt für Sturmweberin und Titan unterschiedliche, passende Hauptskills', () => {
    const definitions = [
      definition('lightning-spell', ['spell', 'lightning']),
      definition('physical-melee', ['attack', 'melee', 'physical']),
    ]
    const common = {
      candidates: definitions.map(value => candidate(value.id)),
      definitions,
      equipment: initialEquipment,
      setups: createEmptySkillSetups(),
    }
    expect(selectAutomaticMainSkill({
      ...common,
      classId: 'class-official-7',
      ascendancyId: 'ascendancy-official-Sorceress1',
    })?.skillId).toBe('lightning-spell')
    expect(selectAutomaticMainSkill({
      ...common,
      classId: 'class-official-6',
      ascendancyId: 'ascendancy-official-Warrior1',
    })?.skillId).toBe('physical-melee')
  })

  it('stellt eine sicher nicht deckbare Geistreservierung nicht vor eine nutzbare Alternative', () => {
    const blocked = definition('blocked-spirit', ['spell', 'lightning'])
    blocked.spiritReservation = 200
    const usable = definition('usable-skill', ['spell', 'lightning'])
    expect(selectAutomaticMainSkill({
      candidates: [
        { skillId: blocked.id, damageScore: 100, totalScore: 100 },
        { skillId: usable.id, damageScore: 10, totalScore: 10 },
      ],
      definitions: [blocked, usable],
      equipment: initialEquipment,
      setups: createEmptySkillSetups(),
      classId: 'class-official-7',
      ascendancyId: 'ascendancy-official-Sorceress1',
      characterLevel: 100,
    })?.skillId).toBe(usable.id)
  })
})
