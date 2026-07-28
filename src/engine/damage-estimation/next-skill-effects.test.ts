import { describe, expect, it } from 'vitest'
import type { SkillGemDefinition, SkillSetup } from '../../domain'
import type { RotationAnalysis } from '../common/types'
import { resolveNextSkillEffects } from './next-skill-effects'

const skill = (
  id: string,
  nameEn: string,
  options: Partial<SkillGemDefinition> = {},
): SkillGemDefinition => ({
  id,
  nameEn,
  displayNameDe: nameEn,
  tags: [],
  dataVersion: 'test',
  source: 'local-placeholder',
  status: 'verified',
  ...options,
})

const setup = (id: string, skillId: string, role: SkillSetup['role']): SkillSetup => ({
  id,
  skillId,
  role,
  weaponSet: 'set-1',
  supportGemIds: [],
})

const rotation = (...skillIds: string[]) => ({
  bossRotation: {
    steps: skillIds.map((skillId, index) => ({
      stepId: `step-${index}`,
      order: index + 1,
      actionType: 'use-skill',
      skillId,
    })),
  },
}) as unknown as RotationAnalysis

describe('vorbereitete Folgeangriffswirkungen', () => {
  it('wendet Emergency Reload nur auf den unmittelbar folgenden Armbrustangriff an', () => {
    const main = skill('main', 'Explosive Shot', { tags: ['attack'], requiredWeaponTypes: ['crossbow'] })
    const reload = skill('reload', 'Emergency Reload')
    const result = resolveNextSkillEffects({
      components: [{ type: 'physical', minimum: 100, maximum: 200 }],
      setups: [setup('reload-setup', reload.id, 'utility'), setup('main-setup', main.id, 'main')],
      skills: [reload, main],
      mainSkill: main,
      rotationAnalysis: rotation(reload.id, main.id),
    })
    expect(result.appliedEffects).toEqual([expect.objectContaining({
      sourceId: reload.id,
      targetSkillId: main.id,
      percent: 31,
      status: 'prepared-next-hit',
    })])
    expect(result.components).toEqual([{ type: 'physical', minimum: 131, maximum: 262 }])
  })

  it('verändert ohne direkte Reihenfolge keinen Treffer', () => {
    const main = skill('main', 'Explosive Shot', { tags: ['attack'], requiredWeaponTypes: ['crossbow'] })
    const reload = skill('reload', 'Emergency Reload')
    const other = skill('other', 'Armour Breaker')
    const result = resolveNextSkillEffects({
      components: [{ type: 'physical', minimum: 100, maximum: 200 }],
      setups: [setup('reload-setup', reload.id, 'utility'), setup('other-setup', other.id, 'utility'), setup('main-setup', main.id, 'main')],
      skills: [reload, other, main],
      mainSkill: main,
      rotationAnalysis: rotation(reload.id, other.id, main.id),
    })
    expect(result.appliedEffects).toHaveLength(0)
    expect(result.blockedEffects[0].detail).toContain('nicht lückenlos')
    expect(result.components).toEqual([{ type: 'physical', minimum: 100, maximum: 200 }])
  })

  it('blockiert Emergency Reload für eine Hauptfertigkeit ohne Armbrustanforderung', () => {
    const main = skill('main', 'Arc', { tags: ['spell'] })
    const reload = skill('reload', 'Emergency Reload')
    const result = resolveNextSkillEffects({
      components: [{ type: 'lightning', minimum: 10, maximum: 20 }],
      setups: [setup('reload-setup', reload.id, 'utility'), setup('main-setup', main.id, 'main')],
      skills: [reload, main],
      mainSkill: main,
      rotationAnalysis: rotation(reload.id, main.id),
    })
    expect(result.appliedEffects).toHaveLength(0)
    expect(result.blockedEffects[0].detail).toContain('nur für einen Armbrustangriff')
  })

  it('identifiziert bei Infernal Cry den Folgeangriff, erfindet ohne Warcry-Power aber keine Exertion', () => {
    const main = skill('main', 'Sunder', { tags: ['attack'], requiredWeaponTypes: ['mace'] })
    const cry = skill('cry', 'Infernal Cry')
    const result = resolveNextSkillEffects({
      components: [{ type: 'physical', minimum: 100, maximum: 100 }],
      setups: [setup('cry-setup', cry.id, 'utility'), setup('main-setup', main.id, 'main')],
      skills: [cry, main],
      mainSkill: main,
      rotationAnalysis: rotation(cry.id, main.id),
    })
    expect(result.appliedEffects).toHaveLength(0)
    expect(result.blockedEffects[0]).toMatchObject({ percent: 49, status: 'blocked' })
    expect(result.blockedEffects[0].detail).toContain('Warcry-Power')
  })

  it('blockiert Mantra of Destruction ohne belegten Comboaufbau und Verbrauch', () => {
    const main = skill('main', 'Quarterstaff Attack', { tags: ['attack'], requiredWeaponTypes: ['quarterstaff'] })
    const mantra = skill('mantra', 'Mantra of Destruction')
    const result = resolveNextSkillEffects({
      components: [{ type: 'physical', minimum: 100, maximum: 100 }],
      setups: [setup('mantra-setup', mantra.id, 'utility'), setup('main-setup', main.id, 'main')],
      skills: [mantra, main],
      mainSkill: main,
      rotationAnalysis: rotation(mantra.id, main.id),
    })
    expect(result.blockedEffects[0]).toMatchObject({ percent: 69, status: 'blocked' })
    expect(result.blockedEffects[0].detail).toContain('Comboaufbau')
  })
})
