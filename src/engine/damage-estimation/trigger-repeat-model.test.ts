import { describe, expect, it } from 'vitest'
import type { SkillGemDefinition, SkillSetup } from '../../domain'
import { resolveTriggerRepeatModel } from './trigger-repeat-model'

const skill = (id: string, nameEn: string): SkillGemDefinition => ({
  id, displayNameDe: nameEn, nameEn, tags: [], dataVersion: 'test', source: 'local-placeholder', status: 'verified',
})
const setup = (skillId: string, role: SkillSetup['role'] = 'secondary'): SkillSetup => ({
  id: `setup:${skillId}`, skillId, role, weaponSet: 'both', supportGemIds: [],
})

describe('Trigger- und Wiederholungsmodell', () => {
  it('blockiert eine eingebaute Triggerfertigkeit ohne belegte Auslöserkette', () => {
    const primary = skill('blood-explosion', 'Blood Explosion')
    const result = resolveTriggerRepeatModel({ primarySkill: primary, setups: [setup(primary.id, 'main')], skills: [primary] })
    expect(result.primarySkillTriggered).toBe(true)
    expect(result.productive).toBe(false)
    expect(result.sources[0]).toMatchObject({ kind: 'inbuilt-trigger', status: 'blocked-missing-trigger-source' })
  })

  it('erkennt Triggerable allein nicht als aktive Auslösung', () => {
    const primary = skill('arc', 'Arc')
    const result = resolveTriggerRepeatModel({ primarySkill: primary, setups: [setup(primary.id, 'main')], skills: [primary] })
    expect(result.primarySkillTriggered).toBe(false)
    expect(result.sources).toEqual([])
  })

  it('weist bei Cast on Critical die Bedingung aus, blockiert aber fehlendes Ziel und Intervall', () => {
    const primary = skill('arc', 'Arc')
    const trigger = skill('coc', 'Cast on Critical')
    const result = resolveTriggerRepeatModel({
      primarySkill: primary, setups: [setup(primary.id, 'main'), setup(trigger.id)], skills: [primary, trigger],
    })
    expect(result.sources[0]).toMatchObject({
      sourceSkillId: 'coc', kind: 'meta-trigger', condition: 'bei einem kritischen Treffer', status: 'blocked-missing-target',
    })
  })

  it('verwendet einen Energiebonus nicht als Triggerfrequenz', () => {
    const primary = skill('arc', 'Arc')
    const trigger = skill('invocation', 'Elemental Invocation')
    const result = resolveTriggerRepeatModel({
      primarySkill: primary, setups: [setup(primary.id, 'main'), setup(trigger.id)], skills: [primary, trigger],
    })
    expect(result.sources[0].intervalMs).toBeUndefined()
    expect(result.productive).toBe(false)
  })

  it('liefert bei identischer Eingabe ein identisches Ergebnis', () => {
    const primary = skill('blood-explosion', 'Blood Explosion')
    const input = { primarySkill: primary, setups: [setup(primary.id, 'main')], skills: [primary] }
    expect(resolveTriggerRepeatModel(input)).toEqual(resolveTriggerRepeatModel(input))
  })
})
