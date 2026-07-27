import { describe, expect, it } from 'vitest'
import type { SkillGemDefinition, SkillSetup } from '../../domain'
import type { RotationAnalysis } from '../common/types'
import type { RotationStepTiming } from '../rotations/timing'
import { applyTemporalDamageWindow, collectTemporalOffensiveEffects } from './temporal-offensive-effects'

const skill = (id: string, nameEn: string, tags: SkillGemDefinition['tags'] = []): SkillGemDefinition => ({
  id,
  nameEn,
  displayNameDe: nameEn,
  tags,
  dataVersion: 'test',
  source: 'local-placeholder',
  status: 'verified',
})
const setup = (id: string, skillId: string, role: SkillSetup['role']): SkillSetup => ({
  id,
  skillId,
  role,
  weaponSet: 'set-1',
  supportGemIds: [],
})
const rotation = (skillId: string, timing: RotationStepTiming = {
  activationTimeMs: 500,
  effectDurationMs: 9800,
  timingStatus: 'windowed' as const,
  evidence: 'structured-exact' as const,
  sourceReferences: ['castTime', 'base_skill_effect_duration'],
  detail: 'Belegtes Testfenster.',
}): RotationAnalysis => ({
  bossRotation: {
    steps: [{ skillId, activationCondition: 'once', timing }],
  },
} as unknown as RotationAnalysis)

describe('zeitabhängige offensive Wirkungen', () => {
  it('wendet War Banner nur als zeitlich begrenztes Angriffsfenster an', () => {
    const main = skill('main', 'Lightning Arrow', ['attack'])
    const banner = skill('banner', 'War Banner')
    const result = collectTemporalOffensiveEffects({
      setups: [setup('main-setup', main.id, 'main'), setup('banner-setup', banner.id, 'utility')],
      skills: [main, banner],
      mainSkill: main,
      rotationAnalysis: rotation(banner.id),
    })
    expect(result.appliedEffects).toHaveLength(2)
    expect(result.damageMultiplier).toBe(1.25)
    expect(result.actionSpeedMultiplier).toBe(1.25)
    expect(result.appliedEffects.every(effect => effect.durationMs === 9800)).toBe(true)
    expect(applyTemporalDamageWindow([{ type: 'physical', minimum: 10, maximum: 20 }], result.damageMultiplier))
      .toEqual([{ type: 'physical', minimum: 12.5, maximum: 25 }])
  })

  it('blockiert War Banner für eine Zauber-Hauptfertigkeit', () => {
    const main = skill('main', 'Arc', ['spell'])
    const banner = skill('banner', 'War Banner')
    const result = collectTemporalOffensiveEffects({
      setups: [setup('main-setup', main.id, 'main'), setup('banner-setup', banner.id, 'utility')],
      skills: [main, banner],
      mainSkill: main,
      rotationAnalysis: rotation(banner.id),
    })
    expect(result.appliedEffects).toEqual([])
    expect(result.blockedEffects[0]?.detail).toContain('Nicht-Angriffsfertigkeit')
  })

  it('blockiert eine unvollständige Aktivierungs- und Zeitkette', () => {
    const main = skill('main', 'Lightning Arrow', ['attack'])
    const banner = skill('banner', 'War Banner')
    const result = collectTemporalOffensiveEffects({
      setups: [setup('main-setup', main.id, 'main'), setup('banner-setup', banner.id, 'utility')],
      skills: [main, banner],
      mainSkill: main,
      rotationAnalysis: rotation(banner.id, {
        timingStatus: 'unresolved',
        evidence: 'unresolved',
        sourceReferences: [],
        detail: 'Unbekannt.',
      }),
    })
    expect(result.appliedEffects).toEqual([])
    expect(result.damageMultiplier).toBe(1)
    expect(result.actionSpeedMultiplier).toBe(1)
  })

  it('wendet Sigil of Power ohne belegte Stufenzahl nicht numerisch an', () => {
    const main = skill('main', 'Arc', ['spell'])
    const sigil = skill('sigil', 'Sigil of Power')
    const result = collectTemporalOffensiveEffects({
      setups: [setup('main-setup', main.id, 'main'), setup('sigil-setup', sigil.id, 'utility')],
      skills: [main, sigil],
      mainSkill: main,
      rotationAnalysis: rotation(sigil.id),
    })
    expect(result.appliedEffects).toEqual([])
    expect(result.blockedEffects[0]?.detail).toContain('Stufenzahl')
  })

  it('liefert bei identischer Eingabe identische Ergebnisse', () => {
    const main = skill('main', 'Lightning Arrow', ['attack'])
    const banner = skill('banner', 'War Banner')
    const input = {
      setups: [setup('main-setup', main.id, 'main'), setup('banner-setup', banner.id, 'utility')],
      skills: [main, banner],
      mainSkill: main,
      rotationAnalysis: rotation(banner.id),
    }
    expect(collectTemporalOffensiveEffects(input)).toEqual(collectTemporalOffensiveEffects(input))
  })
})
