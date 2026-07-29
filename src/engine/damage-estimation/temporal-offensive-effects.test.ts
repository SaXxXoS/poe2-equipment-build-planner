import { describe, expect, it } from 'vitest'
import type { SkillGemDefinition, SkillSetup } from '../../domain'
import type { RotationAnalysis } from '../common/types'
import type { RotationStepTiming } from '../rotations/timing'
import { applyTemporalDamageWindow, collectTemporalOffensiveEffects } from './temporal-offensive-effects'
import { resolveResourceSpiritModel } from './resource-spirit-model'

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

  it('berechnet Mana Tempest als begrenztes Mana- und Blitzschadensfenster', () => {
    const main = skill('main', 'Arc', ['spell'])
    const tempest = skill('tempest', 'Mana Tempest')
    const setups = [
      { ...setup('main-setup', main.id, 'main'), level: 20 },
      { ...setup('tempest-setup', tempest.id, 'utility'), level: 20 },
    ]
    const resourceSpiritModel = resolveResourceSpiritModel({
      characterLevel: 100,
      setups,
      skills: [main, tempest],
      supports: [],
    })
    const result = collectTemporalOffensiveEffects({
      setups,
      skills: [main, tempest],
      mainSkill: main,
      resourceSpiritModel,
    })
    expect(result.appliedEffects).toMatchObject([{
      sourceId: tempest.id,
      kind: 'gain-as-lightning',
      percent: 78,
      durationMs: 6489,
      status: 'active-window',
      evidence: 'structured-exact',
    }])
    expect(result.gainAsLightningPercent).toBe(78)
    expect(result.blockedEffects).toEqual([])
    expect(applyTemporalDamageWindow(
      [{ type: 'lightning', minimum: 10, maximum: 20 }],
      result.damageMultiplier,
    )).toEqual([{ type: 'lightning', minimum: 10, maximum: 20 }])
  })

  it('überträgt Mana Tempest nicht aus einem getrennten Waffenset', () => {
    const main = skill('main', 'Arc', ['spell'])
    const tempest = skill('tempest', 'Mana Tempest')
    const setups = [
      { ...setup('main-setup', main.id, 'main'), level: 20 },
      { ...setup('tempest-setup', tempest.id, 'utility'), level: 20, weaponSet: 'set-2' as const },
    ]
    const resourceSpiritModel = resolveResourceSpiritModel({
      characterLevel: 100,
      setups,
      skills: [main, tempest],
      supports: [],
    })
    const result = collectTemporalOffensiveEffects({
      setups,
      skills: [main, tempest],
      mainSkill: main,
      resourceSpiritModel,
    })
    expect(result.appliedEffects).toEqual([])
    expect(result.gainAsLightningPercent).toBe(0)
    expect(result.blockedEffects[0]?.detail).toContain('Manadauer')
  })

  it('verknüpft Charge Regulation mit dem automatisch ermittelten Verbrauchszustand', () => {
    const main = skill('main', 'Arc', ['spell'])
    const regulation = skill('regulation', 'Charge Regulation')
    const result = collectTemporalOffensiveEffects({
      setups: [setup('main-setup', main.id, 'main'), setup('regulation-setup', regulation.id, 'utility')],
      skills: [main, regulation],
      mainSkill: main,
      rotationAnalysis: rotation(regulation.id),
    })
    expect(result.appliedEffects).toEqual([])
    expect(result.chargeState.productive).toBe(false)
    expect(result.chargeState.consumptions[0]?.intervalMs).toBe(10_000)
    expect(result.blockedEffects[0]?.detail).toContain('alle 10 Sekunden')
  })

  it('erklärt Charged Staff mit dem fehlenden Power-Charge-Zustand', () => {
    const main = skill('main', 'Quarterstaff Strike', ['attack'])
    const chargedStaff = skill('charged-staff', 'Charged Staff')
    const result = collectTemporalOffensiveEffects({
      setups: [setup('main-setup', main.id, 'main'), setup('staff-setup', chargedStaff.id, 'utility')],
      skills: [main, chargedStaff],
      mainSkill: main,
      rotationAnalysis: rotation(chargedStaff.id),
    })
    expect(result.appliedEffects).toEqual([])
    expect(result.blockedEffects[0]?.detail).toContain('Keine vollständig belegte Erzeugung von Power Charges')
  })

  it.each([
    ['Arctic Armour', 'stationäre Dauer'],
    ['Arctic Howl', 'Warcry-Power'],
    ['Charge Regulation', 'Ladungsarten'],
    ['Charged Staff', 'Ladungszahl'],
    ['Elemental Conflux', 'aktives Element'],
    ['Mana Tempest', 'Manadauer'],
    ['Trinity', 'Resonanz'],
    ['Lunar Blessing', 'Buffdauer'],
  ])('erklärt die unvollständige Wirkungskette von %s', (nameEn, expectedReason) => {
    const main = skill('main', 'Arc', ['spell'])
    const candidate = skill('candidate', nameEn)
    const result = collectTemporalOffensiveEffects({
      setups: [setup('main-setup', main.id, 'main'), setup('candidate-setup', candidate.id, 'utility')],
      skills: [main, candidate],
      mainSkill: main,
      rotationAnalysis: rotation(candidate.id),
    })
    expect(result.appliedEffects).toEqual([])
    expect(result.blockedEffects[0]?.detail).toContain(expectedReason)
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
